import { EventEmitter, Injectable } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { environment } from '../../environments/environment'
import { ElectronService } from './electron.service'
import { ToastrService } from 'ngx-toastr'
import { constants } from '@noovolari/leapp-core/models/constants'
import { LoggerLevel, LoggingService } from '@noovolari/leapp-core/services/logging-service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'
import { LeappCoreService } from './leapp-core.service'

/*
* External enum to the toast level so we can use this to define the type of log
*/
//TODO: What about a toasterService?
export enum ToastLevel {
  info,
  warn,
  error,
  success
}

@Injectable({
  providedIn: 'root'
})
export class AppService {

  profileOpen: EventEmitter<boolean> = new EventEmitter<boolean>()

  /* This service is defined to provide different app wide methods as utilities */
  private loggingService: LoggingService
  private awsCoreService: AwsCoreService

  constructor(private electronService: ElectronService,
              private toastr: ToastrService, leappCoreService: LeappCoreService) {
    this.awsCoreService = leappCoreService.awsCoreService
    this.loggingService = leappCoreService.loggingService

    // Global Configure logger
    if (this.electronService.log) {
      const logPaths = {
        mac: `${this.electronService.process.env.HOME}/Library/Logs/Leapp/log.electronService.log`,
        linux: `${this.electronService.process.env.HOME}/.config/Leapp/logs/log.electronService.log`,
        windows: `${this.electronService.process.env.USERPROFILE}\\AppData\\Roaming\\Leapp\\log.electronService.log`
      }

      this.electronService.log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{processType}] {text}'
      this.electronService.log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}'
      this.electronService.log.transports.file.resolvePath = () => logPaths[this.detectOs()]
    }
  }

  /**
   * Return the app object from node
   */
  getApp() {
    return this.electronService.app
  }

  getMenu() {
    return this.electronService.menu
  }

  /**
   * Return the dialog native object
   */
  getDialog() {
    return this.electronService.dialog
  }

  isDarkMode() {
    return this.electronService.nativeTheme.shouldUseDarkColors
  }

  //TODO: remove this wrapper, use electron service directly!
  getTray() {
    return this.electronService.tray
  }

  /**
   * Return the native os object
   */
  //TODO: remove this wrapper, use electron service directly!
  getOS() {
    return this.electronService.os
  }

  /**
   * Return the fs native object
   */
  //TODO: remove this wrapper, use electron service directly!
  getFs() {
    return this.electronService.fs
  }

  /**
   * Return the app process
   */
  //TODO: remove this wrapper, use electron service directly!
  getProcess() {
    return this.electronService.process
  }

  /**
   * Return Electron ipcRenderer
   */
  //TODO: remove this wrapper, use electron service directly!
  getIpcRenderer() {
    return this.electronService.ipcRenderer
  }

  /**
   * Quit the app
   */
  quit() {
    this.electronService.app.exit(0)
  }

  /**
   * Restart the app
   */
  restart() {
    this.electronService.app.relaunch()
    this.electronService.app.exit(0)
  }

  /**
   * Return the type of OS in human readable form
   */
  detectOs() {
    const hrNames = {
      linux: constants.linux,
      darwin: constants.mac,
      win32: constants.windows
    }
    const os = this.electronService.os.platform()
    return hrNames[os]
  }

  public async logout() {
    try {
      // Clear all extra data
      const getAppPath = this.electronService.path.join(this.electronService.app.getPath('appData'), environment.appName)
      this.electronService.rimraf.sync(getAppPath + '/Partitions/leapp*')

      // Cleaning Library Electron Cache
      await this.electronService.session.defaultSession.clearStorageData()

      // Clean localStorage
      localStorage.clear()

      this.toast('Cache and configuration file cleaned.', ToastLevel.success, 'Cleaning configuration file')

      // Restart
      setTimeout(() => {
        this.restart()
      }, 2000)
    } catch (err) {
      this.loggingService.logger(`Leapp has an error re-creating your configuration file and cache.`, LoggerLevel.error, this, err.stack)
      this.toast(`Leapp has an error re-creating your configuration file and cache.`, ToastLevel.error, 'Cleaning configuration file')
    }
  }

  /**
   * Return the semantic version object for version checks and operation
   *
   * @returns the semver object
   */
  semVer() {
    return this.electronService.semver
  }

  /**
   * Copy the selected text to clipboard
   *
   * @param text - the element to copy to clipboard
   */
  copyToClipboard(text: string) {
    const selBox = document.createElement('textarea')
    selBox.style.position = 'fixed'
    selBox.style.left = '0'
    selBox.style.top = '0'
    selBox.style.opacity = '0'
    selBox.value = text
    document.body.appendChild(selBox)
    selBox.focus()
    selBox.select()
    document.execCommand('copy')
    document.body.removeChild(selBox)
  }

  /**
   * Standard parsing of a json JWT token without library
   *
   * @param token - a string token
   * @returns the json object decoded
   */
  parseJwt(token) {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(jsonPayload)
  }

  /**
   * Useful to validate all form field at once if needed
   *
   * @param formGroup - the form formGroup
   */
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field)
      if (control instanceof FormControl) {
        control.markAsTouched({onlySelf: true})
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control)
      }
    })
  }

  /**
   * Show a toast message with different styles for different type of toast
   *
   * @param message - the message to show
   * @param type - the type of message from Toast Level
   * @param title - [optional]
   */
  toast(message: string, type: ToastLevel | LoggerLevel, title?: string): void {
    switch (type) {
      case ToastLevel.success:
        this.toastr.success(message, title)
        break
      case ToastLevel.info || LoggerLevel.info:
        this.toastr.info(message, title)
        break
      case ToastLevel.warn || LoggerLevel.warn:
        this.toastr.warning(message, title)
        break
      case ToastLevel.error || LoggerLevel.error:
        this.toastr.error(message, title ? title : 'Invalid Action!')
        break
      default:
        this.toastr.error(message, title)
        break
    }
  }

  /**
   * Get all aws regions
   *
   * @returns - [{region: string}] - all the regions in array format
   */
  //TODO: move this method under Core - AwsCoreService
  getRegions() {
    return [
      {region: 'af-south-1'},
      {region: 'ap-east-1'},
      {region: 'ap-northeast-1'},
      {region: 'ap-northeast-2'},
      {region: 'ap-northeast-3'},
      {region: 'ap-south-1'},
      {region: 'ap-southeast-1'},
      {region: 'ap-southeast-2'},
      {region: 'ca-central-1'},
      {region: 'cn-north-1'},
      {region: 'cn-northwest-1'},
      {region: 'eu-central-1'},
      {region: 'eu-north-1'},
      {region: 'eu-south-1'},
      {region: 'eu-west-1'},
      {region: 'eu-west-2'},
      {region: 'eu-west-3'},
      {region: 'me-south-1'},
      {region: 'sa-east-1'},
      {region: 'us-east-1'},
      {region: 'us-east-2'},
      {region: 'us-gov-east-1'},
      {region: 'us-gov-west-1'},
      {region: 'us-west-1'},
      {region: 'us-west-2'}
    ]
  }

  /**
   * Get all Azure locations
   *
   * @returns - {region: string}[] - all the regions in array format
   */
  //TODO: move this method under Core - AzureCoreService (it doesn't exist atm, just create it!)
  getLocations() {
    return [
      {location: 'eastus'},
      {location: 'eastus2'},
      {location: 'southcentralus'},
      {location: 'australiaeast'},
      {location: 'southeastasia'},
      {location: 'northeurope'},
      {location: 'uksouth'},
      {location: 'westeurope'},
      {location: 'centralus'},
      {location: 'northcentralus'},
      {location: 'southafricanorth'},
      {location: 'centralindia'},
      {location: 'eastasia'},
      {location: 'japaneast'},
      {location: 'koreacentral'},
      {location: 'canadacentral'},
      {location: 'francecentral'},
      {location: 'germanywestcentral'},
      {location: 'norwayeast'},
      {location: 'switzerlandnorth'},
      {location: 'uaenorth'},
      {location: 'brazilsouth'},
      {location: 'centralusstage'},
      {location: 'eastusstage'},
      {location: 'eastus2stage'},
      {location: 'northcentralusstage'},
      {location: 'southcentralusstage'},
      {location: 'westusstage'},
      {location: 'westus2stage'},
      {location: 'asia'},
      {location: 'asiapacific'},
      {location: 'australia'},
      {location: 'brazil'},
      {location: 'canada'},
      {location: 'europe'},
      {location: 'global'},
      {location: 'india'},
      {location: 'japan'},
      {location: 'uk'},
      {location: 'unitedstates'},
      {location: 'eastasiastage'},
      {location: 'southeastasiastage'},
      {location: 'centraluseuap'},
      {location: 'eastus2euap'},
      {location: 'westcentralus'},
      {location: 'westus3'},
      {location: 'southafricawest'},
      {location: 'australiacentral'},
      {location: 'australiacentral2'},
      {location: 'australiasoutheast'},
      {location: 'japanwest'},
      {location: 'koreasouth'},
      {location: 'southindia'},
      {location: 'westindia'},
      {location: 'canadaeast'},
      {location: 'francesouth'},
      {location: 'germanynorth'},
      {location: 'norwaywest'},
      {location: 'switzerlandwest'},
      {location: 'ukwest'},
      {location: 'uaecentral'},
      {location: 'brazilsoutheast'}
    ]
  }

  /**
   * To use EC2 services with the client you need to change the
   * request header because the origin for electron app is of type file
   */
  setFilteringForEc2Calls() {
    // Modify the user agent for all requests to the following urls.
    const filter = {urls: ['https://*.amazonaws.com/']}
    this.electronService.session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      details.requestHeaders['Origin'] = 'http://localhost:4200'
      callback({cancel: false, requestHeaders: details.requestHeaders})
    })
  }

  /**
   * Clean the credential file helper
   */
  //TODO: move this method under Core - AwsCoreService
  cleanCredentialFile() {
    try {
      const awsCredentialsPath = this.awsCoreService.awsCredentialPath()
      // Rewrite credential file
      this.electronService.fs.writeFileSync(awsCredentialsPath, '')
    } catch (e) {
      this.electronService.log(`Can\'t delete aws credential file probably missing: ${e.toString()}`, LoggerLevel.warn, this, e.stack)
    }
  }

  /**
   * Check if the account is of type azure or not
   *
   * @param s - the session containing the account
   */
  //TODO: move this method under Core - AzureCoreService (it doesn't exist atm, just create it!)
  isAzure(s) {
    return s.subscriptionId !== null && s.subscriptionId !== undefined
  }
}
