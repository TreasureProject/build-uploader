import * as core from '@actions/core';
import { run } from './run';

run()
  .then(() => {
    core.info('Build upload process completed successfully');
  })
  .catch((error) => {
    core.setFailed(`Unable to upload build due to error: ${error.message}`);
  });
