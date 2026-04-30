import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isValid, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTempId() {
  return `temp-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidDate(date: any): boolean {
  if (!date) return false;
  if (date instanceof Date) return isValid(date);
  if (typeof date === 'string') {
    const d = parseISO(date);
    return isValid(d);
  }
  return false;
}

export function parseSafeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Handle YYYY-MM-DD
  let date = parseISO(dateStr);
  if (isValid(date)) return date;

  // Handle YYYY-MM-DDT00:00:00
  if (dateStr.includes('T')) {
    date = new Date(dateStr);
    if (isValid(date)) return date;
  }

  // Handle DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
      if (isValid(date)) return date;
    }
  }

  // Fallback split for YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2].substring(0, 2), 10);
    date = new Date(year, month - 1, day);
    if (isValid(date)) return date;
  }

  return null;
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  const date = parseSafeDate(dateStr);
  if (!date) return dateStr || '-';
  return date.toLocaleDateString('pt-BR', options);
}
