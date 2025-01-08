export async function createBuild({
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
  if (windowsGameName) {
    body.append('windowsGameName', windowsGameName);
  }
  if (macGameName) {
    body.append('macGameName', macGameName);
  }
  if (!windowsGameName && !macGameName) {
    throw new Error('Either windowsGameName or macGameName must be provided');
  }

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
