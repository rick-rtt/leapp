import {WorkspaceService} from '../../../../src/app/services/workspace.service';
import {CredentialsInfo} from '../../../models/credentials-info';
import {SessionStatus} from '../../../models/session-status';
import {SessionService} from '../../../../src/app/services/session.service';
import {LeappBaseError} from '../../../../src/app/errors/leapp-base-error';
import {LoggerLevel} from '../../logging-service';

export default abstract class AwsSessionService extends SessionService {

  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  protected constructor(protected workspaceService: WorkspaceService) {
    super(workspaceService);
  }

  async start(sessionId: string): Promise<void> {
    try {
      if (this.isThereAnotherPendingSessionWithSameNamedProfile(sessionId)) {
        throw new LeappBaseError('Pending session with same named profile', this, LoggerLevel.info, 'Pending session with same named profile');
      }
      this.stopAllWithSameNameProfile(sessionId);
      this.sessionLoading(sessionId);
      const credentialsInfo = await this.generateCredentials(sessionId);
      await this.applyCredentials(sessionId, credentialsInfo);
      this.sessionActivate(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async rotate(sessionId: string): Promise<void> {
    try {
      this.sessionLoading(sessionId);
      const credentialsInfo = await this.generateCredentials(sessionId);
      await this.applyCredentials(sessionId, credentialsInfo);
      this.sessionRotated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async stop(sessionId: string): Promise<void> {
    try {
      await this.deApplyCredentials(sessionId);
      this.sessionDeactivated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      if (this.workspaceService.get(sessionId).status === SessionStatus.active) {
        await this.stop(sessionId);
      }
      this.workspaceService.listIamRoleChained(this.workspaceService.get(sessionId)).forEach(sess => {
        if (sess.status === SessionStatus.active) {
          this.stop(sess.sessionId);
        }
        this.workspaceService.removeSession(sess.sessionId);
      });
      this.workspaceService.removeSession(sessionId);
      await this.removeSecrets(sessionId);
    } catch(error) {
      this.sessionError(sessionId, error);
    }
  }

  private isThereAnotherPendingSessionWithSameNamedProfile(sessionId: string) {
    const session = this.workspaceService.get(sessionId);
    const profileId = (session as any).profileId;
    const pendingSessions = this.workspaceService.listPending();

    for(let i = 0; i < pendingSessions.length; i++) {
      if ((pendingSessions[i] as any).profileId === profileId && (pendingSessions[i] as any).sessionId !== sessionId) {
        return true;
      }
    }

    return false;
  }

  private stopAllWithSameNameProfile(sessionId: string) {
    // Get profile to check
    const session = this.workspaceService.get(sessionId);
    const profileId = (session as any).profileId;
    // Get all active sessions
    const activeSessions = this.workspaceService.listActive();
    // Stop all that shares the same profile
    activeSessions.forEach(sess => {
      if( (sess as any).profileId === profileId ) {
        this.stop(sess.sessionId).then(_ => {});
      }
    });
  }

  abstract generateCredentials(sessionId: string): Promise<CredentialsInfo>;
  abstract applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void>;
  abstract deApplyCredentials(sessionId: string): Promise<void>;
  abstract removeSecrets(sessionId: string): void;
}
