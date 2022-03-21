import ipc from "node-ipc";

export class DesktopAppRemoteProcedures {
  async remoteProcedureCall(
    callMessage: any,
    onMessage: (data: any, resolve: (value: unknown) => void, reject: (reason?: any) => void) => void,
    onDisconnect: (resolve: (value: unknown) => void, reject: (reason?: any) => void) => void
  ): Promise<any> {
    ipc.config.id = "leapp_cli";
    ipc.config.maxRetries = 2;
    ipc.config.silent = true;
    ipc.config.encoding = "utf8";
    return new Promise((resolve, reject) => {
      ipc.connectTo("leapp_da", () => {
        const desktopAppServer = ipc.of.leapp_da;
        desktopAppServer.on("connect", () => {
          desktopAppServer.emit("message", callMessage);
        });
        desktopAppServer.on("disconnect", () => {
          onDisconnect(resolve, reject);
        });
        desktopAppServer.on("message", (data) => {
          onMessage(data, resolve, reject);
          ipc.disconnect("leapp_da");
        });
      });
    });
  }

  async isDesktopAppRunning(): Promise<boolean> {
    ipc.config.id = "leapp_cli";
    ipc.config.maxRetries = 2;
    ipc.config.silent = true;
    ipc.config.encoding = "utf8";
    return new Promise((resolve, _) => {
      ipc.connectTo("leapp_da", () => {
        const desktopAppServer = ipc.of.leapp_da;
        desktopAppServer.on("connect", () => {
          desktopAppServer.emit("message", { method: "isDesktopAppRunning" });
        });
        desktopAppServer.on("disconnect", () => {
          resolve(false);
        });
        desktopAppServer.on("message", (data) => {
          resolve(data === "true");
          ipc.disconnect("leapp_da");
        });
      });
    });
  }

  async needAuthentication(idpUrl: string): Promise<boolean> {
    ipc.config.id = "leapp_cli";
    ipc.config.maxRetries = 2;
    ipc.config.silent = true;
    ipc.config.encoding = "utf8";
    return new Promise((resolve, _) => {
      ipc.connectTo("leapp_da", () => {
        const desktopAppServer = ipc.of.leapp_da;
        desktopAppServer.on("connect", () => {
          desktopAppServer.emit("message", { method: "needAuthentication", idpUrl });
        });
        desktopAppServer.on("disconnect", () => {
          resolve(false);
        });
        desktopAppServer.on("message", (data) => {
          resolve(data === "true");
          ipc.disconnect("leapp_da");
        });
      });
    });
  }
}
