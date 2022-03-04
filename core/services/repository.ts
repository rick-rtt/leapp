import { deserialize, serialize } from "class-transformer";
import { LeappNotFoundError } from "../errors/leapp-not-found-error";
import { INativeService } from "../interfaces/i-native-service";
import { AwsIamRoleChainedSession } from "../models/aws-iam-role-chained-session";
import { AwsNamedProfile } from "../models/aws-named-profile";
import { AwsSsoIntegration } from "../models/aws-sso-integration";
import { constants } from "../models/constants";
import Segment from "../models/Segment";
import { Session } from "../models/session";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { Workspace } from "../models/workspace";
import { FileService } from "./file-service";
import { IdpUrl } from "../models/IdpUrl";
import * as uuid from "uuid";
import Folder from "../models/folder";

export class Repository {
  // Private singleton workspace
  private _workspace: Workspace;

  constructor(private nativeService: INativeService, private fileService: FileService) {
    // TODO: check if it can be moved to a bootstrap phase
    this.createWorkspace();
  }

  // WORKSPACE

  get workspace(): Workspace {
    return this._workspace;
  }

  set workspace(value: Workspace) {
    this._workspace = value;
  }

  getWorkspace(): Workspace {
    if (!this._workspace) {
      const workspaceJSON = this.fileService.decryptText(
        this.fileService.readFileSync(this.nativeService.os.homedir() + "/" + constants.lockFileDestination)
      );
      this._workspace = deserialize(Workspace, workspaceJSON);
      return this._workspace;
    }
    return this._workspace;
  }

  createWorkspace(): void {
    if (!this.fileService.existsSync(this.nativeService.os.homedir() + "/" + constants.lockFileDestination)) {
      this.fileService.newDir(this.nativeService.os.homedir() + "/.Leapp", { recursive: true });
      this._workspace = new Workspace();
      this.persistWorkspace(this._workspace);
    }
  }

  persistWorkspace(workspace: Workspace) {
    const path = this.nativeService.os.homedir() + "/" + constants.lockFileDestination;
    this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
  }

  // SESSIONS

  getSessions(): Session[] {
    const workspace = this.getWorkspace();
    return workspace.sessions;
  }

  getSessionById(sessionId: string): Session {
    const workspace = this.getWorkspace();
    const session = workspace.sessions.find((sess) => sess.sessionId === sessionId);
    if (session === undefined) {
      throw new LeappNotFoundError(this, `session with id ${sessionId} not found.`);
    }
    return session;
  }

  addSession(session: Session): void {
    const workspace = this.getWorkspace();

    workspace.sessions = [...workspace.sessions, session];

    this.persistWorkspace(workspace);
  }

