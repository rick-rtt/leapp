import { SessionStatus } from '../../models/session-status';
import Repository from '../repository';
export class SessionService {
    constructor(iSessionNotifier) {
        this.iSessionNotifier = iSessionNotifier;
    }
    sessionActivate(sessionId) {
        const sessions = Repository.getInstance().getSessions();
        const index = sessions.findIndex(s => s.sessionId === sessionId);
        if (index > -1) {
            const currentSession = sessions[index];
            currentSession.status = SessionStatus.active;
            currentSession.startDateTime = new Date().toISOString();
            sessions[index] = currentSession;
            Repository.getInstance().updateSessions(sessions);
            if (this.iSessionNotifier) {
                this.iSessionNotifier.setSessions([...sessions]);
            }
        }
    }
    sessionLoading(sessionId) {
        const sessions = Repository.getInstance().getSessions();
        const index = sessions.findIndex(s => s.sessionId === sessionId);
        if (index > -1) {
            const currentSession = sessions[index];
            currentSession.status = SessionStatus.pending;
            sessions[index] = currentSession;
            Repository.getInstance().updateSessions(sessions);
            if (this.iSessionNotifier) {
                this.iSessionNotifier.setSessions([...sessions]);
            }
        }
    }
    sessionRotated(sessionId) {
        const sessions = Repository.getInstance().getSessions();
        const index = sessions.findIndex(s => s.sessionId === sessionId);
        if (index > -1) {
            const currentSession = sessions[index];
            currentSession.startDateTime = new Date().toISOString();
            currentSession.status = SessionStatus.active;
            sessions[index] = currentSession;
            Repository.getInstance().updateSessions(sessions);
            if (this.iSessionNotifier) {
                this.iSessionNotifier.setSessions([...sessions]);
            }
        }
    }
    sessionDeactivated(sessionId) {
        const sessions = Repository.getInstance().getSessions();
        const index = sessions.findIndex(s => s.sessionId === sessionId);
        if (index > -1) {
            const currentSession = sessions[index];
            currentSession.status = SessionStatus.inactive;
            currentSession.startDateTime = undefined;
            sessions[index] = currentSession;
            Repository.getInstance().updateSessions(sessions);
            if (this.iSessionNotifier) {
                this.iSessionNotifier.setSessions([...sessions]);
            }
        }
    }
    sessionError(sessionId, error) {
        this.sessionDeactivated(sessionId);
        throw error;
    }
}
//# sourceMappingURL=session.service.js.map