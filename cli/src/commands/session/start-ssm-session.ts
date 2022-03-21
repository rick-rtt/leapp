import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";

export default class StartSsmSession extends LeappCommand {
  static description = "Start an AWS SSM session";

  static examples = [`$leapp session start-ssm-session`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      await this.startSsmSession(selectedSession);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async startSsmSession(session: Session): Promise<void> {
    // TODO: check whether the session is an aws one
    const sessionService = this.leappCliService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    try {
      const credentials = await sessionService.generateCredentials(session.sessionId);
      const selectedSsmInstanceId = await this.selectSsmInstance(credentials, session.region);
      this.leappCliService.ssmService.startSession(credentials, selectedSsmInstanceId, session.region);
    } catch (e) {
      console.log(e);
      throw e;
    }
    this.log("started AWS SSM session");
  }

  private async selectSession(): Promise<Session> {
    const availableSessions = this.leappCliService.repository.getSessions().filter((session: Session) => session.status === SessionStatus.inactive);
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session: any) => ({ name: session.sessionName, value: session })),
      },
    ]);
    return answer.selectedSession;
  }

  private async selectSsmInstance(credentials: CredentialsInfo, region: string): Promise<string> {
    const ssmService = this.leappCliService.ssmService;
    const availableInstances = await ssmService.getSsmInstances(credentials, region);
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedInstance",
        message: "select an instance",
        type: "list",
        choices: availableInstances.map((instance: any) => ({ name: instance.Name, value: instance.InstanceId })),
      },
    ]);
    return answer.selectedInstance;
  }
}
