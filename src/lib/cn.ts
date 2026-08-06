import { clsx, type ClassValue } from "clsx";

export function cn(...entrees: ClassValue[]) {
  return clsx(entrees);
}
