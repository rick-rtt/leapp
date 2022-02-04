import { IAwsAuthenticationService } from '@noovolari/leapp-core/interfaces/i-aws-authentication.service'
import puppeteer from 'puppeteer'

export class CliAwsAuthenticationService implements IAwsAuthenticationService {
  async needAuthentication(idpUrl: string): Promise<boolean> {
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', async (request) => {

      if ((request.url.toString().indexOf('https://accounts.google.com/ServiceLogin') !== -1) &&
        (request.url.toString().indexOf('.onelogin.com/login') !== -1) &&
        (request.url.toString().indexOf('.okta.com/discovery/iframe.html') !== -1)  &&
        (request.url.toString().indexOf('https://login.microsoftonline.com') !== -1) &&
        (request.url.toString().indexOf('/oauth2/authorize') !== -1)){
      }
      else
      {
        console.log(request)
        await browser.close()
      }

    })
    await page.goto(idpUrl)
    return true
  }


  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    return idpUrl === '' && needToAuthenticate
  }
}
