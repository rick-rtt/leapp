import {INativeService} from "@noovolari/leapp-core";

export default class NativeService implements INativeService {

  private static instance: NativeService;

  log: any;
  url: any;
  fs: any;
  rimraf: any;
  os: any;
  ini: any;
  exec: any;
  unzip: any;
  copydir: any;
  sudo: any;
  md5File: any;
  path: any;
  semver: any;
  machineId: any;
  keytar: any;
  followRedirects: any;
  httpProxyAgent: any;
  httpsProxyAgent: any;

  constructor() {
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
    this.machineId = require('node-machine-id').machineIdSync();
    this.keytar = require('keytar');
    this.followRedirects = require('follow-redirects');
    this.httpProxyAgent = require('http-proxy-agent');
    this.httpsProxyAgent = require('https-proxy-agent');
    this.log =  {
      info: (msg: string) => { console.info(msg); },
      warn: (msg: string) => { console.warn(msg); },
      error: (msg: string) => { console.error(msg); }
    }
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new NativeService();
    }
    return this.instance;
  }
}
