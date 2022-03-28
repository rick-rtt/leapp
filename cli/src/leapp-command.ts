import { Command } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { LeappCliService } from "./service/leapp-cli-service";

export abstract class LeappCommand extends Command {
  protected constructor(argv: string[], config: Config, protected leappCliService = new LeappCliService()) {
    super(argv, config);
  }

  async init(): Promise<any> {
    this.leappCliService.awsSsoRoleService.setAwsIntegrationDelegate(this.leappCliService.awsSsoIntegrationService);
    const isDesktopAppRunning = await this.leappCliService.remoteProceduresClient.isDesktopAppRunning();
    if (!isDesktopAppRunning) {
      this.error("Leapp app must be running to use this CLI. You can download it here: https://www.leapp.cloud/releases");
    }
  }
}
