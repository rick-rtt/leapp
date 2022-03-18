import { IShellService } from "@noovolari/leapp-core/interfaces/i-shell-service";
import open from "open";

export class CliOpenWebConsoleService implements IShellService {
  async openExternalUrl(url: string): Promise<void> {
    await open(url);
  }
}
