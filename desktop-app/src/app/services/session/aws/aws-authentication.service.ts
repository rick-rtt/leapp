import { Injectable } from '@angular/core'
import { AppService } from '../../app.service'
import { IAwsAuthenticationService } from '@noovolari/leapp-core/interfaces/i-aws-authentication.service'

@Injectable({providedIn: 'root'})
export class AwsAuthenticationService implements IAwsAuthenticationService {
  public constructor(private appService: AppService) {
  }

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      // Get active window position for extracting new windows coordinate
      const activeWindowPosition = this.appService.getCurrentWindow().getPosition()
      const nearX = 200
      const nearY = 50
      // Generate a new singleton browser window for the check
      let idpWindow = this.appService.newWindow(idpUrl, false, '', activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY)
      // This filter is used to listen to go to a specific callback url (or the generic one)
      const filter = {
        urls: [
          'https://*.onelogin.com/*',
          'https://*.okta.com/*',
          'https://accounts.google.com/ServiceLogin*',
          'https://login.microsoftonline.com/*',
          'https://signin.aws.amazon.com/saml'
        ]
      }

      // Our request filter call the generic hook filter passing the idp response type
      // to construct the ideal method to deal with the construction of the response
      idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
        // G Suite
        if (details.url.indexOf('https://accounts.google.com/ServiceLogin') !== -1) {
          idpWindow = null
          resolve(true)
        }
        // One Login
        if (details.url.indexOf('.onelogin.com/login') !== -1) {
          idpWindow = null
          resolve(true)
        }
        // OKTA
        if (details.url.indexOf('.okta.com/discovery/iframe.html') !== -1) {
          idpWindow = null
          resolve(true)
        }
        // AzureAD
        if (details.url.indexOf('https://login.microsoftonline.com') !== -1 && details.url.indexOf('/oauth2/authorize') !== -1) {
          idpWindow = null
          resolve(true)
        }
        // Do not show window: already logged by means of session cookies
        if (details.url.indexOf('https://signin.aws.amazon.com/saml') !== -1) {
          idpWindow = null
          resolve(false)
        }
        // Callback is used by filter to keep traversing calls until one of the filters apply
        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        })
      })
      // Start the process
      idpWindow.loadURL(idpUrl)
    })
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    // 1. Show or not browser window depending on needToAuthenticate
    const activeWindowPosition = this.appService.getCurrentWindow().getPosition()
    const nearX = 200
    const nearY = 50
    // 2. Prepare browser window
    let idpWindow = this.appService.newWindow(idpUrl, needToAuthenticate, 'IDP - Login', activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY)
    // 3. Prepare filters and configure callback
    const filter = {urls: ['https://signin.aws.amazon.com/saml']}
    // Catch filter url: extract SAML response
    // Our request filter call the generic hook filter passing the idp response type
    // to construct the ideal method to deal with the construction of the response
    return new Promise((resolve, _) => {
      idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
        // it will throw an error as we have altered the original response
        // Setting that everything is ok if we have arrived here
        idpWindow.close()
        idpWindow = null

        // Shut down the filter action: we don't need it anymore
        if (callback) {
          callback({cancel: true})
        }

        // Return the details
        resolve(details)
      })
      // 4. Navigate to idpUrl
      idpWindow.loadURL(idpUrl)
    })
  }
}
