import { AwsNamedProfile } from './aws-named-profile'
import { Session } from './session'
import * as uuid from 'uuid'
import 'reflect-metadata'
import { Type } from 'class-transformer'
import { constants } from './constants'
import { AwsSsoIntegration } from './aws-sso-integration'
import Folder from "./folder";
import Segment from "./Segment";

//TODO: Check required and optional keys for every object

export class Workspace {
  @Type(() => Session)
  private _sessions: Session[]
  private _defaultRegion: string
  private _defaultLocation: string
  private _idpUrls: { id: string; url: string }[]
  private _profiles: AwsNamedProfile[]

  private _awsSsoIntegrations: AwsSsoIntegration[];

  private _pinned: string[];
  private _folders: Folder[];
  private _segments: Segment[];

  private _proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl?: string;
    proxyPort: string;
    username?: string;
    password?: string;
  }

  constructor() {
    this._pinned = [];
    this._sessions = [];
    this._folders = [];
    this._segments = [];
    this._defaultRegion = constants.defaultRegion;
    this._defaultLocation = constants.defaultLocation;
    this._idpUrls = [];
    this._profiles = [
      { id: uuid.v4(), name: constants.defaultAwsProfileName }
    ];

    this._awsSsoIntegrations = [];

    this._proxyConfiguration = {
      proxyProtocol: 'https',
      proxyUrl: undefined,
      proxyPort: '8080',
      username: undefined,
      password: undefined
    }
  }

  get idpUrls(): { id: string; url: string }[] {
    return this._idpUrls
  }

  set idpUrls(value: { id: string; url: string }[]) {
    this._idpUrls = value
  }

  get profiles(): AwsNamedProfile[] {
    return this._profiles
  }

  set profiles(value: AwsNamedProfile[]) {
    this._profiles = value
  }

  get sessions(): Session[] {
    return this._sessions
  }

  set sessions(value: Session[]) {
    this._sessions = value
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string } {
    return this._proxyConfiguration
  }

  set proxyConfiguration(value: { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string }) {
    this._proxyConfiguration = value
  }

  get defaultRegion(): string {
    return this._defaultRegion
  }

  set defaultRegion(value: string) {
    this._defaultRegion = value
  }

  get defaultLocation(): string {
    return this._defaultLocation
  }

  set defaultLocation(value: string) {
    this._defaultLocation = value
  }

  get awsSsoIntegrations(): AwsSsoIntegration[] {
    return this._awsSsoIntegrations;
  }

  set awsSsoIntegrations(value: AwsSsoIntegration[]) {
    this._awsSsoIntegrations = value;
  }

  get pinned() {
    return this._pinned;
  }

  set pinned(pinned: string[] ) {
    this._pinned = pinned;
  }

  get folders() {
    return this._folders;
  }

  set folders(folders: Folder[] ) {
    this._folders = folders;
  }

  get segments() {
    return this._segments;
  }

  set segments(segments: Segment[] ) {
    this._segments = segments;
  }
}
