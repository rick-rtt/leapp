import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {AppService} from './app.service';
import Repository from '../../../../core/services/repository';

@Injectable({
  providedIn: 'root'
})
export class ProxyService {

  constructor(
    private appService: AppService
  ) {}

  configureBrowserWindow(browserWindow: any): void {
    const proxyConfiguration = Repository.getInstance().getProxyConfiguration();

    let proxyUrl;
    let proxyPort;
    let proxyProtocol;

    if (proxyConfiguration) {
      proxyUrl = proxyConfiguration.proxyUrl;
      proxyPort = proxyConfiguration.proxyPort;
      proxyProtocol = proxyConfiguration.proxyProtocol;
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      const rules = `http=${proxyProtocol}://${proxyUrl}:${proxyPort};https=${proxyProtocol}://${proxyUrl}:${proxyPort}`;
      browserWindow.webContents.session.setProxy({
        proxyRules: rules
      });
    }
  }

  getHttpClientOptions(url: string): any {
    const options = this.appService.getUrl().parse(url);
    const proxyConfiguration = Repository.getInstance().getProxyConfiguration();

    let proxyUrl;
    let proxyPort;
    let proxyProtocol;
    let proxyUsername;
    let proxyPassword;

    if (proxyConfiguration) {
      proxyUrl = proxyConfiguration.proxyUrl;
      proxyProtocol = proxyConfiguration.proxyProtocol;
      proxyPort = proxyConfiguration.proxyPort;
      proxyUsername = proxyConfiguration.username;
      proxyPassword = proxyConfiguration.password;
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      let rule = `${proxyProtocol}://${proxyUrl}:${proxyPort}`;
      if (proxyUsername !== undefined && proxyUsername !== null && proxyUrl !== '' &&
        proxyPassword !== undefined && proxyPassword !== null && proxyPassword !== '') {
        rule = `${proxyProtocol}://${proxyUsername}:${proxyPassword}@${proxyUrl}:${proxyPort}`;
      }

      const httpsProxyAgent = this.appService.getHttpsProxyAgent();
      options.agent = new httpsProxyAgent(rule);
      options.timeout = environment.timeout;
    }

    return options;
  }

  get(url: string, resCallback: (res: any) => any, errCallback: (err: any) => any): void {
    const options = this.getHttpClientOptions(url);
    this.appService.getFollowRedirects().https.get(options, (res) => resCallback(res)).on('error', (err) => errCallback(err)).end();
  }
}
