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

  core.info('Starting build upload process');
  core.info(`API Base URL: ${apiBaseUrl}`);
  core.info(`Game ID: ${gameId}`);

  const windowsStats = windowsBuildPath
    ? await fs.stat(windowsBuildPath)
    : null;
  const macStats = macosBuildPath ? await fs.stat(macosBuildPath) : null;

  const windowsChunkTotal = windowsStats
    ? Math.ceil(windowsStats.size / CHUNK_SIZE)
    : 0;
  const macChunkTotal = macStats ? Math.ceil(macStats.size / CHUNK_SIZE) : 0;

  const windowsGameName = windowsBuildPath
    ? extractGameName(windowsBuildPath)
    : null;
  const macGameName = macosBuildPath ? extractGameName(macosBuildPath) : null;

  const buildId = await createBuild({
    apiKey,
    apiBaseUrl,
    gameId,
    windowsChunkTotal,
    macChunkTotal,
    windowsGameName,
    macGameName,
  });

  if (windowsBuildPath) {
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

  core.setOutput('buildId', buildId);
  core.info('Build upload process completed successfully');
}
