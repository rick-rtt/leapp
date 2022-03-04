import { Command } from "@oclif/core";
import { LeappCliService } from "../../service/leapp-cli-service";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrl } from "@noovolari/leapp-core/models/IdpUrl";

export default class EditIdpUrl extends Command {
  static description = "Edit an identity provider URL";

  static examples = [`$leapp idp-url edit`];

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedIdpUrl = await this.selectIdpUrl();
      const newIdpUrl = await this.getNewIdpUrl();
      await this.editIdpUrl(selectedIdpUrl.id, newIdpUrl);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectIdpUrl(): Promise<IdpUrl> {
    const idpUrls = this.leappCliService.idpUrlsService.getIdpUrls();
    if (idpUrls.length === 0) {
      throw new Error("no identity provider URLs available");
    }
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedIdpUrl",
        message: "select an identity provider URL",
        type: "list",
        choices: idpUrls.map((idpUrl) => ({ name: idpUrl.url, value: idpUrl })),
      },
    ]);
    return answer.selectedIdpUrl;
  }

  async getNewIdpUrl(): Promise<string> {
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "newIdpUrl",
        message: "choose a new URL",
        validate: (url) => this.leappCliService.idpUrlsService.validateIdpUrl(url),
        type: "input",
      },
    ]);
    return answer.newIdpUrl;
  }

  async editIdpUrl(id: string, newIdpUrl: string) {
    await this.leappCliService.idpUrlsService.editIdpUrl(id, newIdpUrl);
    this.log("IdP URL edited");
  }
}
