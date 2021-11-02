import {Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {KeychainService} from '../../../core/services/keychain-service';
import {AppService} from './app.service';
import {SessionType} from '../../../core/models/session-type';
import AwsIamUserService from '../../../core/services/session/aws/method/aws-iam-user-service';
import {AwsIamRoleChainedService} from './session/aws/methods/aws-iam-role-chained.service';
import {AwsIamRoleFederatedService} from './session/aws/methods/aws-iam-role-federated.service';
import {AwsSsoRoleService} from './session/aws/methods/aws-sso-role.service';
import {AzureService} from './session/azure/azure.service';
import {ExecuteService} from './execute.service';
import {SessionService} from './session.service';
import {ElectronService} from './electron.service';
import {AwsSsoOidcService} from './aws-sso-oidc.service';

@Injectable({
  providedIn: 'root'
})
export class SessionFactoryService {

  private sessionServiceCache: SessionService[];

  constructor(
    private workspaceService: WorkspaceService,
    private appService: AppService,
    private executeService: ExecuteService,
    private electronService: ElectronService,
    private awsSsoOidcService: AwsSsoOidcService) {

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
      case SessionType.awsIamUser: return this.getAwsIamUserSessionService(accountType);
      case SessionType.awsIamRoleChained: return this.getAwsIamRoleChainedSessionService(accountType);
      case SessionType.awsSsoRole: return this.getAwsSsoRoleSessionService(accountType);
      case SessionType.azure: return this.getAzureSessionService(accountType);
    }
  }

  private getAwsIamRoleFederatedSessionService(accountType: SessionType) {
    const service = new AwsIamRoleFederatedService(this.workspaceService, this.appService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsIamUserSessionService(accountType: SessionType): AwsIamUserService {
    const service = AwsIamUserService.getInstance(this.workspaceService, this.appService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsIamRoleChainedSessionService(accountType: SessionType) {
    const service = new AwsIamRoleChainedService(this.workspaceService, this.appService, this.electronService, this.awsSsoOidcService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsSsoRoleSessionService(accountType: SessionType) {
    const service = new AwsSsoRoleService(this.workspaceService, this.appService, this.awsSsoOidcService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAzureSessionService(accountType: SessionType) {
    const service = new AzureService(this.workspaceService, this.appService, this.executeService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }
}
