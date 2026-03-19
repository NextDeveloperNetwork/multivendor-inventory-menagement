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

export function formatCurrency(amount: any, symbol: string = '$'): string {
  try {
    const num = Number(amount || 0);
    if (isNaN(num)) return `${symbol}0.00`;
    return `${symbol}${num.toFixed(2)}`;
  } catch (e) {
    return `${symbol}0.00`;
  }
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

export function generateBarcode(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
export function generateSKU(name: string = ""): string {
  const prefix = name ? name.trim().slice(0, 3).toUpperCase() : "ART";
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
  const date = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7); // YYMM
  return `${prefix}-${date}-${random}`;
}
