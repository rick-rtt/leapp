import {Repository} from './repository'
import {AwsSsoRoleService, LoginResponse, SsoRoleSession} from './session/aws/aws-sso-role-service'
import {AwsSsoIntegration} from '../models/aws-sso-integration'
import {formatDistance} from 'date-fns'
import {INativeService} from '../interfaces/i-native-service'
import {AwsSsoOidcService} from './aws-sso-oidc.service'
import {KeychainService} from './keychain-service'
import {constants} from '../models/constants'
import SSO, {
  AccountInfo, GetRoleCredentialsRequest, GetRoleCredentialsResponse,
  ListAccountRolesRequest,
  ListAccountsRequest,
  LogoutRequest,
  RoleInfo,
} from 'aws-sdk/clients/sso'
import {SessionType} from '../models/session-type'
import {AwsSsoRoleSession} from '../models/aws-sso-role-session'
import {ISessionNotifier} from '../interfaces/i-session-notifier'

const portalUrlValidationRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/

export interface IntegrationCreationParams {
  alias: string,
  portalUrl: string,
  region: string,
  browserOpening: string
}

export class AwsSsoIntegrationService {

  private ssoPortal: SSO

  constructor(private repository: Repository, private awsSsoOidcService: AwsSsoOidcService,
              private awsSsoRoleService: AwsSsoRoleService, private keyChainService: KeychainService,
              private iSessionNotifier: ISessionNotifier, private nativeService: INativeService) {
  }

  public static validateAlias(alias: string): boolean | string {
    return alias.trim() !== '' ? true : 'Empty alias'
  }

  public static validatePortalUrl(portalUrl: string): boolean | string {
    return portalUrlValidationRegex.test(portalUrl) ? true : 'Invalid portal URL'
  }

  public getIntegrations(): AwsSsoIntegration[] {
    return this.repository.listAwsSsoConfigurations()
  }

  public getOnlineIntegrations(): AwsSsoIntegration[] {
    return this.getIntegrations().filter(integration => this.isOnline(integration))
  }

  public getOfflineIntegrations(): AwsSsoIntegration[] {
    return this.getIntegrations().filter(integration => !this.isOnline(integration))
  }

  public isOnline(integration: AwsSsoIntegration): boolean {
    const expiration = new Date(integration.accessTokenExpiration).getTime()
    const now = this.getDate().getTime()
    return !!integration.accessTokenExpiration && now < expiration
  }

  public remainingHours(integration: AwsSsoIntegration): string {
    return formatDistance(new Date(integration.accessTokenExpiration), this.getDate(), {addSuffix: true})
  }

