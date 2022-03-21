import { describe, expect, jest, test } from "@jest/globals";
import StartSsmSession from "./start-ssm-session";
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";

describe("StartSsmSession", () => {
  const getTestCommand = (leappCliService: any = null): StartSsmSession => {
    const command = new StartSsmSession([], {} as any);
    (command as any).leappCliService = leappCliService;
    return command;
  };

  test("startSsmSession", async () => {
    const sessionService: any = {
      start: jest.fn(async () => {}),
      sessionDeactivated: jest.fn(async () => {}),
      generateCredentials: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };

    const ssmService: any = {
      startSession: jest.fn((_0: CredentialsInfo, _1: string, _2: string) => {}),
      getSsmInstances: jest.fn(() => []),
    };

    const inquirer: any = {
      prompt: jest.fn(() => ({ selectedInstance: {} })),
    };

    const leappCliService: any = {
      sessionFactory,
      ssmService,
      inquirer,
    };

    const session: any = { sessionId: "sessionId", type: "sessionType" };
    const command = getTestCommand(leappCliService);
    command.log = jest.fn();

    await command.startSsmSession(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.generateCredentials).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith("started AWS SSM session");
    expect(ssmService.startSession).toHaveBeenCalled();
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        name: "selectedInstance",
        message: "select an instance",
        type: "list",
        choices: [],
      },
    ]);
  });
});
