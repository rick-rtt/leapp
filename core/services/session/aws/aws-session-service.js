var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SessionStatus } from '../../../models/session-status';
import { LeappBaseError } from '../../../errors/leapp-base-error';
import { LoggerLevel } from '../../logging-service';
import { SessionService } from '../session.service';
import Repository from '../../repository';
export default class AwsSessionService extends SessionService {
    /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
    constructor(iSessionNotifier) {
        super(iSessionNotifier);
    }
    start(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isThereAnotherPendingSessionWithSameNamedProfile(sessionId)) {
                    throw new LeappBaseError('Pending session with same named profile', this, LoggerLevel.info, 'Pending session with same named profile');
                }
                this.stopAllWithSameNameProfile(sessionId);
                this.sessionLoading(sessionId);
                const credentialsInfo = yield this.generateCredentials(sessionId);
                yield this.applyCredentials(sessionId, credentialsInfo);
                this.sessionActivate(sessionId);
            }
            catch (error) {
                this.sessionError(sessionId, error);
            }
        });
    }
    rotate(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.sessionLoading(sessionId);
                const credentialsInfo = yield this.generateCredentials(sessionId);
                yield this.applyCredentials(sessionId, credentialsInfo);
                this.sessionRotated(sessionId);
            }
            catch (error) {
                this.sessionError(sessionId, error);
            }
        });
    }
    stop(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.deApplyCredentials(sessionId);
                this.sessionDeactivated(sessionId);
            }
            catch (error) {
                this.sessionError(sessionId, error);
            }
        });
    }
    delete(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (Repository.getInstance().getSessionById(sessionId).status === SessionStatus.active) {
                    yield this.stop(sessionId);
                }
                Repository.getInstance().listIamRoleChained(this.iSessionNotifier.getSessionById(sessionId)).forEach(sess => {
                    if (sess.status === SessionStatus.active) {
                        this.stop(sess.sessionId);
                    }
                    Repository.getInstance().deleteSession(sess.sessionId);
                });
                Repository.getInstance().deleteSession(sessionId);
                this.iSessionNotifier.setSessions(Repository.getInstance().getSessions());
                yield this.removeSecrets(sessionId);
            }
            catch (error) {
                this.sessionError(sessionId, error);
            }
        });
    }
    isThereAnotherPendingSessionWithSameNamedProfile(sessionId) {
        const session = Repository.getInstance().getSessionById(sessionId);
        const profileId = session.profileId;
        const pendingSessions = Repository.getInstance().listPending();
        for (let i = 0; i < pendingSessions.length; i++) {
            if (pendingSessions[i].profileId === profileId && pendingSessions[i].sessionId !== sessionId) {
                return true;
            }
        }
        return false;
    }
    stopAllWithSameNameProfile(sessionId) {
        // Get profile to check
        const session = Repository.getInstance().getSessionById(sessionId);
        const profileId = session.profileId;
        // Get all active sessions
        const activeSessions = Repository.getInstance().listActive();
        // Stop all that shares the same profile
        activeSessions.forEach(sess => {
            if (sess.profileId === profileId) {
                this.stop(sess.sessionId).then(_ => { });
            }
        });
    }
}
//# sourceMappingURL=aws-session-service.js.map