import { type ClassValue, clsx } from 'clsx';
import type { KeyboardEventHandler } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleKeyUpAsClick: KeyboardEventHandler<HTMLElement> = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.currentTarget.click();
  }
};
