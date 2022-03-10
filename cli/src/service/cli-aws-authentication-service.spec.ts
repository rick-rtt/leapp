import { describe, expect, test } from "@jest/globals";
import { CliAwsAuthenticationService } from "./cli-aws-authentication-service";
import { of } from "rxjs";
import { Page, HTTPRequest } from "puppeteer";

class PageStub {
  public onPageCalled;
  public gotoPageCalled;
  public onEventCalledTimes;
  private callback: Map<string, (request: HTTPRequest) => Promise<void>>;

  constructor(public expectedIdpUrl: string, public requestStub: any) {
    this.onPageCalled = false;
    this.gotoPageCalled = false;
    this.onEventCalledTimes = 0;
    this.callback = new Map<string, (request: HTTPRequest) => Promise<void>>();
  }

  on(param: string, callback: any) {
    this.onPageCalled = true;
    if (this.onEventCalledTimes === 0) {
      expect(param).toEqual("request");
    } else {
      expect(param).toEqual("close");
    }

    expect(callback).toBeDefined();
    this.callback.set(param, callback);
    this.onEventCalledTimes++;
  }

  async goto(url: string) {
    this.gotoPageCalled = true;
    expect(url).toEqual(this.expectedIdpUrl);
    await this.callback.get("request")(this.requestStub);
    return Promise.reject(new Error("errors in goto must be handled"));
  }
}

describe("CliAwsAuthenticationService", () => {
  test("needAuthentication", async () => {
    const idpUrl = "https://idpUrl";
    const page = new PageStub(idpUrl, {
      url: () => idpUrl,
      isInterceptResolutionHandled: () => false,
      continue: async () => Promise.resolve(),
    });

    const cliAwsAuthenticationService = new CliAwsAuthenticationService();
    cliAwsAuthenticationService.getNavigationPage = async (headlessMode: boolean) => {
      expect(headlessMode).toBeTruthy();
      return of(page as unknown as Page).toPromise();
    };

    cliAwsAuthenticationService.isRequestToIntercept = () => true;

    expect(await cliAwsAuthenticationService.needAuthentication(idpUrl)).toBeTruthy();
    expect(page.onPageCalled).toBeTruthy();
    expect(page.gotoPageCalled).toBeTruthy();
  });

  test("awsSignIn", async () => {
    const idpUrl = "https://idpUrl";
    const needToAuthenticate = false;
    const page = new PageStub(idpUrl, {
      url: () => "https://signin.aws.amazon.com/saml",
      isInterceptResolutionHandled: () => false,
      postData: () => "postData",
      continue: async () => Promise.resolve(),
    });

    const cliAwsAuthenticationService = new CliAwsAuthenticationService();
    cliAwsAuthenticationService.getNavigationPage = async (headlessMode: boolean) => {
      expect(headlessMode).toEqual(!needToAuthenticate);
      return of(page as unknown as Page).toPromise();
    };

    const newVar = await cliAwsAuthenticationService.awsSignIn(idpUrl, needToAuthenticate);
    expect(newVar.uploadData[0].bytes.toString()).toBe("postData");
    expect(page.onPageCalled).toBeTruthy();
    expect(page.gotoPageCalled).toBeTruthy();
  });

  test("getNavigationPage and closeAuthenticationWindow", async () => {
    const cliAwsAuthenticationService = new CliAwsAuthenticationService();

    const page = await cliAwsAuthenticationService.getNavigationPage(false);
    const process = page.browser().process();
    expect(process).toBeDefined();
    expect(process?.killed).toBeFalsy();
    expect(process?.signalCode).toBeNull();

    await cliAwsAuthenticationService.closeAuthenticationWindow();
    expect(process?.killed).toBeTruthy();
    expect(process?.signalCode).toEqual("SIGKILL");
  });

  test("isRequestToIntercept", () => {
    const cliAwsAuthenticationService = new CliAwsAuthenticationService();

    expect(cliAwsAuthenticationService.isRequestToIntercept(".onelogin.com/login")).toBeTruthy();
    expect(cliAwsAuthenticationService.isRequestToIntercept(".okta.com/discovery/iframe.html")).toBeTruthy();
    expect(cliAwsAuthenticationService.isRequestToIntercept("https://accounts.google.com/ServiceLogin")).toBeTruthy();
    expect(cliAwsAuthenticationService.isRequestToIntercept("https://signin.aws.amazon.com/saml")).toBeTruthy();
    expect(cliAwsAuthenticationService.isRequestToIntercept("https://login.microsoftonline.com/something/oauth2/authorize")).toBeTruthy();
    expect(cliAwsAuthenticationService.isRequestToIntercept("https://login.microsoftonline.com/")).toBeFalsy();
    expect(cliAwsAuthenticationService.isRequestToIntercept("https://login.oauth2/authorize/")).toBeFalsy();
  });
});
