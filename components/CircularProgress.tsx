
import React from 'react';

interface CircularProgressProps {
  progress: number; // A value between 0 and 1
  size: number;
  strokeWidth: number;
  baseColor: string;
  fillColor: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size, strokeWidth, baseColor, fillColor }) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        className={baseColor}
        fill="transparent"
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        className={`${fillColor} transition-all duration-300 ease-in-out`}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CircularProgress;