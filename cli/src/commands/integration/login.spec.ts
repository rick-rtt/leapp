import { jest, describe, test, expect } from "@jest/globals";
import LoginIntegration from "./login";

describe("LoginIntegration", () => {
  test("selectIntegration", async () => {
    const integration = { alias: "integration1" };
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getOfflineIntegrations: jest.fn(() => [integration]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedIntegration",
              message: "select an integration",
              type: "list",
              choices: [{ name: integration.alias, value: integration }],
            },
          ]);
          return { selectedIntegration: integration };
        },
      },
    };

    const command = new LoginIntegration([], {} as any, leappCliService);
    const selectedIntegration = await command.selectIntegration();

    expect(leappCliService.awsSsoIntegrationService.getOfflineIntegrations).toHaveBeenCalled();
    expect(selectedIntegration).toBe(integration);
  });

  test("selectIntegration, no integrations", async () => {
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getOfflineIntegrations: jest.fn(() => []),
      },
    };

    const command = new LoginIntegration([], {} as any, leappCliService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no offline integrations available"));
  });

  test("login", async () => {
    const sessionsSynced = ["session1", "session2"];
    const leappCliService: any = {
      awsSsoIntegrationService: {
        loginAndGetOnlineSessions: jest.fn(async () => sessionsSynced),
      },
      cliVerificationWindowService: {
        closeBrowser: jest.fn(),
      },
    };

    const command = new LoginIntegration([], {} as any, leappCliService);
    command.log = jest.fn();

    const integration = { id: "id1" } as any;
    await command.login(integration);

    expect(command.log).toHaveBeenNthCalledWith(1, "waiting for browser authorization using your AWS sign-in...");
    expect(leappCliService.awsSsoIntegrationService.loginAndGetOnlineSessions).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenLastCalledWith("login successful (2 sessions ready to be synchronized)");
    expect(leappCliService.cliVerificationWindowService.closeBrowser).toHaveBeenCalled();
  });

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - login throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - login throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });

  async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
    const selectedIntegration = { id: "1" };

    const command = new LoginIntegration([], {} as any, null);
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration);
    command.login = jest.fn(async () => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    let occurredError;
    try {
      await command.run();
    } catch (error) {
      occurredError = error;
    }

    expect(command.selectIntegration).toHaveBeenCalled();
    expect(command.login).toHaveBeenCalledWith(selectedIntegration);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  }
});
