import * as core from '@actions/core';
import fs from 'node:fs/promises';
import { CHUNK_SIZE, extractGameName } from './utils';
import { createBuild } from './createBuild';
import { uploadBuild } from './uploadBuild';
import { completeBuild } from './completeBuild';

export async function run() {
  const apiKey = core.getInput('apiKey', { required: true });
  const apiBaseUrl = core.getInput('apiBaseUrl', { required: true });
  const gameId = core.getInput('gameId', { required: true });
  const windowsBuildPath: string | null = core.getInput('windowsBuildPath', {
    required: false,
  });
  const macosBuildPath: string | null = core.getInput('macosBuildPath', {
    required: false,
  });

  console.log('Starting build upload process');
  console.log(`API Base URL: ${apiBaseUrl}`);
  console.log(`Game ID: ${gameId}`);

  const windowsStats = windowsBuildPath
    ? await fs.stat(windowsBuildPath)
    : null;
  const macStats = macosBuildPath ? await fs.stat(macosBuildPath) : null;

  const windowsChunkTotal = windowsStats
    ? Math.ceil(windowsStats.size / CHUNK_SIZE)
    : 0;
  const macChunkTotal = macStats ? Math.ceil(macStats.size / CHUNK_SIZE) : 0;

  console.log(
    `Windows chunks: ${windowsChunkTotal}, Mac chunks: ${macChunkTotal}`
  );

  const windowsGameName = windowsBuildPath
    ? extractGameName(windowsBuildPath)
    : null;
  const macGameName = macosBuildPath ? extractGameName(macosBuildPath) : null;

  console.log(
    `Windows game name: ${windowsGameName}, Mac game name: ${macGameName}`
  );

  const initialPlatform = windowsBuildPath ? 'windows' : 'mac';

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

  if (windowsBuildPath) {
    console.log('Starting Windows build upload');
    await uploadBuild({
      apiKey,
      apiBaseUrl,
      gameId,
      platform: 'windows',
      filePath: windowsBuildPath,
      windowsChunkTotal,
      macChunkTotal,
      buildId,
      windowsGameName,
      macGameName,
    });
  }

  if (macosBuildPath) {
    console.log('Starting Mac build upload');
    await uploadBuild({
      apiKey,
      apiBaseUrl,
      gameId,
      platform: 'mac',
      filePath: macosBuildPath,
      windowsChunkTotal,
      macChunkTotal,
      buildId,
      windowsGameName,
      macGameName,
    });
  }

  await completeBuild({
    apiKey,
    apiBaseUrl,
    gameId,
    buildId,
  });
}
