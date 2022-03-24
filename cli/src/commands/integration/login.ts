import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";

export default class LoginIntegration extends LeappCommand {
  static description = "Login to synchronize integration sessions";

  static examples = ["$leapp integration login"];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedIntegration = await this.selectIntegration();
      await this.login(selectedIntegration);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async login(integration: AwsSsoIntegration): Promise<void> {
    this.log("waiting for browser authorization using your AWS sign-in...");
    const sessionsDiff = await this.leappCliService.awsSsoIntegrationService.syncSessions(integration.id);
    await this.leappCliService.remoteProceduresClient.refreshIntegrations();
    await this.leappCliService.remoteProceduresClient.refreshSessions();
    this.log(`${sessionsDiff.sessionsToAdd.length} sessions added`);
    this.log(`${sessionsDiff.sessionsToDelete.length} sessions removed`);
    // TODO: use with puppeteer
    // await this.leappCliService.cliVerificationWindowService.closeBrowser();
  }

  async selectIntegration(): Promise<AwsSsoIntegration> {
    const offlineIntegrations = this.leappCliService.awsSsoIntegrationService.getOfflineIntegrations();
    if (offlineIntegrations.length === 0) {
      throw new Error("no offline integrations available");
    }

    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedIntegration",
        message: "select an integration",
        type: "list",
        choices: offlineIntegrations.map((integration: any) => ({ name: integration.alias, value: integration })),
      },
    ]);
    return answer.selectedIntegration;
  }
}
