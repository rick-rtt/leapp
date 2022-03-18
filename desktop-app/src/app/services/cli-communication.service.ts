import { Injectable } from "@angular/core";
import { ElectronService } from "./electron.service";
import { LeappCoreService } from "./leapp-core.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AwsAuthenticationService } from "./session/aws/aws-authentication.service";

@Injectable({
  providedIn: "root",
})
export class CliCommunicationService {
  constructor(
    private electronService: ElectronService,
    private leappCoreService: LeappCoreService,
    private awsAuthenticationService: AwsAuthenticationService
  ) {}

  async startAwsFederatedSessionRemotely(): Promise<void> {
    const ipc = this.electronService.ipcRenderer;
    ipc.on(constants.cliStartAwsFederatedSessionChannel, (_, data) => {
      const sessionId = data.sessionId;
      const sessionFactory = this.leappCoreService.sessionFactory;
      const session = this.leappCoreService.repository.getSessions().find((s) => s.sessionId === sessionId);
      if (session) {
        const sessionService = sessionFactory.getSessionService(session.type);
        sessionService.start(sessionId);
      }
    });
  }

  async logoutAwsFederatedSessionRemotely(): Promise<void> {
    const ipc = this.electronService.ipcRenderer;
    ipc.on(constants.cliLogoutAwsFederatedSessionChannel, (_, data) => {
      const sessionId = data.sessionId;
      const session = this.leappCoreService.repository.getSessions().find((s) => s.sessionId === sessionId);
      if (session) {
        this.awsAuthenticationService.logoutFromFederatedSession(session);
      }
    });
  }

  async refreshSessionsRemotely(): Promise<void> {
    const ipc = this.electronService.ipcRenderer;
    ipc.on(constants.cliRefreshSessionsChannel, (_, __) => {
      const sessions = this.leappCoreService.workspaceService.getSessions();
      this.leappCoreService.workspaceService.setSessions(sessions);
    });
  }
}
