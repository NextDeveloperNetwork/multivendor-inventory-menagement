import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatCurrency(amount: number | string, symbol: string = '$'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${num.toFixed(2)}`;
}

export function sanitizeData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Decimals (Prisma uses decimal.js)
  if (
    typeof data === 'object' &&
    data.constructor &&
    (data.constructor.name === 'Decimal' ||
      data.constructor.name === 'd' ||
      (data.d && Array.isArray(data.d) && data.s !== undefined && data.e !== undefined))
  ) {
    return Number(data.toString());
  }

  // Handle Dates - Next.js 15+ supports passing Dates from Server to Client
  if (data instanceof Date) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle Objects
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}

export function generateEAN13(): string {
  // Use '200' prefix for internal use
  let barcode = "200";
  for (let i = 0; i < 9; i++) {
    barcode += Math.floor(Math.random() * 10).toString();
  }

  // Calculate EAN-13 Checksum
  // Weights are 1, 3, 1, 3...
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return barcode + checksum.toString();
}
