import { SessionType } from '../../../models/session-type'
import { AwsIamUserService } from './aws-iam-user-service'
import { AwsIamRoleFederatedService } from './aws-iam-role-federated-service'
import { AwsSessionService } from './aws-session-service'

//TODO: read ssoRoleService ASAP!!!
export class AwsParentSessionFactory {
  constructor(
    private readonly awsIamUserService: AwsIamUserService,
    private readonly awsIamRoleFederatedService: AwsIamRoleFederatedService,
    /*private readonly awsSsoRoleService: AwsSsoRoleService*/) {
  }

  getSessionService(accountType: SessionType): AwsSessionService {
    switch (accountType) {
      case SessionType.awsIamUser:
        return this.awsIamUserService
      case SessionType.awsIamRoleFederated:
        return this.awsIamRoleFederatedService
      /*case SessionType.awsSsoRole:
        return this.awsSsoRoleService*/
    }
  }
}
