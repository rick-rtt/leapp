var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import SSO from 'aws-sdk/clients/sso';
import { environment } from '../../../../../desktop-app/src/environments/environment';
import AwsSessionService from '../aws-session-service';
import { AwsSsoRoleSession } from '../../../../models/aws-sso-role-session';
import Repository from '../../../repository';
import { FileService } from '../../../file-service';
import { KeychainService } from '../../../keychain-service';
import { SessionType } from '../../../../models/session-type';
import { LeappBaseError } from '../../../../errors/leapp-base-error';
import { LoggerLevel } from '../../../logging-service';
export class AwsSsoRoleService extends AwsSessionService {
    constructor(iSessionNotifier, appService, awsSsoOidcService) {
        super(iSessionNotifier);
        this.appService = appService;
        this.awsSsoOidcService = awsSsoOidcService;
        this.awsSsoOidcService.listeners.push(this);
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
        this.instance = new AwsSsoRoleService(iSessionNotifier, appService, awsSsoOidcService);
    }
    static getProtocol(aliasedUrl) {
        let protocol = aliasedUrl.split('://')[0];
        if (protocol.indexOf('http') === -1) {
            protocol = 'https';
        }
        return protocol;
    }
    static sessionTokenFromGetSessionTokenResponse(getRoleCredentialResponse) {
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
    catchClosingBrowserWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all current sessions if any
            const sessions = this.iSessionNotifier.listAwsSsoRoles();
            for (let i = 0; i < sessions.length; i++) {
                // Stop session
                const sess = sessions[i];
                yield this.stop(sess.sessionId).then(_ => { });
            }
        });
    }
    create(accountRequest, profileId) {
        const session = new AwsSsoRoleSession(accountRequest.sessionName, accountRequest.region, accountRequest.roleArn, profileId, accountRequest.email);
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
            yield FileService.getInstance().replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
        });
    }
    generateCredentials(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const region = Repository.getInstance().getAwsSsoConfiguration().region;
            const portalUrl = Repository.getInstance().getAwsSsoConfiguration().portalUrl;
            const roleArn = this.iSessionNotifier.getSessionById(sessionId).roleArn;
            const accessToken = yield this.getAccessToken(region, portalUrl);
            const credentials = yield this.getRoleCredentials(accessToken, region, roleArn);
            return AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(credentials);
        });
    }
    sessionDeactivated(sessionId) {
        super.sessionDeactivated(sessionId);
    }
    removeSecrets(sessionId) { }
    interrupt() {
        this.awsSsoOidcService.interrupt();
    }
    sync() {
        return __awaiter(this, void 0, void 0, function* () {
            const region = Repository.getInstance().getAwsSsoConfiguration().region;
            const portalUrl = Repository.getInstance().getAwsSsoConfiguration().portalUrl;
            const accessToken = yield this.getAccessToken(region, portalUrl);
            // Get AWS SSO Role sessions
            const sessions = yield this.getSessions(accessToken, region);
            // Remove all old AWS SSO Role sessions from workspace
            yield this.removeSsoSessionsFromWorkspace();
            return sessions;
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            // Obtain region and access token
            const region = Repository.getInstance().getAwsSsoConfiguration().region;
            const savedAccessToken = yield this.getAccessTokenFromKeychain();
            // Configure Sso Portal Client
            this.getSsoPortalClient(region);
            // Make a logout request to Sso
            const logoutRequest = { accessToken: savedAccessToken };
            this.ssoPortal.logout(logoutRequest).promise().then(_ => { }, _ => {
                // Clean clients
                this.ssoPortal = null;
                // Delete access token and remove sso configuration info from workspace
                KeychainService.getInstance().deletePassword(environment.appName, 'aws-sso-access-token');
                Repository.getInstance().removeExpirationTimeFromAwsSsoConfiguration();
                this.removeSsoSessionsFromWorkspace();
            });
        });
    }
    getAccessToken(region, portalUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ssoExpired()) {
                const loginResponse = yield this.login(region, portalUrl);
                this.configureAwsSso(region, loginResponse.portalUrlUnrolled, loginResponse.expirationTime.toISOString(), loginResponse.accessToken);
                return loginResponse.accessToken;
            }
            else {
                return yield this.getAccessTokenFromKeychain();
            }
        });
    }
    getRoleCredentials(accessToken, region, roleArn) {
        return __awaiter(this, void 0, void 0, function* () {
            this.getSsoPortalClient(region);
            const getRoleCredentialsRequest = {
                accountId: roleArn.substring(13, 25),
                roleName: roleArn.split('/')[1],
                accessToken
            };
            return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise();
        });
    }
    awsSsoActive() {
        return __awaiter(this, void 0, void 0, function* () {
            const ssoToken = yield this.getAccessTokenFromKeychain();
            return !this.ssoExpired() && ssoToken !== undefined;
        });
    }
    ssoExpired() {
        const expirationTime = Repository.getInstance().getAwsSsoConfiguration().expirationTime;
        return !expirationTime || Date.parse(expirationTime) < Date.now();
    }
    login(region, portalUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const followRedirectClient = this.appService.getFollowRedirects()[AwsSsoRoleService.getProtocol(portalUrl)];
            portalUrl = yield new Promise((resolve, _) => {
                const request = followRedirectClient.request(portalUrl, response => resolve(response.responseUrl));
                request.end();
            });
            const generateSsoTokenResponse = yield this.awsSsoOidcService.login(region, portalUrl);
            return { portalUrlUnrolled: portalUrl, accessToken: generateSsoTokenResponse.accessToken, region, expirationTime: generateSsoTokenResponse.expirationTime };
        });
    }
    getSessions(accessToken, region) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.listAccounts(accessToken, region);
            const promiseArray = [];
            accounts.forEach((account) => {
                promiseArray.push(this.getSessionsFromAccount(account, accessToken, region));
            });
            return new Promise((resolve, _) => {
                Promise.all(promiseArray).then((sessionMatrix) => {
                    resolve(sessionMatrix.flat());
                });
            });
        });
    }
    getSessionsFromAccount(accountInfo, accessToken, region) {
        return __awaiter(this, void 0, void 0, function* () {
            this.getSsoPortalClient(region);
            const listAccountRolesRequest = {
                accountId: accountInfo.accountId,
                accessToken,
                maxResults: 30 // TODO: find a proper value
            };
            const accountRoles = [];
            yield new Promise((resolve, _) => {
                this.recursiveListRoles(accountRoles, listAccountRolesRequest, resolve);
            });
            const awsSsoSessions = [];
            accountRoles.forEach((accountRole) => {
                const oldSession = this.findOldSession(accountInfo, accountRole);
                const awsSsoSession = {
                    email: accountInfo.emailAddress,
                    region: (oldSession === null || oldSession === void 0 ? void 0 : oldSession.region) || Repository.getInstance().getDefaultRegion() || environment.defaultRegion,
                    roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
                    sessionName: accountInfo.accountName,
                    profileId: (oldSession === null || oldSession === void 0 ? void 0 : oldSession.profileId) || Repository.getInstance().getDefaultProfileId()
                };
                awsSsoSessions.push(awsSsoSession);
            });
            return awsSsoSessions;
        });
    }
    recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback) {
        this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise().then(response => {
            accountRoles.push(...response.roleList);
            if (response.nextToken !== null) {
                listAccountRolesRequest.nextToken = response.nextToken;
                this.recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback);
            }
            else {
                promiseCallback(accountRoles);
            }
        });
    }
    listAccounts(accessToken, region) {
        return __awaiter(this, void 0, void 0, function* () {
            this.getSsoPortalClient(region);
            const listAccountsRequest = { accessToken, maxResults: 30 };
            const accountList = [];
            return new Promise((resolve, _) => {
                this.recursiveListAccounts(accountList, listAccountsRequest, resolve);
            });
        });
    }
    recursiveListAccounts(accountList, listAccountsRequest, promiseCallback) {
        this.ssoPortal.listAccounts(listAccountsRequest).promise().then(response => {
            accountList.push(...response.accountList);
            if (response.nextToken !== null) {
                listAccountsRequest.nextToken = response.nextToken;
                this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback);
            }
            else {
                promiseCallback(accountList);
            }
        });
    }
    removeSsoSessionsFromWorkspace() {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = this.iSessionNotifier.listAwsSsoRoles();
            for (let i = 0; i < sessions.length; i++) {
                const sess = sessions[i];
                const iamRoleChainedSessions = this.iSessionNotifier.listIamRoleChained(sess);
                for (let j = 0; j < iamRoleChainedSessions.length; j++) {
                    yield this.delete(iamRoleChainedSessions[j].sessionId);
                }
                yield this.stop(sess.sessionId);
                this.iSessionNotifier.deleteSession(sess.sessionId);
                Repository.getInstance().deleteSession(sess.sessionId);
            }
        });
    }
    configureAwsSso(region, portalUrl, expirationTime, accessToken) {
        Repository.getInstance().configureAwsSso(region, portalUrl, expirationTime);
        KeychainService.getInstance().saveSecret(environment.appName, 'aws-sso-access-token', accessToken).then(_ => { });
    }
    getSsoPortalClient(region) {
        if (!this.ssoPortal) {
            this.ssoPortal = new SSO({ region });
        }
    }
    getAccessTokenFromKeychain() {
        return __awaiter(this, void 0, void 0, function* () {
            return KeychainService.getInstance().getSecret(environment.appName, 'aws-sso-access-token');
        });
    }
    findOldSession(accountInfo, accountRole) {
        for (let i = 0; i < this.iSessionNotifier.getSessions().length; i++) {
            const sess = this.iSessionNotifier.getSessions()[i];
            if (sess.type === SessionType.awsSsoRole) {
                if ((sess.email === accountInfo.emailAddress) &&
                    (sess.roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`)) {
                    return { region: sess.region, profileId: sess.profileId };
                }
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=aws-sso-role-service.js.map