import { SessionFactory } from './session-factory'

export class RotationService {
  constructor(private sessionServiceFactory: SessionFactory) {
  }

  rotate(): void {
    /*const activeSessions = this.workspaceService.listActive()
    activeSessions.forEach(session => {
      if (session.expired()) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(session.type)
        concreteSessionService.rotate(session.sessionId).then(_ => {
        })
      }
    })*/
  }
}
