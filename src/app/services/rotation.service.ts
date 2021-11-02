import { Injectable } from '@angular/core';
import {SessionFactoryService} from './session-factory.service';
import {WorkspaceService} from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export class RotationService {

  constructor(
    private workspaceService: WorkspaceService,
    private sessionProviderService: SessionFactoryService) { }

  rotate(): void {
    const activeSessions = this.workspaceService.listActive();
    activeSessions.forEach(session => {
      if (session.expired()) {
        const concreteSessionService = this.sessionProviderService.getService(session.type);
        concreteSessionService.rotate(session.sessionId).then(_ => {});
      }
    });
  }
}
