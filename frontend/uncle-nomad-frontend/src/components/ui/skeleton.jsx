// components/ui/skeleton.jsx

export const Skeleton = ({ className, ...props }) => {
    return (
      <div
        className={`bg-gray-200 animate-pulse rounded-md ${className}`}
        {...props}
      ></div>
    );
  };
  