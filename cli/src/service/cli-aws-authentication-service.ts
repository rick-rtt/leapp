import { IAwsAuthenticationService } from '@noovolari/leapp-core/interfaces/i-aws-authentication.service'
import puppeteer from 'puppeteer'

export class CliAwsAuthenticationService implements IAwsAuthenticationService {
  private browser: puppeteer.Browser

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {

      this.browser = await puppeteer.launch({headless: true, devtools: false})
      const page = await this.browser.newPage()
      await page.setDefaultNavigationTimeout(0)
      await page.setRequestInterception(true)
      page.on('request', request => {
        const requestUrl = request.url().toString()
        if (request.isInterceptResolutionHandled()) {
          reject('request unexpectedly already handled')
        }

        if (this.isRequestToIntercept(requestUrl)) {
          request.abort()
          resolve(requestUrl.indexOf('https://signin.aws.amazon.com/saml') === -1)
        } else {
          request.continue()
        }
      })

      try {await page.goto(idpUrl)}catch (e) {
      }
    })
  }

  public async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {

      this.browser = await puppeteer.launch({headless: !needToAuthenticate, devtools: false})
      const page = await this.browser.newPage()
      await page.setDefaultNavigationTimeout(0)
      await page.setRequestInterception(true)
      page.on('request', request => {
        const requestUrl = request.url().toString()
        if (request.isInterceptResolutionHandled()) {
          reject('request unexpectedly already handled')
        }

        if (requestUrl.indexOf('https://signin.aws.amazon.com/saml') !== -1) {
          request.abort()
          resolve({uploadData: [{bytes: {toString: () => request.postData()}}]})
        } else {
          request.continue()
        }
      })

      try {await page.goto(idpUrl)}catch (e) {
      }
    })
  }

  public async closeAuthenticationWindow(): Promise<void> {
    if (this.browser) {
      this.browser.removeAllListeners()
      this.browser.disconnect()
      await this.browser.close()
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
