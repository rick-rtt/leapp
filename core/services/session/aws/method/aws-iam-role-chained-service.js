var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as AWS from 'aws-sdk';
import { AwsIamRoleFederatedService } from './aws-iam-role-federated-service';
import { AwsSsoRoleService } from './aws-sso-role-service';
import AwsSessionService from '../aws-session-service';
import { AwsIamRoleChainedSession } from '../../../../models/aws-iam-role-chained-session';
import Repository from '../../../repository';
import { FileService } from '../../../file-service';
import { LeappNotFoundError } from '../../../../errors/leapp-not-found-error';
import { SessionType } from '../../../../models/session-type';
import { AwsIamUserService } from './aws-iam-user-service';
import { LeappAwsStsError } from '../../../../errors/leapp-aws-sts-error';
import { LeappBaseError } from '../../../../errors/leapp-base-error';
import { LoggerLevel } from '../../../logging-service';
export class AwsIamRoleChainedService extends AwsSessionService {
    constructor(iSessionNotifier, appService, awsSsoOidcService) {
        super(iSessionNotifier);
        this.appService = appService;
        this.awsSsoOidcService = awsSsoOidcService;
    }
    static getInstance() {
        if (!this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Not initialized service error', this, LoggerLevel.error, 'Service needs to be initialized');
        }
        return this.instance;
    }
    static init(iSessionNotifier, appService, awsSsoOidcService) {
        if (this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Already initialized service error', this, LoggerLevel.error, 'Service already initialized');
        }
        this.instance = new AwsIamRoleChainedService(iSessionNotifier, appService, awsSsoOidcService);
    }
    static sessionTokenFromAssumeRoleResponse(assumeRoleResponse) {
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
    create(sessionRequest, profileId) {
        const session = new AwsIamRoleChainedSession(sessionRequest.accountName, sessionRequest.region, sessionRequest.roleArn, profileId, sessionRequest.parentSessionId, sessionRequest.roleSessionName);
        this.iSessionNotifier.addSession(session);
    }
    applyCredentials(sessionId, credentialsInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.iSessionNotifier.getSessionById(sessionId);
            const profileName = Repository.getInstance().getProfileName(session.profileId);
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
            return yield FileService.getInstance().iniWriteSync(this.appService.awsCredentialPath(), credentialObject);
        });
    }
    deApplyCredentials(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.iSessionNotifier.getSessionById(sessionId);
            const profileName = Repository.getInstance().getProfileName(session.profileId);
            const credentialsFile = yield FileService.getInstance().iniParseSync(this.appService.awsCredentialPath());
            delete credentialsFile[profileName];
            return yield FileService.getInstance().replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
        });
    }
    generateCredentials(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Retrieve Session
            const session = this.iSessionNotifier.getSessionById(sessionId);
            // Retrieve Parent Session
            let parentSession;
            try {
                parentSession = this.iSessionNotifier.getSessionById(session.parentSessionId);
            }
            catch (err) {
                throw new LeappNotFoundError(this, `Parent Account Session  not found for Chained Account ${session.sessionName}`);
            }
            // Generate a credential set from Parent Session
            let parentSessionService;
            if (parentSession.type === SessionType.awsIamRoleFederated) {
                parentSessionService = AwsIamRoleFederatedService.getInstance();
            }
            else if (parentSession.type === SessionType.awsIamUser) {
                parentSessionService = AwsIamUserService.getInstance();
            }
            else if (parentSession.type === SessionType.awsSsoRole) {
                parentSessionService = AwsSsoRoleService.getInstance();
            }
            const parentCredentialsInfo = yield parentSessionService.generateCredentials(parentSession.sessionId);
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
            const roleSessionName = session.roleSessionName;
            const params = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                RoleSessionName: roleSessionName ? roleSessionName : 'assumed-from-leapp',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                RoleArn: session.roleArn,
            };
            // Generate Session token
            return this.generateSessionToken(sts, params);
        });
    }
    removeSecrets(sessionId) { }
    generateSessionToken(sts, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Assume Role
                const assumeRoleResponse = yield sts.assumeRole(params).promise();
                // Generate correct object from session token response and return
                return AwsIamRoleChainedService.sessionTokenFromAssumeRoleResponse(assumeRoleResponse);
            }
            catch (err) {
                throw new LeappAwsStsError(this, err.message);
            }
        });
    }
}
//# sourceMappingURL=aws-iam-role-chained-service.js.map