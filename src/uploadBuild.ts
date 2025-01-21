import * as core from '@actions/core';
import fs from 'node:fs/promises';
import { CHUNK_SIZE } from './utils';

export async function uploadBuild({
  apiKey,
  apiBaseUrl,
  gameId,
  platform,
  filePath,
  buildId,
}: {
  apiKey: string;
  apiBaseUrl: string;
  gameId: string;
  platform: 'windows' | 'mac';
  filePath: string;
  buildId: string;
}) {
  try {
    core.info(`Starting ${platform} build upload with file: ${filePath}`);
    const fileHandle = await fs.open(filePath);
    const stats = await fileHandle.stat();
    const totalChunks = Math.ceil(stats.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      try {
        core.info(`Uploading chunk ${i + 1}/${totalChunks}`);
        const buffer = Buffer.alloc(CHUNK_SIZE);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          CHUNK_SIZE,
          i * CHUNK_SIZE
        );
        core.info(`Read ${bytesRead} bytes for chunk ${i + 1}`);

        const body = new FormData();
        body.append('chunkNumber', (i + 1).toString());
        body.append('platform', platform);
        body.append('buildId', buildId);
        body.append('buildChunk', new Blob([buffer.subarray(0, bytesRead)]));

        const chunkResponse = await fetch(
          `${apiBaseUrl}/v3/upload/games/${gameId}/builds`,
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
        core.info(`Successfully uploaded chunk ${i + 1}/${totalChunks}`);
      } catch (error) {
        await fileHandle.close();
        throw error;
      }
    }

    await fileHandle.close();
    core.info(`Completed uploading all chunks for platform: ${platform}`);
  } catch (error) {
    console.error(
      `Error uploading build for platform ${platform} ${apiBaseUrl}:`,
      error
    );
    throw error;
  }
}
