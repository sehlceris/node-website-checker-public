import {Page} from 'puppeteer';
import {BoundLogger} from '../utilities/log.service';
import {delayPromise} from '../utilities/promise-utils';

export const reloadPage = async (page: Page) => {
  await page.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
};

export const containsTextCaseInsensitive = (text: string, search: string): boolean => {
  const textLower = text.toLowerCase();
  const searchLower = search.toLowerCase();
  const contains = textLower.indexOf(searchLower) > -1;
  return contains;
};

export interface ContinualPageCheckParams {
  namespace: string;
  uri: string;
  page: Page;
  checkInterval: number;
  cb: (message: string) => void;
  canCheck: () => boolean;
  pageCheckFn: (page: Page) => Promise<boolean>;
  alertMessage: string;
  log: BoundLogger;
}

export const runContinualPageCheckSimple = async ({
  namespace,
  uri,
  page,
  checkInterval,
  cb,
  canCheck,
  pageCheckFn,
  alertMessage,
  log,
}: ContinualPageCheckParams) => {
  await page.goto(uri, {
    waitUntil: 'networkidle2',
  });
  await delayPromise(1000);
  await reloadPage(page);
  while (true) {
    if (canCheck()) {
      try {
        const hasAlert: boolean = await pageCheckFn(page);
        if (hasAlert) {
          log.info(`***** ${namespace} page alert: ${alertMessage}`);
          cb(`${namespace} ${alertMessage}`);
        } else {
          log.debug(`${namespace} no page alert`);
        }
      } catch (e) {
        cb(`${namespace} failed to run check: ${e.toString()}`);
      }
    } else {
      log.debug(`${namespace} abort check (canCheck is false)`);
    }
    await delayPromise(checkInterval);
  }
};
