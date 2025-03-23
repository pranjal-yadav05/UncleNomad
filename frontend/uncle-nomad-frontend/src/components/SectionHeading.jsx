import React from "react";

export default function SectionHeading({ children, className = "" }) {
  return (
    <h2
      className={`text-3xl md:text-4xl font-bold text-white mb-4 ${className}`}>
      {children}
    </h2>
  );
}
