import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 || cleaned.length === 13) {
    // Attempt basic formatting for international/BR numbers
    const country = cleaned.slice(0, 2);
    const code = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, cleaned.length - 4);
    const secondPart = cleaned.slice(cleaned.length - 4);
    return `+${country} (${code}) ${firstPart}-${secondPart}`;
  }
  return phone;
}
