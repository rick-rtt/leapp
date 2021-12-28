var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@angular/core';
import NativeService from '../../../../core/services/native-service';
let ElectronService = class ElectronService {
    constructor() {
        const nativeService = NativeService.getInstance();
        if (nativeService.isElectron) {
            this.log = nativeService.log;
            this.fs = nativeService.fs;
            this.rimraf = nativeService.rimraf;
            this.os = nativeService.os;
            this.ini = nativeService.ini;
            this.md5File = nativeService.md5File;
            this.path = nativeService.path;
            this.exec = nativeService.exec;
            this.url = nativeService.url;
            this.unzip = nativeService.unzip;
            this.copydir = nativeService.copydir;
            this.sudo = nativeService.sudo;
            this.semver = nativeService.semver;
            this.shell = nativeService.shell;
            this.machineId = nativeService.machineId;
            this.keytar = nativeService.keytar;
            this.followRedirects = nativeService.followRedirects;
            this.httpProxyAgent = nativeService.httpProxyAgent;
            this.httpsProxyAgent = nativeService.httpsProxyAgent;
            this.app = nativeService.app;
            this.session = nativeService.session;
            this.dialog = nativeService.dialog;
            this.browserWindow = nativeService.browserWindow;
            this.currentWindow = nativeService.currentWindow;
            this.menu = nativeService.menu;
            this.tray = nativeService.tray;
            this.ipcRenderer = nativeService.ipcRenderer;
            this.nativeTheme = nativeService.nativeTheme;
            this.notification = nativeService.notification;
            this.process = nativeService.process;
        }
    }
};
ElectronService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], ElectronService);
export { ElectronService };
//# sourceMappingURL=electron.service.js.map