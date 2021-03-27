import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {singleton} from 'tsyringe';
import * as moment from 'moment';
import {DiscordService} from './discord.service';
import {delayPromise} from './utilities/promise-utils';
import * as puppeteer from 'puppeteer';
import checkers from './checkers';
import {PageCheckFunction} from './types';

@singleton()
export class WebsiteCheckService {
  private log: BoundLogger = this.logService.bindToNamespace(this.constructor.name);

  protected startTime: string;
  protected endTime: string;

  protected searchLoop: NodeJS.Timeout;
  protected isExecutingSearchLoop: boolean = false;

  protected browser: puppeteer.Browser;

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

    await this.initPuppeteer();
    await this.initCheckers();
    await this.discordService.sendMessage('WebsiteCheckService initialized and running');
  }

  protected async initPuppeteer() {
    this.browser = await puppeteer.launch();
  }

  protected async initCheckers() {
    const cb = (message: string) => {
      this.log.info(`checker sent message: ${message}`);
      this.discordService.sendMessage(message);
    };
    const canCheck = this.canCheck.bind(this);
    checkers.forEach(async (checker: PageCheckFunction) => {
      const page = await this.browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
      );
      checker(page, cb, canCheck);
    });
  }

  protected canCheck(): boolean {
    const startTime = moment(this.startTime, 'HH:mm');
    const endTime = moment(this.endTime, 'HH:mm');
    if (!moment().isBetween(startTime, endTime)) {
      return false;
    }
    return true;
  }
}
