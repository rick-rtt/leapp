import {Workspace} from '../models/workspace';
import {Session} from '../models/session';
import {deserialize, serialize} from 'class-transformer';
import {FileService} from './file-service';
import NativeService from './native-service';
import {constants} from '../models/constants';

export default class Repository {

  private static instance: Repository;

  // Private singleton workspace
  private _workspace: Workspace;

  private fileService: FileService;
  private nativeService: NativeService;

  private constructor() {
    this.fileService = FileService.getInstance();
    this.nativeService = NativeService.getInstance();
    // TODO: check if it can be moved to a bootstrap phase
    this.createWorkspace();
  }

  static getInstance(): Repository {
    if (!this.instance) {
      this.instance = new Repository();
    }
    return this.instance;
  }

  // WORKSPACE

  get workspace(): Workspace {
    return this._workspace;
  }

  set workspace(value: Workspace) {
    this._workspace = value;
  }

  getWorkspace(): Workspace {
    if(!this._workspace) {
      const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.nativeService.os.homedir() + '/' + constants.lockFileDestination));
      this._workspace = deserialize(Workspace, workspaceJSON);
      return this._workspace;
    }
    return this._workspace;
  }

  createWorkspace(): void {
    if (!this.fileService.exists(this.nativeService.os.homedir() + '/' + constants.lockFileDestination)) {
      this.fileService.newDir(this.nativeService.os.homedir() + '/.Leapp', { recursive: true});
      this._workspace = new Workspace();
      this.persistWorkspace(this._workspace);
    }
  }

  persistWorkspace(workspace: Workspace) {
    const path = this.nativeService.os.homedir() + '/' + constants.lockFileDestination;
    this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
  }

  // SESSIONS

  getSessions(): Session[] {
    const workspace = this.getWorkspace();
    return workspace.sessions;
  }

  getSessionById(sessionId: string): Session {
    const workspace = this.getWorkspace();
    return workspace.sessions.find(session => session.sessionId === sessionId);
  }

  addSession(session: Session): void {
    const workspace = this.getWorkspace();

    workspace.sessions = [
      ...workspace.sessions,
      session
    ];

    Repository.getInstance().persistWorkspace(workspace);
  }

  updateSessions(sessions: Session[]): void {
    const workspace = this.getWorkspace();
    workspace.sessions = sessions;
    Repository.getInstance().persistWorkspace(workspace);
  }

  deleteSession(sessionId: string) {
    const workspace = this.getWorkspace();
    const index = workspace.sessions.findIndex(sess => sess.sessionId === sessionId);
    if(index > -1) {
      workspace.sessions.splice(index, 1);
      Repository.getInstance().persistWorkspace(workspace);
    }
  }

  // REGION AND LOCATION

  getDefaultRegion() {
    return this.getWorkspace().defaultRegion;
  }

  getDefaultLocation() {
    return this.getWorkspace().defaultLocation;
  }

  updateDefaultRegion(defaultRegion: string) {
    const workspace = this.getWorkspace();
    workspace.defaultRegion = defaultRegion;
    this.persistWorkspace(workspace);
  }

  updateDefaultLocation(defaultLocation: string) {
    const workspace = this.getWorkspace();
    workspace.defaultLocation = defaultLocation;
    this.persistWorkspace(workspace);
  }

  // IDP URLS

  getIdpUrl(idpUrlId: string): string {
    const workspace = this.getWorkspace();
    const idpUrlFiltered = workspace.idpUrls.find(url => url.id === idpUrlId);
    return idpUrlFiltered ? idpUrlFiltered.url : null;
  }

  getIdpUrls() {
    return this.getWorkspace().idpUrls;
  }

  addIdpUrl(idpUrl: { id: string; url: string }): void {
    const workspace = this.getWorkspace();
    workspace.idpUrls.push(idpUrl);
    this.persistWorkspace(workspace);
  }

  updateIdpUrl(id: string, url: string) {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex(u => u.id === id);
    if(index > -1) {
      workspace.idpUrls[index].url = url;
      this.persistWorkspace(workspace);
    }
  }

  removeIdpUrl(id: string) {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex(u => u.id === id);

    workspace.idpUrls.splice(index, 1);

    this.persistWorkspace(workspace);
  }

  // NAMED PROFILES

  getProfiles(): any {
    return this.getWorkspace().profiles;
  }

  getProfileName(profileId): string {
    const workspace = this.getWorkspace();
    const profileFiltered = workspace.profiles.find(profile => profile.id === profileId);
    return profileFiltered ? profileFiltered.name : null;
  }

  getDefaultProfileId(): string {
    const workspace = this.getWorkspace();
    const profileFiltered = workspace.profiles.find(profile => profile.name === 'default');
    return profileFiltered.id;
  }

  addProfile(profile: { id: string; name: string }): void {
    const workspace = this.getWorkspace();
    workspace.profiles.push(profile);
    this.persistWorkspace(workspace);
  }

  updateProfile(id: string, name: string) {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    if(profileIndex > -1) {
      workspace.profiles[profileIndex].name = name;
      this.persistWorkspace(workspace);
    }
  }

  removeProfile(id: string) {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    workspace.profiles.splice(profileIndex, 1);

    this.persistWorkspace(workspace);
  }

  // AWS SSO CONFIGURATION

  getAwsSsoConfiguration(): {region: string; portalUrl: string; browserOpening: string; expirationTime: string} {
    return this.getWorkspace().awsSsoConfiguration;
  }

  configureAwsSso(region: string, portalUrl: string, expirationTime: string): void {
    const workspace = this.getWorkspace();
    workspace.awsSsoConfiguration.region = region;
    workspace.awsSsoConfiguration.portalUrl = portalUrl;
    workspace.awsSsoConfiguration.expirationTime = expirationTime;
    this.persistWorkspace(workspace);
  }

  setAwsSsoConfiguration(region: string, portalUrl: string, browserOpening: string, expirationTime: string) {
    const workspace = this.getWorkspace();
    workspace.awsSsoConfiguration = { region, portalUrl, browserOpening, expirationTime };
    this.persistWorkspace(workspace);
  }

  setBrowserOpening(browserOpening: string) {
    const workspace = this.getWorkspace();
    workspace.awsSsoConfiguration.browserOpening = browserOpening;
    this.persistWorkspace(workspace);
  }

  updateBrowserOpening(browserOpening: string) {
    const workspace = this.getWorkspace();
    workspace.awsSsoConfiguration.browserOpening = browserOpening;
    this.persistWorkspace(workspace);
  }

  removeExpirationTimeFromAwsSsoConfiguration(): void {
    const workspace = this.getWorkspace();
    workspace.awsSsoConfiguration.expirationTime = undefined;
    this.persistWorkspace(workspace);
  }

  // PROXY CONFIGURATION

  getProxyConfiguration() {
    return this.getWorkspace().proxyConfiguration;
  }

  updateProxyConfiguration(proxyConfiguration: { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string }) {
    const workspace = this.getWorkspace();
    workspace.proxyConfiguration = proxyConfiguration;
    this.persistWorkspace(workspace);
  }
}
