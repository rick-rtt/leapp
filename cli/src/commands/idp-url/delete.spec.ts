import { jest, describe, test, expect } from "@jest/globals";
import DeleteIdpUrl from "./delete";

describe("DeleteIdpUrl", () => {
  const getTestCommand = (leappCliService: any = null, argv: string[] = []): DeleteIdpUrl => {
    const command = new DeleteIdpUrl(argv, {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

  test("selectIdpUrl", async () => {
    const ipdUrl = { url: "url1" };
    const leappCliService: any = {
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [ipdUrl]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedIdUrl",
              message: "select an identity provider URL to delete",
              type: "list",
              choices: [{ name: ipdUrl.url, value: ipdUrl }],
            },
          ]);
          return { selectedIdUrl: ipdUrl };
        },
      },
    };

    const command = getTestCommand(leappCliService);
    const selectedIdpUrl = await command.selectIdpUrl();

    expect(leappCliService.idpUrlsService.getIdpUrls).toHaveBeenCalled();
    expect(selectedIdpUrl).toBe(ipdUrl);
  });

  test("selectIdpUrl, no idp urls", async () => {
    const leappCliService: any = {
      idpUrlsService: {
        getIdpUrls: jest.fn(() => []),
      },
    };
    const command = getTestCommand(leappCliService);

    await expect(command.selectIdpUrl()).rejects.toThrow(new Error("no identity provider URLs available"));
  });

  test("getAffectedSessions", async () => {
    const leappCliService: any = {
      idpUrlsService: {
        getDependantSessions: jest.fn(() => "sessions"),
      },
    };
    const command = getTestCommand(leappCliService);

    const sessions = command.getAffectedSessions("idpUrlId");
    expect(sessions).toBe("sessions");
    expect(leappCliService.idpUrlsService.getDependantSessions).toHaveBeenCalledWith("idpUrlId");
  });

  test("askForConfirmation", async () => {
    const leappCliService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "confirmation",
              message:
                "deleting this identity provider URL will delete also these sessions\n" + "- sess1\n" + "- sess2\n" + "Do you want to continue?",
              type: "confirm",
            },
          ]);
          return { confirmation: true };
        },
      },
    };
    const command = getTestCommand(leappCliService);

    const affectedSessions = [{ sessionName: "sess1" }, { sessionName: "sess2" }] as any;
    const confirmation = await command.askForConfirmation(affectedSessions);

    expect(confirmation).toBe(true);
  });

  test("askForConfirmation, no affected sessions", async () => {
    const command = getTestCommand();

    const confirmation = await command.askForConfirmation([]);
    expect(confirmation).toBe(true);
  });

  test("deleteIdpUrl", async () => {
    const leappCliService: any = {
      idpUrlsService: {
        deleteIdpUrl: jest.fn(),
      },
    };

    const command = getTestCommand(leappCliService);
    command.log = jest.fn();
    await command.deleteIdpUrl("idpUrl");

    expect(leappCliService.idpUrlsService.deleteIdpUrl).toHaveBeenCalledWith("idpUrl");
    expect(command.log).toHaveBeenCalledWith("identity provider URL deleted");
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const idpUrl = { id: "1" };
    const affectedSessions = [{ sessionId: "2" }] as any;

    const command = getTestCommand();
    command.selectIdpUrl = jest.fn(async (): Promise<any> => idpUrl);
    command.getAffectedSessions = jest.fn(() => affectedSessions);
    command.askForConfirmation = jest.fn(async (): Promise<any> => true);
    command.deleteIdpUrl = jest.fn(async () => {
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

    expect(command.selectIdpUrl).toHaveBeenCalled();
    expect(command.getAffectedSessions).toHaveBeenCalledWith(idpUrl.id);
    expect(command.askForConfirmation).toHaveBeenCalledWith(affectedSessions);
    expect(command.deleteIdpUrl).toHaveBeenCalledWith(idpUrl.id);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - deleteIdpUrl throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - deleteIdpUrl throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
