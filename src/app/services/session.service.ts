import {Injectable} from '@angular/core';
import {SessionStatus} from '../../../core/models/session-status';
import {Session} from '../../../core/models/session';
import {WorkspaceService} from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export abstract class SessionService {

  protected constructor(
    protected workspaceService: WorkspaceService
  ) {}

  protected sessionActivate(sessionId: string) {
    const index = this.workspaceService.sessions.findIndex(s => s.sessionId === sessionId);
    if (index > -1) {
      const currentSession: Session = this.workspaceService.sessions[index];
      currentSession.status = SessionStatus.active;
      currentSession.startDateTime = new Date().toISOString();
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  protected sessionLoading(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      const currentSession: Session = this.workspaceService.sessions[index];
      currentSession.status = SessionStatus.pending;
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  protected sessionRotated(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      const currentSession: Session = this.workspaceService.sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  protected sessionDeactivated(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      const currentSession: Session = this.workspaceService.sessions[index];
      currentSession.status = SessionStatus.inactive;
      currentSession.startDateTime = undefined;
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
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
