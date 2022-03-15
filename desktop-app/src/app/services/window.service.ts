import { Injectable } from "@angular/core";
import { ElectronService } from "./electron.service";
import { environment } from "../../environments/environment";
import { ConfirmationDialogComponent } from "../components/dialogs/confirmation-dialog/confirmation-dialog.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { LoggerLevel } from "@noovolari/leapp-core/services/logging-service";
import { IShellService } from "@noovolari/leapp-core/interfaces/i-shell-service";

@Injectable({
  providedIn: "root",
})
export class WindowService implements IShellService {
  private currentWindow: any;

  constructor(private modalService: BsModalService, private electronService: ElectronService) {}

  /**
   * Create a new browser window
   *
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @param show - boolean to make the window visible or not
   * @param title - the window title
   * @param x - position x
   * @param y - position y
   * @returns return a new browser window
   */
  newWindow(url: string, show: boolean, title?: string, x?: number, y?: number): any {
    const opts = {
      width: 514,
      height: 550,
      resizable: true,
      show,
      title,
      titleBarStyle: "hidden",
      webPreferences: {
        devTools: !environment.production,
        worldSafeExecuteJavaScript: true,
        partition: `persist:Leapp-${btoa(url)}`,
      },
    };

    if (x && y) {
      Object.assign(opts, {
        x: x + 50,
        y: y + 50,
      });
    }

    if (this.currentWindow) {
      try {
        this.currentWindow.close();
      } catch (e) {}
      this.currentWindow = null;
    }
    this.currentWindow = new this.electronService.browserWindow(opts);
    return this.currentWindow;
  }

  getCurrentWindow(): any {
    return this.electronService.currentWindow;
  }

  /**
   * Confirmation dialog popup!
   *
   * @param message - the message to show
   * @param callback - the callback for the ok button to launch
   * @param confirmText
   * @param cancelText
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  confirmDialog(message: string, callback: any, confirmText?: string, cancelText?: string) {
    for (let i = 1; i <= this.modalService.getModalsCount(); i++) {
      this.modalService.hide(i);
    }

    this.getCurrentWindow().show();
    return this.modalService.show(ConfirmationDialogComponent, {
      animated: false,
      class: "confirm-modal",
      initialState: { message, callback, confirmText, cancelText },
    });
  }

  /**
   * With this one you can open an url in an external browser
   *
   * @param url - url to open
   */
  openExternalUrl(url: string): void {
    this.electronService.shell.openExternal(url);
  }

  blockDevToolInProductionMode(): void {
    this.getCurrentWindow().webContents.on("devtools-opened", () => {
      if (environment.production) {
        this.electronService.log("Closing Web tools in production mode", LoggerLevel.info, this);
        this.getCurrentWindow().webContents.closeDevTools();
      }
    });
  }
}
