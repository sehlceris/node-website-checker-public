import {Page} from 'puppeteer';
import {PageCheckFunction} from 'types';
import {LogService} from '../utilities/log.service';
import {
  containsTextCaseInsensitive,
  ContinualPageCheckParams,
  reloadPage,
  runContinualPageCheckSimple,
} from './utilities';

const log = LogService.getInstance().bindToNamespace('LitterRobot');

const NAMESPACE = 'litterRobotChecker';
const CHECK_TEXT = 'Out of Stock';
const URI =
  'https://www.litter-robot.com/reconditioned-litter-robot-units/litter-robot-3-connect-reconditioned.html';
const ALERT_MESSAGE = 'litter robot alert';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

const checkForPageAlert = async (page: Page) => {
  await reloadPage(page);
  try {
    const textContent = await page.evaluate(
      () => document.querySelector('.availability').textContent,
    );
    log.debug(`litter robot content: ${textContent}`);
    return !containsTextCaseInsensitive(textContent, CHECK_TEXT);
  } catch (e) {
    log.error(`litter robot check fail: ${e}`);
    return true;
  }
};

export const litterRobotChecker: PageCheckFunction = async (page, cb, canCheck) => {
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
