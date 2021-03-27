import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {singleton} from 'tsyringe';
import * as moment from 'moment';
import {DiscordService} from './discord.service';
import {delayPromise} from './utilities/promise-utils';

@singleton()
export class WebsiteCheckService {
  private log: BoundLogger = this.logService.bindToNamespace(this.constructor.name);

  protected startTime: string;
  protected endTime: string;

  protected searchLoop: NodeJS.Timeout;
  protected isExecutingSearchLoop: boolean = false;

  constructor(
    private logService: LogService,
    private configurationService: ConfigurationService,
    private discordService: DiscordService,
  ) {}

  async init() {
    this.log.info(`initializing WebsiteCheckService`);

    this.startTime = this.configurationService.config.searchConfig.localStartTime;
    this.endTime = this.configurationService.config.searchConfig.localEndTime;

    if (!moment(this.startTime, 'HH:mm').isValid() || !moment(this.endTime, 'HH:mm').isValid()) {
      throw new Error(`start time or end time is invalid`);
    }

    await this.initSearchLoop();
    await this.discordService.sendMessage('WebsiteCheckService initialized and running');
  }

  protected async initSearchLoop() {
    await this.executeSearchLoop();
    await delayPromise(1000);
    this.searchLoop = setInterval(() => this.executeSearchLoop(), 5000);
  }

  protected async executeSearchLoop() {
    const startTime = moment(this.startTime, 'HH:mm');
    const endTime = moment(this.endTime, 'HH:mm');
    if (!moment().isBetween(startTime, endTime)) {
      this.log.info(`aborting search loop: outside of scheduled hours ${new Date().toString()}`);
      return;
    }

    this.log.info(`executing search loop ${new Date().toString()}`);
    if (!this.isExecutingSearchLoop) {
      try {
        this.isExecutingSearchLoop = true;
        this.log.debug(`search loop complete`);
      } catch (e) {
        const errorMessage = `failed to execute search loop: ${e.toString()}`;
      } finally {
        this.isExecutingSearchLoop = false;
      }
    } else {
      this.log.error(`previous search loop is still in progress, aborting this loop`);
    }
  }
}
