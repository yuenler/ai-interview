import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/conversation_config.js';
import { WavRenderer } from '../utils/wav_renderer';

import CodingQuestion from '../components/CodingQuestion';
import FinancialQuestion from '../components/FinancialQuestion';
import LBOQuestion from '../components/LBOQuestion';
import QuestionList from '../components/QuestionList';

import { storage } from '../firebase'; // Import Firebase storage
import { ref, uploadBytes } from 'firebase/storage';

import './Interview.scss';

interface Props {
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  screenStream: MediaStream | null;
  navigateTo: (page: string) => void;
}

/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL =
  process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || 'http://localhost:8081';

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

// Define topics and time limits for the financial question interview
const FINANCIAL_TOPICS = [
  { id: 'revenueProjections', text: 'Let’s start by building out the revenue projections...', timeLimit: 200 },
  { id: 'costAnalysis', text: 'Next, let’s analyze the cost structure...', timeLimit: 200 },
  { id: 'profitForecast', text: 'Finally, let’s forecast the profit...', timeLimit: 200 },
];

const Interview: React.FC<Props> = ({ audioStream, videoStream, screenStream, navigateTo }) => {
  // Refs to store the media recorder and combined stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
      url: LOCAL_RELAY_SERVER_URL,
    })
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});
  const [currentPage, setCurrentPage] = useState<'questionList' | 'lboQuestion' | 'codingQuestion' | 'financialQuestion'>('questionList');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(FINANCIAL_TOPICS[currentTopicIndex].timeLimit);
  const timeOfLastCodeSendRef = useRef(Date.now());
  const timeOfLastCellSendRef = useRef(Date.now());

  /**
   * Questions assigned to the user
   */
  const lboQuestion = 'Fill in the missing values in this spreadsheet to complete the LBO model.';
  const codingQuestion = 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.';
  const financialQuestion = 'Let’s start by building out the revenue projections for the store. Assume the average selling price (ASP) per item is $500, and the expected number of items sold per year is projected to grow by 5% annually. In year 1, the company expects to sell 10,000 units. In the Excel sheet, calculate the projected revenue for the next three years, based on the provided growth rate and ASP.';

  const initialCode = `# ${codingQuestion}\n\n# Write your code here`;
  const [code, setCode] = useState(initialCode);
  const [sheetData, setSheetData] = useState<any[]>([]);

  const prevCodeRef = useRef(initialCode);
  const prevCellRef = useRef('[]');
  const codeRef = useRef('');
  const sheetRef = useRef<any[]>([]);

  /**
   * Timer countdown effect
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          disconnectConversation();
          setCurrentPage('questionList');
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Function to move to the next topic
  const moveToNextTopic = useCallback(() => {
    setCurrentTopicIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % FINANCIAL_TOPICS.length;
      setTimeLeft(FINANCIAL_TOPICS[nextIndex].timeLimit);
      return nextIndex;
    });
  }, []);

  // Timer countdown effect for topics
  useEffect(() => {
    if (currentPage === 'financialQuestion') {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            moveToNextTopic();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentPage, currentTopicIndex, moveToNextTopic]);

  // Whenever code changes, update the ref
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Whenever sheet data changes, update the ref
  useEffect(() => {
    sheetRef.current = sheetData;
  }, [sheetData]);

  /**
   * Format time as hh:mm:ss
   */
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  /**
   * Start recording function
   */
  const startRecording = () => {
    if (audioStream && videoStream && screenStream) {
      const audioTracks = audioStream.getAudioTracks();

      const canvas = canvasRef.current;

      if (!canvas) {
        console.error('Canvas not available');
        return;
      }

      const canvasCtx = canvas.getContext('2d');

      if (!canvasCtx) {
        console.error('Canvas context not available');
        return;
      }

      const webcamVideo = document.createElement('video');
      webcamVideo.srcObject = videoStream;
      webcamVideo.muted = true;
      webcamVideo.play();

      const screenVideo = document.createElement('video');
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      screenVideo.play();

      let animationFrameId: number;

      const webcamVideoReady = new Promise<void>((resolve) => {
        webcamVideo.onloadedmetadata = () => {
          resolve();
        };
      });

      const screenVideoReady = new Promise<void>((resolve) => {
        screenVideo.onloadedmetadata = () => {
          resolve();
        };
      });

      Promise.all([webcamVideoReady, screenVideoReady]).then(() => {
        // Set canvas size to match screen video size
        canvas.width = screenVideo.videoWidth;
        canvas.height = screenVideo.videoHeight;

        const draw = () => {
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

          // Position the webcam video at the bottom-right corner
          const webcamWidth = canvas.width / 4;
          const webcamHeight = (webcamVideo.videoHeight / webcamVideo.videoWidth) * webcamWidth;
          canvasCtx.drawImage(webcamVideo, canvas.width - webcamWidth - 10, canvas.height - webcamHeight - 10, webcamWidth, webcamHeight);

          animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        const canvasStream = canvas.captureStream(30); // 30 FPS
        const [canvasVideoTrack] = canvasStream.getVideoTracks();

        // Combine audio track and canvas video track
        const combinedStream = new MediaStream([
          ...audioTracks,
          canvasVideoTrack
        ]);

        combinedStreamRef.current = combinedStream;

        // Now proceed to initialize MediaRecorder with combinedStream
        // Dynamically determine a supported mimeType
        let mimeType = '';
        if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
          mimeType = 'video/webm; codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
          mimeType = 'video/webm; codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          console.error('No supported mimeType found for MediaRecorder');
          return;
        }

        let recorder;
        try {
          recorder = new MediaRecorder(combinedStream, {
            mimeType: mimeType,
          });
        } catch (e) {
          console.error('Error initializing MediaRecorder:', e);
          return;
        }

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          // Create a blob from the recorded chunks
          const blob = new Blob(recordedChunks.current, { type: mimeType });

          // Upload to Firebase Storage
          try {
            const storageRef = ref(storage, `recordings/${Date.now()}.webm`);
            await uploadBytes(storageRef, blob);
            console.log('Recording uploaded to Firebase Storage.');
          } catch (error) {
            console.error('Error uploading recording:', error);
          }

          // Clear recorded chunks
          recordedChunks.current = [];
        };

        // Start recording
        try {
          recorder.start();
          console.log('Recording started');
        } catch (e) {
          console.error('Error starting MediaRecorder:', e);
        }

        // Store references for cleanup
        combinedStreamRef.current = combinedStreamRef.current || new MediaStream();
        audioTracks.forEach((track) => combinedStreamRef.current.addTrack(track));
        combinedStreamRef.current.addTrack(canvasVideoTrack);
      });

      // Cleanup function
      const stopDrawing = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        webcamVideo.pause();
        webcamVideo.srcObject = null;
        screenVideo.pause();
        screenVideo.srcObject = null;
      };

      // Store the stopDrawing function to be called later
      stopDrawingRef.current = stopDrawing;

    } else {
      console.error('Audio, video, or screen stream is not available.');
    }
  };

  const stopDrawingRef = useRef<() => void>(() => {});

  /**
   * Stop recording function
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('Recording stopped');
    }
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    // Stop drawing on canvas
    if (stopDrawingRef.current) {
      stopDrawingRef.current();
    }
  };

  /**
   * Connect to conversation:
   * WavRecorder takes speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(
    async (questionType: string) => {
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;
      client.updateSession({
        turn_detection: { type: 'server_vad' },
      });

      // Set state variables
      startTimeRef.current = new Date().toISOString();
      setIsConnected(true);
      setRealtimeEvents([]);
      setItems(client.conversation.getItems());

      // Connect to microphone
      await wavRecorder.begin();

      // Connect to audio output
      await wavStreamPlayer.connect();

      // Connect to realtime API
      await client.connect();

      // Start recording after connecting
      startRecording();

      if (questionType === 'lboQuestion') {
        client.sendUserMessageContent([
          {
            type: `input_text`,
            text: `You are an interviewer for a private equity firm, who is conducting a paper LBO interview with the interviewee (me) where I am building an LBO from scratch on a model and can ask you generic questions but you can't give the answers away freely. You know the following company information but will not say any of it unless specifically asked for that piece of information. The company purchases the target company for 5.0x Forward EBITDA at the end of Year 0. The debt-to-equity ratio for the LBO acquisition will be 60:40. Assume the weighted average interest rate on debt is 10%. The target expects to reach $100 million in sales revenue with an EBITDA margin of 40% in year 1. Revenue is expected to grow 10% YoY. Now remember that you are an interviewer conducting a paper LBO interview and will not be derailed, and will only provide hints or additional information when the candidate asks for it.`,
          },
        ]);
      } else if (questionType === 'codingQuestion') {
        client.sendUserMessageContent([
          {
            type: `input_text`,
            text: `Hello! I am now working on the coding question. The question is as follows: ${codingQuestion}. Please greet me and ask me this question again.`,
          },
        ]);
      } else if (questionType === 'financialQuestion') {
        client.sendUserMessageContent([
          {
            type: `input_text`,
            text: `Hello! I am now working on the financial question. The first question is as follows: ${financialQuestion}. Please greet me and ask me this question again.`,
          },
        ]);
      }

      if (client.getTurnDetectionType() === 'server_vad') {
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }
    },
    [audioStream, videoStream, screenStream]
  );

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setRealtimeEvents([]);
    setItems([]);
    setMemoryKv({});

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();

    // Stop the recording
    stopRecording();
  }, []);

  /**
   * Ensure recording stops when component unmounts
   */
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  /**
   * Handle code changes from the coding question page
   */
  const handleCodeChange = (text: string) => {
    if (Date.now() - timeOfLastCodeSendRef.current > 5000 && text !== prevCodeRef.current) {
      prevCodeRef.current = text;
      timeOfLastCodeSendRef.current = Date.now();
      console.log('Sending code to server');
      console.log(text);
      // Send the code text to the client
      const client = clientRef.current;
      client.sendUserMessageContent([
        {
          type: `input_text`,
          text: text,
        },
      ]);
    }
  };

  const handleCellChange = (data) => {
    const dataString = JSON.stringify(data);

    if (dataString !== prevCellRef.current) {
      console.log('Data changed:', dataString);
    }

    if (Date.now() - timeOfLastCellSendRef.current > 5000 && dataString !== prevCellRef.current) {
      prevCellRef.current = dataString;
      timeOfLastCellSendRef.current = Date.now();
      const client = clientRef.current;
      client.sendUserMessageContent([
        {
          type: `input_text`,
          text: dataString,
        },
      ]);
    }
  };

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    console.log('Rendering setup started');
    let isLoaded = true;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d');
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            console.log('User audio frequencies:', result.values);
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              '#0099ff',
              10,
              0,
              8
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d');
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            console.log('AI audio frequencies:', result.values);
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              '#009900',
              10,
              0,
              8
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, []);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events, and more
   */
  useEffect(() => {
    console.log('Audio client setup started');
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ instructions: instructions });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    console.log('Instructions set and transcription enabled:', instructions);

    // Add tools
    client.addTool(
      {
        name: 'set_memory',
        description: 'Saves important data about the user into memory.',
        parameters: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description:
                'The key of the memory value. Always use lowercase and underscores, no other characters.',
            },
            value: {
              type: 'string',
              description: 'Value can be anything represented as a string',
            },
          },
          required: ['key', 'value'],
        },
      },
      async ({ key, value }: { [key: string]: any }) => {
        console.log(`Memory saved: ${key} = ${value}`);
        setMemoryKv((memoryKv) => {
          const newKv = { ...memoryKv };
          newKv[key] = value;
          return newKv;
        });
        return { ok: true };
      }
    );

    // Handle realtime events from client + server for event logging
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // If we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });
    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      console.log('Conversation interrupted');
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      if (item.role === 'user') {
        handleCodeChange(codeRef.current);
        handleCellChange(sheetRef.current);
      }

      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // Cleanup; resets to defaults
      client.reset();
    };
  }, []);

  /**
   * Handle end of the interview
   */
  const handleEndInterview = () => {
    // Stop the recording and disconnect conversation
    disconnectConversation();
    // Navigate to the desired page
    navigateTo('somePage'); // Replace 'somePage' with the actual page
  };

  /**
   * Render the application
   */
  return (
    <div>
      {/* Timer displayed at the top right */}
      <div className="fixed top-0 right-0 m-2 py-1 px-4 bg-gray-800 text-white text-lg font-semibold rounded-lg shadow-md">
        Time Left: {formatTime(timeLeft)}
      </div>
      <button onClick={handleEndInterview}>End Interview</button>

      {/* Hidden canvas for combining video streams */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {currentPage === 'questionList' && (
        <QuestionList
          onSelectQuestion={(questionType) => {
            setCurrentPage(questionType);
            setTimeLeft(FINANCIAL_TOPICS[0].timeLimit);
            setCurrentTopicIndex(0);
            connectConversation(questionType);
          }}
        />
      )}

      {currentPage === 'lboQuestion' && (
        <LBOQuestion
          question={lboQuestion}
          onBack={() => {
            setCurrentPage('questionList');
            disconnectConversation();
          }}
        />
      )}

      {currentPage === 'codingQuestion' && (
        <CodingQuestion
          onBack={() => {
            setCurrentPage('questionList');
            disconnectConversation();
          }}
          onCodeChange={(code) => {
            setCode(code);
          }}
          code={code}
        />
      )}

      {currentPage === 'financialQuestion' && (
        <FinancialQuestion
          question={FINANCIAL_TOPICS[currentTopicIndex].text}
          onCellChange={(data: any[]) => {
            setSheetData(data);
          }}
          sheetData={sheetData}
          onBack={() => {
            setCurrentPage('questionList');
            disconnectConversation();
          }}
        />
      )}
    </div>
  );
};

export default Interview;
