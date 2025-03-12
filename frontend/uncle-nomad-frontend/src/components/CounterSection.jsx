import AnimatedCounter from "./AnimatedCounter";

const CounterSection = ({stats}) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8">
      <div className="relative flex flex-col md:flex-row w-full max-w-5xl z-10 gap-6">
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="tours.jpeg"
            alt="Tour"
            className="w-full h-auto max-w-sm md:max-w-full rounded-lg shadow-lg object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 bg-white bg-opacity-70 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800" style={{'fontFamily': 'Poppins'}}>About Our Tours</h2>
          <p className="text-gray-600 mt-2" style={{'fontFamily': 'Poppins'}}>
            We have been providing unforgettable travel experiences for years,
            ensuring every adventure is unique and filled with excitement.
          </p>
          <div className="mt-6 text-right">
            <span className="text-lg font-semibold text-gray-700">
              Tours Completed:
            </span>
            <AnimatedCounter targetNumber={stats.tours} duration={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterSection;