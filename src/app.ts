import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {singleton} from 'tsyringe';
import * as fs from 'fs';
import {DiscordService} from './discord.service';
import {WebsiteCheckService} from './website-check.service';

@singleton()
export class Application {
  protected log: BoundLogger = LogService.getInstance().bindToNamespace(this.constructor.name);

  constructor(
    protected configurationService: ConfigurationService,
    protected discordService: DiscordService,
    protected websiteCheckService: WebsiteCheckService,
  ) {}

  async main() {
    const logLevel = this.configurationService.config.logLevel;
    this.log.info(`app startup ${new Date().toString()} with log level ${logLevel}`);
    LogService.getInstance().setLogLevel(logLevel);
    await this.discordService.init();
    await this.websiteCheckService.init();
  }
}
