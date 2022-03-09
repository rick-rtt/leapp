import { jest, describe, test, expect } from "@jest/globals";
import CreateNamedProfile from "./create";

describe("CreateNamedProfile", () => {
  const getTestCommand = (leappCliService: any = null, argv: string[] = []): CreateNamedProfile => {
    const command = new CreateNamedProfile(argv, {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

  test("getProfileName", async () => {
    const leappCliService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toMatchObject([
            {
              name: "namedProfileName",
              message: `choose a name for the profile`,
              type: "input",
            },
          ]);
          expect(params[0].validate("profileName")).toBe("validationResult");
          return { namedProfileName: "profileName" };
        },
      },
      namedProfilesService: {
        validateNewProfileName: jest.fn(() => "validationResult"),
      },
    };

    const command = getTestCommand(leappCliService);
    const profileName = await command.getProfileName();
    expect(profileName).toBe("profileName");
    expect(leappCliService.namedProfilesService.validateNewProfileName).toHaveBeenCalledWith("profileName");
  });

  test("createNamedProfile", async () => {
    const leappCliService: any = {
      namedProfilesService: {
        createNamedProfile: jest.fn(),
      },
    };

    const command = getTestCommand(leappCliService);
    command.log = jest.fn();
    command.createNamedProfile("profileName");

    expect(leappCliService.namedProfilesService.createNamedProfile).toHaveBeenCalledWith("profileName");
    expect(command.log).toHaveBeenCalledWith("profile created");
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const profileName = "profile1";
    const command = getTestCommand();
    command.getProfileName = jest.fn(async (): Promise<any> => profileName);
    command.createNamedProfile = jest.fn(() => {
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

    expect(command.getProfileName).toHaveBeenCalled();
    expect(command.createNamedProfile).toHaveBeenCalledWith(profileName);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - createNamedProfile throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createNamedProfile throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
