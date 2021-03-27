import {Page} from 'puppeteer';

/*
PageCheckFunction receives:
   - a Puppeteer Page
   - a callback to send a message/alert
   - a function that returns a boolean of whether the function should run its check
 */
export type PageCheckFunction = (
  page: Page,
  cb: (message: string) => void,
  canCheck: () => boolean,
) => void;
