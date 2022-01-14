import { Injectable } from '@angular/core'
import { WorkspaceService } from './workspace.service'
import {
  AwsIamUserService,
  IMfaCodePrompter
} from '@noovolari/leapp-core/services/session/aws/method/aws-iam-user-service'
import { Repository } from '@noovolari/leapp-core/services/repository'
import NativeService from './native-service'
import { FileService } from '@noovolari/leapp-core/services/file-service'
import { KeychainService } from '@noovolari/leapp-core/services/keychain-service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'
import { LoggingService } from '@noovolari/leapp-core/services/logging-service'

@Injectable({
  providedIn: 'root'
})
export class LeappCoreService {
  //TODO: All the getter should become Singletons
  constructor(private workspaceService: WorkspaceService, private mfaCodePrompter: IMfaCodePrompter) {
  }

  private awsIamUserServiceInstance: AwsIamUserService

  public get awsIamUserService(): AwsIamUserService {
    if (!this.awsIamUserServiceInstance) {
      this.awsIamUserServiceInstance = new AwsIamUserService(this.workspaceService, this.repository,
        this.mfaCodePrompter, this.keyChainService, this.fileService, this.awsCoreService)
    }
    return this.awsIamUserServiceInstance
  }

  get nativeService(): NativeService {
    return new NativeService()
  }

  get awsCoreService(): AwsCoreService {
    return new AwsCoreService(this.nativeService)
  }

  get fileService(): FileService {
    return new FileService(this.nativeService)
  }

  get repository(): Repository {
    return new Repository(this.nativeService, this.fileService)
  }

  get keyChainService(): KeychainService {
    return new KeychainService(this.nativeService)
  }

  get loggingService(): LoggingService {
    return new LoggingService(this.nativeService)
  }
}
