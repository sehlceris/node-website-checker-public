import 'reflect-metadata'; // required to enable dependency injection
import {container} from 'tsyringe'; // enable dependency injection

import {Application} from './app';

const application = container.resolve(Application);

application
  .main()
  .then()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
