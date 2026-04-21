import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatILS(amount: number): string {
  return `${Math.round(amount).toLocaleString("he-IL")} ₪`;
}
