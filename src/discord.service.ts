import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {singleton} from 'tsyringe';
import * as Discord from 'discord.js';
import {WebhookClient} from 'discord.js';
import {delayPromise} from './utilities/promise-utils';

@singleton()
export class DiscordService {
  private log: BoundLogger = LogService.getInstance().bindToNamespace(this.constructor.name);
  private webhookClient: WebhookClient;

  constructor(private configurationService: ConfigurationService) {}

  async init() {
    const webhookId = this.configurationService.config.discordConfig.webhookId;
    const webhookToken = this.configurationService.config.discordConfig.webhookToken;

    this.webhookClient = new Discord.WebhookClient(webhookId, webhookToken);
    await delayPromise(1000);

    this.log.debug(`initialized discord api using webhookId ${webhookId}`);
  }

  async sendMessage(message: string) {
    if (this.configurationService.config.discordConfig.enabled) {
      if (this.webhookClient) {
        return this.webhookClient.send(message);
      } else {
        this.log.warn(`unable to send message - discord webhookClient is ${this.webhookClient}`);
      }
    } else {
      this.log.warn(`unable to send message - discord is disabled ${message}`);
    }
  }
}
