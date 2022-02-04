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
import { AwsSsoOidcService } from './aws-sso-oidc.service'
import { AwsSsoRoleSessionRequest } from './aws-sso-role-session-request'
import {AwsSsoIntegration} from "../../../models/aws-sso-integration";
import {Session} from "../../../models/session";
import {AwsSsoIntegrationService} from "./aws-sso-integration-service";
import {AwsIamRoleChainedSession} from "../../../models/aws-iam-role-chained-session";

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
                     private awsSsoIntegrationService: AwsSsoIntegrationService, private workspaceService,
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
    };
  }

  public create(accountRequest: AwsSsoRoleSessionRequest): Promise<void> {
    const session = new AwsSsoRoleSession(accountRequest.sessionName, accountRequest.region, accountRequest.roleArn, accountRequest.profileId, accountRequest.awsSsoConfigurationId, accountRequest.email);
    this.workspaceService.addSession(session);
    return;
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.workspaceService.getSessionById(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsSsoRoleSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region
    };
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.workspaceService.getSessionById(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsSsoRoleSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    const awsSsoConfiguration = this.workspaceService.getAwsSsoIntegration((this.workspaceService.getSessionById(sessionId) as AwsSsoRoleSession).awsSsoConfigurationId);
    const region = awsSsoConfiguration.region;
    const roleArn = (this.workspaceService.getSessionById(sessionId) as AwsSsoRoleSession).roleArn;

    await this.awsSsoIntegrationService.login(awsSsoConfiguration.id);
    const awsSsoIntegrationTokenInfo = await this.awsSsoIntegrationService.getAwsSsoIntegrationTokenInfo(awsSsoConfiguration.id);
    const accessToken = awsSsoIntegrationTokenInfo.accessToken;
    const credentials = await this.getRoleCredentials(accessToken, region, roleArn);

    return AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(credentials);
  }

  sessionDeactivated(sessionId: string) {
    super.sessionDeactivated(sessionId);
  }

  removeSecrets(sessionId: string): void {}

  async catchClosingBrowserWindow(): Promise<void> {
    // Get all current sessions if any
    const sessions = this.listAwsSsoRoles();

    for (let i = 0; i < sessions.length; i++) {
      // Stop sessions
      const sess = sessions[i];
      await this.stop(sess.sessionId).then(_ => {});
    }
  }

  interrupt() {
    this.awsSsoOidcService.interrupt();
  }

  async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.getSsoPortalClient(region);

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split('/')[1],
      accessToken
    };

    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise();
  }

  listAwsSsoRoles(): Session[] {
    return (this.workspaceService.getSessions().length > 0) ? this.workspaceService.getSessions().filter((session) => session.type === SessionType.awsSsoRole) : [];
  }

  listIamRoleChained(parentSession?: Session): Session[] {
    let childSession = (this.workspaceService.getSessions().length > 0) ? this.workspaceService.getSessions().filter( (session) => session.type === SessionType.awsIamRoleChained ) : [];
    if (parentSession) {
      childSession = childSession.filter(session => (session as AwsIamRoleChainedSession).parentSessionId === parentSession.sessionId );
    }
    return childSession;
  }

  // TODO: move to SsoPortalSingleton
  private getSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region});
    }
  }
}
