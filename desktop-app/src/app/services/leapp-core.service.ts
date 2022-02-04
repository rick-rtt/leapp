import { Injectable } from '@angular/core';
import { AwsIamUserService } from '@noovolari/leapp-core/services/session/aws/aws-iam-user-service';
import { FileService } from '@noovolari/leapp-core/services/file-service';
import { KeychainService } from '@noovolari/leapp-core/services/keychain-service';
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service';
import { LoggingService } from '@noovolari/leapp-core/services/logging-service';
import { TimerService } from '@noovolari/leapp-core/services/timer-service';
import { AwsIamRoleFederatedService } from '@noovolari/leapp-core/services/session/aws/aws-iam-role-federated-service';
import { AzureService } from '@noovolari/leapp-core/services/session/azure/azure-service';
import { AwsSsoIntegrationService } from '@noovolari/leapp-core/services/session/aws/aws-sso-integration-service';
import { ElectronService } from './electron.service';
import { MfaCodePromptService } from './mfa-code-prompt.service';
import { ExecuteService } from '@noovolari/leapp-core/services/execute-service';
import { RetroCompatibilityService } from '@noovolari/leapp-core/services/retro-compatibility-service';
import { AwsAuthenticationService } from './session/aws/aws-authentication.service';
import { AwsParentSessionFactory } from '@noovolari/leapp-core/services/session/aws/aws-parent-session.factory';
import { AwsIamRoleChainedService } from '@noovolari/leapp-core/services/session/aws/aws-iam-role-chained-service';
import { Repository } from '@noovolari/leapp-core/services/repository';
import { AwsSsoOidcService } from '@noovolari/leapp-core/services/session/aws/aws-sso-oidc.service';
import { AwsSsoRoleService } from '@noovolari/leapp-core/services/session/aws/aws-sso-role-service';
import { VerificationWindowService } from './verification-window.service';
import { WorkspaceService } from '@noovolari/leapp-core/services/workspace-service';
import { SessionFactory } from '@noovolari/leapp-core/services/session-factory';
import { RotationService } from '@noovolari/leapp-core/services/rotation-service';
import { AzureCoreService } from '@noovolari/leapp-core/services/azure-core-service';
import { constants } from '@noovolari/leapp-core/models/constants';

@Injectable({
  providedIn: 'root'
})
export class LeappCoreService {

  private workspaceServiceInstance: WorkspaceService;
  private awsIamUserServiceInstance: AwsIamUserService;
  private awsIamRoleFederatedServiceInstance: AwsIamRoleFederatedService;
  private awsIamRoleChainedServiceInstance: AwsIamRoleChainedService;
  private awsSsoRoleServiceInstance: AwsSsoRoleService;
  private awsSsoOidcServiceInstance: AwsSsoOidcService;
  private awsCoreServiceInstance: AwsCoreService;
  private azureServiceInstance: AzureService;
  private sessionFactoryInstance: SessionFactory;
  private awsParentSessionFactoryInstance: AwsParentSessionFactory;
  private fileServiceInstance: FileService;
  private repositoryInstance: Repository;
  private keyChainServiceInstance: KeychainService;
  private loggingServiceInstance: LoggingService;
  private timerServiceInstance: TimerService;
  private executeServiceInstance: ExecuteService;
  private rotationServiceInstance: RotationService;
  private retroCompatibilityServiceInstance: RetroCompatibilityService;
  private azureCoreServiceInstance: AzureCoreService;
  private awsSsoIntegrationServiceInstance: AwsSsoIntegrationService;

  constructor(private mfaCodePrompter: MfaCodePromptService, private awsAuthenticationService: AwsAuthenticationService,
              private verificationWindowService: VerificationWindowService, private electronService: ElectronService) {
  }

  public get workspaceService(): WorkspaceService {
    if (!this.workspaceServiceInstance) {
      this.workspaceServiceInstance = new WorkspaceService(this.repository);
    }
    return this.workspaceServiceInstance;
  }

  public get awsIamUserService(): AwsIamUserService {
    if (!this.awsIamUserServiceInstance) {
      this.awsIamUserServiceInstance = new AwsIamUserService(this.workspaceService, this.repository,
        this.mfaCodePrompter, this.keyChainService, this.fileService, this.awsCoreService);
    }
    return this.awsIamUserServiceInstance;
  }

  public get awsIamRoleFederatedService(): AwsIamRoleFederatedService {
    if (!this.awsIamRoleFederatedServiceInstance) {
      this.awsIamRoleFederatedServiceInstance = new AwsIamRoleFederatedService(this.workspaceService, this.repository,
        this.fileService, this.awsCoreService, this.awsAuthenticationService, constants.samlRoleSessionDuration);
    }
    return this.awsIamRoleFederatedServiceInstance;
  }

