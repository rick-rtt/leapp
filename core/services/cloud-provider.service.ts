import { AccessMethod } from '../models/access-method'
import { AccessMethodField } from '../models/access-method-field'
import { AccessMethodFieldType } from '../models/access-method-field-type'
import { CloudProviderType } from '../models/cloud-provider-type'
import { SessionType } from '../models/session-type'
import { AwsCoreService } from './aws-core-service'
import { Repository } from './repository'

export class CloudProviderService {
  constructor(private awsCoreService : AwsCoreService, private repository: Repository) {
  }

  public availableCloudProviders(): CloudProviderType[] {
    return [CloudProviderType.AWS, CloudProviderType.AZURE]
  }

  public availableAccessMethods(cloudProviderType: CloudProviderType): AccessMethod[] {
    return this.map.get(cloudProviderType)
  }

  public get map():Map<CloudProviderType, AccessMethod[]> {
    const regions = this.getRegions()

    return new Map([
      [CloudProviderType.AWS, [
        new AccessMethod(SessionType.awsIamUser, 'IAM User', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('accessKey', 'Insert Access Key ID', AccessMethodFieldType.input),
          new AccessMethodField('secretKey', 'Insert Secret Access Key', AccessMethodFieldType.input),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, regions),
          new AccessMethodField('mfaDevice', ' Insert Mfa Device ARN', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, [])
        ]),
        new AccessMethod(SessionType.awsIamRoleFederated, 'IAM Role Federated', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, []),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, regions),
          new AccessMethodField('roleArn', 'Insert Role ARN', AccessMethodFieldType.input),
          new AccessMethodField('idpUrl', 'Insert the SAML 2.0 Url', AccessMethodFieldType.input),
          new AccessMethodField('idpArn', 'Insert the AWS Identity Provider ARN', AccessMethodFieldType.input)

        ]),
        new AccessMethod(SessionType.awsIamRoleChained, 'IAM Role Chained', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, []),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, regions),
          new AccessMethodField('roleArn', 'Insert Role ARN', AccessMethodFieldType.input),
          //todo check assumer session name
          new AccessMethodField('parentSessionId', 'Insert Assumer Session ', AccessMethodFieldType.input),
          new AccessMethodField('roleSessionName', 'Role Session Name', AccessMethodFieldType.input)

        ]),
        //todo check sso role field name
        new AccessMethod(SessionType.awsSsoRole, 'Single Sign-On', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, []),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, regions),
          new AccessMethodField('roleArn', 'Insert Role ARN', AccessMethodFieldType.input),
          new AccessMethodField('email', 'Insert E-mail', AccessMethodFieldType.input)
        ])
      ]],
      [CloudProviderType.AZURE, [
        new AccessMethod(SessionType.azure, 'Azure', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('region', 'Select Location', AccessMethodFieldType.list, []),
          new AccessMethodField('subscriptionId', 'Insert Subscription Id', AccessMethodFieldType.list),
          new AccessMethodField('tenantId', 'Insert Tenant Id', AccessMethodFieldType.input),
        ])
      ]]
    ])
  }

  private getRegions(): string[]{
    return this.awsCoreService.getRegions().map(value => value.region);
  }

  private getProfiles(): any[]{
    this.repository.getProfiles()
    return this.awsCoreService.getRegions().map(value => value.region);
  }
}
