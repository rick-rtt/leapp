var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { environment } from '../../../../desktop-app/src/environments/environment';
import { SessionService } from '../session.service';
import { AzureSession } from '../../../models/azure-session';
import { LeappExecuteError } from '../../../errors/leapp-execute-error';
import { LeappParseError } from '../../../errors/leapp-parse-error';
import { FileService } from '../../file-service';
import Repository from '../../repository';
import { LeappBaseError } from "../../../errors/leapp-base-error";
import { LoggerLevel } from "../../logging-service";
export class AzureService extends SessionService {
    constructor(iSessionNotifier, appService, executeService) {
        super(iSessionNotifier);
        this.appService = appService;
        this.executeService = executeService;
    }
    static getInstance() {
        if (!this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Not initialized service error', this, LoggerLevel.error, 'Service needs to be initialized');
        }
        return this.instance;
    }
    static init(iSessionNotifier, appService, executeService) {
        if (this.instance) {
            // TODO: understand if we need to move Leapp Errors in a core folder
            throw new LeappBaseError('Already initialized service error', this, LoggerLevel.error, 'Service already initialized');
        }
        this.instance = new AzureService(iSessionNotifier, appService, executeService);
    }
    create(sessionRequest) {
        const session = new AzureSession(sessionRequest.sessionName, sessionRequest.region, sessionRequest.subscriptionId, sessionRequest.tenantId);
        Repository.getInstance().addSession(session);
        this.iSessionNotifier.addSession(session);
    }
    start(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionLoading(sessionId);
            const session = Repository.getInstance().getSessionById(sessionId);
            // Try parse accessToken.json
            let accessTokensFile = this.parseAccessTokens();
            // extract accessToken corresponding to the specific tenant (if not present, require az login)
            let accessTokenExpirationTime;
            if (accessTokensFile) {
                accessTokenExpirationTime = this.extractAccessTokenExpirationTime(accessTokensFile, session.tenantId);
            }
            if (!accessTokenExpirationTime) {
                try {
                    yield this.executeService.execute(`az login --tenant ${session.tenantId} 2>&1`);
                    accessTokensFile = this.parseAccessTokens();
                    accessTokenExpirationTime = this.extractAccessTokenExpirationTime(accessTokensFile, session.tenantId);
                }
                catch (err) {
                    this.sessionDeactivated(sessionId);
                    throw new LeappExecuteError(this, err.message);
                }
            }
            // if access token is expired
            if (new Date(accessTokenExpirationTime).getTime() < Date.now()) {
                try {
                    yield this.executeService.execute(`az account get-access-token --subscription ${session.subscriptionId}`);
                }
                catch (err) {
                    this.sessionDeactivated(sessionId);
                    throw new LeappExecuteError(this, err.message);
                }
            }
            try {
                // az account set —subscription <xxx> 2>&1
                yield this.executeService.execute(`az account set --subscription ${session.subscriptionId} 2>&1`);
                // az configure —default location <region(location)>
                yield this.executeService.execute(`az configure --default location=${session.region} 2>&1`);
                // delete refresh token from accessTokens
                this.deleteRefreshToken();
            }
            catch (err) {
                this.sessionDeactivated(sessionId);
                throw new LeappExecuteError(this, err.message);
            }
            this.sessionActivate(sessionId);
            return Promise.resolve(undefined);
        });
    }
    rotate(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.start(sessionId);
        });
    }
    stop(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionLoading(sessionId);
            try {
                yield this.executeService.execute(`az account clear 2>&1`);
                yield this.executeService.execute(`az configure --defaults location='' 2>&1`);
            }
            catch (err) {
                throw new LeappExecuteError(this, err.message);
            }
            finally {
                this.sessionDeactivated(sessionId);
            }
        });
    }
    delete(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.stop(sessionId);
                Repository.getInstance().deleteSession(sessionId);
                this.iSessionNotifier.deleteSession(sessionId);
            }
            catch (error) {
                throw new LeappParseError(this, error.message);
            }
        });
    }
    extractAccessTokenExpirationTime(accessTokens, tenantId) {
        const correctToken = accessTokens.find(accessToken => accessToken._authority.split('/')[1] === tenantId);
        return correctToken ? correctToken.expiresOn : undefined;
    }
    deleteRefreshToken() {
        const accessTokensString = FileService.getInstance().readFileSync(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`);
        let azureSessionTokens = JSON.parse(accessTokensString);
        azureSessionTokens = azureSessionTokens.map(azureSessionToken => {
            delete azureSessionToken.refreshToken;
            return azureSessionToken;
        });
        FileService.getInstance().writeFileSync(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`, JSON.stringify(azureSessionTokens));
    }
    parseAccessTokens() {
        if (!this.accessTokenFileExists()) {
            return undefined;
        }
        const accessTokensString = FileService.getInstance().readFileSync(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`);
        return JSON.parse(accessTokensString);
    }
    accessTokenFileExists() {
        return FileService.getInstance().exists(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`);
    }
}
//# sourceMappingURL=azure.service.js.map