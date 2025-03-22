// LoadingCard.js
export const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
  </div>
);
