import * as core from '@actions/core';
import { run } from './run';

run()
  .then((buildId) => {
    core.info(
      `Build upload process completed successfully for build ID: ${buildId}`
    );
  })
  .catch((error) => {
    core.setFailed(`Unable to upload build due to error: ${error.message}`);
  });