  public get awsIamRoleChainedService(): AwsIamRoleChainedService {
    if (!this.awsIamRoleChainedServiceInstance) {
      this.awsIamRoleChainedServiceInstance = new AwsIamRoleChainedService(this.workspaceService, this.repository,
        this.awsCoreService, this.fileService, this.awsIamUserService, this.awsParentSessionFactory);
    }
    return this.awsIamRoleChainedServiceInstance;
  }

  public get awsSsoRoleService(): AwsSsoRoleService {
    if (!this.awsSsoRoleServiceInstance) {
      this.awsSsoRoleServiceInstance = new AwsSsoRoleService(this.workspaceService, this.repository, this.fileService,
        this.keyChainService, this.awsCoreService, this.electronService, this.awsSsoOidcService, constants.appName,
        constants.defaultRegion);
    }
    return this.awsSsoRoleServiceInstance;
  }

  public get awsSsoOidcService(): AwsSsoOidcService {
    if (!this.awsSsoOidcServiceInstance) {
      this.awsSsoOidcServiceInstance = new AwsSsoOidcService(this.verificationWindowService, this.repository);
    }
    return this.awsSsoOidcServiceInstance;
  }

  public get awsCoreService(): AwsCoreService {
    if (!this.awsCoreServiceInstance) {
      this.awsCoreServiceInstance = new AwsCoreService(this.electronService);
    }
    return this.awsCoreServiceInstance;
  }

  public get azureService(): AzureService {
    if (!this.azureServiceInstance) {
      this.azureServiceInstance = new AzureService(this.workspaceService, this.repository, this.fileService,
        this.executeService, constants.azureAccessTokens);
    }

    return this.azureServiceInstance;
  }

  public get sessionFactory(): SessionFactory {
    if (!this.sessionFactoryInstance) {
      this.sessionFactoryInstance = new SessionFactory(this.awsIamUserService,
        this.awsIamRoleFederatedService, this.awsIamRoleChainedService, this.awsSsoRoleService,
        this.azureService);
    }
    return this.sessionFactoryInstance;
  }

  public get awsParentSessionFactory(): AwsParentSessionFactory {
    if (!this.awsParentSessionFactoryInstance) {
      this.awsParentSessionFactoryInstance = new AwsParentSessionFactory(this.awsIamUserService,
        this.awsIamRoleFederatedService, this.awsSsoRoleService);
    }
    return this.awsParentSessionFactoryInstance;
  }

  public get fileService(): FileService {
    if (!this.fileServiceInstance) {
      this.fileServiceInstance = new FileService(this.electronService);
    }
    return this.fileServiceInstance;
  }

  public get repository(): Repository {
    if (!this.repositoryInstance) {
      this.repositoryInstance = new Repository(this.electronService, this.fileService);
    }
    return this.repositoryInstance;
  }

  public get keyChainService(): KeychainService {
    if (!this.keyChainServiceInstance) {
      this.keyChainServiceInstance = new KeychainService(this.electronService);
    }
    return this.keyChainServiceInstance;
  }

  public get loggingService(): LoggingService {
    if (!this.loggingServiceInstance) {
      this.loggingServiceInstance = new LoggingService(this.electronService);
    }
    return this.loggingServiceInstance;
  }

  public get timerService(): TimerService {
    if (!this.timerServiceInstance) {
      this.timerServiceInstance = new TimerService();
    }
    return this.timerServiceInstance;
  }

  public get executeService(): ExecuteService {
    if (!this.executeServiceInstance) {
      this.executeServiceInstance = new ExecuteService(this.electronService);
    }
    return this.executeServiceInstance;
  }

  public get rotationService(): RotationService {
    if (!this.rotationServiceInstance) {
      this.rotationServiceInstance = new RotationService(this.sessionFactory, this.workspaceService);
    }
    return this.rotationServiceInstance;
  }

  public get retroCompatibilityService(): RetroCompatibilityService {
    if (!this.retroCompatibilityServiceInstance) {
      this.retroCompatibilityServiceInstance = new RetroCompatibilityService(this.fileService, this.keyChainService,
        this.repository, this.workspaceService, constants.appName, constants.lockFileDestination);
    }
    return this.retroCompatibilityServiceInstance;
  }

  public get azureCoreService(): AzureCoreService {
    if (!this.azureCoreServiceInstance) {
      this.azureCoreServiceInstance = new AzureCoreService();
    }
    return this.azureCoreServiceInstance;
  }

  public get awsSsoIntegrationService(): AwsSsoIntegrationService {
    if (!this.awsSsoIntegrationServiceInstance) {
      this.awsSsoIntegrationServiceInstance = new AwsSsoIntegrationService(
        this.repositoryInstance, this.fileServiceInstance, this.keyChainServiceInstance,
        this.awsCoreServiceInstance, this.awsSsoRoleServiceInstance, this.awsSsoOidcServiceInstance,
        this.workspaceServiceInstance);
    }
    return this.awsSsoIntegrationServiceInstance;
  }
}
