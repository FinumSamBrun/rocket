#!/usr/bin/env node
/* eslint-disable no-console */

import { RocketCli } from './RocketCli.js';

const cli = new RocketCli();

try {
  await cli.start();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (process.env.ROCKET_DEBUG) {
    console.error(error);
  }
  process.exit(1);
}
