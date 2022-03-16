import puppeteer from "puppeteer";
import { IAwsAuthenticationService } from "@noovolari/leapp-core/interfaces/i-aws-authentication.service";
import { LeappModalClosedError } from "@noovolari/leapp-core/errors/leapp-modal-closed-error";

export class CliAwsAuthenticationService implements IAwsAuthenticationService {
  private browser: puppeteer.Browser;

  async needAuthentication(idpUrl: string): Promise<boolean> {
    // eslint-disable-next-line
    return new Promise(async (resolve, reject) => {
      const page = await this.getNavigationPage(true);

      page.on("request", async (request) => {
        const requestUrl = request.url().toString();
        if (request.isInterceptResolutionHandled()) {
          reject("request unexpectedly already handled");
          return;
        }

        if (this.isRequestToIntercept(requestUrl)) {
          this.resolveIfNeeded(requestUrl, resolve);
        }

        await request.continue();
      });

      try {
        await page.goto(idpUrl);
      } catch (e) {}
    });
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    // eslint-disable-next-line
    return new Promise(async (resolve, reject) => {
      const page = await this.getNavigationPage(!needToAuthenticate);

      page.on("request", async (request) => {
        const requestUrl = request.url().toString();
        if (request.isInterceptResolutionHandled()) {
          reject("request unexpectedly already handled");
          return;
        }

        if (requestUrl.indexOf("https://signin.aws.amazon.com/saml") !== -1) {
          resolve({ uploadData: [{ bytes: { toString: () => request.postData() } }] });
          return;
        }

        await request.continue();
      });

      page.on("close", () => {
        reject(new LeappModalClosedError(this, "request window closed by user"));
      });

      try {
        await page.goto(idpUrl);
      } catch (e) {}
    });
  }

  async closeAuthenticationWindow(): Promise<void> {
    if (this.browser) {
      for (const page of await this.browser.pages()) {
        page.removeAllListeners();
        await page.close();
      }

      await this.browser.close();
    }
  }

  async getNavigationPage(headlessMode: boolean): Promise<puppeteer.Page> {
    this.browser = await puppeteer.launch({ headless: headlessMode, devtools: false });
    const pages = await this.browser.pages();
    const page = pages.length > 0 ? pages[0] : await this.browser.newPage();

    await page.setDefaultNavigationTimeout(180000);
    await page.setRequestInterception(true);

    return page;
  }

  isRequestToIntercept(requestUrl: string): boolean {
    const regexes = [
      /^https:\/\/.*\.onelogin\.com\/.*$/,
      /^https:\/\/.*\/adfs\/ls\/idpinitiatedsignon.*$/,
      /^https:\/\/.*\.okta\.com\/.*$/,
      /^https:\/\/accounts\.google\.com\/ServiceLogin.*$/,
      /^https:\/\/login\.microsoftonline\.com\/.*$/,
      /^https:\/\/signin\.aws\.amazon\.com\/saml$/,
    ];
    return regexes.some((regex) => regex.test(requestUrl));
  }

  resolveIfNeeded(requestUrl: string, resolve: (value: boolean | PromiseLike<boolean>) => void) {
    if (requestUrl.indexOf("https://accounts.google.com/ServiceLogin") !== -1) {
      return resolve(true);
    }
    // One Login
    if (requestUrl.indexOf(".onelogin.com/login") !== -1) {
      return resolve(true);
    }
    // ADFS 2.0
    if (requestUrl.indexOf("adfs/ls/idpinitiatedsignon") !== -1 && requestUrl.indexOf("loginToRp=urn:amazon:webservices") !== -1) {
      return resolve(true);
    }
    // OKTA
    if (requestUrl.indexOf(".okta.com/discovery/iframe.html") !== -1) {
      return resolve(true);
    }
    // AzureAD
    if (requestUrl.indexOf("https://login.microsoftonline.com") !== -1 && requestUrl.indexOf("/oauth2/authorize") !== -1) {
      return resolve(true);
    }
    // Do not show window: already logged by means of sessions cookies
    if (requestUrl.indexOf("https://signin.aws.amazon.com/saml") !== -1) {
      return resolve(false);
    }
  }
}
