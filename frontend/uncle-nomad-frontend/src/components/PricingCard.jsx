import React from "react";
import { Button } from "../components/ui/button";

const PricingCard = ({ title, price, isPopular, features, onSelect }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ${
        isPopular ? "border-2 border-blue-500 relative" : ""
      }`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-sm px-4 py-1 rounded-bl-lg">
          Most Popular
        </div>
      )}

      <div className="p-6 border-b">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-blue-600">₹{price}</span>
          <span className="text-gray-500 ml-1">/person</span>
        </div>
      </div>

      <div className="p-6">
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onSelect}
          className={`w-full py-3 rounded-lg transition-colors duration-300 ${
            isPopular
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}>
          Select Package
        </Button>
      </div>
    </div>
  );
};

export default PricingCard;