  public async loginAndGetOnlineSessions(integrationId: string): Promise<SsoRoleSession[]> {
    const region = this.repository.getAwsSsoConfiguration(integrationId).region
    const portalUrl = this.repository.getAwsSsoConfiguration(integrationId).portalUrl
    const accessToken = await this.getAccessToken(integrationId, region, portalUrl)
    const onlineSessions = await this.getSessions(integrationId, accessToken, region)

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
          await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId)
        }

        await this.awsSsoRoleService.stop(persistedSession.sessionId)
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
    // Obtain region and access token
    const configuration: AwsSsoIntegration = this.repository.getAwsSsoConfiguration(integrationId)
    const region = configuration.region
    const savedAccessToken = await this.getAccessTokenFromKeychain(integrationId)

    // Configure Sso Portal Client
    this.setupSsoPortalClient(region)

    // Make a logout request to Sso
    const logoutRequest: LogoutRequest = {accessToken: savedAccessToken}

    this.ssoPortal.logout(logoutRequest).promise().then(_ => {
    }, async _ => {
      // Clean clients
      this.ssoPortal = null

      // Delete access token and remove sso configuration info from workspace
      await this.keyChainService.deletePassword(constants.appName, this.getIntegrationAccessTokenKey(integrationId))
      this.repository.unsetAwsSsoIntegrationExpiration(integrationId.toString())

      await this.awsSsoRoleService.removeSsoSessionsFromWorkspace()
    })
  }

  public async getAccessToken(integrationId: string, region: string, portalUrl: string): Promise<string> {
    if (this.ssoExpired(integrationId)) {
      const loginResponse = await this.login(integrationId, region, portalUrl)
      const configuration: AwsSsoIntegration = this.repository.getAwsSsoConfiguration(integrationId)

      await this.configureAwsSso(
        integrationId,
        configuration.alias,
        region,
        loginResponse.portalUrlUnrolled,
        configuration.browserOpening,
        loginResponse.expirationTime.toISOString(),
        loginResponse.accessToken,
      )

      return loginResponse.accessToken
    } else {
      return await this.getAccessTokenFromKeychain(integrationId)
    }
  }

  public async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.setupSsoPortalClient(region)

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split('/')[1],
      accessToken,
    }

    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise()
  }

  public createIntegration(creationParams: IntegrationCreationParams) {
    this.repository.addAwsSsoIntegration(creationParams.portalUrl, creationParams.alias, creationParams.region, creationParams.browserOpening)
  }

  public async deleteIntegration(integrationId: string) {
    await this.logout(integrationId);
    this.repository.deleteAwsSsoIntegration(integrationId);
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

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.setupSsoPortalClient(region)

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

  private setupSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region})
    }
  }

  private async getSessionsFromAccount(configurationId: string, accountInfo: AccountInfo, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    this.setupSsoPortalClient(region)

    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30, // TODO: find a proper value
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
        region: oldSession?.region || this.repository.getDefaultRegion() || constants.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
        profileId: oldSession?.profileId || this.repository.getDefaultProfileId(),
        awsSsoConfigurationId: configurationId,
      }

      awsSsoSessions.push(awsSsoSession)
    })

    return awsSsoSessions
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

  private async getAccessTokenFromKeychain(integrationId: string | number): Promise<string> {
    return await this.keyChainService.getSecret(constants.appName, this.getIntegrationAccessTokenKey(integrationId))
  }

  private async configureAwsSso(integrationId: string, alias: string, region: string, portalUrl: string,
                                browserOpening: string, expirationTime: string, accessToken: string): Promise<void> {
    this.repository.updateAwsSsoIntegration(integrationId, alias, region, portalUrl, browserOpening, expirationTime)
    await this.keyChainService.saveSecret(constants.appName, this.getIntegrationAccessTokenKey(integrationId), accessToken)
  }

  private getIntegrationAccessTokenKey(integrationId: string | number) {
    return `aws-sso-integration-access-token-${integrationId}`
  }

  private ssoExpired(configurationId: string | number): boolean {
    const expirationTime = this.repository.getAwsSsoConfiguration(configurationId).accessTokenExpiration
    return !expirationTime || Date.parse(expirationTime) < Date.now()
  }

  private async login(configurationId: string | number, region: string, portalUrl: string): Promise<LoginResponse> {
    const redirectClient = this.nativeService.followRedirects[this.getProtocol(portalUrl)]
    portalUrl = await new Promise((resolve, _) => {
      const request = redirectClient.request(portalUrl, response => resolve(response.responseUrl))
      request.end()
    })

    const generateSsoTokenResponse = await this.awsSsoOidcService.login(configurationId, region, portalUrl)

    return {
      portalUrlUnrolled: portalUrl,
      accessToken: generateSsoTokenResponse.accessToken,
      region,
      expirationTime: generateSsoTokenResponse.expirationTime,
    }
  }

  private getProtocol(aliasedUrl: string): string {
    let protocol = aliasedUrl.split('://')[0]
    if (protocol.indexOf('http') === -1) {
      protocol = 'https'
    }
    return protocol
  }

  private getDate(): Date {
    return new Date()
  }
}
