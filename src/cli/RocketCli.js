import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { readConfig } from '../config.js';
import { RocketBuild } from './RocketBuild.js';
import { RocketInit } from './RocketInit.js';
import { RocketStart } from './RocketStart.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

export class RocketCli {
  /** @type {string[]} */
  argv;

  /** @type {Command} */
  program;

  /** @type {string | undefined} */
  configFilePath;

  /** @type {import('@rocket/js/types.js').ResolvedRocketConfig | undefined} */
  config;

  constructor({ argv = process.argv } = {}) {
    this.argv = argv;

    this.program = new Command();
    this.program
      .name('rocket')
      .description('HTML-first static-site metaframework for content sites and Web Component docs')
      .version(packageJson.version)
      .allowUnknownOption(true)
      .option('-c, --config-file <path>', 'path to config file');
    this.program.parseOptions(this.argv);

    this.program.allowUnknownOption(false);

    if (this.program.opts().configFile) {
      this.configFilePath = this.program.opts().configFile;
    }
  }

  async getConfig() {
    this.config ??= await readConfig(this.configFilePath);
    return this.config;
  }

  async start() {
    for (const progClass of [RocketInit, RocketBuild, RocketStart]) {
      const prog = new progClass();
      await prog.setupCommand(this.program, this);
    }

    await this.program.parseAsync(this.argv);
  }
}
