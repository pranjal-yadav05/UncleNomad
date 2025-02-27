import React from 'react';

const ImageGallery = ({ images, onImageClick }) => {
  if (!images || images.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.slice(0, 4).map((image, index) => (
        <div 
          key={index}
          className={`relative rounded-lg overflow-hidden cursor-pointer ${
            index === 0 && images.length === 3 ? 'col-span-2' : ''
          } ${index === 0 && images.length >= 4 ? 'row-span-2' : ''}`}
          onClick={() => onImageClick(image)}
        >
          <img 
            src={image.src || image} 
            alt={image.alt || `Gallery image ${index + 1}`} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          
          {index === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-semibold">+{images.length - 4} more</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;