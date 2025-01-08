import * as core from '@actions/core';
import { run } from './run';

run().catch((error) => {
  core.setFailed(`Unable to upload build due to error: ${error.message}`);
});
