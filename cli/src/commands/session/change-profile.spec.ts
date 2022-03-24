import { jest, describe, test, expect } from "@jest/globals";
import { AwsIamUserService } from "@noovolari/leapp-core/services/session/aws/aws-iam-user-service";
import ChangeSessionProfile from "./change-profile";

describe("ChangeProfile", () => {
  const getTestCommand = (leappCliService: any = null): ChangeSessionProfile => {
    const command = new ChangeSessionProfile([], {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

  test("selectSession", async () => {
    const session1 = { sessionName: "sessionName" };
    const leappCliService: any = {
      repository: {
        getSessions: () => [session1],
      },
      sessionFactory: {
        getSessionService: () => new AwsIamUserService(null, null, null, null, null, null),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedSession",
              message: "select a session",
              type: "list",
              choices: [{ name: session1.sessionName, value: session1 }],
            },
          ]);
          return { selectedSession: "selectedSession" };
        },
      },
    };

    const command = getTestCommand(leappCliService);
    const selectedSession = await command.selectSession();
    expect(selectedSession).toBe("selectedSession");
  });

  test("selectProfile", async () => {
    const profileFieldChoice = { name: "profileName1", id: "profileId1" };
    const leappCliService: any = {
      repository: {
        getProfiles: jest.fn(() => [profileFieldChoice]),
        getProfileName: jest.fn(() => "profileName1"),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedProfile",
              message: "current profile is profileName1, select a new profile",
              type: "list",
              choices: [{ name: profileFieldChoice.name, value: profileFieldChoice.id }],
            },
          ]);
          return { selectedProfile: "selectedProfile" };
        },
      },
    };

    const command = getTestCommand(leappCliService);

    const session = { type: "type", profileId: "profileId2" } as any;
    const selectedProfile = await command.selectProfile(session);

    expect(selectedProfile).toBe("selectedProfile");
    expect(leappCliService.repository.getProfiles).toHaveBeenCalled();
    expect(leappCliService.repository.getProfileName).toHaveBeenCalledWith(session.profileId);
  });

  test("selectProfile - error: no profile available", async () => {
    const leappCliService: any = {
      repository: {
        getProfiles: jest.fn(() => []),
        getProfileName: jest.fn(() => "profileName1"),
      },
    };

    const command = getTestCommand(leappCliService);

    const session = { type: "type", profileId: "profileId2" } as any;

    await expect(command.selectProfile(session)).rejects.toThrow(new Error("no profiles available"));
    expect(leappCliService.repository.getProfiles).toHaveBeenCalled();
    expect(leappCliService.repository.getProfileName).toHaveBeenCalledWith(session.profileId);
  });

  test("changeSessionProfile", async () => {
    const session = {} as any;
    const newProfile = {} as any;

    const leappCliService: any = {
      namedProfilesService: {
        changeNamedProfile: jest.fn(),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    const command = getTestCommand(leappCliService);
    command.log = jest.fn();

    await command.changeSessionProfile(session, newProfile);
    expect(leappCliService.namedProfilesService.changeNamedProfile).toHaveBeenCalledWith(session, newProfile);
    expect(command.log).toHaveBeenCalledWith("session profile changed");
    expect(leappCliService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const session = "session";
    const region = "region";
    const command = getTestCommand();
    command.selectSession = jest.fn(async (): Promise<any> => session);
    command.selectProfile = jest.fn(async (): Promise<any> => region);
    command.changeSessionProfile = jest.fn(async (): Promise<void> => {
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

    expect(command.selectSession).toHaveBeenCalled();
    expect(command.selectProfile).toHaveBeenCalledWith(session);
    expect(command.changeSessionProfile).toHaveBeenCalledWith(session, region);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - changeSessionRegion throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - changeSessionRegion throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
