import { Injectable } from '@angular/core';
import {WorkspaceService} from "./workspace.service";
import {
  AwsIamUserService,
  IMfaCodePrompter
} from "@noovolari/leapp-core/services/session/aws/method/aws-iam-user-service";
import Repository from "@noovolari/leapp-core/services/repository";
import NativeService from "./native-service";
import {FileService} from "@noovolari/leapp-core/services/file-service";

@Injectable({
  providedIn: 'root'
})
export class LeappCoreService {

  private awsIamUserServiceInstance: AwsIamUserService

  constructor(private workspaceService: WorkspaceService, private mfaCodePrompter: IMfaCodePrompter) {}

  get nativeService(): NativeService {
    return new NativeService();
  }

  get fileService(): FileService {
    return new FileService(this.nativeService);
  }

  get repository(): Repository {
    return new Repository(this.nativeService, this.fileService);
  }

  get awsIamUserService(): AwsIamUserService {
    return new AwsIamUserService(this.workspaceService, this.repository, this.mfaCodePrompter, )
  }
}
