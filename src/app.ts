import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {singleton} from 'tsyringe';
import * as fs from 'fs';
import {DiscordService} from './discord.service';
import {trimString} from './utilities/trim-string';
import {delayPromise} from './utilities/promise-utils';
import {WebsiteCheckService} from './website-check.service';

@singleton()
export class Application {
  protected log: BoundLogger = this.logService.bindToNamespace(this.constructor.name);

  constructor(
    protected logService: LogService,
    protected configurationService: ConfigurationService,
    protected discordService: DiscordService,
    protected websiteCheckService: WebsiteCheckService,
  ) {}

  async main() {
    this.log.info(`app startup ${new Date().toString()}`);
    const logLevel = this.configurationService.config.logLevel;
    this.logService.setLogLevel(logLevel);
    await this.discordService.init();
    await this.websiteCheckService.init();
  }
}
