import * as Aws from "aws-sdk";
import { LeappAwsStsError } from "../../../errors/leapp-aws-sts-error";
import { LeappSamlError } from "../../../errors/leapp-saml-error";
import { IAwsSamlAuthenticationService } from "../../../interfaces/i-aws-saml-authentication-service";
import { ISessionNotifier } from "../../../interfaces/i-session-notifier";
import { AwsIamRoleFederatedSession } from "../../../models/aws-iam-role-federated-session";
import { CredentialsInfo } from "../../../models/credentials-info";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { AwsIamRoleFederatedSessionRequest } from "./aws-iam-role-federated-session-request";
import { AwsSessionService } from "./aws-session-service";
import { SessionType } from "../../../models/session-type";
import { Session } from "../../../models/session";
import * as AWS from "aws-sdk";
import { AwsIamUserSession } from "../../../models/aws-iam-user-session";

export class AwsIamRoleFederatedService extends AwsSessionService {
  constructor(
    iSessionNotifier: ISessionNotifier,
    repository: Repository,
    private fileService: FileService,
    private awsCoreService: AwsCoreService,
    private awsAuthenticationService: IAwsSamlAuthenticationService,
    private samlRoleSessionDuration: number
  ) {
    super(iSessionNotifier, repository);
  }

  static sessionTokenFromGetSessionTokenResponse(assumeRoleResponse: Aws.STS.AssumeRoleWithSAMLResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: assumeRoleResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: assumeRoleResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: assumeRoleResponse.Credentials.SessionToken.trim(),
      },
    };
  }

  async create(request: AwsIamRoleFederatedSessionRequest): Promise<void> {
    const session = new AwsIamRoleFederatedSession(
      request.sessionName,
      request.region,
      request.idpUrl,
      request.idpArn,
      request.roleArn,
      request.profileId
    );

    this.repository.addSession(session);
    this.sessionNotifier?.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleFederatedSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region,
    };
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleFederatedSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Get the session in question
    const session = this.repository.getSessionById(sessionId);

    let idpUrl;
    // Check if we need to authenticate
    let needToAuthenticate;
    try {
      // Get idpUrl
      idpUrl = this.repository.getIdpUrl((session as AwsIamRoleFederatedSession).idpUrlId);
      needToAuthenticate = await this.awsAuthenticationService.needAuthentication(idpUrl);
    } catch (err) {
      throw new LeappSamlError(this, err.message);
    } finally {
      // await this.awsAuthenticationService.closeAuthenticationWindow();
    }

    // AwsSignIn: retrieve the response hook
    let samlResponse;
    try {
      samlResponse = await this.awsAuthenticationService.awsSignIn(idpUrl, needToAuthenticate);
    } finally {
      // await this.awsAuthenticationService.closeAuthenticationWindow();
    }

    // Setup STS to generate the credentials
    const sts = new Aws.STS(this.awsCoreService.stsOptions(session));

    // Params for the calls
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      PrincipalArn: (session as AwsIamRoleFederatedSession).idpArn,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleArn: (session as AwsIamRoleFederatedSession).roleArn,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      SAMLAssertion: samlResponse,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      DurationSeconds: this.samlRoleSessionDuration,
    };

    // Invoke assumeRoleWithSAML
    let assumeRoleWithSamlResponse: Aws.STS.AssumeRoleWithSAMLResponse;
    try {
      assumeRoleWithSamlResponse = await sts.assumeRoleWithSAML(params).promise();
    } catch (err) {
      throw new LeappAwsStsError(this, err.message);
    }

    // Save session token expiration
    this.saveSessionTokenExpirationInTheSession(session, assumeRoleWithSamlResponse.Credentials);

    // Generate credentials
    return AwsIamRoleFederatedService.sessionTokenFromGetSessionTokenResponse(assumeRoleWithSamlResponse);
  }

  async getAccountNumberFromCallerIdentity(session: AwsIamRoleFederatedSession): Promise<string> {
    if (session.type === SessionType.awsIamRoleFederated) {
      return `${session.roleArn.split("/")[0].substring(13, 25)}`;
    } else {
      throw new Error("AWS IAM Role Federated Session required");
    }
  }

  removeSecrets(_: string): void {}

  private saveSessionTokenExpirationInTheSession(session: Session, credentials: AWS.STS.Credentials): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (credentials !== undefined) {
      (currentSession as AwsIamUserSession).sessionTokenExpiration = credentials.Expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
