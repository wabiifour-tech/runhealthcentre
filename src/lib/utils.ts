import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ClassName utility for shadcn/ui components
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
