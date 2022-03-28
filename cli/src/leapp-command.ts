import { Command } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { CliProviderService } from "./service/cli-provider-service";

export abstract class LeappCommand extends Command {
  protected constructor(argv: string[], config: Config, protected leappCliService = new CliProviderService()) {
    super(argv, config);
  }

  async init(): Promise<any> {
    this.leappCliService.awsSsoRoleService.setAwsIntegrationDelegate(this.leappCliService.awsSsoIntegrationService);
    const isDesktopAppRunning = await this.leappCliService.remoteProceduresClient.isDesktopAppRunning();
    if (!isDesktopAppRunning) {
      this.error("Leapp app must be running to use this CLI");
    }
  }
}
