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
    this.create();
  }

  static getInstance(): Repository {
    if (!this.instance) {
      this.instance = new Repository();
    }
    return this.instance;
  }

  get workspace(): Workspace {
    return this._workspace;
  }

  set workspace(value: Workspace) {
    this._workspace = value;
  }

  create(): void {
    if (!this.fileService.exists(this.nativeService.os.homedir() + '/' + constants.lockFileDestination)) {
      this.fileService.newDir(this.nativeService.os.homedir() + '/.Leapp', { recursive: true});
      this._workspace = new Workspace();
      this.persist(this._workspace);
    }
  }

  get(): Workspace {
    if(!this._workspace) {
      const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.nativeService.os.homedir() + '/' + constants.lockFileDestination));
      this._workspace = deserialize(Workspace, workspaceJSON);
      return this._workspace;
    }
    return this._workspace;
  }

  updateDefaultRegion(defaultRegion: string) {
    const workspace = this.get();
    workspace.defaultRegion = defaultRegion;
    this.persist(workspace);
  }

  updateDefaultLocation(defaultLocation: string) {
    const workspace = this.get();
    workspace.defaultLocation = defaultLocation;
    this.persist(workspace);
  }

  getIdpUrl(idpUrlId: string): string {
    const workspace = this.get();
    const idpUrlFiltered = workspace.idpUrls.find(url => url.id === idpUrlId);
    return idpUrlFiltered ? idpUrlFiltered.url : null;
  }

  addIdpUrl(idpUrl: { id: string; url: string }): void {
    const workspace = this.get();
    workspace.idpUrls.push(idpUrl);
    this.persist(workspace);
  }

  updateIdpUrl(id: string, url: string) {
    const workspace = this.get();
    const index = workspace.idpUrls.findIndex(u => u.id === id);
    if(index > -1) {
      workspace.idpUrls[index].url = url;
      this.persist(workspace);
    }
  }

  removeIdpUrl(id: string) {
    const workspace = this.get();
    const index = workspace.idpUrls.findIndex(u => u.id === id);

    workspace.idpUrls.splice(index, 1);

    this.persist(workspace);
  }

  getDefaultRegion() {
    return this.get().defaultRegion;
  }

  getProfileName(profileId): string {
    const workspace = this.get();
    const profileFiltered = workspace.profiles.find(profile => profile.id === profileId);
    return profileFiltered ? profileFiltered.name : null;
  }

  getDefaultProfileId(): string {
    const workspace = this.get();
    const profileFiltered = workspace.profiles.find(profile => profile.name === 'default');
    return profileFiltered.id;
  }

  addProfile(profile: { id: string; name: string }): void {
    const workspace = this.get();
    workspace.profiles.push(profile);
    this.persist(workspace);
  }

  updateProfile(id: string, name: string) {
    const workspace = this.get();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    if(profileIndex > -1) {
      workspace.profiles[profileIndex].name = name;
      this.persist(workspace);
    }
  }

  removeProfile(id: string) {
    const workspace = this.get();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    workspace.profiles.splice(profileIndex, 1);

    this.persist(workspace);
  }

  configureAwsSso(region: string, portalUrl: string, expirationTime: string): void {
    const workspace = this.get();
    workspace.awsSsoConfiguration.region = region;
    workspace.awsSsoConfiguration.portalUrl = portalUrl;
    workspace.awsSsoConfiguration.expirationTime = expirationTime;
    this.persist(workspace);
  }

  removeExpirationTimeFromAwsSsoConfiguration(): void {
    const workspace = this.get();
    workspace.awsSsoConfiguration.expirationTime = undefined;
    this.persist(workspace);
  }

  getAwsSsoConfiguration(): {region: string; portalUrl: string; browserOpening: string; expirationTime: string} {
    return this.get().awsSsoConfiguration;
  }

  getProxyConfiguration() {
    return this.get().proxyConfiguration;
  }

  getProfiles(): any {
    return this.get().profiles;
  }

  getDefaultLocation() {
    return this.get().defaultLocation;
  }

  setBrowserOpening(browserOpening: string) {
    const workspace = this.get();
    workspace.awsSsoConfiguration.browserOpening = browserOpening;
    this.persist(workspace);
  }

  setAwsSsoConfiguration(region: string, portalUrl: string, browserOpening: string, expirationTime: string) {
    const workspace = this.get();
    workspace.awsSsoConfiguration = { region, portalUrl, browserOpening, expirationTime };
    this.persist(workspace);
  }

  getIdpUrls() {
    return this.get().idpUrls;
  }

  updateBrowserOpening(browserOpening: string) {
    const workspace = this.get();
    workspace.awsSsoConfiguration.browserOpening = browserOpening;
    this.persist(workspace);
  }

  updateProxyConfiguration(proxyConfiguration: { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string }) {
    const workspace = this.get();
    workspace.proxyConfiguration = proxyConfiguration;
    this.persist(workspace);
  }

  persist(workspace: Workspace) {
    const path = this.nativeService.os.homedir() + '/' + constants.lockFileDestination;
    this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
  }

  getSessions(): Session[] {
    const workspace = this.get();
    return workspace.sessions;
  }

  updateSessions(sessions: Session[]): void {
    const workspace = this.get();
    workspace.sessions = sessions;
    Repository.getInstance().persist(workspace);
  }
}
