import { CliUx } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { LeappCommand } from "../../leappCommand";

export default class ListIdpUrls extends LeappCommand {
  static description = "Show identity providers list";
  static examples = ["$leapp idp-url list"];

  static flags = {
    ...CliUx.ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showIdpUrls();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showIdpUrls(): Promise<void> {
    const { flags } = await this.parse(ListIdpUrls);
    const data = this.leappCliService.idpUrlsService.getIdpUrls().map((idpUrl: any) => ({
      url: idpUrl.url,
    })) as any as Record<string, unknown>[];

    const columns = {
      url: { header: "Identity Provider URL" },
    };

    CliUx.ux.table(data, columns, { ...flags });
  }
}
