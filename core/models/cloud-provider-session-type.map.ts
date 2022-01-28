import { AccessMethod } from './access-method'
import { AccessMethodField } from './access-method-field'
import { AccessMethodFieldType } from './access-method-field-type'
import { CloudProviderType } from './cloud-provider-type'
import { SessionType } from './session-type'
//constructor(sessionName: string, region: string, profileId: string, mfaDevice?: string)

export const cloudProviderSessionTypeMap = new Map([
  [CloudProviderType.AWS, [
    new AccessMethod(SessionType.awsIamUser, 'IAM User',[
      new AccessMethodField('sessionName','Insert session alias',AccessMethodFieldType.input),
      new AccessMethodField('region','Select region',AccessMethodFieldType.list)
    ]),
    new AccessMethod(SessionType.awsIamRoleFederated, 'IAM Role Federated'),
    new AccessMethod(SessionType.awsIamRoleChained, 'IAM Role Chained'),
    new AccessMethod(SessionType.awsSsoRole, 'Single Sign-On')]],
  [CloudProviderType.AZURE, [
    new AccessMethod(SessionType.azure, 'Azure'),
  ]]
])
