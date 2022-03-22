import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class CreateNamedProfile extends LeappCommand {
  static description = "Create a new AWS named profile";

  static examples = [`$leapp profile create`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const profileName = await this.getProfileName();
      await this.createNamedProfile(profileName);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async getProfileName(): Promise<string> {
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "namedProfileName",
        message: `choose a name for the profile`,
        validate: (profileName) => this.leappCliService.namedProfilesService.validateNewProfileName(profileName),
        type: "input",
      },
    ]);
    return answer.namedProfileName;
  }

  async createNamedProfile(profileName: string): Promise<void> {
    this.leappCliService.namedProfilesService.createNamedProfile(profileName);
    await this.leappCliService.desktopAppRemoteProcedures.refreshSessions();
    this.log("profile created");
  }
}
