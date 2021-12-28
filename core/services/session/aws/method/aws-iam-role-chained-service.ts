import {AppService} from '../../../../../desktop-app/src/app/services/app.service';
import * as AWS from 'aws-sdk';
import {AwsIamRoleFederatedService} from './aws-iam-role-federated-service';
import {AwsSsoRoleService} from './aws-sso-role-service';
import {AwsSsoOidcService} from '../../../../../desktop-app/src/app/services/aws-sso-oidc.service';
import { AssumeRoleResponse } from 'aws-sdk/clients/sts';
import AwsSessionService from '../aws-session-service';
import {AwsIamRoleChainedSession} from '../../../../models/aws-iam-role-chained-session';
import {CredentialsInfo} from '../../../../models/credentials-info';
import Repository from '../../../repository';
import {FileService} from '../../../file-service';
import {Session} from '../../../../models/session';
import {LeappNotFoundError} from '../../../../errors/leapp-not-found-error';
import {SessionType} from '../../../../models/session-type';
import {AwsIamUserService} from './aws-iam-user-service';
import {LeappAwsStsError} from '../../../../errors/leapp-aws-sts-error';
import {ISessionNotifier} from '../../../../interfaces/i-session-notifier';
import {LeappBaseError} from '../../../../errors/leapp-base-error';
import {LoggerLevel} from '../../../logging-service';

export interface AwsIamRoleChainedSessionRequest {
  accountName: string;
  region: string;
  roleArn: string;
  roleSessionName?: string;
  parentSessionId: string;
}

export class AwsIamRoleChainedService extends AwsSessionService {

  private static instance: AwsSessionService;
  private appService: AppService;
  private awsSsoOidcService: AwsSsoOidcService;

  private constructor(
    iSessionNotifier: ISessionNotifier,
    appService: AppService,
    awsSsoOidcService: AwsSsoOidcService,
  ) {
    super(iSessionNotifier);

    this.appService = appService;
    this.awsSsoOidcService = awsSsoOidcService;
  }

  static getInstance() {
    if(!this.instance) {
      // TODO: understand if we need to move Leapp Errors in a core folder
      throw new LeappBaseError('Not initialized service error', this, LoggerLevel.error,
        'Service needs to be initialized');
    }
    return this.instance;
  }

  static init(iSessionNotifier: ISessionNotifier, appService: AppService, awsSsoOidcService: AwsSsoOidcService) {
    if(this.instance) {
      // TODO: understand if we need to move Leapp Errors in a core folder
      throw new LeappBaseError('Already initialized service error', this, LoggerLevel.error,
        'Service already initialized');
    }
    this.instance = new AwsIamRoleChainedService(iSessionNotifier, appService, awsSsoOidcService);
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

    this.iSessionNotifier.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.iSessionNotifier.getSessionById(sessionId);
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
    const session = this.iSessionNotifier.getSessionById(sessionId);
    const profileName = Repository.getInstance().getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialsFile = await FileService.getInstance().iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await FileService.getInstance().replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Retrieve Session
    const session = this.iSessionNotifier.getSessionById(sessionId);

    // Retrieve Parent Session
    let parentSession: Session;
    try {
      parentSession = this.iSessionNotifier.getSessionById((session as AwsIamRoleChainedSession).parentSessionId);
    } catch (err) {
      throw new LeappNotFoundError(this, `Parent Account Session  not found for Chained Account ${session.sessionName}`);
    }

    // Generate a credential set from Parent Session
    let parentSessionService;
    if(parentSession.type === SessionType.awsIamRoleFederated) {
      parentSessionService = AwsIamRoleFederatedService.getInstance() as AwsSessionService;
    } else if(parentSession.type === SessionType.awsIamUser) {
      parentSessionService = AwsIamUserService.getInstance() as AwsSessionService;
    } else if(parentSession.type === SessionType.awsSsoRole) {
      parentSessionService = AwsSsoRoleService.getInstance() as AwsSessionService;
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
