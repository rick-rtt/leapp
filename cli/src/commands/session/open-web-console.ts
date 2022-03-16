import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";

export default class OpenWebConsole extends LeappCommand {
  static description = "Open an AWS Web Console";

  static examples = [`$leapp session open-web-console`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      await this.openWebConsole(selectedSession);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async openWebConsole(session: Session): Promise<void> {
    // TODO: check whether the session is an aws one
    const sessionService = this.leappCliService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    const credentials = await sessionService.generateCredentials(session.sessionId);
    try {
      await this.leappCliService.webConsoleService.openWebConsole(credentials, session.region);
    } catch (e) {
      console.log(e);
      throw e;
    }
    this.log("opened AWS Web Console for this session");
  }

  async selectSession(): Promise<Session> {
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
}
