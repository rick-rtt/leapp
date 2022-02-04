import SSO, {
  AccountInfo,
  ListAccountRolesRequest,
  ListAccountsRequest,
  LogoutRequest,
  RoleInfo
} from 'aws-sdk/clients/sso'
import { AwsSsoRoleSession } from '../../../models/aws-sso-role-session'
import { SessionType } from '../../../models/session-type'
import { AwsCoreService } from '../../aws-core-service'
import { FileService } from '../../file-service'
import { KeychainService } from '../../keychain-service'
import { Repository } from '../../repository'

import { AwsSsoOidcService } from './aws-sso-oidc.service'
import {AwsSsoIntegration} from "../../../models/aws-sso-integration";
import {AwsSsoRoleService} from "./aws-sso-role-service";
import {constants} from "../../../models/constants";
import {AwsSsoIntegrationTokenInfo} from "../../../models/aws-sso-integration-token-info";
import {WorkspaceService} from "../../workspace-service";

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

export class AwsSsoIntegrationService {
  private _ssoPortal: SSO;

  public constructor(private repository: Repository, private fileService: FileService,
                     private keyChainService: KeychainService, private awsCoreService: AwsCoreService,
                     private awsSsoRoleService: AwsSsoRoleService, private awsSsoOidcService: AwsSsoOidcService,
                     private workspaceService: WorkspaceService) {}

  get ssoPortal(): SSO {
    return this._ssoPortal;
  }
  set ssoPortal(sso: SSO) {
    this._ssoPortal = sso;
  }

  async login(awsSsoIntegrationId: string): Promise<void> {
    if (await this.isAwsSsoAccessTokenExpired(awsSsoIntegrationId)) {
      const awsSsoIntegration = this.repository.getAwsSsoConfiguration(awsSsoIntegrationId);
      const generateSsoTokenResponse = await this.awsSsoOidcService.login(awsSsoIntegrationId, awsSsoIntegration.region, awsSsoIntegration.portalUrl);

      this.repository.updateAwsSsoIntegration(
        awsSsoIntegration.id,
        awsSsoIntegration.alias,
        awsSsoIntegration.region,
        awsSsoIntegration.portalUrl,
        awsSsoIntegration.browserOpening,
        generateSsoTokenResponse.expirationTime.toISOString()
      );

      await this.keyChainService.saveSecret(
        constants.appName,
        `aws-sso-integration-access-token-${awsSsoIntegration.id}`,
        generateSsoTokenResponse.accessToken
      ).then(_ => {});
    }
  }

  async logout(awsSsoIntegrationId: string): Promise<void> {
    const awsSsoIntegration = this.repository.getAwsSsoConfiguration(awsSsoIntegrationId);

    const region = awsSsoIntegration.region;
    const awsSsoIntegrationAccessTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegration.id);
    const awsSsoIntegrationAccessToken = awsSsoIntegrationAccessTokenInfo.accessToken;

    this.getSsoPortalClient(region);

    const logoutRequest: LogoutRequest = { accessToken: awsSsoIntegrationAccessToken };

