import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Helper to check if we are in demo mode
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
