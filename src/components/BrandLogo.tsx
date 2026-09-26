import React from 'react';
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: 'default' | 'white';
}

/**
 * BrandLogo - High-fidelity recreation of the Skinwise logo.
 * Replicates the elegant script "Skin" and chunky "wise" serif from the provided design.
 */
export function BrandLogo({ className, variant = 'default' }: BrandLogoProps) {
  const isWhite = variant === 'white';
  
  // Colors sampled from the user's original logo image
  const skinColor = isWhite ? "white" : "#c39b6d";
  const wiseColor = isWhite ? "white" : "#f0b24f";
  const starColor = isWhite ? "white" : "#f0b24f";

  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto h-auto", className)}
      style={{ filter: isWhite ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
    >
      {/* 
        STAR PATH CAREFULLY CRAFTED: 
        A four-pointed star with tapered edges as seen in the original logo.
      */}
      <defs>
        <path id="tapered-star" d="M10 0C10 0 11.5 7.5 18 10C11.5 12.5 10 20 10 20C10 20 8.5 12.5 2 10C8.5 7.5 10 0 10 0Z" />
      </defs>

      {/* Top Left Small Star */}
      <use 
        href="#tapered-star" 
        x="15" 
        y="15" 
        transform="scale(0.4)" 
        fill={starColor} 
        className="animate-pulse"
        style={{ transformOrigin: '20px 20px', animationDuration: '3s' }}
      />

      {/* Right Large Star */}
      <use 
        href="#tapered-star" 
        x="115" 
        y="35" 
        transform="scale(1.2)" 
        fill={starColor} 
        className="animate-pulse"
        style={{ transformOrigin: '125px 45px', animationDuration: '4s', animationDelay: '0.5s' }}
      />

      {/* Bottom Left Small Star */}
      <use 
        href="#tapered-star" 
        x="20" 
        y="65" 
        transform="scale(0.5)" 
        fill={starColor} 
        className="animate-pulse"
        style={{ transformOrigin: '25px 75px', animationDuration: '2.5s', animationDelay: '1s' }}
      />

      {/* "Skin" - Elegant Brush Script */}
      <text
        x="80"
        y="45"
        textAnchor="middle"
        fill={skinColor}
        style={{ 
          fontFamily: "'Great Vibes', cursive", 
          fontSize: '48px',
          fontWeight: 'normal'
        }}
      >
        Skin
      </text>

      {/* "wise" - Chunky Rounded Serif */}
      <text
        x="88"
        y="75"
        textAnchor="middle"
        fill={wiseColor}
        style={{ 
          fontFamily: "'Bowlby One SC', serif", 
          fontSize: '28px',
          fontWeight: 'normal',
          letterSpacing: '0.05em'
        }}
      >
        wise
      </text>
    </svg>
  );
}

