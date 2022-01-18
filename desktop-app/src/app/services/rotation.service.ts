import { Injectable } from '@angular/core';
import {SessionServiceFactory} from './session-service-factory';
import {WorkspaceService} from '@noovolari/leapp-core/services/workspace.service';
import { LeappCoreService } from './leapp-core.service'


//TODO: Move this under core module
@Injectable({
  providedIn: 'root'
})
export class RotationService {
  private sessionServiceFactory: SessionServiceFactory
  private workspaceService: WorkspaceService

  constructor(leappCoreService: LeappCoreService) {
    this.workspaceService = leappCoreService.workspaceService
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
