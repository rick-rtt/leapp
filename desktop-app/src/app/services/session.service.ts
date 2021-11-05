import {Injectable} from '@angular/core';
import {Session} from '../../../../core/models/session';
import {SessionStatus} from '../../../../core/models/session-status';
import Repository from '../../../../core/services/repository';
import ISessionNotifier from '../../../../core/interfaces/i-session-notifier';

@Injectable({
  providedIn: 'root'
})
export abstract class SessionService {

  protected iSessionNotifier: ISessionNotifier;

  protected constructor(
    iSessionNotifier: ISessionNotifier
  ) {
    this.iSessionNotifier = iSessionNotifier;
  }

  protected sessionActivate(sessionId: string) {
    const sessions = Repository.getInstance().getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.active;
      currentSession.startDateTime = new Date().toISOString();

      sessions[index] = currentSession;

      Repository.getInstance().updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionLoading(sessionId: string) {
    const sessions = Repository.getInstance().getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.pending;

      sessions[index] = currentSession;

      Repository.getInstance().updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionRotated(sessionId: string) {
    const sessions = Repository.getInstance().getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;

      sessions[index] = currentSession;

      Repository.getInstance().updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionDeactivated(sessionId: string) {
    const sessions = Repository.getInstance().getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.inactive;
      currentSession.startDateTime = undefined;

      sessions[index] = currentSession;

      Repository.getInstance().updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionError(sessionId: string, error: any) {
    this.sessionDeactivated(sessionId);
    throw error;
  }

  abstract start(sessionId: string): Promise<void>;

  abstract rotate(sessionId: string): Promise<void>;

  abstract stop(sessionId: string): Promise<void>;

  abstract delete(sessionId: string): Promise<void>;
}
