export default class NativeService {

  private static instance: NativeService;

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
  keytar: any;
  followRedirects: any;
  httpProxyAgent: any;
  httpsProxyAgent: any;
  nativeTheme: any;
  notification: any;
  process: any;

  private constructor() {
    try {
      if (this.isElectron) {
        this.log = window.require('electron-log');
        this.fs = window.require('fs-extra');
        this.rimraf = window.require('rimraf');
        this.os = window.require('os');
        this.ini = window.require('ini');
        this.md5File = window.require('md5-file');
        this.path = window.require('path');
        this.exec = window.require('child_process').exec;
        this.url = window.require('url');
        this.unzip = window.require('extract-zip');
        this.copydir = window.require('copy-dir');
        this.sudo = window.require('sudo-prompt');
        this.semver = window.require('semver');
        this.shell = window.require('electron').shell;
        this.machineId = window.require('node-machine-id').machineIdSync();
        this.keytar = window.require('keytar');
        this.followRedirects = window.require('follow-redirects');
        this.httpProxyAgent = window.require('http-proxy-agent');
        this.httpsProxyAgent = window.require('https-proxy-agent');
        this.app = window.require('@electron/remote').app;
        this.session = window.require('@electron/remote').session;
        this.dialog = window.require('@electron/remote').dialog;
        this.browserWindow = window.require('@electron/remote').BrowserWindow;
        this.currentWindow = window.require('@electron/remote').getCurrentWindow();
        this.menu = window.require('@electron/remote').Menu;
        this.tray = window.require('@electron/remote').Tray;
        this.ipcRenderer = window.require('electron').ipcRenderer;
        this.nativeTheme = window.require('@electron/remote').nativeTheme;
        this.notification = window.require('@electron/remote').Notification;
        this.process = (window as any).process;
      }
    } catch (e: any) {
      if (e.constructor.name === 'ReferenceError') { // TODO: add message check
        //this.log = require('electron-log');
        this.fs = require('fs-extra');
        this.rimraf = require('rimraf');
        this.os = require('os');
        this.ini = require('ini');
        this.md5File = require('md5-file');
        this.path = require('path');
        this.exec = require('child_process').exec;
        this.url = require('url');
        this.unzip = require('extract-zip');
        this.copydir = require('copy-dir');
        this.sudo = require('sudo-prompt');
        this.semver = require('semver');
        //this.shell = require('electron').shell;
        this.machineId = require('node-machine-id').machineIdSync();
        this.keytar = require('keytar');
        this.followRedirects = require('follow-redirects');
        this.httpProxyAgent = require('http-proxy-agent');
        this.httpsProxyAgent = require('https-proxy-agent');
        /*this.app = require('@electron/remote').app;
        this.session = require('@electron/remote').session;
        this.dialog = require('@electron/remote').dialog;
        this.browserWindow = require('@electron/remote').BrowserWindow;
        this.currentWindow = require('@electron/remote').getCurrentWindow();
        this.menu = require('@electron/remote').Menu;
        this.tray = require('@electron/remote').Tray;
        this.ipcRenderer = require('electron').ipcRenderer;
        this.nativeTheme = require('@electron/remote').nativeTheme;
        this.notification = require('@electron/remote').Notification;*/
      }
    }
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new NativeService();
    }
    return this.instance;
  }

  get isElectron(): boolean {
    return !!(window && window.process && (window.process as any).type);
  }
}
