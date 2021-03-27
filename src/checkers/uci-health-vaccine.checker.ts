import {PageCheckFunction} from 'types';
import {delayPromise} from '../utilities/promise-utils';

const reloadAndReadErrorContent = async (page) => {
  await page.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
  const textContent = await page.evaluate(
    () => document.querySelector('.errormessage').textContent,
  );
  console.log(`uci health error content: ${textContent}`);
  return textContent;
};

export const uciHealthVaccineChecker: PageCheckFunction = async (page, cb, canCheck) => {
  const uri =
    'https://mychart-openscheduling.et0502.epichosted.com/uci/SignupAndSchedule/EmbeddedSchedule?vt=8631&dept=80110004&payor=8070,8073,8011,8078,8093,8026,8030,8035,8036,8044,8241,8158,8054,-1,-2,-3&lang=en-US';

  const checkText = 'At this time, we don’t have any appointments available';

  const initialCheckDelay = 10000;
  const checkInterval = 60 * 60 * 1000; // 1 hour
  // const checkInterval = 15000; // 15 seconds (for dev testing only!)

  await delayPromise(1000);
  await page.goto(uri, {
    waitUntil: 'networkidle2',
  });
  await delayPromise(initialCheckDelay);

  // initial check
  const errorContent = await reloadAndReadErrorContent(page);
  cb(`initialized uciHealthVaccineChecker. current page content: ${errorContent}`);

  while (true) {
    await delayPromise(checkInterval);
    const errorContent = await reloadAndReadErrorContent(page);
    if (!errorContent || errorContent.indexOf(checkText) < 0) {
      cb(`uciHealthVaccineChecker: no error found`);
    } else {
      cb(`uciHealthVaccineChecker: current page content: ${errorContent}`);
    }
  }
};
