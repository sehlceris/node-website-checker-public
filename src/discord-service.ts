import {BoundLogger, LogService} from './utilities/log.service';
import {ConfigurationService} from './utilities/configuration.service';
import {injectable} from 'tsyringe';
import * as Discord from 'discord.js';
import {WebhookClient} from 'discord.js';

@injectable()
export class DiscordService {
  private log: BoundLogger = this.logService.bindToNamespace(this.constructor.name);
  private webhookClient: WebhookClient;

  constructor(private logService: LogService, private configurationService: ConfigurationService) {
  }

  async init() {

    const webhookId = this.configurationService.config.discordConfig.webhookId;
    const webhookToken = this.configurationService.config.discordConfig.webhookToken;

    this.log.info(
      `initializing discord api using webhookId ${webhookId}`,
    );

    this.webhookClient = new Discord.WebhookClient(webhookId, webhookToken);
  }

  async sendMessage(message: string) {
    if (this.configurationService.config.discordConfig.enabled) {
      return this.webhookClient.send(message);
    }
    else {
      this.log.warn(`unable to send message - discord is disabled ${message}`);
    }
  }
}
