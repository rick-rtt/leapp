import { Repository } from "./repository";
import { AwsSsoRoleService, LoginResponse, SsoRoleSession } from "./session/aws/aws-sso-role-service";
import { AwsSsoIntegration } from "../models/aws-sso-integration";
import { formatDistance } from "date-fns";
import { INativeService } from "../interfaces/i-native-service";
import { AwsSsoOidcService } from "./aws-sso-oidc.service";
import { KeychainService } from "./keychain-service";
import { constants } from "../models/constants";
import SSO, {
  AccountInfo,
  GetRoleCredentialsRequest,
  GetRoleCredentialsResponse,
  ListAccountRolesRequest,
  ListAccountsRequest,
  LogoutRequest,
  RoleInfo,
} from "aws-sdk/clients/sso";
import { SessionType } from "../models/session-type";
import { AwsSsoRoleSession } from "../models/aws-sso-role-session";
import { ISessionNotifier } from "../interfaces/i-session-notifier";
import { AwsSsoIntegrationTokenInfo } from "../models/aws-sso-integration-token-info";

const portalUrlValidationRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

export interface IntegrationCreationParams {
  alias: string;
  portalUrl: string;
  region: string;
  browserOpening: string;
}

export class AwsSsoIntegrationService {
  private ssoPortal: SSO;

  constructor(
    private repository: Repository,
    private awsSsoOidcService: AwsSsoOidcService,
    private awsSsoRoleService: AwsSsoRoleService,
    private keyChainService: KeychainService,
    private sessionNotifier: ISessionNotifier,
    private nativeService: INativeService
  ) {}

  static validateAlias(alias: string): boolean | string {
    return alias.trim() !== "" ? true : "Empty alias";
  }

  static validatePortalUrl(portalUrl: string): boolean | string {
    return portalUrlValidationRegex.test(portalUrl) ? true : "Invalid portal URL";
  }

  // TODO: understand if we want to use an object that contains params
  createIntegration(creationParams: IntegrationCreationParams): void {
    this.repository.addAwsSsoIntegration(creationParams.portalUrl, creationParams.alias, creationParams.region, creationParams.browserOpening);
  }

  // TODO: to be moved in repository
  getIntegrations(): AwsSsoIntegration[] {
    return this.repository.listAwsSsoIntegrations();
  }

  // TODO: to be moved in repository
  getOnlineIntegrations(): AwsSsoIntegration[] {
    return this.getIntegrations().filter((integration) => this.isOnline(integration));
  }

  // TODO: to be moved in repository
  getOfflineIntegrations(): AwsSsoIntegration[] {
    return this.getIntegrations().filter((integration) => !this.isOnline(integration));
  }

  isOnline(integration: AwsSsoIntegration): boolean {
    const expiration = new Date(integration.accessTokenExpiration).getTime();
    const now = this.getDate().getTime();
    return !!integration.accessTokenExpiration && now < expiration;
  }

  remainingHours(integration: AwsSsoIntegration): string {
    return formatDistance(new Date(integration.accessTokenExpiration), this.getDate(), { addSuffix: true });
  }

  async loginAndProvisionSessions(integrationId: string): Promise<SsoRoleSession[]> {
    const region = this.repository.getAwsSsoIntegration(integrationId).region;
    const portalUrl = this.repository.getAwsSsoIntegration(integrationId).portalUrl;
    const accessToken = await this.getAccessToken(integrationId, region, portalUrl);
    const onlineSessions = await this.getSessions(integrationId, accessToken, region);

    const persistedSessions = this.repository.getAwsSsoIntegrationSessions(integrationId);
    const sessionsToBeDeleted: SsoRoleSession[] = [];

    for (let i = 0; i < persistedSessions.length; i++) {
      const persistedSession = persistedSessions[i];
      const shouldBeDeleted =
        onlineSessions.filter(
          (s) =>
            (persistedSession as unknown as SsoRoleSession).sessionName === s.sessionName &&
            (persistedSession as unknown as SsoRoleSession).roleArn === s.roleArn &&
            (persistedSession as unknown as SsoRoleSession).email === s.email
        ).length === 0;

      if (shouldBeDeleted) {
        sessionsToBeDeleted.push(persistedSession as unknown as SsoRoleSession);

        const iamRoleChainedSessions = this.repository.listIamRoleChained(persistedSession);

        for (let j = 0; j < iamRoleChainedSessions.length; j++) {
          await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId);
        }

        await this.awsSsoRoleService.stop(persistedSession.sessionId);
        this.repository.deleteSession(persistedSession.sessionId);
      }
    }

    const finalSessions = [];

