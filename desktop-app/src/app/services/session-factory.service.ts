import {Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {AppService} from './app.service';
import {AwsIamRoleChainedService} from '../../../../core/services/session/aws/method/aws-iam-role-chained-service';
import {AwsIamRoleFederatedService} from '../../../../core/services/session/aws/method/aws-iam-role-federated-service';
import {AwsSsoRoleService} from '../../../../core/services/session/aws/method/aws-sso-role-service';
import {AzureService} from '../../../../core/services/session/azure/azure.service';
import {ExecuteService} from './execute.service';
import {SessionService} from '../../../../core/services/session/session.service';
import {ElectronService} from './electron.service';
import {AwsSsoOidcService} from './aws-sso-oidc.service';
import {SessionType} from '../../../../core/models/session-type';
import {AwsIamUserService} from '../../../../core/services/session/aws/method/aws-iam-user-service';

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
    private awsSsoOidcService: AwsSsoOidcService
  ) {
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
    const service = AwsIamRoleFederatedService.getInstance();
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsIamUserSessionService(accountType: SessionType): AwsIamUserService {
    const service = AwsIamUserService.getInstance();
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
