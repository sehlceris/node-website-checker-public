import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {injectable} from 'tsyringe';
import {EbayFinderService, IEbayItemSearchResult} from './ebay-finder-service';
import * as fs from 'fs';
import * as moment from 'moment';
import {DiscordService} from './discord-service';
import {trimString} from './utilities/trim-string';
import {delayPromise} from './utilities/promise-utils';

const APP_STATE_PATH = './appState.json';

export interface IAppStateBeforeParsing {
  alreadyFoundEbayItemIds: string[];
}

export interface IAppStateAfterParsing {
  alreadyFoundEbayItemIds: Set<string>;
}

@injectable()
export class Application {
  protected log: BoundLogger = this.logService.bindToNamespace(this.constructor.name);
  protected ebaySearchLoop: NodeJS.Timeout;
  protected state: IAppStateAfterParsing = null;
  protected isExecutingSearchLoop: boolean = false;
  protected startTime: string;
  protected endTime: string;

  constructor(
    protected logService: LogService,
    protected configurationService: ConfigurationService,
    protected ebayFinderService: EbayFinderService,
    protected discordService: DiscordService,
  ) {
  }

  async main() {
    this.log.info(`app startup ${new Date().toString()}`);
    const logLevel = this.configurationService.config.logLevel;
    this.logService.setLogLevel(logLevel);

    this.startTime = this.configurationService.config.localStartTime;
    this.endTime = this.configurationService.config.localEndTime;

    if (!moment(this.startTime, 'HH:mm').isValid() || !moment(this.endTime, 'HH:mm').isValid()) {
      throw new Error(`start time or end time is invalid`);
    }

    await this.loadState();
    await this.initDiscord();
    await this.initSearchLoop();
  }

  protected async loadState() {
    if (fs.existsSync(APP_STATE_PATH)) {
      try {
        const text = fs.readFileSync(APP_STATE_PATH, 'utf8');
        if (text && text.trim().length) {
          const stateBeforeParsing: IAppStateBeforeParsing = JSON.parse(text);
          const parsedState: IAppStateAfterParsing = {
            alreadyFoundEbayItemIds: new Set(stateBeforeParsing.alreadyFoundEbayItemIds),
          };
          this.state = parsedState;
          this.log.info(`loaded state with ${parsedState.alreadyFoundEbayItemIds.size} previously found ebay item ids`);
          return;
        } else {
          this.log.warn(`app state file empty`);
        }
      } catch (e) {
        this.log.error(`failed to load state: e`);
      }
    }
    this.log.warn(`no previously existing app state found`);
    this.state = {
      alreadyFoundEbayItemIds: new Set(),
    };
  }

  protected writeState() {
    const stateBeforeParsing: IAppStateBeforeParsing = {
      alreadyFoundEbayItemIds: Array.from(this.state.alreadyFoundEbayItemIds),
    };
    fs.writeFileSync(APP_STATE_PATH, JSON.stringify(stateBeforeParsing, undefined, 2), 'utf8');
  }

  protected async initSearchLoop() {
    await this.ebayFinderService.init();
    const searchIntervalMs = this.configurationService.config.ebayConfig.searchIntervalMinutes * 1000 * 60;
    if (!searchIntervalMs || searchIntervalMs < 60000) {
      throw new Error(`invalid search interval '${this.configurationService.config.ebayConfig.searchIntervalMinutes}'`);
    }
    if (searchIntervalMs < 600000) {
      this.log.warn(`search intervals of less than 10 minutes will probably get you banned!`);
    }
    this.ebaySearchLoop = setInterval(() => this.executeSearchLoop(), searchIntervalMs);
    await this.executeSearchLoop(); // uncomment this to execute the first search right away
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
        for (let i = 0; i < this.configurationService.config.ebayConfig.itemsToSearch.length; i++) {
          if (i !== 0) {
            // add a delay in between searches
            const delayMs = this.configurationService.config.ebayConfig.intervalBetweenSearchesMs || 1000;
            await delayPromise(delayMs);
          }
          const itemToSearch = this.configurationService.config.ebayConfig.itemsToSearch[i];
          const foundItems = await this.ebayFinderService.findBuyItNowItemsByKeywords(itemToSearch);
          const filteredItems = foundItems.filter((it) => !this.state.alreadyFoundEbayItemIds.has(it.itemId));
          this.log.info(`search loop index ${i} found ${filteredItems.length}/${foundItems.length} new items`);
          filteredItems.forEach((item) => {
            this.state.alreadyFoundEbayItemIds.add(item.itemId);
            this.alertItemFound(item);
          });
          this.writeState();
        }
        this.log.debug(`search loop complete`);
      } catch (e) {
        const errorMessage = `failed to execute search loop: ${e.toString()}`;
        this.log.error(errorMessage);
        this.discordService.sendMessage(errorMessage);
      } finally {
        this.isExecutingSearchLoop = false;
      }
    } else {
      this.log.error(`previous search loop is still in progress, aborting this loop`);
    }
  }

  protected async alertItemFound(item: IEbayItemSearchResult) {
    const trimmedTitle = trimString(item.title, 20);
    const message = `item found: ${trimmedTitle} ${item.currentPrice} ${item.currentPriceCurrency}\n${item.viewItemURL}`;
    await this.discordService.sendMessage(message);
  }

  protected async initDiscord() {
    await this.discordService.init();
  }
}