    for (let j = 0; j < onlineSessions.length; j++) {
      const session = onlineSessions[j];
      let found = false;
      for (let i = 0; i < persistedSessions.length; i++) {
        const persistedSession = persistedSessions[i];
        if (
          (persistedSession as unknown as SsoRoleSession).sessionName === session.sessionName &&
          (persistedSession as unknown as SsoRoleSession).roleArn === session.roleArn &&
          (persistedSession as unknown as SsoRoleSession).email === session.email
        ) {
          found = true;
          break;
        }
      }
      if (!found) {
        finalSessions.push(session);
      }
    }

    return finalSessions;
  }

  async syncSessions(integrationId: string): Promise<SsoRoleSession[]> {
    const ssoRoleSessions: SsoRoleSession[] = await this.loginAndProvisionSessions(integrationId);

    ssoRoleSessions.forEach((ssoRoleSession: SsoRoleSession) => {
      ssoRoleSession.awsSsoConfigurationId = integrationId;
      this.awsSsoRoleService.create(ssoRoleSession);
    });

    return ssoRoleSessions;
  }

  async logout(integrationId: string | number): Promise<void> {
    // Obtain region and access token
    const integration: AwsSsoIntegration = this.repository.getAwsSsoIntegration(integrationId);
    const region = integration.region;
    const savedAccessToken = await this.getAccessTokenFromKeychain(integrationId);

    // Configure Sso Portal Client
    this.setupSsoPortalClient(region);

    // Make a logout request to Sso
    const logoutRequest: LogoutRequest = { accessToken: savedAccessToken };

    this.ssoPortal
      .logout(logoutRequest)
      .promise()
      .then(
        (_) => {},
        async (_) => {
          // logout request has to be handled in reject Promise by design

          // Clean clients
          this.ssoPortal = null;

          // Delete access token and remove sso integration info from workspace
          await this.keyChainService.deletePassword(constants.appName, this.getIntegrationAccessTokenKey(integrationId));
          this.repository.unsetAwsSsoIntegrationExpiration(integrationId.toString());
          await this.removeSsoSessionsFromWorkspace();
        }
      );
  }

  async getAccessToken(integrationId: string, region: string, portalUrl: string): Promise<string> {
    const isAwsSsoAccessTokenExpired = await this.isAwsSsoAccessTokenExpired(integrationId);

    if (isAwsSsoAccessTokenExpired) {
      const loginResponse = await this.login(integrationId, region, portalUrl);
      const integration: AwsSsoIntegration = this.repository.getAwsSsoIntegration(integrationId);

      await this.configureAwsSso(
        integrationId,
        integration.alias,
        region,
        loginResponse.portalUrlUnrolled,
        integration.browserOpening,
        loginResponse.expirationTime.toISOString(),
        loginResponse.accessToken
      );

      return loginResponse.accessToken;
    } else {
      return await this.getAccessTokenFromKeychain(integrationId);
    }
  }

  async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.setupSsoPortalClient(region);

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split("/")[1],
      accessToken,
    };

    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise();
  }

  async getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId: string): Promise<AwsSsoIntegrationTokenInfo> {
    const accessToken = await this.keyChainService.getSecret(constants.appName, `aws-sso-integration-access-token-${awsSsoIntegrationId}`);
    const expiration = this.repository.getAwsSsoIntegration(awsSsoIntegrationId)
      ? new Date(this.repository.getAwsSsoIntegration(awsSsoIntegrationId).accessTokenExpiration).getTime()
      : undefined;
    return { accessToken, expiration };
  }

  async isAwsSsoAccessTokenExpired(awsSsoIntegrationId: string): Promise<boolean> {
    const awsSsoAccessTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId);
    return !awsSsoAccessTokenInfo.expiration || awsSsoAccessTokenInfo.expiration < Date.now();
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    await this.logout(integrationId);
    this.repository.deleteAwsSsoIntegration(integrationId);
  }

  private async getSessions(integrationId: string, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    const accounts: AccountInfo[] = await this.listAccounts(accessToken, region);

    const promiseArray: Promise<SsoRoleSession[]>[] = [];

    accounts.forEach((account) => {
      promiseArray.push(this.getSessionsFromAccount(integrationId, account, accessToken, region));
    });

    return new Promise((resolve, _) => {
      Promise.all(promiseArray).then((sessionMatrix: SsoRoleSession[][]) => {
        resolve(sessionMatrix.flat());
      });
    });
  }

  private async configureAwsSso(
    integrationId: string,
    alias: string,
    region: string,
    portalUrl: string,
    browserOpening: string,
    expirationTime: string,
    accessToken: string
  ): Promise<void> {
    this.repository.updateAwsSsoIntegration(integrationId, alias, region, portalUrl, browserOpening, expirationTime);
    await this.keyChainService.saveSecret(constants.appName, this.getIntegrationAccessTokenKey(integrationId), accessToken);
  }

  private async getAccessTokenFromKeychain(integrationId: string | number): Promise<string> {
    return await this.keyChainService.getSecret(constants.appName, this.getIntegrationAccessTokenKey(integrationId));
  }

  private getIntegrationAccessTokenKey(integrationId: string | number) {
    return `aws-sso-integration-access-token-${integrationId}`;
  }

  private async login(integrationId: string | number, region: string, portalUrl: string): Promise<LoginResponse> {
    const redirectClient = this.nativeService.followRedirects[this.getProtocol(portalUrl)];
    portalUrl = await new Promise((resolve, _) => {
      const request = redirectClient.request(portalUrl, (response) => resolve(response.responseUrl));
      request.end();
    });

    const generateSsoTokenResponse = await this.awsSsoOidcService.login(integrationId, region, portalUrl);

    return {
      portalUrlUnrolled: portalUrl,
      accessToken: generateSsoTokenResponse.accessToken,
      region,
      expirationTime: generateSsoTokenResponse.expirationTime,
    };
  }

  private async removeSsoSessionsFromWorkspace(): Promise<void> {
    const sessions = this.repository.listAwsSsoRoles();

    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i];

      const iamRoleChainedSessions = this.repository.listIamRoleChained(sess);

      for (let j = 0; j < iamRoleChainedSessions.length; j++) {
        await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId);
      }

      await this.awsSsoRoleService.stop(sess.sessionId);

      this.repository.deleteSession(sess.sessionId);
      this.sessionNotifier?.deleteSession(sess.sessionId);
    }
  }

  private setupSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({ region });
    }
  }

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.setupSsoPortalClient(region);

    const listAccountsRequest: ListAccountsRequest = { accessToken, maxResults: 30 };
    const accountList: AccountInfo[] = [];

    return new Promise((resolve, _) => {
      this.recursiveListAccounts(accountList, listAccountsRequest, resolve);
    });
  }

  private recursiveListAccounts(accountList: AccountInfo[], listAccountsRequest: ListAccountsRequest, promiseCallback: any) {
    this.ssoPortal
      .listAccounts(listAccountsRequest)
      .promise()
      .then((response) => {
        accountList.push(...response.accountList);

        if (response.nextToken !== null) {
          listAccountsRequest.nextToken = response.nextToken;
          this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback);
        } else {
          promiseCallback(accountList);
        }
      });
  }

  private async getSessionsFromAccount(
    integrationId: string,
    accountInfo: AccountInfo,
    accessToken: string,
    region: string
  ): Promise<SsoRoleSession[]> {
    this.setupSsoPortalClient(region);

    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30, // TODO: find a proper value
    };

    const accountRoles: RoleInfo[] = [];

    await new Promise((resolve, _) => {
      this.recursiveListRoles(accountRoles, listAccountRolesRequest, resolve);
    });

    const awsSsoSessions: SsoRoleSession[] = [];

    accountRoles.forEach((accountRole) => {
      const oldSession = this.findOldSession(accountInfo, accountRole);

      const awsSsoSession = {
        email: accountInfo.emailAddress,
        region: oldSession?.region || this.repository.getDefaultRegion() || constants.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
        profileId: oldSession?.profileId || this.repository.getDefaultProfileId(),
        awsSsoConfigurationId: integrationId,
      };

      awsSsoSessions.push(awsSsoSession);
    });

    return awsSsoSessions;
  }

  private recursiveListRoles(accountRoles: RoleInfo[], listAccountRolesRequest: ListAccountRolesRequest, promiseCallback: any) {
    this.ssoPortal
      .listAccountRoles(listAccountRolesRequest)
      .promise()
      .then((response) => {
        accountRoles.push(...response.roleList);

        if (response.nextToken !== null) {
          listAccountRolesRequest.nextToken = response.nextToken;
          this.recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback);
        } else {
          promiseCallback(accountRoles);
        }
      });
  }

  private findOldSession(accountInfo: SSO.AccountInfo, accountRole: SSO.RoleInfo): { region: string; profileId: string } {
    //TODO: use map and filter in order to make this method more readable
    for (let i = 0; i < this.sessionNotifier.getSessions().length; i++) {
      const sess = this.sessionNotifier.getSessions()[i];

      if (sess.type === SessionType.awsSsoRole) {
        if (
          (sess as AwsSsoRoleSession).email === accountInfo.emailAddress &&
          (sess as AwsSsoRoleSession).roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`
        ) {
          return { region: (sess as AwsSsoRoleSession).region, profileId: (sess as AwsSsoRoleSession).profileId };
        }
      }
    }

    return undefined;
  }

  private getProtocol(aliasedUrl: string): string {
    let protocol = aliasedUrl.split("://")[0];
    if (protocol.indexOf("http") === -1) {
      protocol = "https";
    }
    return protocol;
  }

  // TODO: is it needed?
  private getDate(): Date {
    return new Date();
  }
}
