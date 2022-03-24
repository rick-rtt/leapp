import { Injectable, NgZone } from "@angular/core";
import { ElectronService } from "./electron.service";
import { LeappCoreService } from "./leapp-core.service";
import { AwsAuthenticationService } from "./session/aws/aws-authentication.service";
import { VerificationWindowService } from "./verification-window.service";
import { integrationsFilter } from "../components/integration-bar/integration-bar.component";

@Injectable({
  providedIn: "root",
})
export class CliCommunicationService {
  rpcMethods = {
    isDesktopAppRunning: (emitFunction, socket) => emitFunction(socket, "message", { result: true }),
    needAuthentication: (emitFunction, socket, data) =>
      this.awsAuthenticationService.needAuthentication(data.idpUrl).then((result: boolean) => {
        emitFunction(socket, "message", { result });
      }),
    awsSignIn: (emitFunction, socket, data) =>
      this.awsAuthenticationService
        .awsSignIn(data.idpUrl, data.needToAuthenticate)
        .then((result: any) => emitFunction(socket, "message", { result }))
        .catch((error) => emitFunction(socket, "message", { error })),
    openVerificationWindow: (emitFunction, socket, data) =>
      this.verificationWindowService
        .openVerificationWindow(data.registerClientResponse, data.startDeviceAuthorizationResponse, data.windowModality, () =>
          emitFunction(socket, "message", { callbackId: "onWindowClose" })
        )
        .then((result: any) => emitFunction(socket, "message", { result }))
        .catch((error) => emitFunction(socket, "message", { error })),
    refreshIntegrations: (emitFunction, socket) => {
      try {
        this.leappCoreService.repository.reloadWorkspace();
        this.ngZone.run(() => {
          integrationsFilter.next(this.leappCoreService.repository.listAwsSsoIntegrations());
        });
        emitFunction(socket, "message", {});
      } catch (error) {
        emitFunction(socket, "message", { error });
      }
    },
    refreshSessions: (emitFunction, socket) => {
      try {
        this.leappCoreService.repository.reloadWorkspace();
        const sessions = this.leappCoreService.repository.getSessions();
        this.ngZone.run(() => {
          this.leappCoreService.workspaceService.setSessions(sessions);
        });
        emitFunction(socket, "message", {});
      } catch (error) {
        emitFunction(socket, "message", { error });
      }
    },
  };

  constructor(
    private electronService: ElectronService,
    private leappCoreService: LeappCoreService,
    private verificationWindowService: VerificationWindowService,
    private awsAuthenticationService: AwsAuthenticationService,
    private ngZone: NgZone
  ) {}

  startServer(): void {
    const ipc = this.electronService.nodeIpc;
    ipc.config.id = "leapp_da";
    ipc.serve(() => {
      ipc.server.on("message", (data, socket) => {
        const emitFunction = (...params) => ipc.server.emit(...params);

        if (this.rpcMethods[data.method]) {
          this.rpcMethods[data.method](emitFunction, socket, data);
        } else {
          socket.destroy();
        }
      });
    });

    ipc.server.start();
  }
}
