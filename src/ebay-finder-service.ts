import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {injectable} from 'tsyringe';
import * as eBay from 'ebay-node-api';

export interface IEbayItemKeywordSearchParams {
  name: string;
  categoryId?: string;
  keywords: string;
  minPrice: number;
  maxPrice: number;
}

export interface IEbayItemSearchResult {
  itemId: string;
  title: string;
  viewItemURL: string;
  currentPrice: number;
  currentPriceCurrency: string;
}

@injectable()
export class EbayFinderService {
  private log: BoundLogger = this.logService.bindToNamespace(this.constructor.name);
  private ebay: any; // no typescript definitions for this API

  constructor(private logService: LogService, private configurationService: ConfigurationService) {
  }

  async init() {
    const env = this.configurationService.config.ebayConfig.environment;
    const clientID = this.getClientIdFromConfig();

    this.log.info(
      `initializing ebay api using environment ${env} and client id ${clientID}`,
    );

    this.ebay = new eBay({
      clientID,
      clientSecret: this.getClientSecretFromConfig(),
      env,
      body: {
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope'
      }
      // headers: {
      //   'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      // },
    });
  }

  async findBuyItNowItemsByKeywords(searchParams: IEbayItemKeywordSearchParams): Promise<IEbayItemSearchResult[]> {
    try {
      const searchByKeywordsParams: any = {
        keywords: searchParams.keywords,
        sortOrder: 'PricePlusShippingLowest',
        pageNumber: 1,
        limit: 1,
        entriesPerPage: 50,
        MinPrice: searchParams.minPrice,
        MaxPrice: searchParams.maxPrice,
        ListingType: 'FixedPrice',
      };
      let result: any;
      if (searchParams.categoryId) {
        this.log.info(`finding buy it now items with advanced keywords / category search: '${searchParams.name}' | ${searchParams.categoryId}`);
        searchByKeywordsParams.categoryId = searchParams.categoryId;
        result = await this.ebay.findItemsAdvanced(searchByKeywordsParams);
      }
      else {
        this.log.info(`finding buy it now items with standard keywords search: '${searchParams.name}'`);
        result = await this.ebay.findItemsByKeywords(searchByKeywordsParams);
      }

      this.log.debug(`raw result`);
      this.log.debug(result);
      const mappedResults = this.mapSearchResultToItems(result);
      return mappedResults;
    }
    catch (e) {
      this.log.error(`failed to find items by keywords: ${e}`);
      throw e;
    }
  }

  protected mapSearchResultToItems(result: any): IEbayItemSearchResult[] {
    const rawItems = result[0].searchResult[0].item;
    if (rawItems) {
      const items: IEbayItemSearchResult[] = rawItems.map((rawItem) => {
        return {
          itemId: rawItem.itemId[0],
          title: rawItem.title[0],
          viewItemURL: rawItem.viewItemURL[0],
          currentPrice: rawItem.sellingStatus[0].convertedCurrentPrice[0]['@currencyId'],
          currentPriceCurrency: rawItem.sellingStatus[0].convertedCurrentPrice[0].__value__,
        }
      });
      return items;
    }
    return [];
  }

  protected getClientIdFromConfig() {
    return this.configurationService.config.ebayConfig.environment === 'PRODUCTION'
      ? this.configurationService.config.ebayConfig.productionClientId
      : this.configurationService.config.ebayConfig.sandboxClientId;
  }

  protected getClientSecretFromConfig() {
    return this.configurationService.config.ebayConfig.environment === 'PRODUCTION'
      ? this.configurationService.config.ebayConfig.productionClientSecret
      : this.configurationService.config.ebayConfig.sandboxClientSecret;
  }
}
