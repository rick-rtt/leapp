import { Injectable } from "@angular/core";
import { ElectronService } from "./electron.service";
import { LeappCoreService } from "./leapp-core.service";
import { AwsAuthenticationService } from "./session/aws/aws-authentication.service";
import { VerificationWindowService } from "./verification-window.service";
import { integrationsFilter } from "../components/integration-bar/integration-bar.component";

@Injectable({
  providedIn: "root",
})
export class CliCommunicationService {
  constructor(
    private electronService: ElectronService,
    private leappCoreService: LeappCoreService,
    private verificationWindowService: VerificationWindowService,
    private awsAuthenticationService: AwsAuthenticationService
  ) {}

  startServer() {
    const ipc = this.electronService.nodeIpc;
    ipc.config.id = "leapp_da";
    ipc.serve(() => {
      ipc.server.on("message", (data, socket) => {
        if (data.method === "isDesktopAppRunning") {
          ipc.server.emit(socket, "message", { result: true });
        } else if (data.method === "needAuthentication") {
          this.awsAuthenticationService.needAuthentication(data.idpUrl).then((result: boolean) => {
            ipc.server.emit(socket, "message", { result });
          });
        } else if (data.method === "awsSignIn") {
          this.awsAuthenticationService
            .awsSignIn(data.idpUrl, data.needToAuthenticate)
            .then((result: any) => ipc.server.emit(socket, "message", { result }))
            .catch((error) => ipc.server.emit(socket, "message", { error }));
        } else if (data.method === "openVerificationWindow") {
          this.verificationWindowService
            .openVerificationWindow(data.registerClientResponse, data.startDeviceAuthorizationResponse, data.windowModality, () =>
              ipc.server.emit(socket, "message", { callbackId: "onWindowClose" })
            )
            .then((result: any) => ipc.server.emit(socket, "message", { result }))
            .catch((error) => ipc.server.emit(socket, "message", { error }));
        } else if (data.method === "refreshSessions") {
          try {
            this.leappCoreService.repository.reloadWorkspace();
            const sessions = this.leappCoreService.repository.getSessions();
            this.leappCoreService.workspaceService.setSessions(sessions);
            ipc.server.emit(socket, "message", {});
          } catch (error) {
            ipc.server.emit(socket, "message", { error });
          }
        } else if (data.method === "refreshIntegrations") {
          try {
            this.leappCoreService.repository.reloadWorkspace();
            integrationsFilter.next(this.leappCoreService.repository.listAwsSsoIntegrations());
            ipc.server.emit(socket, "message", {});
          } catch (error) {
            ipc.server.emit(socket, "message", { error });
          }
        }
      });
    });

    ipc.server.start();
  }
}
