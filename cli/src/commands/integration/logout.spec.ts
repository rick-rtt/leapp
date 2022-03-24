import { jest, describe, test, expect } from "@jest/globals";
import LogoutIntegration from "./logout";

describe("LogoutIntegration", () => {
  const getTestCommand = (leappCliService: any = null, argv: string[] = []): LogoutIntegration => {
    const command = new LogoutIntegration(argv, {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

  test("selectIntegration", async () => {
    const integration = { alias: "integration1" };
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getOnlineIntegrations: jest.fn(() => [integration]),
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

    expect(leappCliService.awsSsoIntegrationService.getOnlineIntegrations).toHaveBeenCalled();
    expect(selectedIntegration).toBe(integration);
  });

  test("selectIntegration, no integrations", async () => {
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getOnlineIntegrations: jest.fn(() => []),
      },
    };

    const command = getTestCommand(leappCliService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no online integrations available"));
  });

  test("logout", async () => {
    const leappCliService: any = {
      awsSsoIntegrationService: {
        logout: jest.fn(),
      },
      remoteProceduresClient: { refreshIntegrations: jest.fn(), refreshSessions: jest.fn() },
    };

    const command = getTestCommand(leappCliService);
    command.log = jest.fn();

    const integration = { id: "id1" } as any;
    await command.logout(integration);

    expect(leappCliService.awsSsoIntegrationService.logout).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenLastCalledWith("logout successful");
    expect(leappCliService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(leappCliService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const selectedIntegration = { id: "1" };

    const command = getTestCommand();
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration);
    command.logout = jest.fn(async () => {
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
    expect(command.logout).toHaveBeenCalledWith(selectedIntegration);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - logout throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - logout throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
