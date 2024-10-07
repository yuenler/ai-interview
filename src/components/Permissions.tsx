import React, { useState } from 'react';

interface Props {
  navigateTo: (page: string) => void;
}
const Permissions: React.FC<Props> = ({navigateTo}) => {
  const [step, setStep] = useState(0);
  const permissions = ['Microphone', 'Webcam', 'Screen Sharing'];

  const requestPermission = async () => {
    try {
      if (permissions[step] === 'Microphone') {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (permissions[step] === 'Webcam') {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } else if (permissions[step] === 'Screen Sharing') {
        await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      }
      alert(`${permissions[step]} access granted.`);
      if (step < permissions.length - 1) {
        setStep(step + 1);
      } else {
        navigateTo('instructions');
      }
    } catch (error) {
      alert(`Failed to get ${permissions[step]} access.`);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="bg-white p-8 rounded shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-6">
          Enable {permissions[step]} Access
        </h2>
        <button
          onClick={requestPermission}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Enable
        </button>
      </div>
    </div>
  );
};

export default Permissions;
