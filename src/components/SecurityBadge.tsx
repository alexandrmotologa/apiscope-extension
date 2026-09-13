import React from 'react';
import { SecurityGrade } from '../types/index.js';

interface SecurityBadgeProps {
  grade?: SecurityGrade;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  grade = 'B',
  score,
  size = 'md',
  showScore = false,
}) => {
  const getColors = (g: SecurityGrade) => {
    switch (g) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-emerald-500/20';
      case 'B':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30 ring-sky-500/20';
      case 'C':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-amber-500/20';
      case 'D':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30 ring-orange-500/20';
      case 'F':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-rose-500/20';
    }
  };

  const sizeClasses = {
    sm: 'text-2xs px-1.5 py-0.5 font-semibold rounded',
    md: 'text-xs px-2 py-0.5 font-bold rounded-md',
    lg: 'text-base px-3 py-1 font-extrabold rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border font-mono tracking-tight ring-1 ${getColors(
        grade
      )} ${sizeClasses[size]}`}
      title={`Security Grade: ${grade}${score !== undefined ? ` (${score}/100)` : ''}`}
    >
      <span>{grade}</span>
      {showScore && score !== undefined && (
        <span className="text-[10px] opacity-75 font-normal">({score})</span>
      )}
    </span>
  );
};
