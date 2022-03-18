import { Injectable } from "@angular/core";
import { IAwsAuthenticationService } from "@noovolari/leapp-core/interfaces/i-aws-authentication.service";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";
import { LeappCoreService } from "../../leapp-core.service";
import { WindowService } from "../../window.service";

@Injectable({ providedIn: "root" })
export class AwsAuthenticationService implements IAwsAuthenticationService {
  leappCoreService: LeappCoreService;

  constructor(private windowService: WindowService) {}

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Get active window position for extracting new windows coordinate
      const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
      const nearX = 200;
      const nearY = 50;
      // Generate a new singleton browser window for the check
      let idpWindow = this.windowService.newWindow(idpUrl, false, "", activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);

      //const filter = { urls: ["https://*.*/*"] };

      // Our request filter call the generic hook filter passing the idp response type
      // to construct the ideal method to deal with the construction of the response
      idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (this.leappCoreService.authenticationService.isAuthenticationUrl(CloudProviderType.aws, details.url)) {
          idpWindow = null;
          resolve(true);
        }
        if (this.leappCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
          idpWindow = null;
          resolve(false);
        }
        // Callback is used by filter to keep traversing calls until one of the filters apply
        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        });
      });
      // Start the process
      idpWindow.loadURL(idpUrl);
    });
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    // 1. Show or not browser window depending on needToAuthenticate
    const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
    const nearX = 200;
    const nearY = 50;
    // 2. Prepare browser window
    let idpWindow = this.windowService.newWindow(
      idpUrl,
      needToAuthenticate,
      "IDP - Login",
      activeWindowPosition[0] + nearX,
      activeWindowPosition[1] + nearY
    );
    // Catch filter url: extract SAML response
    // Our request filter call the generic hook filter passing the idp response type
    // to construct the ideal method to deal with the construction of the response
    return new Promise((resolve) => {
      idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (this.leappCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
          // it will throw an error as we have altered the original response
          // Setting that everything is ok if we have arrived here
          idpWindow.close();
          idpWindow = null;

          // Shut down the filter action: we don't need it anymore
          if (callback) {
            callback({ cancel: true });
          }

          // Return the details
          resolve(details);
        } else {
          // Callback is used by filter to keep traversing calls until one of the filters apply
          callback({
            requestHeaders: details.requestHeaders,
            url: details.url,
          });
        }
      });
      // 4. Navigate to idpUrl
      idpWindow.loadURL(idpUrl);
    });
  }

  async closeAuthenticationWindow(): Promise<void> {}
}
