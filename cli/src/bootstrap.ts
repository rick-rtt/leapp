import {AwsIamUserService, IMfaCodePrompter, ISessionNotifier, Session} from "@noovolari/leapp-core";
import Repository from "@noovolari/leapp-core/services/repository";
import NativeService from "./native-service";
import {FileService} from "@noovolari/leapp-core/services/file-service";
import {KeychainService} from "@noovolari/leapp-core/services/keychain-service";
import AppService from "@noovolari/leapp-core/services/app-service";

class SessionNotifier implements ISessionNotifier {

  addSession(session: Session): void {
    console.log(session);
  }

  deleteSession(sessionId: string): void {
    console.log(sessionId);
  }

  getSessionById(sessionId: string): Session {
    console.log(sessionId);
    return new Session('fake-session-name', 'fake-region');
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
    return [session];
  }

  listPending(): Session[] {
    return [];
  }

  setSessions(sessions: Session[]): void {
    console.log(sessions);
  }
}

const nativeService: NativeService = new NativeService();
const fileService: FileService = new FileService(nativeService);
const repository: Repository = new Repository(nativeService, fileService);

class MfaCodePrompter implements IMfaCodePrompter {
  promptForMFACode(sessionName: string, callback: any): void {
    console.log(`prompting mfa for session ${sessionName}`);
    if(callback !== undefined) {
      callback();
    }
  }
}

const keychainService: KeychainService = new KeychainService(nativeService);
const appService: AppService = new AppService(nativeService);

export const awsIamUserService = new AwsIamUserService(new SessionNotifier(), repository, new MfaCodePrompter(),
  keychainService, fileService, appService);
