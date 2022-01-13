import {CredentialsInfo} from '../../../models/credentials-info';
import {SessionStatus} from '../../../models/session-status';
import {LeappBaseError} from '../../../errors/leapp-base-error';
import {LoggerLevel} from '../../logging-service';
import {SessionService} from '../session.service';
import {ISessionNotifier} from '../../../interfaces/i-session-notifier';
import { Repository } from '../../repository';

export abstract class AwsSessionService extends SessionService {

  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  protected constructor(
    iSessionNotifier: ISessionNotifier,
    repository: Repository
  ) {
    super(iSessionNotifier, repository);
  }

  async start(sessionId: string): Promise<void> {
    console.log(`${JSON.stringify(this.repository.getSessions())}`);

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
      if (this.repository.getSessionById(sessionId).status === SessionStatus.active) {
        await this.stop(sessionId);
      }
      this.repository.listIamRoleChained(this.iSessionNotifier.getSessionById(sessionId)).forEach(sess => {
        if (sess.status === SessionStatus.active) {
          this.stop(sess.sessionId);
        }
        this.repository.deleteSession(sess.sessionId);
      });
      this.repository.deleteSession(sessionId);

      this.iSessionNotifier.setSessions(this.repository.getSessions());
      await this.removeSecrets(sessionId);
    } catch(error) {
      this.sessionError(sessionId, error);
    }
  }

  private isThereAnotherPendingSessionWithSameNamedProfile(sessionId: string) {
    const session = this.repository.getSessionById(sessionId);
    const profileId = (session as any).profileId;
    const pendingSessions = this.repository.listPending();

    for(let i = 0; i < pendingSessions.length; i++) {
      if ((pendingSessions[i] as any).profileId === profileId && (pendingSessions[i] as any).sessionId !== sessionId) {
        return true;
      }
    }

    return false;
  }

  private stopAllWithSameNameProfile(sessionId: string) {
    // Get profile to check
    const session = this.repository.getSessionById(sessionId);
    const profileId = (session as any).profileId;
    // Get all active sessions
    const activeSessions = this.repository.listActive();
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
