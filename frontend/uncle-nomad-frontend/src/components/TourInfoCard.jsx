import React from "react";

const TourInfoCard = ({ icon, title, content }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg transform hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-700">{content}</p>
    </div>
  );
};

export default TourInfoCard;
