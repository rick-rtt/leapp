import {Injectable} from '@angular/core';
import {SessionStatus} from '../../../core/models/session-status';
import {Session} from '../../../core/models/session';
import {WorkspaceService} from './workspace.service';
import Repository from '../../../core/services/repository';
import {IAwsIamUserSessionUINotifier} from '../../../core/services/session/aws/method/aws-iam-user-service';

@Injectable({
  providedIn: 'root'
})
export abstract class SessionService {

  protected awsIamUserSessionUINotifier: IAwsIamUserSessionUINotifier;

  protected constructor(
    awsIamUserSessionUINotifier: IAwsIamUserSessionUINotifier
  ) {
    this.awsIamUserSessionUINotifier = awsIamUserSessionUINotifier;
  }

  protected sessionActivate(sessionId: string) {
    const index = this.awsIamUserSessionUINotifier.sessions.findIndex(s => s.sessionId === sessionId);
    if (index > -1) {
      const currentSession: Session = this.awsIamUserSessionUINotifier.sessions[index];
      currentSession.status = SessionStatus.active;
      currentSession.startDateTime = new Date().toISOString();
      this.awsIamUserSessionUINotifier.sessions[index] = currentSession;
      this.awsIamUserSessionUINotifier.sessions = [...this.awsIamUserSessionUINotifier.sessions];
      Repository.getInstance().updateSessions(this.awsIamUserSessionUINotifier.sessions);
    }
  }

  protected sessionLoading(sessionId: string) {
    const session = this.awsIamUserSessionUINotifier.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.awsIamUserSessionUINotifier.sessions.indexOf(session);
      const currentSession: Session = this.awsIamUserSessionUINotifier.sessions[index];
      currentSession.status = SessionStatus.pending;
      this.awsIamUserSessionUINotifier.sessions[index] = currentSession;
      this.awsIamUserSessionUINotifier.sessions = [...this.awsIamUserSessionUINotifier.sessions];
      Repository.getInstance().updateSessions(this.awsIamUserSessionUINotifier.sessions);
    }
  }

  protected sessionRotated(sessionId: string) {
    const session = this.awsIamUserSessionUINotifier.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.awsIamUserSessionUINotifier.sessions.indexOf(session);
      const currentSession: Session = this.awsIamUserSessionUINotifier.sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;
      this.awsIamUserSessionUINotifier.sessions[index] = currentSession;
      this.awsIamUserSessionUINotifier.sessions = [...this.awsIamUserSessionUINotifier.sessions];
      Repository.getInstance().updateSessions(this.awsIamUserSessionUINotifier.sessions);
    }
  }

  protected sessionDeactivated(sessionId: string) {
    const session = this.awsIamUserSessionUINotifier.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.awsIamUserSessionUINotifier.sessions.indexOf(session);
      const currentSession: Session = this.awsIamUserSessionUINotifier.sessions[index];
      currentSession.status = SessionStatus.inactive;
      currentSession.startDateTime = undefined;
      this.awsIamUserSessionUINotifier.sessions[index] = currentSession;
      this.awsIamUserSessionUINotifier.sessions = [...this.awsIamUserSessionUINotifier.sessions];
      Repository.getInstance().updateSessions(this.awsIamUserSessionUINotifier.sessions);
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
