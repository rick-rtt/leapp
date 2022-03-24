import { expect, describe, test } from "@jest/globals";
import { RemoteProceduresServer } from "./remote-procedures-server";
import * as ipc from "node-ipc";

describe("RemoteProceduresServer", () => {
  const callWithRpc = (serverId: string, callMessage: any) => {
    ipc.config.id = "leapp_test";
    ipc.config.maxRetries = 2;
    ipc.config.silent = true;
    ipc.config.encoding = "utf8";
    return new Promise((resolve, _reject) => {
      ipc.connectTo(serverId, () => {
        const desktopAppServer = ipc.of[serverId];
        desktopAppServer.on("connect", () => {
          desktopAppServer.emit("message", callMessage);
        });
        desktopAppServer.on("disconnect", () => {
          resolve("disconnected");
        });
        desktopAppServer.on("message", (data: any) => {
          resolve({ message: data });
          ipc.disconnect(serverId);
        });
      });
    });
  };

  test("isDesktopAppRunning", async () => {
    const nativeService = {
      nodeIpc: ipc,
    };
    const testId = `rpc_test${Math.random() * 10000}`;
    const server = new RemoteProceduresServer(nativeService as any, null, null, null, null, (f) => f(), testId);

    expect(await callWithRpc(testId, { method: "isDesktopAppRunning" })).toBe("disconnected");

    server.startServer();

    await new Promise((resolve, reject) => {
      let retries = 0;
      const handle = setInterval(async () => {
        const actualResult = (await callWithRpc(testId, { method: "isDesktopAppRunning" })) as any;
        if (actualResult.message.result === true) {
          clearInterval(handle);
          resolve(undefined);
        } else if (retries++ > 10) {
          clearInterval(handle);
          reject("result not received");
        }
      }, 100);
    });

    server.stopServer();
  });
});
