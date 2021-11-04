import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../../../../../core/models/session';
import {SessionType} from '../../../../../../core/models/session-type';
import {AwsIamRoleFederatedSession} from '../../../../../../core/models/aws-iam-role-federated-session';
import {AzureSession} from '../../../../../../core/models/azure-session';
import {AwsSsoRoleSession} from '../../../../../../core/models/aws-sso-role-session';
import {AwsIamRoleChainedSession} from '../../../../../../core/models/aws-iam-role-chained-session';

@Pipe({
  name: 'detail'
})
export class DetailPipe implements PipeTransform {
  transform(session: Session): string {
    switch (session.type) {
      case(SessionType.awsIamRoleFederated):
        return (session as AwsIamRoleFederatedSession).roleArn.split('role/')[1];
      case(SessionType.azure):
        return (session as AzureSession).subscriptionId;
      case(SessionType.awsIamUser):
        return ''; // (session as AwsIamUserSession).sessionName;
      case(SessionType.awsSsoRole):
        const splittedRoleArn = (session as AwsSsoRoleSession).roleArn.split('/');
        splittedRoleArn.splice(0, 1);
        return splittedRoleArn.join('/');
      case(SessionType.awsIamRoleChained):
        return (session as AwsIamRoleChainedSession).roleArn.split('role/')[1];
    }
  }
}
