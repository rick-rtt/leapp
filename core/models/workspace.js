var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Session } from './session';
import * as uuid from 'uuid';
import { Type } from 'class-transformer';
import { constants } from './constants';
import 'reflect-metadata';
import 'core-js/es7/reflect';
//TODO: Check required and optional keys for every object
export class Workspace {
    constructor() {
        this._sessions = [];
        this._defaultRegion = constants.defaultRegion;
        this._defaultLocation = constants.defaultLocation;
        this._idpUrls = [];
        this._profiles = [
            { id: uuid.v4(), name: constants.defaultAwsProfileName }
        ];
        this._awsSsoConfiguration = {
            region: undefined,
            portalUrl: undefined,
            expirationTime: undefined,
            browserOpening: constants.inApp.toString()
        };
        this._proxyConfiguration = {
            proxyProtocol: 'https',
            proxyUrl: undefined,
            proxyPort: '8080',
            username: undefined,
            password: undefined
        };
    }
    get idpUrls() {
        return this._idpUrls;
    }
    set idpUrls(value) {
        this._idpUrls = value;
    }
    get profiles() {
        return this._profiles;
    }
    set profiles(value) {
        this._profiles = value;
    }
    get sessions() {
        return this._sessions;
    }
    set sessions(value) {
        this._sessions = value;
    }
    get proxyConfiguration() {
        return this._proxyConfiguration;
    }
    set proxyConfiguration(value) {
        this._proxyConfiguration = value;
    }
    get defaultRegion() {
        return this._defaultRegion;
    }
    set defaultRegion(value) {
        this._defaultRegion = value;
    }
    get defaultLocation() {
        return this._defaultLocation;
    }
    set defaultLocation(value) {
        this._defaultLocation = value;
    }
    get awsSsoConfiguration() {
        return this._awsSsoConfiguration;
    }
    set awsSsoConfiguration(value) {
        this._awsSsoConfiguration = value;
    }
}
__decorate([
    Type(() => Session)
], Workspace.prototype, "_sessions", void 0);
//# sourceMappingURL=workspace.js.map