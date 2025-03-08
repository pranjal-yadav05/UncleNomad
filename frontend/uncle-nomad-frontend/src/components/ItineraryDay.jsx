import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ItineraryDay = ({ day, isLast }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    day: dayNumber = '',
    title = '',
    description = 'Activities for this day will be updated soon.',
    activities = '',
    accommodation = '',
    meals = []
  } = day;

  // Convert activities to an array if it’s a string
  const activityList = typeof activities === 'string' 
    ? activities.split(',').map(activity => activity.trim()) 
    : activities;

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 border-l-2 border-dashed border-gray-300 z-0"></div>
      )}

      <div className="relative z-10 flex">
        {/* Blue Dot with Day Number */}
        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {dayNumber}
        </div>

        <div className="ml-6 flex-grow">
          <div 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
              <button className="text-gray-500 hover:text-blue-600 transition-colors">
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            
            <p className="text-gray-700 mt-2 line-clamp-2">
              {description}
            </p>

            {expanded && (
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                {activityList.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Activities:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {activityList.map((activity, index) => (
                        <li key={index}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Meals:</h4>
                    <p className="text-gray-700">{meals.join(', ')}</p>
                  </div>
                )}

                {accommodation && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Accommodation:</h4>
                    <p className="text-gray-700">{accommodation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDay;
