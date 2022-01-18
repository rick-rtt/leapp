import { Injectable } from '@angular/core'
import { AwsIamUserService } from '@noovolari/leapp-core/services/session/aws/method/aws-iam-user-service'
import { Repository } from '@noovolari/leapp-core/services/repository'
import { FileService } from '@noovolari/leapp-core/services/file-service'
import { KeychainService } from '@noovolari/leapp-core/services/keychain-service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'
import { LoggingService } from '@noovolari/leapp-core/services/logging-service'
import { WorkspaceService } from '@noovolari/leapp-core/services/workspace.service'
import { TimerService } from '@noovolari/leapp-core/services/timer-service'
import { AwsIamRoleFederatedService } from './session/aws/method/aws-iam-role-federated-service'
import { AwsIamRoleChainedService } from './session/aws/method/aws-iam-role-chained-service'
import { ElectronService } from './electron.service'
import { AwsSsoRoleService } from './session/aws/method/aws-sso-role-service'
import { AzureService } from './session/azure/azure.service'
import { SessionServiceFactory } from './session-service-factory'
import { MfaCodePromptService } from './mfa-code-prompt.service'
import { ExecuteService } from '@noovolari/leapp-core/services/execute.service'

@Injectable({
  providedIn: 'root'
})
export class LeappCoreService {
  constructor(private mfaCodePrompter: MfaCodePromptService, private electronService: ElectronService) {
  }

  private workspaceServiceInstance: WorkspaceService

  public get workspaceService(): WorkspaceService {
    if (!this.workspaceServiceInstance) {
      this.workspaceServiceInstance = new WorkspaceService(this.repository)
    }

    return this.workspaceServiceInstance
  }

  private awsIamUserServiceInstance: AwsIamUserService

  public get awsIamUserService(): AwsIamUserService {
    if (!this.awsIamUserServiceInstance) {
      this.awsIamUserServiceInstance = new AwsIamUserService(this.workspaceService, this.repository,
        this.mfaCodePrompter, this.keyChainService, this.fileService, this.awsCoreService)
    }

    return this.awsIamUserServiceInstance
  }

  private awsIamRoleFederatedServiceInstance: AwsIamRoleFederatedService

  get awsIamRoleFederatedService(): AwsIamRoleFederatedService {
    if (!this.awsIamRoleFederatedServiceInstance) {
      this.awsIamRoleFederatedServiceInstance = new AwsIamRoleFederatedService(this.workspaceService, this.repository,
        this.fileService, this.awsCoreService, appService)
    }

    return this.awsIamRoleFederatedServiceInstance
  }

  private awsIamRoleChainedServiceInstance: AwsIamRoleChainedService

  get awsIamRoleChainedService(): AwsIamRoleChainedService {
    if (!this.awsIamRoleChainedServiceInstance) {
      this.awsIamRoleChainedServiceInstance = new AwsIamRoleChainedService(this.workspaceService, this.repository,
        this.awsCoreService, awsSsoOidcService, this.fileService, this.awsIamUserService, this.sessionServiceFactory)
    }

    return this.awsIamRoleChainedServiceInstance
  }

  private awsSsoRoleServiceInstance: AwsSsoRoleService

  get awsSsoRoleService(): AwsSsoRoleService {
    if (!this.awsSsoRoleServiceInstance) {
      this.awsSsoRoleServiceInstance = new AwsSsoRoleService(this.workspaceService, this.repository, this.fileService,
        this.keyChainService, this.awsCoreService, appService, awsSsoOidcService)
    }

    return this.awsSsoRoleServiceInstance
  }

  private awsCoreServiceInstance: AwsCoreService

  get awsCoreService(): AwsCoreService {
    if (!this.awsCoreServiceInstance) {
      this.awsCoreServiceInstance = new AwsCoreService(this.electronService)
    }

    return this.awsCoreServiceInstance
  }


  private azureServiceInstance: AzureService

  get azureService(): AzureService {
    if (!this.azureServiceInstance) {
      this.azureServiceInstance = new AzureService(this.workspaceService, this.repository, this.fileService,
        this.executeService)
    }

    return this.azureServiceInstance
  }


  private sessionFactoryServiceInstance: SessionServiceFactory

  get sessionServiceFactory(): SessionServiceFactory {
    if (!this.sessionFactoryServiceInstance) {
      this.sessionFactoryServiceInstance = new SessionServiceFactory(this.awsIamUserService,
        this.awsIamRoleFederatedService, this.awsIamRoleChainedService, this.awsSsoRoleService,
        this.azureService)
    }

    return this.sessionFactoryServiceInstance
  }

  private fileServiceInstance: FileService

  get fileService(): FileService {
    if (!this.fileServiceInstance) {
      this.fileServiceInstance = new FileService(this.electronService)
    }

    return this.fileServiceInstance
  }

  private repositoryInstance: Repository

  get repository(): Repository {
    if (!this.repositoryInstance) {
      this.repositoryInstance = new Repository(this.electronService, this.fileService)
    }

    return this.repositoryInstance
  }

  private keyChainServiceInstance: KeychainService

  get keyChainService(): KeychainService {
    if (!this.keyChainServiceInstance) {
      this.keyChainServiceInstance = new KeychainService(this.electronService)
    }

    return this.keyChainServiceInstance
  }

  private loggingServiceInstance: LoggingService

  get loggingService(): LoggingService {
    if (!this.loggingServiceInstance) {
      this.loggingServiceInstance = new LoggingService(this.electronService)
    }

    return this.loggingServiceInstance
  }

  private timerServiceInstance: TimerService

  get timerService(): TimerService {
    if (!this.timerServiceInstance) {
      this.timerServiceInstance = new TimerService()
    }

    return this.timerServiceInstance
  }

  private executeServiceInstance: ExecuteService

  get executeService(): ExecuteService {
    if (!this.executeServiceInstance) {
      this.executeServiceInstance = new ExecuteService(this.electronService)
    }

    return this.executeServiceInstance
  }
}
