import {Session} from '../../models/session';
import {SessionStatus} from '../../models/session-status';
import Repository from '../repository';
import {ISessionNotifier} from '../../interfaces/i-session-notifier';

export abstract class SessionService {

  protected constructor(
    protected iSessionNotifier: ISessionNotifier,
    protected repository: Repository
  ) {}

  protected sessionActivate(sessionId: string) {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.active;
      currentSession.startDateTime = new Date().toISOString();

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionLoading(sessionId: string) {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.pending;

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionRotated(sessionId: string) {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if(this.iSessionNotifier) {
        this.iSessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionDeactivated(sessionId: string) {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex(s => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.inactive;
      currentSession.startDateTime = undefined;

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

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
