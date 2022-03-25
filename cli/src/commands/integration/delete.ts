import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";

export default class DeleteIntegration extends LeappCommand {
  static description = "Delete an integration";

  static examples = ["$leapp integration delete"];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedIntegration = await this.selectIntegration();
      await this.delete(selectedIntegration);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async delete(integration: AwsSsoIntegration): Promise<void> {
    await this.leappCliService.awsSsoIntegrationService.deleteIntegration(integration.id);
    await this.leappCliService.remoteProceduresClient.refreshIntegrations();
    await this.leappCliService.remoteProceduresClient.refreshSessions();
    this.log(`integration deleted`);
  }

  async selectIntegration(): Promise<AwsSsoIntegration> {
    const integrations = this.leappCliService.awsSsoIntegrationService.getIntegrations();
    if (integrations.length === 0) {
      throw new Error("no integrations available");
    }

    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedIntegration",
        message: "select an integration to delete",
        type: "list",
        choices: integrations.map((integration: any) => ({ name: integration.alias, value: integration })),
      },
    ]);
    return answer.selectedIntegration;
  }
}
