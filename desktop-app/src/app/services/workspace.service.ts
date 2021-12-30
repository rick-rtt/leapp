import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import Repository from '@noovolari/leapp-core/services/repository';
import {Session} from '@noovolari/leapp-core/models/session';
import {SessionStatus} from '@noovolari/leapp-core/models/session-status';
import {SessionType} from '@noovolari/leapp-core/models/session-type';
import {AwsIamRoleChainedSession} from '@noovolari/leapp-core/models/aws-iam-role-chained-session';
import {ISessionNotifier} from '@noovolari/leapp-core/interfaces/i-session-notifier';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService implements ISessionNotifier {

  // Expose the observable$ part of the _sessions subject (read only stream)
  readonly sessions$: Observable<Session[]>;

  // - We set the initial state in BehaviorSubject's constructor
  // - Nobody outside the Store should have access to the BehaviorSubject
  //   because it has the write rights
  // - Writing to state should be handled by specialized Store methods
  // - Create one BehaviorSubject per store entity, for example if you have
  //   create a new BehaviorSubject for it, as well as the observable$, and getters/setters
  private readonly _sessions;

  private repository: Repository;

  constructor() {
    this._sessions = new BehaviorSubject<Session[]>([]);
    this.sessions$ = this._sessions.asObservable();
    this.repository = Repository.getInstance();
    this.sessions = this.repository.getSessions();
  }

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this._sessions.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    this._sessions.next(sessions);
  }

  getSessions(): Session[] {
    return this._sessions.getValue();
  }

  getSessionById(sessionId: string): Session {
    const sessionFiltered = this.sessions.find(session => session.sessionId === sessionId);
    return sessionFiltered ? sessionFiltered : null;
  }

  setSessions(sessions: Session[]): void {
    this._sessions.next(sessions);
  }

  addSession(session: Session) {
    // we assign a new copy of session by adding a new session to it
    this.sessions = [
      ...this.sessions,
      session
    ];
  }

  deleteSession(sessionId: string): void {
    this.sessions = this.sessions.filter(session => session.sessionId !== sessionId);
  }

  listPending(): Session[] {
    return (this.sessions.length > 0) ? this.sessions.filter( (session) => session.status === SessionStatus.pending ) : [];
  }

  listActive(): Session[] {
    return (this.sessions.length > 0) ? this.sessions.filter( (session) => session.status === SessionStatus.active ) : [];
  }

  listAwsSsoRoles() {
    return (this.sessions.length > 0) ? this.sessions.filter((session) => session.type === SessionType.awsSsoRole) : [];
  }

  listIamRoleChained(parentSession?: Session): Session[] {
    let childSession = (this.sessions.length > 0) ? this.sessions.filter( (session) => session.type === SessionType.awsIamRoleChained ) : [];
    if (parentSession) {
      childSession = childSession.filter(session => (session as AwsIamRoleChainedSession).parentSessionId === parentSession.sessionId );
    }
    return childSession;
  }

  removeSessionById(sessionId: string) {
    this.sessions = this.sessions.filter(session => session.sessionId !== sessionId);
  }

  updateSession(sessionId: string, session: Session) {
    const sessions = this.sessions;
    const index = sessions.findIndex(sess => sess.sessionId === sessionId);
    if(index > -1) {
      this.sessions[index] = session;
      this.sessions = [...this.sessions];
    }
  }

  listInActive(): Session[] {
    return (this.sessions.length > 0) ? this.sessions.filter( (session) => session.status === SessionStatus.inactive ) : [];
  }

  listAssumable(): Session[] {
    return (this.sessions.length > 0) ? this.sessions.filter( (session) => session.type !== SessionType.azure ) : [];
  }
}
