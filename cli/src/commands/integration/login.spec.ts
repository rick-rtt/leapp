import { jest, describe, test, expect } from "@jest/globals";
import LoginIntegration from "./login";

describe("LoginIntegration", () => {
  const getTestCommand = (leappCliService: any = null, argv: string[] = []): LoginIntegration => {
    const command = new LoginIntegration(argv, {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

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

    const command = getTestCommand(leappCliService);
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

    const command = getTestCommand(leappCliService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no offline integrations available"));
  });

  test("login", async () => {
    const sessionsDiff = { sessionsToAdd: ["session1", "session2"] };
    const leappCliService: any = {
      awsSsoIntegrationService: {
        loginAndGetSessionsDiff: jest.fn(async () => sessionsDiff),
      },
      cliVerificationWindowService: {
        closeBrowser: jest.fn(),
      },
    };

    const command = getTestCommand(leappCliService);
    command.log = jest.fn();

    const integration = { id: "id1" } as any;
    await command.login(integration);

    expect(command.log).toHaveBeenNthCalledWith(1, "waiting for browser authorization using your AWS sign-in...");
    expect(leappCliService.awsSsoIntegrationService.loginAndGetSessionsDiff).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenLastCalledWith("login successful (2 sessions ready to be synchronized)");
    expect(leappCliService.cliVerificationWindowService.closeBrowser).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const selectedIntegration = { id: "1" };

    const command = getTestCommand();
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
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - login throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - login throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
