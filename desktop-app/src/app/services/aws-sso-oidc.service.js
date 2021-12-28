var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import SSOOIDC from 'aws-sdk/clients/ssooidc';
import { Injectable } from '@angular/core';
import { LeappBaseError } from '../../../../core/errors/leapp-base-error';
import { LoggerLevel } from '../../../../core/services/logging-service';
import { constants } from '../../../../core/models/constants';
import Repository from '../../../../core/services/repository';
let AwsSsoOidcService = class AwsSsoOidcService {
    constructor(appService, electronService) {
        this.appService = appService;
        this.electronService = electronService;
        this.listeners = [];
        this.ssoOidc = null;
        this.ssoWindow = null;
        this.currentRegion = null;
        this.currentPortalUrl = null;
        this.registerClientResponse = null;
        this.startDeviceAuthorizationResponse = null;
        this.startDeviceAuthorizationResponseExpiresAt = null;
        this.generateSSOTokenResponse = null;
        this.setIntervalQueue = [];
        this.loginMutex = false;
        this.timeoutOccurred = false;
        this.interruptOccurred = false;
        this.index = 0;
    }
    getAwsSsoOidcClient() {
        return this.ssoOidc;
    }
    interrupt() {
        clearInterval(this.mainIntervalId);
        this.interruptOccurred = true;
        this.loginMutex = false;
    }
    login(region, portalUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.loginMutex && this.setIntervalQueue.length === 0) {
                this.loginMutex = true;
                this.ssoOidc = new SSOOIDC({ region });
                this.ssoWindow = null;
                this.currentRegion = region;
                this.currentPortalUrl = portalUrl;
                this.registerClientResponse = null;
                this.startDeviceAuthorizationResponse = null;
                this.startDeviceAuthorizationResponseExpiresAt = null;
                this.generateSSOTokenResponse = null;
                this.setIntervalQueue = [];
                this.timeoutOccurred = false;
                this.interruptOccurred = false;
                yield this.registerSsoOidcClient();
                const startDeviceAuthorizationRequest = {
                    clientId: this.registerClientResponse.clientId,
                    clientSecret: this.registerClientResponse.clientSecret,
                    startUrl: portalUrl
                };
                const baseTimeInMilliseconds = Date.now();
                this.startDeviceAuthorizationResponse = yield this.getAwsSsoOidcClient().startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
                this.startDeviceAuthorizationResponseExpiresAt = baseTimeInMilliseconds + this.startDeviceAuthorizationResponse.expiresIn * 1000;
                const verificationResponse = yield this.openVerificationBrowserWindow(this.registerClientResponse, this.startDeviceAuthorizationResponse);
                try {
                    this.generateSSOTokenResponse = yield this.createToken(verificationResponse);
                }
                catch (err) {
                    this.loginMutex = false;
                    throw (err);
                }
                this.loginMutex = false;
                return this.generateSSOTokenResponse;
            }
            else if (!this.loginMutex && this.setIntervalQueue.length > 0) {
                return this.generateSSOTokenResponse;
            }
            else {
                return new Promise((resolve, reject) => {
                    const repeatEvery = 500; // 0.5 second, we can make these more speedy as they just check a variable, no external calls here
                    const resolved = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        if (this.interruptOccurred) {
                            clearInterval(resolved);
                            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
                            this.setIntervalQueue.splice(resolvedIndex, 1);
                            reject(new LeappBaseError('AWS SSO Interrupted', this, LoggerLevel.info, 'AWS SSO Interrupted.'));
                        }
                        else if (this.generateSSOTokenResponse) {
                            clearInterval(resolved);
                            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
                            this.setIntervalQueue.splice(resolvedIndex, 1);
                            resolve(this.generateSSOTokenResponse);
                        }
                        else if (this.timeoutOccurred) {
                            clearInterval(resolved);
                            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
                            this.setIntervalQueue.splice(resolvedIndex, 1);
                            reject(new LeappBaseError('AWS SSO Timeout', this, LoggerLevel.error, 'AWS SSO Timeout occurred. Please redo login procedure.'));
                        }
                    }), repeatEvery);
                    this.setIntervalQueue.push(resolved);
                });
            }
        });
    }
    registerSsoOidcClient() {
        return __awaiter(this, void 0, void 0, function* () {
            const registerClientRequest = { clientName: 'leapp', clientType: 'public' };
            this.registerClientResponse = yield this.ssoOidc.registerClient(registerClientRequest).promise();
        });
    }
    openVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Repository.getInstance().getAwsSsoConfiguration().browserOpening === constants.inApp.toString()) {
                const pos = this.electronService.currentWindow.getPosition();
                this.ssoWindow = null;
                this.ssoWindow = this.appService.newWindow(startDeviceAuthorizationResponse.verificationUriComplete, true, 'Portal url - Client verification', pos[0] + 200, pos[1] + 50);
                this.ssoWindow.loadURL(startDeviceAuthorizationResponse.verificationUriComplete);
                this.ssoWindow.on('close', (e) => {
                    e.preventDefault();
                    this.loginMutex = false;
                    this.listeners.forEach(listener => {
                        listener.catchClosingBrowserWindow();
                    });
                });
                return new Promise((resolve, reject) => {
                    // When the code is verified and the user has been logged in, the window can be closed
                    this.ssoWindow.webContents.session.webRequest.onBeforeRequest({ urls: [
                            'https://*.awsapps.com/start/user-consent/login-success.html',
                        ] }, (details, callback) => {
                        this.ssoWindow.close();
                        this.ssoWindow = null;
                        const verificationResponse = {
                            clientId: registerClientResponse.clientId,
                            clientSecret: registerClientResponse.clientSecret,
                            deviceCode: startDeviceAuthorizationResponse.deviceCode
                        };
                        resolve(verificationResponse);
                        callback({
                            requestHeaders: details.requestHeaders,
                            url: details.url,
                        });
                    });
                    this.ssoWindow.webContents.session.webRequest.onErrorOccurred((details) => {
                        if (details.error.indexOf('net::ERR_ABORTED') < 0 &&
                            details.error.indexOf('net::ERR_FAILED') < 0 &&
                            details.error.indexOf('net::ERR_CACHE_MISS') < 0 &&
                            details.error.indexOf('net::ERR_CONNECTION_REFUSED') < 0) {
                            if (this.ssoWindow) {
                                this.ssoWindow.close();
                                this.ssoWindow = null;
                            }
                            reject(details.error.toString());
                        }
                    });
                });
            }
            else {
                return this.openExternalVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse);
            }
        });
    }
    openExternalVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            const uriComplete = startDeviceAuthorizationResponse.verificationUriComplete;
            return new Promise((resolve, _) => {
                // Open external browser window and let authentication begins
                this.appService.openExternalUrl(uriComplete);
                // Return the code to be used after
                const verificationResponse = {
                    clientId: registerClientResponse.clientId,
                    clientSecret: registerClientResponse.clientSecret,
                    deviceCode: startDeviceAuthorizationResponse.deviceCode
                };
                resolve(verificationResponse);
            });
        });
    }
    createToken(verificationResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            const createTokenRequest = {
                clientId: verificationResponse.clientId,
                clientSecret: verificationResponse.clientSecret,
                grantType: 'urn:ietf:params:oauth:grant-type:device_code',
                deviceCode: verificationResponse.deviceCode
            };
            let createTokenResponse;
            if (Repository.getInstance().getAwsSsoConfiguration().browserOpening === constants.inApp) {
                createTokenResponse = yield this.getAwsSsoOidcClient().createToken(createTokenRequest).promise();
            }
            else {
                createTokenResponse = yield this.waitForToken(createTokenRequest);
            }
            const expirationTime = new Date(Date.now() + createTokenResponse.expiresIn * 1000);
            return { accessToken: createTokenResponse.accessToken, expirationTime };
        });
    }
    waitForToken(createTokenRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const intervalInMilliseconds = 5000;
                this.mainIntervalId = setInterval(() => {
                    this.getAwsSsoOidcClient().createToken(createTokenRequest).promise().then(createTokenResponse => {
                        clearInterval(this.mainIntervalId);
                        resolve(createTokenResponse);
                    }).catch(err => {
                        if (err.toString().indexOf('AuthorizationPendingException') === -1) {
                            // AWS SSO Timeout occurred
                            clearInterval(this.mainIntervalId);
                            this.timeoutOccurred = true;
                            reject(new LeappBaseError('AWS SSO Timeout', this, LoggerLevel.error, 'AWS SSO Timeout occurred. Please redo login procedure.'));
                        }
                    });
                }, intervalInMilliseconds);
            });
        });
    }
};
AwsSsoOidcService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], AwsSsoOidcService);
export { AwsSsoOidcService };
//# sourceMappingURL=aws-sso-oidc.service.js.map