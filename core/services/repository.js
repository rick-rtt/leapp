import { Workspace } from '../models/workspace';
import { deserialize, serialize } from 'class-transformer';
import { FileService } from './file-service';
import NativeService from './native-service';
import { constants } from '../models/constants';
import { SessionStatus } from '../models/session-status';
import { SessionType } from '../models/session-type';
import { LeappNotFoundError } from "../errors/leapp-not-found-error";
export default class Repository {
    constructor() {
        this.fileService = FileService.getInstance();
        this.nativeService = NativeService.getInstance();
        // TODO: check if it can be moved to a bootstrap phase
        this.createWorkspace();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new Repository();
        }
        return this.instance;
    }
    // WORKSPACE
    get workspace() {
        return this._workspace;
    }
    set workspace(value) {
        this._workspace = value;
    }
    getWorkspace() {
        if (!this._workspace) {
            const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.nativeService.os.homedir() + '/' + constants.lockFileDestination));
            this._workspace = deserialize(Workspace, workspaceJSON);
            return this._workspace;
        }
        return this._workspace;
    }
    createWorkspace() {
        if (!this.fileService.exists(this.nativeService.os.homedir() + '/' + constants.lockFileDestination)) {
            this.fileService.newDir(this.nativeService.os.homedir() + '/.Leapp', { recursive: true });
            this._workspace = new Workspace();
            this.persistWorkspace(this._workspace);
        }
    }
    persistWorkspace(workspace) {
        const path = this.nativeService.os.homedir() + '/' + constants.lockFileDestination;
        this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
    }
    // SESSIONS
    getSessions() {
        const workspace = this.getWorkspace();
        return workspace.sessions;
    }
    getSessionById(sessionId) {
        const workspace = this.getWorkspace();
        const session = workspace.sessions.find(sess => sess.sessionId === sessionId);
        if (session === undefined) {
            throw new LeappNotFoundError(this, `session with id ${sessionId} not found.`);
        }
        return session;
    }
    addSession(session) {
        const workspace = this.getWorkspace();
        workspace.sessions = [
            ...workspace.sessions,
            session
        ];
        Repository.getInstance().persistWorkspace(workspace);
    }
    updateSessions(sessions) {
        const workspace = this.getWorkspace();
        workspace.sessions = sessions;
        Repository.getInstance().persistWorkspace(workspace);
    }
    deleteSession(sessionId) {
        const workspace = this.getWorkspace();
        const index = workspace.sessions.findIndex(sess => sess.sessionId === sessionId);
        if (index > -1) {
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
    updateDefaultRegion(defaultRegion) {
        const workspace = this.getWorkspace();
        workspace.defaultRegion = defaultRegion;
        this.persistWorkspace(workspace);
    }
    updateDefaultLocation(defaultLocation) {
        const workspace = this.getWorkspace();
        workspace.defaultLocation = defaultLocation;
        this.persistWorkspace(workspace);
    }
    // IDP URLS
    getIdpUrl(idpUrlId) {
        const workspace = this.getWorkspace();
        const idpUrlFiltered = workspace.idpUrls.find(url => url.id === idpUrlId);
        return idpUrlFiltered ? idpUrlFiltered.url : null;
    }
    getIdpUrls() {
        return this.getWorkspace().idpUrls;
    }
    addIdpUrl(idpUrl) {
        const workspace = this.getWorkspace();
        workspace.idpUrls.push(idpUrl);
        this.persistWorkspace(workspace);
    }
    updateIdpUrl(id, url) {
        const workspace = this.getWorkspace();
        const index = workspace.idpUrls.findIndex(u => u.id === id);
        if (index > -1) {
            workspace.idpUrls[index].url = url;
            this.persistWorkspace(workspace);
        }
    }
    removeIdpUrl(id) {
        const workspace = this.getWorkspace();
        const index = workspace.idpUrls.findIndex(u => u.id === id);
        workspace.idpUrls.splice(index, 1);
        this.persistWorkspace(workspace);
    }
    // NAMED PROFILES
    getProfiles() {
        return this.getWorkspace().profiles;
    }
    getProfileName(profileId) {
        const workspace = this.getWorkspace();
        const profileFiltered = workspace.profiles.find(profile => profile.id === profileId);
        if (profileFiltered === undefined) {
            throw new LeappNotFoundError(this, `named profile with id ${profileId} not found.`);
        }
        return profileFiltered.name;
    }
    getDefaultProfileId() {
        const workspace = this.getWorkspace();
        const profileFiltered = workspace.profiles.find(profile => profile.name === 'default');
        if (profileFiltered === undefined) {
            throw new LeappNotFoundError(this, 'no default named profile found.');
        }
        return profileFiltered.id;
    }
    addProfile(profile) {
        const workspace = this.getWorkspace();
        workspace.profiles.push(profile);
        this.persistWorkspace(workspace);
    }
    updateProfile(id, name) {
        const workspace = this.getWorkspace();
        const profileIndex = workspace.profiles.findIndex(p => p.id === id);
        if (profileIndex > -1) {
            workspace.profiles[profileIndex].name = name;
            this.persistWorkspace(workspace);
        }
    }
    removeProfile(id) {
        const workspace = this.getWorkspace();
        const profileIndex = workspace.profiles.findIndex(p => p.id === id);
        workspace.profiles.splice(profileIndex, 1);
        this.persistWorkspace(workspace);
    }
    // AWS SSO CONFIGURATION
    getAwsSsoConfiguration() {
        return this.getWorkspace().awsSsoConfiguration;
    }
    configureAwsSso(region, portalUrl, expirationTime) {
        const workspace = this.getWorkspace();
        workspace.awsSsoConfiguration.region = region;
        workspace.awsSsoConfiguration.portalUrl = portalUrl;
        workspace.awsSsoConfiguration.expirationTime = expirationTime;
        this.persistWorkspace(workspace);
    }
    setAwsSsoConfiguration(region, portalUrl, browserOpening, expirationTime) {
        const workspace = this.getWorkspace();
        workspace.awsSsoConfiguration = { region, portalUrl, browserOpening, expirationTime };
        this.persistWorkspace(workspace);
    }
    setBrowserOpening(browserOpening) {
        const workspace = this.getWorkspace();
        workspace.awsSsoConfiguration.browserOpening = browserOpening;
        this.persistWorkspace(workspace);
    }
    updateBrowserOpening(browserOpening) {
        const workspace = this.getWorkspace();
        workspace.awsSsoConfiguration.browserOpening = browserOpening;
        this.persistWorkspace(workspace);
    }
    removeExpirationTimeFromAwsSsoConfiguration() {
        const workspace = this.getWorkspace();
        workspace.awsSsoConfiguration.expirationTime = undefined;
        this.persistWorkspace(workspace);
    }
    // PROXY CONFIGURATION
    getProxyConfiguration() {
        return this.getWorkspace().proxyConfiguration;
    }
    updateProxyConfiguration(proxyConfiguration) {
        const workspace = this.getWorkspace();
        workspace.proxyConfiguration = proxyConfiguration;
        this.persistWorkspace(workspace);
    }
    listPending() {
        const workspace = this.getWorkspace();
        return (workspace.sessions && workspace.sessions.length > 0) ? workspace.sessions.filter((session) => session.status === SessionStatus.pending) : [];
    }
    listActive() {
        const workspace = this.getWorkspace();
        return (workspace.sessions && workspace.sessions.length > 0) ? workspace.sessions.filter((session) => session.status === SessionStatus.active) : [];
    }
    listAwsSsoRoles() {
        const workspace = this.getWorkspace();
        return (workspace.sessions && workspace.sessions.length > 0) ? workspace.sessions.filter((session) => session.type === SessionType.awsSsoRole) : [];
    }
    listIamRoleChained(parentSession) {
        const workspace = this.getWorkspace();
        let childSession = (workspace.sessions && workspace.sessions.length > 0) ? workspace.sessions.filter((session) => session.type === SessionType.awsIamRoleChained) : [];
        if (parentSession) {
            childSession = childSession.filter(session => session.parentSessionId === parentSession.sessionId);
        }
        return childSession;
    }
}
//# sourceMappingURL=repository.js.map