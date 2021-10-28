import {Injectable} from '@angular/core';
import {Session} from '../../../core/models/session';
import {BehaviorSubject, Observable} from 'rxjs';
import Repository from '../../../core/services/repository';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  // Expose the observable$ part of the _sessions subject (read only stream)
  readonly sessions$: Observable<Session[]>;

  // - We set the initial state in BehaviorSubject's constructor
  // - Nobody outside the Store should have access to the BehaviorSubject
  //   because it has the write rights
  // - Writing to state should be handled by specialized Store methods
  // - Create one BehaviorSubject per store entity, for example if you have
  //   create a new BehaviorSubject for it, as well as the observable$, and getters/setters
  private readonly _sessions;

  constructor() {
    this._sessions = new BehaviorSubject<Session[]>([]);
    this.sessions$ = this._sessions.asObservable();
    this.sessions = this.getPersistedSessions();
  }

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this._sessions.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    this.updatePersistedSessions(sessions);
    this._sessions.next(sessions);
  }

  addSession(session: Session) {
    // we assign a new copy of session by adding a new session to it
    this.sessions = [
      ...this.sessions,
      session
    ];
  }

  removeSession(sessionId: string) {
    this.sessions = this.sessions.filter(session => session.sessionId !== sessionId);
  }

  private getPersistedSessions(): Session[] {
    const workspace = Repository.getInstance().get();
    return workspace.sessions;
  }

  private updatePersistedSessions(sessions: Session[]): void {
    const workspace = Repository.getInstance().get();
    workspace.sessions = sessions;
    Repository.getInstance().persist(workspace);
  }
}
