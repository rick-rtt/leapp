import {Injectable} from '@angular/core';
import {CredentialsInfo} from '../../../../../../core/models/credentials-info';
import {WorkspaceService} from '../../../workspace.service';
import {AppService} from '../../../app.service';
import {LeappNotFoundError} from '../../../../errors/leapp-not-found-error';
import {Session} from '../../../../../../core/models/session';
import {AwsIamRoleChainedSession} from '../../../../../../core/models/aws-iam-role-chained-session';
import {LeappAwsStsError} from '../../../../errors/leapp-aws-sts-error';
import * as AWS from 'aws-sdk';
import {SessionType} from '../../../../../../core/models/session-type';
import {AwsIamRoleFederatedService} from './aws-iam-role-federated.service';
import {AwsSsoRoleService} from './aws-sso-role.service';
import {ElectronService} from '../../../electron.service';
import {AwsSsoOidcService} from '../../../aws-sso-oidc.service';
import { AssumeRoleResponse } from 'aws-sdk/clients/sts';
import Repository from '../../../../../../core/services/repository';
import {FileService} from '../../../../../../core/services/file-service';
import AwsSessionService from '../../../../../../core/services/session/aws/aws-session-service';
import AwsIamUserService from '../../../../../../core/services/session/aws/method/aws-iam-user-service';

export interface AwsIamRoleChainedSessionRequest {
  accountName: string;
  region: string;
  roleArn: string;
  roleSessionName?: string;
  parentSessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsIamRoleChainedService extends AwsSessionService {

  constructor(
    protected workspaceService: WorkspaceService,
    private appService: AppService,
    private electronService: ElectronService,
    private awsSsoOidcService: AwsSsoOidcService,
  ) {
    super(workspaceService);
  }

  static sessionTokenFromAssumeRoleResponse(assumeRoleResponse: AssumeRoleResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: assumeRoleResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: assumeRoleResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: assumeRoleResponse.Credentials.SessionToken.trim(),
      }
    };
  }

  create(sessionRequest: AwsIamRoleChainedSessionRequest, profileId: string): void {
    const session = new AwsIamRoleChainedSession(sessionRequest.accountName, sessionRequest.region, sessionRequest.roleArn, profileId, sessionRequest.parentSessionId, sessionRequest.roleSessionName);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.workspaceService.get(sessionId);
    const profileName = Repository.getInstance().getProfileName((session as AwsIamRoleChainedSession).profileId);
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
    return await FileService.getInstance().iniWriteSync(this.appService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.workspaceService.get(sessionId);
    const profileName = Repository.getInstance().getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialsFile = await FileService.getInstance().iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await FileService.getInstance().replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Retrieve Session
    const session = this.workspaceService.get(sessionId);

    // Retrieve Parent Session
    let parentSession: Session;
    try {
      parentSession = this.workspaceService.get((session as AwsIamRoleChainedSession).parentSessionId);
    } catch (err) {
      throw new LeappNotFoundError(this, `Parent Account Session  not found for Chained Account ${session.sessionName}`);
    }

    // Generate a credential set from Parent Session
    let parentSessionService;
    if(parentSession.type === SessionType.awsIamRoleFederated) {
      parentSessionService = new AwsIamRoleFederatedService(this.workspaceService, this.appService) as AwsSessionService;
    } else if(parentSession.type === SessionType.awsIamUser) {
      parentSessionService = AwsIamUserService.getInstance() as AwsSessionService;
    } else if(parentSession.type === SessionType.awsSsoRole) {
      parentSessionService = new AwsSsoRoleService(this.workspaceService, this.appService, this.awsSsoOidcService) as AwsSessionService;
    }

    const parentCredentialsInfo = await parentSessionService.generateCredentials(parentSession.sessionId);

    // Make second jump: configure aws SDK with parent credentials set
    AWS.config.update({
      sessionToken: parentCredentialsInfo.sessionToken.aws_session_token,
      accessKeyId: parentCredentialsInfo.sessionToken.aws_access_key_id,
      secretAccessKey: parentCredentialsInfo.sessionToken.aws_secret_access_key,
    });

    // Assume Role from parent
    // Prepare session credentials set parameters and client
    const sts = new AWS.STS(this.appService.stsOptions(session));

    // Configure IamRoleChained Account session parameters
    const roleSessionName = (session as AwsIamRoleChainedSession).roleSessionName;
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleSessionName: roleSessionName ? roleSessionName : 'assumed-from-leapp',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleArn: (session as AwsIamRoleChainedSession).roleArn,
    };

    // Generate Session token
    return this.generateSessionToken(sts, params);
  }

  removeSecrets(sessionId: string): void {}

  private async generateSessionToken(sts, params): Promise<CredentialsInfo> {
    try {
      // Assume Role
      const assumeRoleResponse: AssumeRoleResponse = await sts.assumeRole(params).promise();
      // Generate correct object from session token response and return
      return AwsIamRoleChainedService.sessionTokenFromAssumeRoleResponse(assumeRoleResponse);
    } catch (err) {
      throw new LeappAwsStsError(this, err.message);
    }
  }
}
