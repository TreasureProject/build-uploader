import * as core from '@actions/core';

export async function completeBuild({
  apiKey,
  apiBaseUrl,
  gameId,
  buildId,
}: {
  apiKey: string;
  apiBaseUrl: string;
  gameId: string;
  buildId: string;
}) {
  core.info('Marking build as complete');
  await fetch(
    `${apiBaseUrl}/v3/dashboard/games/${gameId}/builds/${buildId}/complete`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
    }
  );
}
