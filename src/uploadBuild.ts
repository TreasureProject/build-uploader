import fs from 'node:fs/promises';
import { CHUNK_SIZE } from './utils';

export async function uploadBuild({
  apiKey,
  apiBaseUrl,
  gameId,
  platform,
  filePath,
  windowsChunkTotal,
  macChunkTotal,
  buildId,
  windowsGameName,
  macGameName,
}: {
  apiKey: string;
  apiBaseUrl: string;
  gameId: string;
  platform: 'windows' | 'mac';
  filePath: string;
  windowsChunkTotal: number;
  macChunkTotal: number;
  buildId: string;
  windowsGameName: string | null;
  macGameName: string | null;
}) {
  try {
    console.log(`Opening file: ${filePath}`);
    const fileHandle = await fs.open(filePath);
    const stats = await fileHandle.stat();
    const totalChunks = Math.ceil(stats.size / CHUNK_SIZE);
    console.log(`File size: ${stats.size} bytes, Total chunks: ${totalChunks}`);

    for (let i = 0; i < totalChunks; i++) {
      try {
        console.log(`Uploading chunk ${i + 1}/${totalChunks}`);
        const buffer = Buffer.alloc(CHUNK_SIZE);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          CHUNK_SIZE,
          i * CHUNK_SIZE
        );
        console.log(`Read ${bytesRead} bytes for chunk ${i + 1}`);

        const body = new FormData();
        body.append('windowsChunkTotal', windowsChunkTotal.toString());
        body.append('macChunkTotal', macChunkTotal.toString());
        body.append('chunkNumber', (i + 1).toString());
        body.append('platform', platform);
        body.append('buildId', buildId);
        body.append('isBuildComplete', 'false');
        body.append('buildChunk', new Blob([buffer.subarray(0, bytesRead)]));
        if (windowsGameName) {
          body.append('windowsGameName', windowsGameName);
        }
        if (macGameName) {
          body.append('macGameName', macGameName);
        }
        if (!windowsGameName && !macGameName) {
          throw new Error(
            'Either windowsGameName or macGameName must be provided'
          );
        }

        const chunkResponse = await fetch(
          `${apiBaseUrl}/v3/dashboard/games/${gameId}/builds`,
          {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
            },
            body,
          }
        );

        if (!chunkResponse.ok) {
          throw new Error(
            `Failed to upload chunk ${i + 1}: ${chunkResponse.status}`
          );
        }
        console.log(`Successfully uploaded chunk ${i + 1}/${totalChunks}`);
      } catch (error) {
        await fileHandle.close();
        throw error;
      }
    }

    await fileHandle.close();
    console.log(`Completed uploading all chunks for platform: ${platform}`);
  } catch (error) {
    console.error(
      `Error uploading build for platform ${platform} ${apiBaseUrl}:`,
      error
    );
    throw error;
  }
}
