import path from 'node:path';

export const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

export function extractGameName(filePath: string): string {
  return path.parse(filePath).name;
}
