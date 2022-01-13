import { Injectable } from '@angular/core';
import * as Keytar from 'keytar';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  url: any;
  log: any;
  fs: any;
  rimraf: any;
  os: any;
  ini: any;
  app: any;
  dialog: any;
  exec: any;
  session: any;
  unzip: any;
  copydir: any;
  browserWindow: any;
  sudo: any;
  md5File: any;
  path: any;
  currentWindow: any;
  semver: any;
  shell: any;
  menu: any;
  tray: any;
  machineId: any;
  ipcRenderer: any;
  keytar: typeof Keytar;
  followRedirects: any;
  httpProxyAgent: any;
  httpsProxyAgent: any;
  nativeTheme: any;
  notification: any;
  process: any;

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
}
