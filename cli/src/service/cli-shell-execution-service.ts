import { ChildProcess, exec, ExecException } from "child_process";

export class CliShellExecutionService {
  getPlatform(): string {
    return process.platform;
  }

  execCommand(command: string, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess {
    return exec(command, callback);
  }

  async isDesktopAppRunning(): Promise<boolean> {
    let query: string;
    let result = false;
    const platform = this.getPlatform();
    let cmd = "";
    switch (platform) {
      case "win32":
        cmd = "tasklist";
        query = "leapp.exe";
        break;
      default:
        cmd = "ps -Ac";
        query = "leapp";
        break;
    }

    return new Promise((resolve, reject) => {
      this.execCommand(cmd, (err, stdout, _stderr) => {
        if (err) {
          reject(err);
          return;
        }
        result = stdout.toLowerCase().indexOf(query.toLowerCase()) > -1;
        resolve(result);
      });
    });
  }
}
