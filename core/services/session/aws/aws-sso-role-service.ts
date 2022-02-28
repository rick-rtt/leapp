import SSO, {
  AccountInfo,
  GetRoleCredentialsRequest,
  GetRoleCredentialsResponse,
  ListAccountRolesRequest,
  ListAccountsRequest,
  LogoutRequest,
  RoleInfo
} from 'aws-sdk/clients/sso'
import { BrowserWindowClosing } from '../../../interfaces/i-browser-window-closing'
import { INativeService } from '../../../interfaces/i-native-service'
import { ISessionNotifier } from '../../../interfaces/i-session-notifier'
import { AwsSsoRoleSession } from '../../../models/aws-sso-role-session'
import { CredentialsInfo } from '../../../models/credentials-info'
import { SessionType } from '../../../models/session-type'
import { AwsCoreService } from '../../aws-core-service'
import { FileService } from '../../file-service'
import { KeychainService } from '../../keychain-service'
import { Repository } from '../../repository'

import { AwsSessionService } from './aws-session-service'
import { AwsSsoOidcService } from '../../aws-sso-oidc.service'
import { AwsSsoRoleSessionRequest } from './aws-sso-role-session-request'
import {AwsSsoIntegration} from "../../../models/aws-sso-integration";

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
  private ssoPortal: SSO

  public constructor(iSessionNotifier: ISessionNotifier, repository: Repository, private fileService: FileService,
                     private keyChainService: KeychainService, private awsCoreService: AwsCoreService,
                     private nativeService: INativeService, private awsSsoOidcService: AwsSsoOidcService,
                     private appName: string, private defaultRegion: string) {
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
      }
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
      request.email)

    this.repository.addSession(session)
    this.iSessionNotifier?.addSession(session)
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.iSessionNotifier.getSessionById(sessionId)
    const profileName = this.repository.getProfileName((session as AwsSsoRoleSession).profileId)
    const credentialObject = {}
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region
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
    const session: AwsSsoRoleSession = (this.iSessionNotifier.getSessionById(sessionId) as AwsSsoRoleSession);
    const awsSsoConfiguration = this.repository.getAwsSsoConfiguration(session.awsSsoConfigurationId);
    const region = awsSsoConfiguration.region;
    const portalUrl = awsSsoConfiguration.portalUrl;
    const roleArn = session.roleArn;

    const accessToken = await this.getAccessToken(session.awsSsoConfigurationId, region, portalUrl);
    const credentials = await this.getRoleCredentials(accessToken, region, roleArn);

    return AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(credentials)
  }

  sessionDeactivated(sessionId: string) {
    super.sessionDeactivated(sessionId)
  }

  removeSecrets(sessionId: string): void {
  }

  async sync(configurationId: string): Promise<SsoRoleSession[]> {
    const region = this.repository.getAwsSsoConfiguration(configurationId).region
    const portalUrl = this.repository.getAwsSsoConfiguration(configurationId).portalUrl

    const accessToken = await this.getAccessToken(configurationId, region, portalUrl);

    const sessions = await this.getSessions(configurationId, accessToken, region)

    const persistedSessions = this.repository.getAwsSsoIntegrationSessions(configurationId);
    const sessionsToBeDeleted: SsoRoleSession[] = [];

    for (let i = 0; i < persistedSessions.length; i++) {
      const persistedSession = persistedSessions[i];
      const shouldBeDeleted = sessions.filter(s =>
        (persistedSession as unknown as SsoRoleSession).sessionName === s.sessionName &&
        (persistedSession as unknown as SsoRoleSession).roleArn === s.roleArn &&
        (persistedSession as unknown as SsoRoleSession).email === s.email).length === 0;

      if (shouldBeDeleted) {
        sessionsToBeDeleted.push(persistedSession as unknown as SsoRoleSession);

        const iamRoleChainedSessions = this.repository.listIamRoleChained(persistedSession);

        for (let j = 0; j < iamRoleChainedSessions.length; j++) {
          await this.delete(iamRoleChainedSessions[j].sessionId);
        }

        await this.stop(persistedSession.sessionId);
        this.repository.deleteSession(persistedSession.sessionId);
      }
    }

    const finalSessions = [];

    for (let j = 0; j < sessions.length; j++) {
      const session = sessions[j];
      let found = false;
      for (let i = 0; i < persistedSessions.length; i++) {
        const persistedSession = persistedSessions[i];
        if((persistedSession as unknown as SsoRoleSession).sessionName === session.sessionName &&
          (persistedSession as unknown as SsoRoleSession).roleArn === session.roleArn &&
          (persistedSession as unknown as SsoRoleSession).email === session.email) {
          found = true;
          break;
        }
      }
      if(!found) {
        finalSessions.push(session);
      }
    }

    return finalSessions;
  }

  async logout(configurationId: string | number): Promise<void> {
    // Obtain region and access token
    const configuration: AwsSsoIntegration = this.repository.getAwsSsoConfiguration(configurationId);
    const region = configuration.region;
    const savedAccessToken = await this.getAccessTokenFromKeychain();

    // Configure Sso Portal Client
    this.getSsoPortalClient(region)

    // Make a logout request to Sso
    const logoutRequest: LogoutRequest = {accessToken: savedAccessToken}

    this.ssoPortal.logout(logoutRequest).promise().then(_ => {
    }, _ => {
      // Clean clients
      this.ssoPortal = null

      // Delete access token and remove sso configuration info from workspace
      this.keyChainService.deletePassword(this.appName, 'aws-sso-access-token')
      this.repository.unsetAwsSsoIntegrationExpiration(configurationId.toString());

      this.removeSsoSessionsFromWorkspace()
    })
  }

  async getAccessToken(configurationId: string, region: string, portalUrl: string): Promise<string> {
    if (this.ssoExpired(configurationId)) {
      const loginResponse = await this.login(configurationId, region, portalUrl);
      const configuration: AwsSsoIntegration = this.repository.getAwsSsoConfiguration(configurationId);

      this.configureAwsSso(
        configurationId,
        configuration.alias,
        region,
        loginResponse.portalUrlUnrolled,
        configuration.browserOpening,
        loginResponse.expirationTime.toISOString(),
        loginResponse.accessToken
      );

      return loginResponse.accessToken;
    } else {
      return await this.getAccessTokenFromKeychain()
    }
  }

  async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.getSsoPortalClient(region)

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split('/')[1],
      accessToken
    }

    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise()
  }

  async awsSsoActive(configurationId: string | number): Promise<boolean> {
    const ssoToken = await this.getAccessTokenFromKeychain();
    return !this.ssoExpired(configurationId) && ssoToken !== undefined;
  }

  private ssoExpired(configurationId: string | number): boolean {
    const expirationTime = this.repository.getAwsSsoConfiguration(configurationId).accessTokenExpiration;
    return !expirationTime || Date.parse(expirationTime) < Date.now();
  }

  private async login(configurationId: string | number, region: string, portalUrl: string): Promise<LoginResponse> {
    const redirectClient = this.nativeService.followRedirects[this.getProtocol(portalUrl)];
    portalUrl = await new Promise((resolve, _) => {
      const request = redirectClient.request(portalUrl, response => resolve(response.responseUrl));
      request.end();
    })

    const generateSsoTokenResponse = await this.awsSsoOidcService.login(configurationId, region, portalUrl);
    return {
      portalUrlUnrolled: portalUrl,
      accessToken: generateSsoTokenResponse.accessToken,
      region,
      expirationTime: generateSsoTokenResponse.expirationTime
    }
  }

  private getProtocol(aliasedUrl: string): string {
    let protocol = aliasedUrl.split('://')[0]
    if (protocol.indexOf('http') === -1) {
      protocol = 'https'
    }
    return protocol
  }

  private async getSessions(configurationId: string, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    const accounts: AccountInfo[] = await this.listAccounts(accessToken, region)

    const promiseArray: Promise<SsoRoleSession[]>[] = []

    accounts.forEach((account) => {
      promiseArray.push(this.getSessionsFromAccount(configurationId, account, accessToken, region))
    })

    return new Promise((resolve, _) => {
      Promise.all(promiseArray).then((sessionMatrix: SsoRoleSession[][]) => {
        resolve(sessionMatrix.flat())
      })
    })
  }

  private async getSessionsFromAccount(configurationId: string, accountInfo: AccountInfo, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    this.getSsoPortalClient(region)

    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30 // TODO: find a proper value
    }

    const accountRoles: RoleInfo[] = []

    await new Promise((resolve, _) => {
      this.recursiveListRoles(accountRoles, listAccountRolesRequest, resolve)
    })

    const awsSsoSessions: SsoRoleSession[] = []

    accountRoles.forEach((accountRole) => {
      const oldSession = this.findOldSession(accountInfo, accountRole)

      const awsSsoSession = {
        email: accountInfo.emailAddress,
        region: oldSession?.region || this.repository.getDefaultRegion() || this.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
        profileId: oldSession?.profileId || this.repository.getDefaultProfileId(),
        awsSsoConfigurationId: configurationId
      }

      awsSsoSessions.push(awsSsoSession)
    })

    return awsSsoSessions
  }

  private recursiveListRoles(accountRoles: RoleInfo[], listAccountRolesRequest: ListAccountRolesRequest, promiseCallback: any) {
    this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise().then(response => {
      accountRoles.push(...response.roleList)

      if (response.nextToken !== null) {
        listAccountRolesRequest.nextToken = response.nextToken
        this.recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback)
      } else {
        promiseCallback(accountRoles)
      }
    })
  }

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.getSsoPortalClient(region)

    const listAccountsRequest: ListAccountsRequest = {accessToken, maxResults: 30}
    const accountList: AccountInfo[] = []

    return new Promise((resolve, _) => {
      this.recursiveListAccounts(accountList, listAccountsRequest, resolve)
    })
  }

  private recursiveListAccounts(accountList: AccountInfo[], listAccountsRequest: ListAccountsRequest, promiseCallback: any) {
    this.ssoPortal.listAccounts(listAccountsRequest).promise().then(response => {
      accountList.push(...response.accountList)

      if (response.nextToken !== null) {
        listAccountsRequest.nextToken = response.nextToken
        this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback)
      } else {
        promiseCallback(accountList)
      }
    })
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

      this.iSessionNotifier.deleteSession(sess.sessionId)
      this.repository.deleteSession(sess.sessionId)
    }
  }

  private configureAwsSso(configurationId: string, alias: string, region: string, portalUrl: string, browserOpening: string, expirationTime: string, accessToken: string) {
    this.repository.updateAwsSsoIntegration(configurationId, alias, region, portalUrl, browserOpening, expirationTime);
    this.keyChainService.saveSecret(this.appName, 'aws-sso-access-token', accessToken).then(_ => {});
  }

  private getSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region})
    }
  }

  private async getAccessTokenFromKeychain(): Promise<string> {
    return this.keyChainService.getSecret(this.appName, 'aws-sso-access-token')
  }

  private findOldSession(accountInfo: SSO.AccountInfo, accountRole: SSO.RoleInfo): { region: string; profileId: string } {
    //TODO: use map and filter in order to make this method more readable
    for (let i = 0; i < this.iSessionNotifier.getSessions().length; i++) {
      const sess = this.iSessionNotifier.getSessions()[i]

      if (sess.type === SessionType.awsSsoRole) {
        if (
          ((sess as AwsSsoRoleSession).email === accountInfo.emailAddress) &&
          ((sess as AwsSsoRoleSession).roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`)
        ) {
          return {region: (sess as AwsSsoRoleSession).region, profileId: (sess as AwsSsoRoleSession).profileId}
        }
      }
    }

    return undefined
  }
}
