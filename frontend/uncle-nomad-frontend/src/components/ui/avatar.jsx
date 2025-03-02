"use client";

import { User } from "lucide-react"; // User icon for fallback

// AvatarImage component - This renders the image for the avatar
export const AvatarImage = ({ src, alt, className }) => (
  <img
    className={`h-full w-full rounded-full object-cover ${className}`}
    src={src}
    alt={alt}
  />
);

// AvatarFallback component - This renders the fallback icon or content
export const AvatarFallback = ({ children, className }) => (
  <div
    className={`h-full w-full rounded-full bg-gray-300 flex items-center justify-center ${className}`}
  >
    {children}
  </div>
);

// Avatar component - Combines AvatarImage and AvatarFallback
export const Avatar = ({ src, alt, className }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* If no src is provided, the fallback will be shown */}
      {src ? (
        <AvatarImage src={src} alt={alt} />
      ) : (
        <AvatarFallback className="bg-gray-400">
          <User className="h-12 w-12 text-white" />
        </AvatarFallback>
      )}
    </div>
  );
};
