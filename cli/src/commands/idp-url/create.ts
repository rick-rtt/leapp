import { Command } from "@oclif/core";
import { LeappCliService } from "../../service/leapp-cli-service";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrl } from "@noovolari/leapp-core/models/IdpUrl";

export default class CreateIdpUrl extends Command {
  static description = "Create a new identity provider URL";

  static examples = [`$leapp idp-url create`];

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.promptAndCreateIdpUrl();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async promptAndCreateIdpUrl(): Promise<IdpUrl> {
    const idpUrl = await this.getIdpUrl();
    return this.createIdpUrl(idpUrl);
  }

  async getIdpUrl(): Promise<string> {
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "idpUrl",
        message: `enter the identity provider URL`,
        validate: (url) => this.leappCliService.idpUrlsService.validateIdpUrl(url),
        type: "input",
      },
    ]);
    return answer.idpUrl;
  }

  createIdpUrl(idpUrl: string): IdpUrl {
    const newIdpUrl = this.leappCliService.idpUrlsService.createIdpUrl(idpUrl);
    this.log("identity provider URL created");
    return newIdpUrl;
  }
}
