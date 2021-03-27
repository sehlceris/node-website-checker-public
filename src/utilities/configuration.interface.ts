import {IEbayItemKeywordSearchParams} from '../ebay-finder-service';
import {LogLevel} from './log.service';

export interface IAppConfiguration {
  logLevel: LogLevel;
  discordConfig: IDiscordConfig;
  searchConfig: ISearchConfig;
}

export interface IDiscordConfig {
  enabled: boolean;
  webhookId: string;
  webhookToken: string;
}

export interface ISearchConfig {
  localStartTime: string;
  localEndTime: string;
}
