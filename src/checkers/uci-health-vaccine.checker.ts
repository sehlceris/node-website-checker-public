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

const CHECK_TEXT = 'At this time, we don’t have any appointments available';
const URI =
  'https://mychart-openscheduling.et0502.epichosted.com/uci/SignupAndSchedule/EmbeddedSchedule?vt=8631&dept=80110004&payor=8070,8073,8011,8078,8093,8026,8030,8035,8036,8044,8241,8158,8054,-1,-2,-3&lang=en-US';
const ALERT_MESSAGE = 'uci health vaccine site has changed';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

const checkForPageAlert = async (page: Page) => {
  await reloadPage(page);
  const textContent = await page.evaluate(
    () => document.querySelector('.errormessage').textContent,
  );
  log.debug(`uci health content: ${textContent}`);
  return !containsTextCaseInsensitive(textContent, CHECK_TEXT);
};

export const uciHealthVaccineChecker: PageCheckFunction = async (page, cb, canCheck) => {
  const params: ContinualPageCheckParams = {
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
