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

import './Interview.scss';



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

export default function Interview() {
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
   * - coords, marker are for get_weather() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});
  const [currentPage, setCurrentPage] = useState<'questionList' | 'lboQuestion' | 'codingQuestion' | 'financialQuestion'>('questionList');
  const [timeLeft, setTimeLeft] = useState(3600); // 1 minute
  const prevCodeRef = useRef('');
  const timeOfLastCodeSendRef = useRef(Date.now());

  const codeRef = useRef('');


  /**
   * Questions assigned to the user
   */
  const lboQuestion = 'Fill in the missing values in this spreadsheet to complete the LBO model.';
  const codingQuestion = 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.';
  const financialQuestion = 'Let’s start by building out the revenue projections for the store. Assume the average selling price (ASP) per item is $500, and the expected number of items sold per year is projected to grow by 5% annually. In year 1, the company expects to sell 10,000 units. In the Excel sheet, calculate the projected revenue for the next three years, based on the provided growth rate and ASP.';
  
  const [code, setCode] = useState(`# ${codingQuestion}\n\n# Write your code here`);

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

  // whenever code changes, update the ref
  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  

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
   * Connect to conversation:
   * WavRecorder takes speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async (questionType: string) => {
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

    if (questionType === 'lboQuestion') {
      client.sendUserMessageContent([
        {
          type: `input_text`,
          text: `Hello! I am now working on the LBO modeling question.`,
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
  }, []);

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
  }

  const handleCellChange = (data: any[]) => {
    console.log(data)
    const client = clientRef.current;
    const formattedData = JSON.stringify(data);
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: formattedData,
      },
    ]);
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
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ instructions: instructions });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

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
        setMemoryKv((memoryKv) => {
          const newKv = { ...memoryKv };
          newKv[key] = value;
          return newKv;
        });
        return { ok: true };
      }
    );

    // handle realtime events from client + server for event logging
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // if we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });
    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      if (item.role === "user"){
        handleCodeChange(codeRef.current);
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
      // cleanup; resets to defaults
      client.reset();
    };
  }, []);

  /**
   * Render the application
   */
  return (
    <div >
      {/* Timer displayed at the top right */}
      <div className="fixed top-0 right-0 m-2 py-1 px-4 bg-gray-800 text-white text-lg font-semibold rounded-lg shadow-md">
        Time Left: {formatTime(timeLeft)}
      </div>
      {currentPage === 'questionList' && (
        <QuestionList
          onSelectQuestion={(questionType) => {
            setCurrentPage(questionType);
            connectConversation(questionType);
          }}
        />
      )}

      {currentPage === 'lboQuestion' && (
        <LBOQuestion
          question={lboQuestion}
          onBack={() => setCurrentPage('questionList')}
        />
      )}

      {currentPage === 'codingQuestion' && (
        <CodingQuestion
          onBack={() => {
            setCurrentPage('questionList');
            disconnectConversation();
          }}
          onCodeChange={(code) => {
            setCode(code)}}
          code={code}
        />
      )}

      {currentPage === 'financialQuestion' && (
        <FinancialQuestion
          question={financialQuestion}
          handleCellChange={handleCellChange}
          onBack={() => {
            setCurrentPage('questionList');
            disconnectConversation();
          }}
        />
      )}
    </div>
  );
}
