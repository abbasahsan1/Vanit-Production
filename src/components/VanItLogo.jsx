import React, { useState } from 'react';

/**
 * Centralized Logo Component
 * Provides consistent logo rendering across all portals with fallback handling
 */
const VanItLogo = ({ 
  className = "w-10 h-10", 
  alt = "VanIt Logo",
  variant = "primary" // "primary" for 2.png, "alternate" for 1.png
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(variant === "primary" ? "/2.png" : "/1.png");

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Try the alternate logo if primary fails
      setCurrentSrc(variant === "primary" ? "/1.png" : "/2.png");
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <img 
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      style={{
        objectFit: 'contain',
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

export default VanItLogo;
