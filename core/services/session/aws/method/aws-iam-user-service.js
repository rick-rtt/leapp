var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AwsIamUserSession } from '../../../../models/aws-iam-user-session';
import { KeychainService } from '../../../keychain-service';
import * as AWS from 'aws-sdk';
import { constants } from '../../../../models/constants';
import { LeappAwsStsError } from '../../../../errors/leapp-aws-sts-error';
import { LeappParseError } from '../../../../errors/leapp-parse-error';
import { LeappMissingMfaTokenError } from '../../../../errors/leapp-missing-mfa-token-error';
import Repository from '../../../repository';
import { FileService } from '../../../file-service';
import AwsSessionService from '../aws-session-service';
import { LeappBaseError } from '../../../../errors/leapp-base-error';
import { LoggerLevel } from '../../../logging-service';
import AppService2 from '../../../app-service2';
import { LeappNotFoundError } from '../../../../errors/leapp-not-found-error';
export class AwsIamUserService extends AwsSessionService {
    constructor(iSessionNotifier, mfaCodePrompter) {
        super(iSessionNotifier);
        this.mfaCodePrompter = mfaCodePrompter;
        this.repository = Repository.getInstance();
    }
    static getInstance() {
        if (!this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Not initialized service error', this, LoggerLevel.error, 'Service needs to be initialized');
        }
        return this.instance;
    }
    static init(iSessionNotifier, mfaCodePrompter) {
        if (this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Already initialized service error', this, LoggerLevel.error, 'Service already initialized');
        }
        this.instance = new AwsIamUserService(iSessionNotifier, mfaCodePrompter);
    }
    static isTokenExpired(tokenExpiration) {
        const now = Date.now();
        return now > new Date(tokenExpiration).getTime();
    }
    static sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse) {
        if (getSessionTokenResponse.Credentials === undefined) {
            throw new LeappAwsStsError(this, 'an error occurred during session token generation.');
        }
        return {
            sessionToken: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                aws_access_key_id: getSessionTokenResponse.Credentials.AccessKeyId.trim(),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                aws_secret_access_key: getSessionTokenResponse.Credentials.SecretAccessKey.trim(),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                aws_session_token: getSessionTokenResponse.Credentials.SessionToken.trim(),
            }
        };
    }
    create(accountRequest, profileId) {
        const session = new AwsIamUserSession(accountRequest.accountName, accountRequest.region, profileId, accountRequest.mfaDevice);
        KeychainService.getInstance().saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-access-key-id`, accountRequest.accessKey)
            .then((_) => {
            KeychainService.getInstance().saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-secret-access-key`, accountRequest.secretKey)
                .catch((err) => console.error(err));
        })
            .catch((err) => console.error(err));
        Repository.getInstance().addSession(session);
        if (this.iSessionNotifier) {
            this.iSessionNotifier.addSession(session);
        }
    }
    applyCredentials(sessionId, credentialsInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.repository.getSessionById(sessionId);
            const profileName = Repository.getInstance().getProfileName(session.profileId);
            const credentialObject = {};
            credentialObject[profileName] = {
                // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/naming-convention
                aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                aws_session_token: credentialsInfo.sessionToken.aws_session_token,
                region: session.region
            };
            return yield FileService.getInstance().iniWriteSync(AppService2.getInstance().awsCredentialPath(), credentialObject);
        });
    }
    deApplyCredentials(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            //const session = this.workspaceService.get(sessionId);
            const session = this.repository.getSessions().find(sess => sess.sessionId === sessionId);
            const profileName = Repository.getInstance().getProfileName(session.profileId);
            const credentialsFile = yield FileService.getInstance().iniParseSync(AppService2.getInstance().awsCredentialPath());
            delete credentialsFile[profileName];
            return yield FileService.getInstance().replaceWriteSync(AppService2.getInstance().awsCredentialPath(), credentialsFile);
        });
    }
    generateCredentials(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the session in question
            //const session = this.workspaceService.get(sessionId);
            const session = this.repository.getSessions().find(sess => sess.sessionId === sessionId);
            if (session === undefined) {
                throw new LeappNotFoundError(this, `session with id ${sessionId} not found.`);
            }
            // Retrieve session token expiration
            const tokenExpiration = session.sessionTokenExpiration;
            // Check if token is expired
            if (!tokenExpiration || AwsIamUserService.isTokenExpired(tokenExpiration)) {
                // Token is Expired!
                // Retrieve access keys from keychain
                const accessKeyId = yield this.getAccessKeyFromKeychain(sessionId);
                const secretAccessKey = yield this.getSecretKeyFromKeychain(sessionId);
                // Get session token
                // https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html
                AWS.config.update({ accessKeyId, secretAccessKey });
                // Configure sts client options
                const sts = new AWS.STS(AppService2.getInstance().stsOptions(session));
                // Configure sts get-session-token api call params
                // eslint-disable-next-line @typescript-eslint/naming-convention
                const params = { durationSeconds: constants.sessionTokenDuration };
                // Check if MFA is needed or not
                if (session.mfaDevice) {
                    // Return session token after calling MFA modal
                    return this.generateSessionTokenCallingMfaModal(session, sts, params);
                }
                else {
                    // Return session token in the form of CredentialsInfo
                    return this.generateSessionToken(session, sts, params);
                }
            }
            else {
                // Session Token is NOT expired
                try {
                    // Retrieve session token from keychain
                    return JSON.parse(yield KeychainService.getInstance().getSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-token`));
                }
                catch (err) {
                    throw new LeappParseError(this, err.message);
                }
            }
        });
    }
    getAccountNumberFromCallerIdentity(session) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Get credentials
            const credentials = yield this.generateCredentials(session.sessionId);
            AWS.config.update({ accessKeyId: credentials.sessionToken.aws_access_key_id, secretAccessKey: credentials.sessionToken.aws_secret_access_key, sessionToken: credentials.sessionToken.aws_session_token });
            // Configure sts client options
            try {
                const sts = new AWS.STS(AppService2.getInstance().stsOptions(session));
                const response = yield sts.getCallerIdentity({}).promise();
                return (_a = response.Account) !== null && _a !== void 0 ? _a : '';
            }
            catch (err) {
                throw new LeappAwsStsError(this, err.message);
            }
        });
    }
    removeSecrets(sessionId) {
        this.removeAccessKeyFromKeychain(sessionId).then(_ => {
            this.removeSecretKeyFromKeychain(sessionId).then(__ => {
                this.removeSessionTokenFromKeychain(sessionId).catch(err => {
                    throw err;
                });
            }).catch(err => {
                throw err;
            });
        }).catch(err => {
            throw err;
        });
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    generateSessionTokenCallingMfaModal(session, sts, params) {
        return new Promise((resolve, reject) => {
            // TODO: think about timeout management
            // TODO: handle condition in which mfaCodePrompter is null
            this.mfaCodePrompter.promptForMFACode(session.sessionName, (value) => {
                if (value !== constants.confirmClosed) {
                    params.serialNumber = session.mfaDevice;
                    params.tokenCode = value;
                    // Return session token in the form of CredentialsInfo
                    resolve(this.generateSessionToken(session, sts, params));
                }
                else {
                    reject(new LeappMissingMfaTokenError(this, 'Missing Multi Factor Authentication code'));
                }
            });
        });
    }
    getAccessKeyFromKeychain(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield KeychainService.getInstance().getSecret(constants.appName, `${sessionId}-iam-user-aws-session-access-key-id`);
        });
    }
    getSecretKeyFromKeychain(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield KeychainService.getInstance().getSecret(constants.appName, `${sessionId}-iam-user-aws-session-secret-access-key`);
        });
    }
    removeAccessKeyFromKeychain(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KeychainService.getInstance().deletePassword(constants.appName, `${sessionId}-iam-user-aws-session-access-key-id`);
        });
    }
    removeSecretKeyFromKeychain(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KeychainService.getInstance().deletePassword(constants.appName, `${sessionId}-iam-user-aws-session-secret-access-key`);
        });
    }
    removeSessionTokenFromKeychain(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KeychainService.getInstance().deletePassword(constants.appName, `${sessionId}-iam-user-aws-session-token`);
        });
    }
    generateSessionToken(session, sts, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Invoke sts get-session-token api
                const getSessionTokenResponse = yield sts.getSessionToken(params).promise();
                // Save session token expiration
                this.saveSessionTokenResponseInTheSession(session, getSessionTokenResponse);
                // Generate correct object from session token response
                const sessionToken = AwsIamUserService.sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse);
                // Save in keychain the session token
                yield KeychainService.getInstance().saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-token`, JSON.stringify(sessionToken));
                // Return Session Token
                return sessionToken;
            }
            catch (err) {
                throw new LeappAwsStsError(this, err.message);
            }
        });
    }
    saveSessionTokenResponseInTheSession(session, getSessionTokenResponse) {
        const sessions = Repository.getInstance().getSessions();
        const index = sessions.indexOf(session);
        const currentSession = sessions[index];
        if (getSessionTokenResponse.Credentials !== undefined) {
            currentSession.sessionTokenExpiration = getSessionTokenResponse.Credentials.Expiration.toISOString();
        }
        sessions[index] = currentSession;
        Repository.getInstance().updateSessions(sessions);
        this.iSessionNotifier.setSessions([...sessions]);
    }
}
//# sourceMappingURL=aws-iam-user-service.js.map