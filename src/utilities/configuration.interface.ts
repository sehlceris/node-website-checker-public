import {IEbayItemKeywordSearchParams} from '../ebay-finder-service';
import {LogLevel} from './log.service';

export interface IAppConfiguration {
  logLevel: LogLevel;
  localStartTime: string;
  localEndTime: string;
  ebayConfig: IEbayConfig;
  discordConfig: IDiscordConfig;
}

export interface IEbayConfig {
  environment: 'PRODUCTION' | 'SANDBOX';
  sandboxClientId: string;
  sandboxClientSecret: string;
  productionClientId: string;
  productionClientSecret: string;
  searchIntervalMinutes: number; // ebay allows 5000 API executions per day
  intervalBetweenSearchesMs: number;
  itemsToSearch: IEbayItemKeywordSearchParams[];
}

export interface IDiscordConfig {
  enabled: boolean;
  webhookId: string;
  webhookToken: string;
}