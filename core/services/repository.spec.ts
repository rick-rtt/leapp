import { describe, test } from "@jest/globals";
import { Repository } from "./repository";
import { FileService } from "./file-service";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";

describe("WebConsoleService", () => {
  let mockedWorkspace;
  let mockedNativeService;
  let mockedFileService;
  let repository;

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
});
