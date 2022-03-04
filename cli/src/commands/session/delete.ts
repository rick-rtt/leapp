import { Command } from "@oclif/core";
import { LeappCliService } from "../../service/leapp-cli-service";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";

export default class DeleteSession extends Command {
  static description = "Delete a session";

  static examples = [`$leapp session delete`];

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      const affectedSessions = this.getAffectedSessions(selectedSession);
      if (await this.askForConfirmation(affectedSessions)) {
        await this.deleteSession(selectedSession);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.leappCliService.repository.getSessions();
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session) => ({ name: session.sessionName, value: session })),
      },
    ]);
    return answer.selectedSession;
  }

  async deleteSession(session: Session): Promise<void> {
    const sessionService = this.leappCliService.sessionFactory.getSessionService(session.type);
    await sessionService.delete(session.sessionId);
    this.log("session deleted");
  }

  getAffectedSessions(session: Session): Session[] {
    const sessionService = this.leappCliService.sessionFactory.getSessionService(session.type);
    return sessionService.getDependantSessions(session.sessionId);
  }

  async askForConfirmation(affectedSessions: Session[]): Promise<boolean> {
    if (affectedSessions.length === 0) {
      return true;
    }
    const sessionsList = affectedSessions.map((session) => `- ${session.sessionName}`).join("\n");
    const answer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "confirmation",
        message: `deleting this session will delete also these chained sessions\n${sessionsList}\nDo you want to continue?`,
        type: "confirm",
      },
    ]);
    return answer.confirmation;
  }
}
