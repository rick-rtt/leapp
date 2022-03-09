import { jest, describe, test, expect } from "@jest/globals";
import { CliShellExecutionService } from "./cli-shell-execution-service";

describe("CliShellExecutionService", () => {
  test("isDesktopAppRunning - on Windows, leap inactive", async () => {
    const cliShellExecutionService = new CliShellExecutionService();
    cliShellExecutionService.getPlatform = jest.fn(() => "win32");
    (cliShellExecutionService.execCommand as any) = jest.fn((cmd, callback: any) => {
      expect(cmd).toBe("tasklist");
      callback(undefined, "commandOutput");
    });

    const isRunning = await cliShellExecutionService.isDesktopAppRunning();
    //console.log(await CliShellExecutionService.isDesktopAppRunning())
    expect(cliShellExecutionService.execCommand).toHaveBeenCalled();
    expect(isRunning).toBe(false);
  });

  test("isDesktopAppRunning - on Windows, leap active", async () => {
    const cliShellExecutionService = new CliShellExecutionService();
    cliShellExecutionService.getPlatform = jest.fn(() => "win32");
    (cliShellExecutionService.execCommand as any) = jest.fn((cmd, callback: any) => {
      expect(cmd).toBe("tasklist");
      callback(undefined, "  leapp.exe---");
    });

    const isRunning = await cliShellExecutionService.isDesktopAppRunning();
    //console.log(await CliShellExecutionService.isDesktopAppRunning())
    expect(cliShellExecutionService.execCommand).toHaveBeenCalled();
    expect(isRunning).toBe(true);
  });

  test("isDesktopAppRunning - on Windows, error", async () => {
    const cliShellExecutionService = new CliShellExecutionService();
    cliShellExecutionService.getPlatform = jest.fn(() => "win32");
    (cliShellExecutionService.execCommand as any) = jest.fn((cmd, callback: any) => {
      callback(new Error("error"));
    });

    await expect(cliShellExecutionService.isDesktopAppRunning()).rejects.toThrow(new Error("error"));
    expect(cliShellExecutionService.execCommand).toHaveBeenCalled();
  });

  test("isDesktopAppRunning - on other platforms, leap active", async () => {
    const cliShellExecutionService = new CliShellExecutionService();
    cliShellExecutionService.getPlatform = jest.fn(() => "platform");
    (cliShellExecutionService.execCommand as any) = jest.fn((cmd, callback: any) => {
      expect(cmd).toBe("ps -Ac");
      callback(undefined, "  leapp---");
    });

    const isRunning = await cliShellExecutionService.isDesktopAppRunning();
    expect(cliShellExecutionService.execCommand).toHaveBeenCalled();
    expect(isRunning).toBe(true);
  });
});
