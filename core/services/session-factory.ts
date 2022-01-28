import { AccessMethod } from '../models/access-method'
import { AccessMethodField } from '../models/access-method-field'
import { SessionService } from './session/session.service'
import { SessionType } from '../models/session-type'
import { AwsIamRoleFederatedService } from './session/aws/aws-iam-role-federated-service'
import { AzureService } from './session/azure/azure.service'
import { AwsIamUserService } from './session/aws/aws-iam-user-service'
import { AwsIamRoleChainedService } from './session/aws/aws-iam-role-chained-service'
import { AwsSsoRoleService } from './session/aws/aws-sso-role-service'

export class SessionFactory {
  constructor(
    private readonly awsIamUserService: AwsIamUserService,
    private readonly awsIamRoleFederatedService: AwsIamRoleFederatedService,
    private readonly awsIamRoleChainedService: AwsIamRoleChainedService,
    private readonly awsSsoRoleService: AwsSsoRoleService,
    private readonly azureService: AzureService) {
  }

  getSessionService(accountType: SessionType): SessionService {
    switch (accountType) {
      case SessionType.awsIamUser:
        return this.awsIamUserService
      case SessionType.awsIamRoleFederated:
        return this.awsIamRoleFederatedService
      case SessionType.awsIamRoleChained:
        return this.awsIamRoleChainedService
      case SessionType.awsSsoRole:
        return this.awsSsoRoleService
      case SessionType.azure:
        return this.azureService
    }
  }

  createSession(accessMethod: AccessMethod, sessionRequest: any): void {
    const sessionService = this.getSessionService(accessMethod.sessionType)
    sessionService

    switch (accessMethod.sessionType) {
      case SessionType.awsIamUser:
        this.awsIamUserService.create(sessionRequest, '')
        break
      case SessionType.awsIamRoleFederated:
        break
      case SessionType.awsIamRoleChained:
        break
      case SessionType.awsSsoRole:
        break
      case SessionType.azure:
        break
    }
  }
}
