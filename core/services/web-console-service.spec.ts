import { jest, describe, expect, test } from "@jest/globals";
import { LoggerLevel } from "./logging-service";
import { WebConsoleService } from "./web-console-service";
import { CredentialsInfo } from "../models/credentials-info";

describe("WebConsoleService", () => {
  test("openWebConsole - throws error if session's region starts with us-gov- or cn-", async () => {
    const shellService: any = {
      openExternalUrl: jest.fn((_loginUrl: string): void => {}),
    };

    const loggingService: any = {
      logger: jest.fn((_message: any, _type: LoggerLevel, _instance?: any, _stackTrace?: string): void => {}),
    };

    const fetch: any = jest.fn(() => {
      {
        jest.fn(() => {
          "mocked-signin-token";
        });
      }
    });

    const credentialsInfo: CredentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "mocked-aws_access_key_id",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "mocked-aws_secret_access_key",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "mocked-aws_session_token",
      },
    };

    const mockedSessionRegion = "us-gov-";
    const mockedSessionDuration = 3200;

    const webConsoleService: WebConsoleService = new WebConsoleService(shellService, loggingService, fetch);
    try {
      await webConsoleService.openWebConsole(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    } catch (e) {
      expect(e).toEqual(new Error("Unsupported Region"));
    }
  });
});
