import { Repository } from '@noovolari/leapp-core/services/repository'
import { ISessionNotifier } from '@noovolari/leapp-core/interfaces/i-session-notifier'
import { Session } from '@noovolari/leapp-core/models/session'
import { CliNativeService } from './cli-native-service'
import { FileService } from '@noovolari/leapp-core/services/file-service'
import {
  AwsIamUserService,
  IMfaCodePrompter
} from '@noovolari/leapp-core/services/session/aws/aws-iam-user-service'
import { KeychainService } from '@noovolari/leapp-core/services/keychain-service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'

class SessionNotifier implements ISessionNotifier {

  addSession(session: Session): void {
    console.log(session)
  }

  deleteSession(sessionId: string): void {
    console.log(sessionId)
  }

  getSessionById(sessionId: string): Session {
    console.log(sessionId)
    return new Session('fake-session-name', 'fake-region')
  }

  getSessions(): Session[] {
    return []
  }

  listActive(): Session[] {
    return []
  }

  listAwsSsoRoles(): Session[] {
    return []
  }

  listIamRoleChained(session: Session): Session[] {
    return [session]
  }

  listPending(): Session[] {
    return []
  }

  setSessions(sessions: Session[]): void {
    console.log(sessions)
  }
}

const cliNativeService: CliNativeService = new CliNativeService()
const fileService: FileService = new FileService(cliNativeService)
const repository: Repository = new Repository(cliNativeService, fileService)

class MfaCodePrompter implements IMfaCodePrompter {
  promptForMFACode(sessionName: string, callback: any): void {
    console.log(`prompting mfa for session ${sessionName}`)
    if (callback !== undefined) {
      callback()
    }
  }
}

const keychainService = new KeychainService(cliNativeService)
const awsCoreService = new AwsCoreService(cliNativeService)

export const awsIamUserService = new AwsIamUserService(new SessionNotifier(), repository, new MfaCodePrompter(),
  keychainService, fileService, awsCoreService)
