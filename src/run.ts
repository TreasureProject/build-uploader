import * as core from '@actions/core';
import fs from 'node:fs/promises';
import { CHUNK_SIZE, extractGameName } from './utils';
import { createBuild } from './createBuild';
import { uploadBuild } from './uploadBuild';
import { completeBuild } from './completeBuild';

export async function run(): Promise<string> {
  const apiKey = core.getInput('apiKey', { required: true });
  const apiBaseUrl = core.getInput('apiBaseUrl', { required: true });
  const gameId = core.getInput('gameId', { required: true });
  const windowsBuildPath = core.getInput('windowsBuildPath', {
    required: false,
  });
  const macosBuildPath = core.getInput('macosBuildPath', {
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

  if (windowsBuildPath) {
    core.info(`Upload Windows build: ${windowsBuildPath}`);
    core.info(`Windows game name: ${windowsGameName}`);
    core.info(`Windows file bytes: ${windowsStats ? windowsStats.size : 0}`);
    core.info(`Windows chunk total: ${windowsChunkTotal}`);
  }

  if (macosBuildPath) {
    core.info(`Upload macOS build: ${macosBuildPath}`);
    core.info(`macOS game name: ${macGameName}`);
    core.info(`macOS file bytes: ${macStats ? macStats.size : 0}`);
    core.info(`macOS chunk total: ${macChunkTotal}`);
  }

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
      buildId,
    });
  }

  if (macosBuildPath) {
    await uploadBuild({
      apiKey,
      apiBaseUrl,
      gameId,
      platform: 'mac',
      filePath: macosBuildPath,
      buildId,
    });
  }

  await completeBuild({
    apiKey,
    apiBaseUrl,
    gameId,
    buildId,
  });

  core.setOutput('buildId', buildId);
  return buildId;
}
