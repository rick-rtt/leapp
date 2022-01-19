import { Repository } from './repository'
import { INativeService } from '../interfaces/i-native-service'

export class ProxyService {
  constructor(private repository: Repository, private nativeService: INativeService, private timeOut: number) {
  }

  //TODO: why not returning a promise?
  get(url: string, resCallback: (res: any) => any, errCallback: (err: any) => any): void {
    const options = this.getHttpClientOptions(url)
    const httpsRedirectClient = this.nativeService.followRedirects.https
    httpsRedirectClient
      .get(options, (res) => resCallback(res))
      .on('error', (err) => errCallback(err))
      .end()
  }

  configureBrowserWindow(browserWindow: any): void {
    const proxyConfiguration = this.repository.getProxyConfiguration()

    let proxyUrl
    let proxyPort
    let proxyProtocol

    if (proxyConfiguration) {
      proxyUrl = proxyConfiguration.proxyUrl
      proxyPort = proxyConfiguration.proxyPort
      proxyProtocol = proxyConfiguration.proxyProtocol
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      const rules = `http=${proxyProtocol}://${proxyUrl}:${proxyPort};https=${proxyProtocol}://${proxyUrl}:${proxyPort}`
      browserWindow.webContents.session.setProxy({
        proxyRules: rules
      })
    }
  }

  private getHttpClientOptions(url: string): any {
    const options = this.nativeService.url.parse(url)
    const proxyConfiguration = this.repository.getProxyConfiguration()

    let proxyUrl
    let proxyPort
    let proxyProtocol
    let proxyUsername
    let proxyPassword

    if (proxyConfiguration) {
      proxyUrl = proxyConfiguration.proxyUrl
      proxyProtocol = proxyConfiguration.proxyProtocol
      proxyPort = proxyConfiguration.proxyPort
      proxyUsername = proxyConfiguration.username
      proxyPassword = proxyConfiguration.password
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      let rule = `${proxyProtocol}://${proxyUrl}:${proxyPort}`
      if (proxyUsername !== undefined && proxyUsername !== null && proxyUrl !== '' &&
        proxyPassword !== undefined && proxyPassword !== null && proxyPassword !== '') {
        rule = `${proxyProtocol}://${proxyUsername}:${proxyPassword}@${proxyUrl}:${proxyPort}`
      }

      options.agent = new this.nativeService.httpsProxyAgent(rule)
      options.timeout = this.timeOut
    }

    return options
  }
}
