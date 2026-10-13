import React from 'react';
import { cn } from '@/lib/utils';

interface RizzLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function RizzLogo({ className, size = 'md', showText = true }: RizzLogoProps) {
  const iconDimensions = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-9 w-9',
  }[size];

  const textSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-[26px]',
  }[size];

  return (
    <div
      className={cn(
        'group inline-flex items-center gap-2.5 select-none smooth-interactive',
        className
      )}
    >
      <div
        className={cn(
          'relative shrink-0 smooth-interactive group-hover:scale-105 group-hover:-rotate-3',
          iconDimensions
        )}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="rizz-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#221C19" />
              <stop offset="100%" stopColor="#120F0D" />
            </linearGradient>
            <linearGradient id="rizz-accent" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF714F" />
              <stop offset="50%" stopColor="#FC4C2B" />
              <stop offset="100%" stopColor="#D93214" />
            </linearGradient>
            <linearGradient id="rizz-rim" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF7857" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <rect
            x="2"
            y="2"
            width="60"
            height="60"
            rx="16"
            fill="url(#rizz-bg)"
            stroke="url(#rizz-rim)"
            strokeWidth="2.2"
          />

          {/* Speech Bubble + Electric Spark Cutout */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M32 13C20.954 13 12 20.611 12 30C12 34.487 14.048 38.567 17.398 41.611C17.87 42.04 18.068 42.703 17.873 43.311L15.82 49.708C15.468 50.805 16.564 51.773 17.613 51.296L24.85 48.006C25.335 47.785 25.884 47.734 26.404 47.848C28.198 48.241 30.072 48.45 32 48.45C43.046 48.45 52 40.839 52 31.45C52 22.061 43.046 13 32 13ZM34.6 19.8C35.12 19.12 36.2 19.56 36.08 20.41L34.95 28.2H40.4C41.18 28.2 41.62 29.09 41.14 29.71L29.4 44.8C28.88 45.48 27.8 45.04 27.92 44.19L29.05 36.4H23.6C22.82 36.4 22.38 35.51 22.86 34.89L34.6 19.8Z"
            fill="url(#rizz-accent)"
          />
        </svg>
      </div>

      {showText && (
        <span className={cn('font-headline tracking-tight leading-none text-foreground', textSize)}>
          Rizz<span className="italic text-primary smooth-interactive">Up</span>
        </span>
      )}
    </div>
  );
}
