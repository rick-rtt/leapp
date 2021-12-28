import {Command, Flags} from '@oclif/core';
import {AwsIamUserService, IMfaCodePrompter, ISessionNotifier, Session} from '@noovolari/leapp-core';

export default class Stop extends Command {
  static description = 'Stop Session'

  static examples = [
    `$ oex stop --sessionId 1234567890`,
  ]

  static flags = {
    sessionId: Flags.string({char: 'i', description: 'Session ID', required: true}),
  }

  //static args = [{name: '', description: '', required: true}]

  async run(): Promise<void> {
    const parserOuput = await this.parse(Stop)

    try {
      AwsIamUserService.init(new SessionNotifier(), new MfaCodePrompter())
      await AwsIamUserService.getInstance().stop(parserOuput.flags.sessionId);
    } catch (e: any) {
      this.log(e);
    }
  }
}

export class SessionNotifier implements ISessionNotifier {
  addSession(session: Session): void {
    console.log(session);
  }

  deleteSession(sessionId: string): void {
    console.log(sessionId);
  }

  getSessionById(sessionId: string): Session {
    console.log(sessionId);
    return new Session('fake session name', 'fake region')
  }

  getSessions(): Session[] {
    return [];
  }

  listActive(): Session[] {
    return [];
  }

  listAwsSsoRoles(): Session[] {
    return [];
  }

  listIamRoleChained(session: Session): Session[] {
    console.log(session);
    return [];
  }

  listPending(): Session[] {
    return [];
  }

  setSessions(sessions: Session[]): void {
    console.log(sessions);
  }
}

export class MfaCodePrompter implements IMfaCodePrompter {
  promptForMFACode(sessionName: string, callback: any): void {
    console.log(`prompting mfa for session ${sessionName}`);
    if(callback !== undefined) {
      callback();
    }
  }
}
