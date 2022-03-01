import SSO from 'aws-sdk/clients/sso'
import {BrowserWindowClosing} from '../../../interfaces/i-browser-window-closing'
import {INativeService} from '../../../interfaces/i-native-service'
import {ISessionNotifier} from '../../../interfaces/i-session-notifier'
import {AwsSsoRoleSession} from '../../../models/aws-sso-role-session'
import {CredentialsInfo} from '../../../models/credentials-info'
import {AwsCoreService} from '../../aws-core-service'
import {FileService} from '../../file-service'
import {KeychainService} from '../../keychain-service'
import {Repository} from '../../repository'

import {AwsSessionService} from './aws-session-service'
import {AwsSsoOidcService} from '../../aws-sso-oidc.service'
import {AwsSsoRoleSessionRequest} from './aws-sso-role-session-request'
import {AwsIntegrationsService} from '../../aws-integrations-service'

export interface GenerateSSOTokenResponse {
  accessToken: string;
  expirationTime: Date;
}

export interface LoginResponse {
  accessToken: string;
  region: string;
  expirationTime: Date;
  portalUrlUnrolled: string;
}

export interface RegisterClientResponse {
  clientId?: string;
  clientSecret?: string;
  clientIdIssuedAt?: number;
  clientSecretExpiresAt?: number;
}

export interface StartDeviceAuthorizationResponse {
  deviceCode?: string;
  expiresIn?: number;
  interval?: number;
  userCode?: string;
  verificationUri?: string;
  verificationUriComplete?: string;
}

export interface VerificationResponse {
  clientId: string;
  clientSecret: string;
  deviceCode: string;
}

export interface SsoRoleSession {
  sessionName: string;
  roleArn: string;
  email: string;
  region: string;
  profileId: string;
  awsSsoConfigurationId: string;
}

export class AwsSsoRoleService extends AwsSessionService implements BrowserWindowClosing {

  public constructor(iSessionNotifier: ISessionNotifier, repository: Repository, private fileService: FileService,
                     private keyChainService: KeychainService, private awsCoreService: AwsCoreService,
                     private nativeService: INativeService, private awsSsoOidcService: AwsSsoOidcService,
                     private awsIntegrationsService: AwsIntegrationsService) {
    super(iSessionNotifier, repository)
    awsSsoOidcService.appendListener(this)
  }

  static sessionTokenFromGetSessionTokenResponse(getRoleCredentialResponse: SSO.GetRoleCredentialsResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: getRoleCredentialResponse.roleCredentials.accessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: getRoleCredentialResponse.roleCredentials.secretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: getRoleCredentialResponse.roleCredentials.sessionToken.trim(),
      },
    }
  }

  async catchClosingBrowserWindow(): Promise<void> {
    const sessions = this.iSessionNotifier.listAwsSsoRoles()
    for (let i = 0; i < sessions.length; i++) {
      // Stop session
      const currentSession = sessions[i]
      await this.stop(currentSession.sessionId).then(_ => {
      })
    }
  }

  async create(request: AwsSsoRoleSessionRequest): Promise<void> {
    const session = new AwsSsoRoleSession(request.sessionName, request.region, request.roleArn, request.profileId,
      request.awsSsoConfigurationId, request.email)

    this.repository.addSession(session)
    this.iSessionNotifier?.addSession(session)
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.iSessionNotifier.getSessionById(sessionId)
    const profileName = this.repository.getProfileName((session as AwsSsoRoleSession).profileId)
    const credentialObject = {}
    credentialObject[profileName] = {
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region,
    }
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject)
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.iSessionNotifier.getSessionById(sessionId)
    const profileName = this.repository.getProfileName((session as AwsSsoRoleSession).profileId)
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath())
    delete credentialsFile[profileName]
    await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile)
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    const session: AwsSsoRoleSession = (this.iSessionNotifier.getSessionById(sessionId) as AwsSsoRoleSession)
    const awsSsoConfiguration = this.repository.getAwsSsoConfiguration(session.awsSsoConfigurationId)
    const region = awsSsoConfiguration.region
    const portalUrl = awsSsoConfiguration.portalUrl
    const roleArn = session.roleArn

    const accessToken = await this.awsIntegrationsService.getAccessToken(session.awsSsoConfigurationId, region, portalUrl)
    const credentials = await this.awsIntegrationsService.getRoleCredentials(accessToken, region, roleArn)

    return AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(credentials)
  }

  sessionDeactivated(sessionId: string) {
    super.sessionDeactivated(sessionId)
  }

  removeSecrets(sessionId: string): void {
  }

  public async loginAndGetSsoSessions(integrationId: string): Promise<SsoRoleSession[]> {
    const onlineSessions = await this.awsIntegrationsService.loginAndGetOnlineSessions(integrationId)
    const persistedSessions = this.repository.getAwsSsoIntegrationSessions(integrationId)
    const sessionsToBeDeleted: SsoRoleSession[] = []

    for (let i = 0; i < persistedSessions.length; i++) {
      const persistedSession = persistedSessions[i]
      const shouldBeDeleted = onlineSessions.filter(s =>
        (persistedSession as unknown as SsoRoleSession).sessionName === s.sessionName &&
        (persistedSession as unknown as SsoRoleSession).roleArn === s.roleArn &&
        (persistedSession as unknown as SsoRoleSession).email === s.email).length === 0

      if (shouldBeDeleted) {
        sessionsToBeDeleted.push(persistedSession as unknown as SsoRoleSession)

        const iamRoleChainedSessions = this.repository.listIamRoleChained(persistedSession)

        for (let j = 0; j < iamRoleChainedSessions.length; j++) {
          await this.delete(iamRoleChainedSessions[j].sessionId)
        }

        await this.stop(persistedSession.sessionId)
        this.repository.deleteSession(persistedSession.sessionId)
      }
    }

    const finalSessions = []

    for (let j = 0; j < onlineSessions.length; j++) {
      const session = onlineSessions[j]
      let found = false
      for (let i = 0; i < persistedSessions.length; i++) {
        const persistedSession = persistedSessions[i]
        if ((persistedSession as unknown as SsoRoleSession).sessionName === session.sessionName &&
          (persistedSession as unknown as SsoRoleSession).roleArn === session.roleArn &&
          (persistedSession as unknown as SsoRoleSession).email === session.email) {
          found = true
          break
        }
      }
      if (!found) {
        finalSessions.push(session)
      }
    }

    return finalSessions
  }

  public async logout(integrationId: string | number): Promise<void> {
    await this.awsIntegrationsService.logout(integrationId, async () => this.removeSsoSessionsFromWorkspace())
  }

  private async removeSsoSessionsFromWorkspace(): Promise<void> {
    const sessions = this.iSessionNotifier.listAwsSsoRoles()

    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i]

      const iamRoleChainedSessions = this.iSessionNotifier.listIamRoleChained(sess)

      for (let j = 0; j < iamRoleChainedSessions.length; j++) {
        await this.delete(iamRoleChainedSessions[j].sessionId)
      }

      await this.stop(sess.sessionId)

      this.repository.deleteSession(sess.sessionId)
      this.iSessionNotifier.deleteSession(sess.sessionId)
    }
  }
}