  updateSession(sessionId: string, session: Session) {
    const sessions: Session[] = this.getSessions();
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].sessionId === sessionId) {
        (sessions[i] as any) = session;
      }
    }
    this.updateSessions(sessions);
  }

  updateSessions(sessions: Session[]): void {
    const workspace = this.getWorkspace();
    workspace.sessions = sessions;
    this.persistWorkspace(workspace);
  }

  deleteSession(sessionId: string) {
    const workspace = this.getWorkspace();
    const index = workspace.sessions.findIndex((sess) => sess.sessionId === sessionId);
    if (index > -1) {
      workspace.sessions.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  listPending(): Session[] {
    const workspace = this.getWorkspace();
    return workspace.sessions && workspace.sessions.length > 0
      ? workspace.sessions.filter((session) => session.status === SessionStatus.pending)
      : [];
  }

  listActive(): Session[] {
    const workspace = this.getWorkspace();
    return workspace.sessions && workspace.sessions.length > 0 ? workspace.sessions.filter((session) => session.status === SessionStatus.active) : [];
  }

  listAwsSsoRoles() {
    const workspace = this.getWorkspace();
    return workspace.sessions && workspace.sessions.length > 0 ? workspace.sessions.filter((session) => session.type === SessionType.awsSsoRole) : [];
  }

  listAssumable() {
    return this.getWorkspace().sessions.length > 0 ? this.getWorkspace().sessions.filter((session) => session.type !== SessionType.azure) : [];
  }

  listIamRoleChained(parentSession?: Session): Session[] {
    const workspace = this.getWorkspace();
    let childSession =
      workspace.sessions && workspace.sessions.length > 0
        ? workspace.sessions.filter((session) => session.type === SessionType.awsIamRoleChained)
        : [];
    if (parentSession) {
      childSession = childSession.filter((session) => (session as AwsIamRoleChainedSession).parentSessionId === parentSession.sessionId);
    }
    return childSession;
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
  getIdpUrl(idpUrlId: string): string | null {
    const workspace = this.getWorkspace();
    const idpUrlFiltered = workspace.idpUrls.find((url) => url.id === idpUrlId);
    return idpUrlFiltered ? idpUrlFiltered.url : null;
  }

  getIdpUrls(): IdpUrl[] {
    return this.getWorkspace().idpUrls;
  }

  addIdpUrl(idpUrl: IdpUrl): void {
    const workspace = this.getWorkspace();
    workspace.addIpUrl(idpUrl);
    this.persistWorkspace(workspace);
  }

  updateIdpUrl(id: string, url: string) {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex((u) => u.id === id);
    if (index > -1) {
      workspace.idpUrls[index].url = url;
      this.persistWorkspace(workspace);
    }
  }

  removeIdpUrl(id: string) {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex((u) => u.id === id);

    workspace.idpUrls.splice(index, 1);

    this.persistWorkspace(workspace);
  }

  getProfiles(): AwsNamedProfile[] {
    return this.getWorkspace().profiles;
  }

  getProfileName(profileId: string): string {
    const profileFiltered = this.getWorkspace().profiles.find((profile) => profile.id === profileId);
    if (profileFiltered === undefined) {
      throw new LeappNotFoundError(this, `named profile with id ${profileId} not found.`);
    }
    return profileFiltered.name;
  }

  doesProfileExist(profileId: string): boolean {
    return this.getWorkspace().profiles.find((profile) => profile.id === profileId) !== undefined;
  }

  getDefaultProfileId(): string {
    const workspace = this.getWorkspace();
    const profileFiltered = workspace.profiles.find((profile) => profile.name === "default");
    if (profileFiltered === undefined) {
      throw new LeappNotFoundError(this, "no default named profile found.");
    }
    return profileFiltered.id;
  }

  addProfile(profile: AwsNamedProfile): void {
    const workspace = this.getWorkspace();
    workspace.profiles.push(profile);
    this.persistWorkspace(workspace);
  }

  updateProfile(profileId: string, newName: string) {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex((p) => p.id === profileId);
    if (profileIndex > -1) {
      workspace.profiles[profileIndex].name = newName;
      this.persistWorkspace(workspace);
    }
  }

  removeProfile(profileId: string) {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex((p) => p.id === profileId);
    workspace.profiles.splice(profileIndex, 1);

    this.persistWorkspace(workspace);
  }

  // AWS SSO INTEGRATION
  listAwsSsoIntegrations() {
    const workspace = this.getWorkspace();
    return workspace.awsSsoIntegrations;
  }

  getAwsSsoIntegration(id: string | number): AwsSsoIntegration {
    return this.getWorkspace().awsSsoIntegrations.filter((ssoConfig) => ssoConfig.id === id)[0];
  }

  getAwsSsoIntegrationSessions(id: string | number): Session[] {
    return this.workspace.sessions.filter((sess) => (sess as any).awsSsoConfigurationId === id);
  }

  addAwsSsoIntegration(portalUrl: string, alias: string, region: string, browserOpening: string) {
    const workspace = this.getWorkspace();
    workspace.awsSsoIntegrations.push({ id: uuid.v4(), alias, portalUrl, region, accessTokenExpiration: undefined, browserOpening });
    this.persistWorkspace(workspace);
  }

  updateAwsSsoIntegration(id: string, alias: string, region: string, portalUrl: string, browserOpening: string, expirationTime?: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex((sso) => sso.id === id);
    if (index > -1) {
      workspace.awsSsoIntegrations[index].alias = alias;
      workspace.awsSsoIntegrations[index].region = region;
      workspace.awsSsoIntegrations[index].portalUrl = portalUrl;
      workspace.awsSsoIntegrations[index].browserOpening = browserOpening;
      if (expirationTime) {
        workspace.awsSsoIntegrations[index].accessTokenExpiration = expirationTime;
      }
      this.persistWorkspace(workspace);
    }
  }

  unsetAwsSsoIntegrationExpiration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex((sso) => sso.id === id);
    if (index > -1) {
      workspace.awsSsoIntegrations[index].accessTokenExpiration = undefined;
      this.persistWorkspace(workspace);
    }
  }

  deleteAwsSsoIntegration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex((awsSsoIntegration) => awsSsoIntegration.id === id);
    if (index > -1) {
      workspace.awsSsoIntegrations.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  // PROXY CONFIGURATION
  getProxyConfiguration() {
    return this.getWorkspace().proxyConfiguration;
  }

  updateProxyConfiguration(proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl?: string;
    proxyPort: string;
    username?: string;
    password?: string;
  }) {
    const workspace = this.getWorkspace();
    workspace.proxyConfiguration = proxyConfiguration;
    this.persistWorkspace(workspace);
  }

  // SEGMENTS
  getSegments() {
    const workspace = this.getWorkspace();
    return workspace.segments;
  }

  getSegment(segmentName: string) {
    const workspace = this.getWorkspace();
    return workspace.segments.find((s) => s.name === segmentName);
  }

  setSegments(segments: Segment[]) {
    const workspace = this.getWorkspace();
    workspace.segments = segments;
    this.persistWorkspace(workspace);
  }

  removeSegment(segment: Segment) {
    const workspace = this.getWorkspace();
    const index = workspace.segments.findIndex((s) => s.name === segment.name);
    if (index > -1) {
      workspace.segments.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  // FOLDERS
  getFolders() {
    const workspace = this.getWorkspace();
    return workspace.folders;
  }

  setFolders(folders: Folder[]) {
    const workspace = this.getWorkspace();
    workspace.folders = folders;
    this.persistWorkspace(workspace);
  }

  // PINS
  pinSession(session: Session) {
    const workspace = this.getWorkspace();
    if (workspace.pinned.indexOf(session.sessionId) === -1) {
      workspace.pinned.push(session.sessionId);
      this.persistWorkspace(workspace);
    }
  }

  unpinSession(session: Session) {
    const workspace = this.getWorkspace();
    const index = workspace.pinned.indexOf(session.sessionId);
    if (index > -1) {
      workspace.pinned.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  // MACOS TERMINAL
  updateMacOsTerminal(macOsTerminal: string) {
    const workspace = this.getWorkspace();
    workspace.macOsTerminal = macOsTerminal;
    this.persistWorkspace(workspace);
  }
}
