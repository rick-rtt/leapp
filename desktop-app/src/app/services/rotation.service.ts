import { Injectable } from '@angular/core';
import {SessionServiceFactory} from './session-service-factory';
import {WorkspaceService} from './workspace.service';
import { LeappCoreService } from './leapp-core.service'


//TODO: Move this under core module
@Injectable({
  providedIn: 'root'
})
export class RotationService {
  private sessionServiceFactory: SessionServiceFactory

  constructor(private workspaceService: WorkspaceService, leappCoreService: LeappCoreService) {
    this.sessionServiceFactory = leappCoreService.sessionServiceFactory
  }

  rotate(): void {
    const activeSessions = this.workspaceService.listActive();
    activeSessions.forEach(session => {
      if (session.expired()) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(session.type);
        concreteSessionService.rotate(session.sessionId).then(_ => {});
      }
    });
  }
}
