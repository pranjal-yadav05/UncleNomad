import AnimatedCounter from "./AnimatedCounter";

const CounterSection = () => {
  return (
    <div
      className="relative flex flex-col items-center justify-center h-screen p-8"
    >
      <div className="relative flex w-full max-w-4xl z-10">
        <img
          src="tours.jpeg"
          alt="Tour"
          className="w-1/2 rounded-lg shadow-lg"
        />
        <div className="w-1/2 flex flex-col justify-between p-6 bg-white bg-opacity-70 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800">About Our Tours</h2>
          <p className="text-gray-600 mt-2">
            We have been providing unforgettable travel experiences for years,
            ensuring every adventure is unique and filled with excitement.
          </p>
          <div className="mt-6 text-right">
            <span className="text-lg font-semibold text-gray-700">
              Tours Completed:
            </span>
            <AnimatedCounter targetNumber={500} duration={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterSection;
