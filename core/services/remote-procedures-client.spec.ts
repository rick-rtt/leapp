import { describe, test, expect } from "@jest/globals";
import * as ipc from "node-ipc";
import { RemoteProceduresClient } from "./remote-procedures-client";

describe("RemoteProceduresClient", () => {
  test("isDesktopAppRunning", async () => {
    const nativeService = {
      nodeIpc: ipc,
    } as any;
    const testId = `rpc_test${Math.random() * 10000}`;
    const client = new RemoteProceduresClient(nativeService, testId);

    expect(await client.isDesktopAppRunning()).toBe(false);

    ipc.config.id = testId;
    ipc.serve(() => {
      ipc.server.on("message", (data, socket) => {
        if (data.method === "isDesktopAppRunning") {
          ipc.server.emit(socket, "message", { result: true });
        }
      });
    });
    ipc.server.start();

    await new Promise((resolve, reject) => {
      let retries = 0;
      const handle = setInterval(async () => {
        const actualResult = await client.isDesktopAppRunning();
        if (actualResult) {
          clearInterval(handle);
          resolve(undefined);
        } else if (retries++ > 10) {
          clearInterval(handle);
          reject("result is still false");
        }
      }, 100);
    });

    ipc.server.stop();
  });

  test("needAuthentication", async () => {});

  test("awsSignIn", async () => {});

  test("openVerificationWindow", async () => {});

  test("refreshSessions", async () => {});

  test("remoteProcedureCall", async () => {});
});
