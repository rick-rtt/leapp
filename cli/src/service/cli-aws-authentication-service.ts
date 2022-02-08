import { IAwsAuthenticationService } from '@noovolari/leapp-core/interfaces/i-aws-authentication.service'
import { BrowserHandler, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from './browser-handler'

export class CliAwsAuthenticationService implements IAwsAuthenticationService {
  private browserHandler: BrowserHandler

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {

      this.browserHandler = new BrowserHandler(true)
      const page = await (await this.browserHandler.getBrowser()).newPage()
      await page.setDefaultNavigationTimeout(0)
      await page.setRequestInterception(true)
      page.on('request', request => {
        const requestUrl = request.url().toString()
        if (request.isInterceptResolutionHandled()) {
          reject('request unexpectedly already handled')
        }

        if (this.isRequestToIntercept(requestUrl)) {
          resolve(requestUrl.indexOf('https://signin.aws.amazon.com/saml') === -1)
        } else {
          request.continue(undefined, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY)
        }
      })

      await page.goto(idpUrl)
    })
  }

  public async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {

      this.browserHandler = new BrowserHandler(!needToAuthenticate)
      const page = await (await this.browserHandler.getBrowser()).newPage()
      await page.setDefaultNavigationTimeout(0)
      await page.setRequestInterception(true)
      page.on('request', request => {
        const requestUrl = request.url().toString()
        if (request.isInterceptResolutionHandled()) {
          reject('request unexpectedly already handled')
        }

        if (requestUrl.indexOf('https://signin.aws.amazon.com/saml') !== -1) {
          resolve({uploadData: [{bytes: {toString: () => request.postData()}}]})
        } else {
          request.continue(undefined, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY)
        }
      })

      await page.goto(idpUrl)
    })
  }

  public authenticationPhaseEnded(): void {
    if (this.browserHandler){
      this.browserHandler.killBrowser()
    }
  }

  private isRequestToIntercept(requestUrl: string): boolean {
    if (requestUrl.indexOf('https://login.microsoftonline.com') !== -1 &&
      requestUrl.indexOf('/oauth2/authorize') !== -1) {
      return true
    }

    const otherFilters = [
      '.onelogin.com/login',
      '.okta.com/discovery/iframe.html',
      'https://accounts.google.com/ServiceLogin',
      'https://signin.aws.amazon.com/saml'
    ]

    return otherFilters.some(filter => requestUrl.indexOf(filter) !== -1)
  }
}
