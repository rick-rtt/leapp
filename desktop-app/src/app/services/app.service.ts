import { EventEmitter, Injectable } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { environment } from '../../environments/environment'
import { ElectronService } from './electron.service'
import { constants } from '@noovolari/leapp-core/models/constants'
import { LoggerLevel, LoggingService } from '@noovolari/leapp-core/services/logging-service'
import { LeappCoreService } from './leapp-core.service'
import { MessageToasterService, ToastLevel } from './message-toaster.service'

@Injectable({
  providedIn: 'root'
})
export class AppService {

  profileOpen: EventEmitter<boolean> = new EventEmitter<boolean>()

  /* This service is defined to provide different app wide methods as utilities */
  private loggingService: LoggingService

  constructor(private electronService: ElectronService, private messageToasterService: MessageToasterService,
              leappCoreService: LeappCoreService) {
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

      this.messageToasterService.toast('Cache and configuration file cleaned.', ToastLevel.success, 'Cleaning configuration file')

      // Restart
      setTimeout(() => {
        this.restart()
      }, 2000)
    } catch (err) {
      this.loggingService.logger(`Leapp has an error re-creating your configuration file and cache.`, LoggerLevel.error, this, err.stack)
      this.messageToasterService.toast(`Leapp has an error re-creating your configuration file and cache.`, ToastLevel.error, 'Cleaning configuration file')
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
}
