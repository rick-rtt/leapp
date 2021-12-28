var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { environment } from '../../../../../desktop-app/src/environments/environment';
import * as AWS from 'aws-sdk';
import { AwsIamRoleFederatedSession } from '../../../../models/aws-iam-role-federated-session';
import Repository from '../../../repository';
import { FileService } from '../../../file-service';
import { LeappSamlError } from '../../../../errors/leapp-saml-error';
import { LeappParseError } from '../../../../errors/leapp-parse-error';
import { LeappAwsStsError } from '../../../../errors/leapp-aws-sts-error';
import AwsSessionService from '../aws-session-service';
import { LeappBaseError } from '../../../../errors/leapp-base-error';
import { LoggerLevel } from '../../../logging-service';
export class AwsIamRoleFederatedService extends AwsSessionService {
    constructor(iSessionNotifier, appService) {
        super(iSessionNotifier);
        this.appService = appService;
    }
    static getInstance() {
        if (!this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Not initialized service error', this, LoggerLevel.error, 'Service needs to be initialized');
        }
        return this.instance;
    }
    static init(iSessionNotifier, appService) {
        if (this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Already initialized service error', this, LoggerLevel.error, 'Service already initialized');
        }
        this.instance = new AwsIamRoleFederatedService(iSessionNotifier, appService);
    }
    static extractSamlResponse(responseHookDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            let rawData = responseHookDetails.uploadData[0].bytes.toString();
            const n = rawData.lastIndexOf('SAMLResponse=');
            const n2 = rawData.lastIndexOf('&RelayState=');
            rawData = n2 !== -1 ? rawData.substring(n + 13, n2) : rawData.substring(n + 13);
            return decodeURIComponent(rawData);
        });
    }
    static sessionTokenFromGetSessionTokenResponse(assumeRoleResponse) {
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
        const session = new AwsIamRoleFederatedSession(sessionRequest.accountName, sessionRequest.region, sessionRequest.idpUrl, sessionRequest.idpArn, sessionRequest.roleArn, profileId);
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
            // Get the session in question
            const session = this.iSessionNotifier.getSessionById(sessionId);
            // Get idpUrl
            const idpUrl = Repository.getInstance().getIdpUrl(session.idpUrlId);
            // Check if we need to authenticate
            let needToAuthenticate;
            try {
                needToAuthenticate = yield this.needAuthentication(idpUrl);
            }
            catch (err) {
                throw new LeappSamlError(this, err.message);
            }
            // AwsSignIn: retrieve the response hook
            let responseHookDetails;
            try {
                responseHookDetails = yield this.awsSignIn(idpUrl, needToAuthenticate);
            }
            catch (err) {
                throw new LeappParseError(this, err.message);
            }
            // Extract SAML response from responseHookDetails
            let samlResponse;
            try {
                samlResponse = yield AwsIamRoleFederatedService.extractSamlResponse(responseHookDetails);
            }
            catch (err) {
                throw new LeappParseError(this, err.message);
            }
            // Setup STS to generate the credentials
            const sts = new AWS.STS(this.appService.stsOptions(session));
            // Params for the calls
            const params = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                PrincipalArn: session.idpArn,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                RoleArn: session.roleArn,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                SAMLAssertion: samlResponse,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                DurationSeconds: environment.samlRoleSessionDuration,
            };
            // Invoke assumeRoleWithSAML
            let assumeRoleWithSamlResponse;
            try {
                assumeRoleWithSamlResponse = yield sts.assumeRoleWithSAML(params).promise();
            }
            catch (err) {
                throw new LeappAwsStsError(this, err.message);
            }
            // Generate credentials
            return AwsIamRoleFederatedService.sessionTokenFromGetSessionTokenResponse(assumeRoleWithSamlResponse);
        });
    }
    removeSecrets(sessionId) { }
    needAuthentication(idpUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, _) => {
                // Get active window position for extracting new windows coordinate
                const activeWindowPosition = this.appService.getCurrentWindow().getPosition();
                const nearX = 200;
                const nearY = 50;
                // Generate a new singleton browser window for the check
                let idpWindow = this.appService.newWindow(idpUrl, false, '', activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);
                // This filter is used to listen to go to a specific callback url (or the generic one)
                const filter = {
                    urls: [
                        'https://*.onelogin.com/*',
                        'https://*.okta.com/*',
                        'https://accounts.google.com/ServiceLogin*',
                        'https://login.microsoftonline.com/*',
                        'https://signin.aws.amazon.com/saml'
                    ]
                };
                // Our request filter call the generic hook filter passing the idp response type
                // to construct the ideal method to deal with the construction of the response
                idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
                    // G Suite
                    if (details.url.indexOf('https://accounts.google.com/ServiceLogin') !== -1) {
                        idpWindow = null;
                        resolve(true);
                    }
                    // One Login
                    if (details.url.indexOf('.onelogin.com/login') !== -1) {
                        idpWindow = null;
                        resolve(true);
                    }
                    // OKTA
                    if (details.url.indexOf('.okta.com/discovery/iframe.html') !== -1) {
                        idpWindow = null;
                        resolve(true);
                    }
                    // AzureAD
                    if (details.url.indexOf('https://login.microsoftonline.com') !== -1 && details.url.indexOf('/oauth2/authorize') !== -1) {
                        idpWindow = null;
                        resolve(true);
                    }
                    // Do not show window: already logged by means of session cookies
                    if (details.url.indexOf('https://signin.aws.amazon.com/saml') !== -1) {
                        idpWindow = null;
                        resolve(false);
                    }
                    // Callback is used by filter to keep traversing calls until one of the filters apply
                    callback({
                        requestHeaders: details.requestHeaders,
                        url: details.url,
                    });
                });
                // Start the process
                idpWindow.loadURL(idpUrl);
            });
        });
    }
    awsSignIn(idpUrl, needToAuthenticate) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Show or not browser window depending on needToAuthenticate
            const activeWindowPosition = this.appService.getCurrentWindow().getPosition();
            const nearX = 200;
            const nearY = 50;
            // 2. Prepare browser window
            let idpWindow = this.appService.newWindow(idpUrl, needToAuthenticate, 'IDP - Login', activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);
            // 3. Prepare filters and configure callback
            const filter = { urls: ['https://signin.aws.amazon.com/saml'] };
            // Catch filter url: extract SAML response
            // Our request filter call the generic hook filter passing the idp response type
            // to construct the ideal method to deal with the construction of the response
            return new Promise((resolve, _) => {
                idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
                    // it will throw an error as we have altered the original response
                    // Setting that everything is ok if we have arrived here
                    idpWindow.close();
                    idpWindow = null;
                    // Shut down the filter action: we don't need it anymore
                    if (callback) {
                        callback({ cancel: true });
                    }
                    // Return the details
                    resolve(details);
                });
                // 4. Navigate to idpUrl
                idpWindow.loadURL(idpUrl);
            });
        });
    }
}
//# sourceMappingURL=aws-iam-role-federated-service.js.map