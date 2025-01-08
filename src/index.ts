import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

async function createBuild({
  apiKey,
  apiBaseUrl,
  gameId,
  platform,
  windowsChunkTotal,
  macChunkTotal,
  windowsGameName,
  macGameName,
}: {
  apiKey: string;
  apiBaseUrl: string;
  gameId: string;
  platform: 'windows' | 'mac';
  windowsChunkTotal: number;
  macChunkTotal: number;
  windowsGameName: string | null;
  macGameName: string | null;
}) {
  const body = new FormData();
  body.append('windowsChunkTotal', windowsChunkTotal.toString());
  body.append('macChunkTotal', macChunkTotal.toString());
  body.append('chunkNumber', '0');
  body.append('platform', platform);
  body.append('isBuildComplete', 'false');
  windowsGameName && body.append('windowsGameName', windowsGameName);
  macGameName && body.append('macGameName', macGameName);

  console.log(`Initializing build for platform: ${platform}`);
  const initResponse = await fetch(
    `${apiBaseUrl}/v3/dashboard/games/${gameId}/builds`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body,
    }
  );

  if (!initResponse.ok) {
    const text = await initResponse.text();
    throw new Error(
      `Failed to initialize build: ${apiBaseUrl} ${initResponse.status} ${text}`
    );
  }

  const { result: buildId } = await initResponse.json();
  console.log(`Build initialized with ID: ${buildId}`);
  return buildId;
}

async function uploadBuild({
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
        windowsGameName && body.append('windowsGameName', windowsGameName);
        macGameName && body.append('macGameName', macGameName);

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

const program = new Command();

program
  .requiredOption('--api-key <key>')
  .requiredOption('--api-base-url <url>')
  .requiredOption('--game-id <id>')
  .option('--windows-build <path>')
  .option('--mac-build <path>')
  .parse();

const { windowsBuild, macBuild, apiKey, apiBaseUrl, gameId } = program.opts();

if (!windowsBuild && !macBuild) {
  console.error('Either --windows-build or --mac-build must be provided');
  process.exit(1);
}

function extractGameName(filePath: string): string {
  return path.parse(filePath).name;
}

async function main() {
  console.log('Starting build upload process');
  console.log(`API Base URL: ${apiBaseUrl}`);
  console.log(`Game ID: ${gameId}`);

  const windowsStats = windowsBuild ? await fs.stat(windowsBuild) : null;
  const macStats = macBuild ? await fs.stat(macBuild) : null;

  const windowsChunkTotal = windowsStats
    ? Math.ceil(windowsStats.size / CHUNK_SIZE)
    : 0;
  const macChunkTotal = macStats ? Math.ceil(macStats.size / CHUNK_SIZE) : 0;

  console.log(
    `Windows chunks: ${windowsChunkTotal}, Mac chunks: ${macChunkTotal}`
  );

  const windowsGameName = windowsBuild ? extractGameName(windowsBuild) : null;
  const macGameName = macBuild ? extractGameName(macBuild) : null;

  console.log(
    `Windows game name: ${windowsGameName}, Mac game name: ${macGameName}`
  );

  const initialPlatform = windowsBuild ? 'windows' : 'mac';
  const buildId = await createBuild({
    apiKey,
    apiBaseUrl,
    gameId,
    platform: initialPlatform,
    windowsChunkTotal,
    macChunkTotal,
    windowsGameName,
    macGameName,
  });

  if (windowsBuild) {
    console.log('Starting Windows build upload');
    await uploadBuild({
      apiKey,
      apiBaseUrl,
      gameId,
      platform: 'windows',
      filePath: windowsBuild,
      windowsChunkTotal,
      macChunkTotal,
      buildId,
      windowsGameName,
      macGameName,
    });
  }

  if (macBuild) {
    console.log('Starting Mac build upload');
    await uploadBuild({
      apiKey,
      apiBaseUrl,
      gameId,
      platform: 'mac',
      filePath: macBuild,
      windowsChunkTotal,
      macChunkTotal,
      buildId,
      windowsGameName,
      macGameName,
    });
  }

  console.log('Marking build as complete');
  await fetch(
    `${apiBaseUrl}/v3/dashboard/games/${gameId}/builds/${buildId}/complete`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
    }
  );
  console.log('Build upload process completed successfully');
}

main().catch(console.error);
