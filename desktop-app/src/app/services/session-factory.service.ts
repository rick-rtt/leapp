import {Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {AppService} from './app.service';
import {ExecuteService} from './execute.service';
import {SessionService} from '@noovolari/leapp-core/services/session/session.service';
import {ElectronService} from './electron.service';
import {AwsSsoOidcService} from './aws-sso-oidc.service';
import {SessionType} from '@noovolari/leapp-core/models/session-type';
import {AwsIamUserService} from '@noovolari/leapp-core/services/session/aws/method/aws-iam-user-service';
import {AwsIamRoleFederatedService} from "./session/aws/method/aws-iam-role-federated-service";
import {AwsIamRoleChainedService} from "./session/aws/method/aws-iam-role-chained-service";
import {AzureService} from "./session/azure/azure.service";
import {AwsSsoRoleService} from "./session/aws/method/aws-sso-role-service";
import { LeappCoreService } from './leapp-core.service'

@Injectable({
  providedIn: 'root'
})
export class SessionFactoryService {

  //TODO remove this unuseful cache, singleton are already lazy-initialized (see AwsIamUserService)
  private sessionServiceCache: SessionService[];

  constructor(private readonly leappCoreService: LeappCoreService) {
    this.sessionServiceCache = [];
  }

  getService(accountType: SessionType): SessionService {
    // Return if service is already in the cache using flyweight pattern
    this.sessionServiceCache = this.sessionServiceCache || [];

    if(this.sessionServiceCache[accountType.toString()]) {
      return this.sessionServiceCache[accountType.toString()];
    }

    // Creater and save the SessionService needed; return it to the requester
    switch (accountType) {
      case SessionType.awsIamRoleFederated: return this.getAwsIamRoleFederatedSessionService(accountType);
      case SessionType.awsIamUser: return this.leappCoreService.awsIamUserService;
      case SessionType.awsIamRoleChained: return this.getAwsIamRoleChainedSessionService(accountType);
      case SessionType.awsSsoRole: return this.getAwsSsoRoleSessionService(accountType);
      case SessionType.azure: return this.getAzureSessionService(accountType);
    }
  }

  private getAwsIamRoleFederatedSessionService(accountType: SessionType) {
    const service = AwsIamRoleFederatedService.getInstance();
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsIamRoleChainedSessionService(accountType: SessionType) {
    const service = AwsIamRoleChainedService.getInstance();
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsSsoRoleSessionService(accountType: SessionType) {
    const service = AwsSsoRoleService.getInstance();
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAzureSessionService(accountType: SessionType) {
    const service = AzureService.getInstance();
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }
}
