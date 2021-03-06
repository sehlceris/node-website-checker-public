import {Page} from 'puppeteer';
import {PageCheckFunction} from 'types';
import {LogService} from '../utilities/log.service';
import {
  containsTextCaseInsensitive,
  ContinualPageCheckParams,
  reloadPage,
  runContinualPageCheckSimple,
} from './utilities';

const log = LogService.getInstance().bindToNamespace('UCIHealthVaccine');

const NAMESPACE = 'uciHealthVaccineChecker';
const CHECK_TEXT = 'At this time, we don’t have any appointments available';
const URI =
  'https://mychart-openscheduling.et0502.epichosted.com/uci/SignupAndSchedule/EmbeddedSchedule?vt=8631&dept=80110004&payor=8070,8073,8011,8078,8093,8026,8030,8035,8036,8044,8241,8158,8054,-1,-2,-3&lang=en-US';
const ALERT_MESSAGE = 'uci health vaccine site has changed';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

const checkForPageAlert = async (page: Page) => {
  await reloadPage(page);
  const openings = await page.evaluate(() => {
    try {
      const openingsData = document.querySelector('.openingsData');
      if (openingsData && openingsData.children) {
        return openingsData.children.length;
      }
      return 0;
    } catch (e) {
      return -1;
    }
  });
  log.debug(`uci health openings: ${openings}`);
  return !!openings;
};

export const uciHealthVaccineChecker: PageCheckFunction = async (page, cb, canCheck) => {
  const params: ContinualPageCheckParams = {
    namespace: NAMESPACE,
    uri: URI,
    page,
    checkInterval: CHECK_INTERVAL,
    cb,
    canCheck,
    pageCheckFn: checkForPageAlert,
    alertMessage: ALERT_MESSAGE,
    log,
  };
  runContinualPageCheckSimple(params);
};