    this.ssoPortal.logout(logoutRequest).promise().then(_ => {}, async _ => {
      this.ssoPortal = null;

      try {
        await this.keyChainService.deletePassword(constants.appName, `aws-sso-integration-access-token-${awsSsoIntegrationId}`);
      } catch(err) {}

      this.repository.unsetAwsSsoIntegrationExpiration(awsSsoIntegration.id);

      const sessions = this.repository.getAwsSsoIntegrationSessions(awsSsoIntegration.id);

      for (let i = 0; i < sessions.length; i++) {
        const sess = sessions[i];

        const iamRoleChainedSessions = this.awsSsoRoleService.listIamRoleChained(sess);

        for (let j = 0; j < iamRoleChainedSessions.length; j++) {
          await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId);
        }

        await this.awsSsoRoleService.stop(sess.sessionId);

        this.repository.deleteSession(sess.sessionId);
      }
    });
  }

  async provisionSessions(awsSsoIntegrationId: string) {
    await this.login(awsSsoIntegrationId);

    const awsSsoIntegration: AwsSsoIntegration = this.repository.getAwsSsoConfiguration(awsSsoIntegrationId);
    const region = awsSsoIntegration.region;

    const awsSsoIntegrationTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId);
    const accessToken = awsSsoIntegrationTokenInfo.accessToken;

    const accounts: AccountInfo[] = await this.listAccounts(accessToken, region);
    const promiseArray: Promise<SsoRoleSession[]>[] = [];

    accounts.forEach((account) => {
      promiseArray.push(this.getSessionsFromAccount(awsSsoIntegration.id, account, accessToken, region));
    });

    const sessionsNotFlattened = await Promise.all(promiseArray);
    const sessions = sessionsNotFlattened.flat();

    const persistedSessions = this.repository.getAwsSsoIntegrationSessions(awsSsoIntegration.id);
    const sessionsToBeDeleted: SsoRoleSession[] = [];

    for (let i = 0; i < persistedSessions.length; i++) {
      const persistedSession = persistedSessions[i];
      const shouldBeDeleted = sessions.filter(s =>
        (persistedSession as unknown as SsoRoleSession).sessionName === s.sessionName &&
        (persistedSession as unknown as SsoRoleSession).roleArn === s.roleArn &&
        (persistedSession as unknown as SsoRoleSession).email === s.email).length === 0;

      if (shouldBeDeleted) {
        sessionsToBeDeleted.push(persistedSession as unknown as SsoRoleSession);

        const iamRoleChainedSessions = this.awsSsoRoleService.listIamRoleChained(persistedSession);

        for (let j = 0; j < iamRoleChainedSessions.length; j++) {
          await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId);
        }

        await this.awsSsoRoleService.stop(persistedSession.sessionId);
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

  async getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId: string): Promise<AwsSsoIntegrationTokenInfo> {
    const accessToken = await this.keyChainService.getSecret(constants.appName, `aws-sso-integration-access-token-${awsSsoIntegrationId}`);
    const expiration = this.repository.getAwsSsoConfiguration(awsSsoIntegrationId) ? new Date(this.repository.getAwsSsoConfiguration(awsSsoIntegrationId).accessTokenExpiration).getTime() : undefined;
    return { accessToken, expiration };
  }

  async isAwsSsoAccessTokenExpired(awsSsoIntegrationId: string): Promise<boolean> {
    const awsSsoAccessTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId);
    return !awsSsoAccessTokenInfo.expiration || awsSsoAccessTokenInfo.expiration < Date.now();
  }

  // TODO: move to SsoPortalSingleton
  private getSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region});
    }
  }

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.getSsoPortalClient(region);

    const listAccountsRequest: ListAccountsRequest = { accessToken, maxResults: 30 };
    const accountList: AccountInfo[] = [];

    return new Promise( (resolve, _) => {
      this.recursiveListAccounts(accountList, listAccountsRequest, resolve);
    });
  }

  private recursiveListAccounts(accountList: AccountInfo[], listAccountsRequest: ListAccountsRequest, promiseCallback: any) {
    this.ssoPortal.listAccounts(listAccountsRequest).promise().then(response => {
      accountList.push(...response.accountList);

      if (response.nextToken !== null) {
        listAccountsRequest.nextToken = response.nextToken;
        this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback);
      } else {
        promiseCallback(accountList);
      }
    });
  }

  private async getSessionsFromAccount(configurationId: string, accountInfo: AccountInfo, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    this.getSsoPortalClient(region);

    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30 // TODO: find a proper value
    };

    const accountRoles: RoleInfo[] = [];

    await new Promise((resolve, _) => {
      this.recursiveListRoles(accountRoles, listAccountRolesRequest, resolve);
    });

    const awsSsoSessions: SsoRoleSession[] = [];

    accountRoles.forEach((accountRole) => {
      const oldSession = this.findOldSession(configurationId, accountInfo, accountRole);

      const awsSsoSession = {
        email: accountInfo.emailAddress,
        region: oldSession?.region || this.repository.getWorkspace().defaultRegion || constants.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
        profileId: oldSession?.profileId || this.repository.getDefaultProfileId(),
        awsSsoConfigurationId: configurationId
      };

      awsSsoSessions.push(awsSsoSession);
    });

    return awsSsoSessions;
  }

  private recursiveListRoles(accountRoles: RoleInfo[], listAccountRolesRequest: ListAccountRolesRequest, promiseCallback: any) {
    this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise().then(response => {
      accountRoles.push(...response.roleList);

      if (response.nextToken !== null) {
        listAccountRolesRequest.nextToken = response.nextToken;
        this.recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback);
      } else {
        promiseCallback(accountRoles);
      }
    });
  }

  private findOldSession(configurationId: string, accountInfo: SSO.AccountInfo, accountRole: SSO.RoleInfo): { region: string; profileId: string } {
    for (let i = 0; i < this.workspaceService.sessions.length; i++) {
      const sess = this.workspaceService.sessions[i];

      if(sess.type === SessionType.awsSsoRole) {
        if (
          ((sess as AwsSsoRoleSession).awsSsoConfigurationId === configurationId ) &&
          ((sess as AwsSsoRoleSession).email === accountInfo.emailAddress ) &&
          ((sess as AwsSsoRoleSession).roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}` )
        ) {
          return { region: (sess as AwsSsoRoleSession).region, profileId: (sess as AwsSsoRoleSession).profileId };
        }
      }
    }

    return undefined;
  }

  private getProtocol(aliasedUrl: string): string {
    let protocol = aliasedUrl.split('://')[0];
    if (protocol.indexOf('http') === -1) {
      protocol = 'https';
    }
    return protocol;
  }
}
