import { SessionFactory } from './session-factory'
import { WorkspaceService } from './workspace.service'

export class RotationService {
  constructor(private sessionServiceFactory: SessionFactory, private workspaceService: WorkspaceService) {
  }

  rotate(): void {
    const activeSessions = this.workspaceService.listActive()
    activeSessions.forEach(session => {
      if (session.expired()) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(session.type)
        concreteSessionService.rotate(session.sessionId).then(_ => {
        })
      }
    })
  }
}
