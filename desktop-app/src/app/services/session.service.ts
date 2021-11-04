import {Injectable} from '@angular/core';
import {Session} from '../../../../core/models/session';
import {SessionStatus} from '../../../../core/models/session-status';
import Repository from '../../../../core/services/repository';
import ISessionNotifier from '../../../../core/models/i-session-notifier';

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
    const index = this.iSessionNotifier.getSessions().findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = this.iSessionNotifier.getSessions()[index];
      currentSession.status = SessionStatus.active;
      currentSession.startDateTime = new Date().toISOString();

      this.iSessionNotifier.getSessions()[index] = currentSession;
      this.iSessionNotifier.setSessions([...this.iSessionNotifier.getSessions()]);

      Repository.getInstance().updateSessions(this.iSessionNotifier.getSessions());
    }
  }

  protected sessionLoading(sessionId: string) {
    const index = this.iSessionNotifier.getSessions().findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = this.iSessionNotifier.getSessions()[index];
      currentSession.status = SessionStatus.pending;

      this.iSessionNotifier.getSessions()[index] = currentSession;
      this.iSessionNotifier.setSessions([...this.iSessionNotifier.getSessions()]);

      Repository.getInstance().updateSessions(this.iSessionNotifier.getSessions());
    }
  }

  protected sessionRotated(sessionId: string) {
    const index = this.iSessionNotifier.getSessions().findIndex(s => s.sessionId === sessionId);
    if (index > -1) {
      const currentSession: Session = this.iSessionNotifier.getSessions()[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;

      this.iSessionNotifier.getSessions()[index] = currentSession;
      this.iSessionNotifier.setSessions([...this.iSessionNotifier.getSessions()]);

      Repository.getInstance().updateSessions(this.iSessionNotifier.getSessions());
    }
  }

  protected sessionDeactivated(sessionId: string) {
    const index = this.iSessionNotifier.getSessions().findIndex(s => s.sessionId === sessionId);
    if (index > -1) {
      const currentSession: Session = this.iSessionNotifier.getSessions()[index];
      currentSession.status = SessionStatus.inactive;
      currentSession.startDateTime = undefined;

      this.iSessionNotifier.getSessions()[index] = currentSession;
      this.iSessionNotifier.setSessions([...this.iSessionNotifier.getSessions()]);

      Repository.getInstance().updateSessions(this.iSessionNotifier.getSessions());
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
