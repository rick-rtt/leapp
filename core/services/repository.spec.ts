import { describe, test } from "@jest/globals";
import { Repository } from "./repository";
import { FileService } from "./file-service";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";
import { Session } from "../models/session";
import { SessionType } from "../models/session-type";
import { SessionStatus } from "../models/session-status";

describe("Repository", () => {
  let mockedWorkspace;
  let mockedNativeService;
  let mockedFileService;
  let repository;
  let mockedSession: Session;

  beforeEach(() => {
    mockedWorkspace = new Workspace();

    mockedNativeService = {
      copydir: jest.fn(),
      exec: jest.fn(),
      followRedirects: jest.fn(),
      fs: jest.fn(),
      httpProxyAgent: jest.fn(),
      httpsProxyAgent: jest.fn(),
      ini: jest.fn(),
      keytar: jest.fn(),
      log: jest.fn(),
      machineId: jest.fn(),
      os: { homedir: () => "" },
      path: jest.fn(),
      process: jest.fn(),
      rimraf: jest.fn(),
      semver: jest.fn(),
      sudo: jest.fn(),
      unzip: jest.fn(),
      url: jest.fn(),
    };

    mockedFileService = new FileService(mockedNativeService);
    mockedFileService.readFileSync = jest.fn();
    mockedFileService.writeFileSync = jest.fn(() => {});
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(mockedWorkspace));
    mockedFileService.existsSync = jest.fn(() => false);
    mockedFileService.newDir = jest.fn();

    repository = new Repository(mockedNativeService, mockedFileService);
    (repository as any)._workspace = mockedWorkspace;

    mockedSession = {
      region: "eu-west-1",
      sessionId: "123456789",
      sessionName: "mock-session",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
  });

  test("get workspace() - returns the private workspace", () => {
    const workspace = repository.workspace;
    expect(workspace).toBe(mockedWorkspace);
  });

  test("set workspace() - set the private workspace", () => {
    const workspace = new Workspace();

    repository.workspace = workspace;
    expect(workspace).toBe((repository as any)._workspace);
  });

  test("createWorkspace() - create a new workspace", () => {
    repository.persistWorkspace = jest.fn();
    repository.createWorkspace();
    expect(repository.workspace).not.toBe(null);
    expect(repository.persistWorkspace).toHaveBeenCalledWith((repository as any)._workspace);
  });

  test("getWorkspace() - to be the same as the getter property and the private variable", () => {
    repository.persistWorkspace = jest.fn();
    repository.createWorkspace();

    expect(repository.workspace).not.toBe(null);
    expect(repository.persistWorkspace).toHaveBeenCalledWith((repository as any)._workspace);
    expect(repository.getWorkspace()).toBe(repository.workspace);
    expect(repository.getWorkspace()).toBe((repository as any)._workspace);
  });

  test("persistWorkspace() - to save the new status of a workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    expect(repository.workspace).not.toBe(workspace);

    repository.persistWorkspace(workspace);

    expect(mockedFileService.writeFileSync).not.toBe(null);
    expect(mockedFileService.writeFileSync).toHaveBeenCalledWith("/" + constants.lockFileDestination, JSON.stringify(workspace));
  });

  test("getSessions() - get the sessions persisted in the workspace", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(mockedFileService.writeFileSync).not.toBe(null);
    expect(mockedFileService.writeFileSync).toHaveBeenCalledWith("/" + constants.lockFileDestination, JSON.stringify(workspace));
    expect(repository.getSessions()).toStrictEqual([mockedSession]);
  });

  test("getSessionById() - get a session give an ID", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getSessionById("123456789")).toStrictEqual(mockedSession);
  });

  test("addSession() - add a new session to the array of sessions", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
      region: "eu-west-2",
      sessionId: "987654321",
      sessionName: "mocked-2",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
    repository.addSession(mockedSession2);

    expect(repository.getSessions()).toStrictEqual([mockedSession, mockedSession2]);
  });

  test("updateSession() - updates a specific session", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
      region: "eu-west-2",
      sessionId: "123456789",
      sessionName: "mocked-2",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
    repository.updateSession("123456789", mockedSession2);

    expect(repository.getSessionById("123456789")).not.toBe(mockedSession);
    expect(repository.getSessionById("123456789")).toBe(mockedSession2);
    expect(repository.getSessions()).toStrictEqual([mockedSession2]);
  });

  test("updateSessions() - bulk updates all sessions at once", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
      region: "eu-west-2",
      sessionId: "123456789",
      sessionName: "mocked-2",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
    repository.updateSessions([mockedSession2]);
    expect(repository.getSessions()).not.toStrictEqual([mockedSession]);
    expect(repository.getSessions()).toStrictEqual([mockedSession2]);
  });

  test("deleteSession() - remove a session from the array of sessions", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    repository.deleteSession("123456789");
    expect(repository.getSessions()).not.toStrictEqual([mockedSession]);
    expect(repository.getSessions()).toStrictEqual([]);
  });

  test("listPending() - list sessions in pending state", () => {
    mockedSession.status = SessionStatus.pending;
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listPending()).toStrictEqual([mockedSession]);

    mockedSession.status = SessionStatus.active;
    workspace.sessions = [mockedSession];

    expect(repository.listPending()).toStrictEqual([]);
  });
});
