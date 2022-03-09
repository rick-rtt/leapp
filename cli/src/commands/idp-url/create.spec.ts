import { jest, describe, test, expect } from "@jest/globals";
import CreateIdpUrl from "./create";

describe("CreateIdpUrl", () => {
  const getTestCommand = (leappCliService: any = null, argv: string[] = []): CreateIdpUrl => {
    const command = new CreateIdpUrl(argv, {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

  test("promptAndCreateIdpUrl", async () => {
    const command = getTestCommand();
    command.getIdpUrl = jest.fn(async () => "idpUrl");
    command.createIdpUrl = jest.fn((): any => "newIdpUrl");

    const newIdpUrl = await command.promptAndCreateIdpUrl();

    expect(command.createIdpUrl).toHaveBeenCalledWith("idpUrl");
    expect(newIdpUrl).toBe("newIdpUrl");
  });

  test("getIdpUrl", async () => {
    const leappCliService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toMatchObject([
            {
              name: "idpUrl",
              message: `enter the identity provider URL`,
              type: "input",
            },
          ]);
          expect(params[0].validate("url")).toBe("validationResult");
          return { idpUrl: "idpUrl" };
        },
      },
      idpUrlsService: {
        validateIdpUrl: jest.fn(() => "validationResult"),
      },
    };

    const command = getTestCommand(leappCliService);
    const idpUrl = await command.getIdpUrl();
    expect(idpUrl).toBe("idpUrl");
    expect(leappCliService.idpUrlsService.validateIdpUrl).toHaveBeenCalledWith("url");
  });

  test("createIdpUrl", async () => {
    const leappCliService: any = {
      idpUrlsService: {
        createIdpUrl: jest.fn(() => "newIdpUrl"),
      },
    };

    const command = getTestCommand(leappCliService);
    command.log = jest.fn();
    const newIdpUrl = command.createIdpUrl("idpUrl");

    expect(leappCliService.idpUrlsService.createIdpUrl).toHaveBeenCalledWith("idpUrl");
    expect(command.log).toHaveBeenCalledWith("identity provider URL created");
    expect(newIdpUrl).toBe("newIdpUrl");
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand();
    command.promptAndCreateIdpUrl = jest.fn((): any => {
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

    expect(command.promptAndCreateIdpUrl).toHaveBeenCalled();
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - promptAndCreateIdpUrl throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - promptAndCreateIdpUrl throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
