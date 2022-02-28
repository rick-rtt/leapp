import {IAwsAuthenticationService} from '@noovolari/leapp-core/interfaces/i-aws-authentication.service'
import puppeteer from 'puppeteer'
import {LeappModalClosedError} from '@noovolari/leapp-core/errors/leapp-modal-closed-error'

export class CliAwsAuthenticationService implements IAwsAuthenticationService {
  private browser: puppeteer.Browser

  public async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const page = await this.getNavigationPage(true)

      page.on('request', async request => {
        const requestUrl = request.url().toString()
        if (request.isInterceptResolutionHandled()) {
          reject('request unexpectedly already handled')
          return
        }

        if (this.isRequestToIntercept(requestUrl)) {
          resolve(requestUrl.indexOf('https://signin.aws.amazon.com/saml') === -1)
          return
        }

        await request.continue()
      })

      try {
        await page.goto(idpUrl)
      } catch (e) {
      }
    })
  }

  public async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const page = await this.getNavigationPage(!needToAuthenticate)

      page.on('request', async request => {
        const requestUrl = request.url().toString()
        if (request.isInterceptResolutionHandled()) {
          reject('request unexpectedly already handled')
          return
        }

        if (requestUrl.indexOf('https://signin.aws.amazon.com/saml') !== -1) {
          resolve({uploadData: [{bytes: {toString: () => request.postData()}}]})
          return
        }

        await request.continue()
      })

      page.on('close', () => {
        reject(new LeappModalClosedError(this, 'request window closed by user'))
      })

      try {
        await page.goto(idpUrl)
      } catch (e) {
      }
    })
  }

  public async closeAuthenticationWindow(): Promise<void> {
    if (this.browser) {
      for (const page of await this.browser.pages()) {
        page.removeAllListeners()
        await page.close()
      }
      await this.browser.close()
    }
  }

  public async getNavigationPage(headlessMode: boolean): Promise<puppeteer.Page> {
    this.browser = await puppeteer.launch({headless: headlessMode, devtools: false})
    const pages = await this.browser.pages()
    const page = pages.length > 0
      ? pages[0]
      : await this.browser.newPage()

    await page.setDefaultNavigationTimeout(180000)
    await page.setRequestInterception(true)

    return page
  }

  public isRequestToIntercept(requestUrl: string): boolean {
    if (requestUrl.indexOf('https://login.microsoftonline.com') !== -1 &&
      requestUrl.indexOf('/oauth2/authorize') !== -1) {
      return true
    }

    const otherFilters = [
      '.onelogin.com/login',
      '.okta.com/discovery/iframe.html',
      'https://accounts.google.com/ServiceLogin',
      'https://signin.aws.amazon.com/saml',
    ]

    return otherFilters.some(filter => requestUrl.indexOf(filter) !== -1)
  }
}
