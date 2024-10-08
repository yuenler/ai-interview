

/**
 * LBO Question Page Component
 */
function LBOQuestion({
  question,
  onBack,
}: {
  question: string;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        className="py-1 m-2 px-4 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        onClick={onBack}
      >
        Back to Questions
      </button>
      <div className="flex flex-col items-center h-screen bg-gray-200">
        <div className="w-full h-full">
          <iframe
            src="https://docs.google.com/spreadsheets/d/1S_1616WaRrMdYRQ5DM5_JZri3ycU8NtM4BK0SmpfH50/edit?usp=sharing"
            title="LBO Sheet"
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default LBOQuestion;
