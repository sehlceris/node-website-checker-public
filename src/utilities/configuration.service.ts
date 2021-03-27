import * as fs from 'fs';
import {IAppConfiguration} from './configuration.interface';
import {injectable} from 'tsyringe';

const CONFIG_PATH = './config.json';
const config: IAppConfiguration = Object.freeze(
  JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')),
) as IAppConfiguration;

injectable();
export class ConfigurationService {
  private _config: IAppConfiguration;

  constructor() {
    this._config = config;
  }

  static get config(): IAppConfiguration {
    return config;
  }

  // ***** instance methods

  get config(): IAppConfiguration {
    return ConfigurationService.config;
  }
}
