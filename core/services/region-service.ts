import {SessionFactory} from './session-factory'
import {Repository} from './repository'
import {WorkspaceService} from './workspace-service'
import {Session} from '../models/session'
import {SessionStatus} from '../models/session-status'

export class RegionService {

    constructor(private sessionFactory: SessionFactory, private repository: Repository,
                private workspaceService: WorkspaceService) {
    }

    public async changeRegion(session: Session, newRegion: string): Promise<void> {
        const sessionService = this.sessionFactory.getSessionService(session.type)
        const wasActive = session.status === SessionStatus.active
        if (wasActive) {
            await sessionService.stop(session.sessionId)
        }

        session.region = newRegion
        const updatedSessions = this.repository.getSessions()
            .map(repoSession => repoSession.sessionId === session.sessionId ? session : repoSession)
        this.repository.updateSessions(updatedSessions)
        this.workspaceService.updateSession(session.sessionId, session)

        if (wasActive) {
            await sessionService.start(session.sessionId)
        }
    }
}
