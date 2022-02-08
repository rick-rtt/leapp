import { AccessMethod } from '../models/access-method'
import { AccessMethodField } from '../models/access-method-field'
import { AccessMethodFieldType } from '../models/access-method-field-type'
import { CloudProviderType } from '../models/cloud-provider-type'
import { SessionType } from '../models/session-type'
import { AwsCoreService } from './aws-core-service'
import { AwsSessionTypes } from './aws-session-types'
import { AzureCoreService } from './azure-core-service'
import { FieldChoice } from './field-choice'
import { Repository } from './repository'

export class CloudProviderService {

  public constructor(private awsCoreService: AwsCoreService, private azureCoreService: AzureCoreService,
                     private repository: Repository) {
  }

  public availableCloudProviders(): CloudProviderType[] {
    return [CloudProviderType.AWS, CloudProviderType.AZURE]
  }

  public availableAccessMethods(cloudProviderType: CloudProviderType): AccessMethod[] {
    return this.map.get(cloudProviderType)
  }

  private get map(): Map<CloudProviderType, AccessMethod[]> {
    const awsRegionChoices = this.getAwsRegionChoices()
    const awsNamedProfileChoices = this.getAwsNamedProfileChoices()
    const idpUrlChoices = this.getIdpUrls()
    const awsSessionChoices = this.getAwsSessionChoices()
    const azureLocationChoices = this.getAzureLocationChoices()

    return new Map([
      [CloudProviderType.AWS, [
        new AccessMethod(SessionType.awsIamUser, 'IAM User', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('accessKey', 'Insert Access Key ID', AccessMethodFieldType.input),
          new AccessMethodField('secretKey', 'Insert Secret Access Key', AccessMethodFieldType.input),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, awsRegionChoices),
          new AccessMethodField('mfaDevice', 'Insert Mfa Device ARN', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, awsNamedProfileChoices)
        ]),
        new AccessMethod(SessionType.awsIamRoleFederated, 'IAM Role Federated', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, awsRegionChoices),
          new AccessMethodField('roleArn', 'Insert Role ARN', AccessMethodFieldType.input),
          new AccessMethodField('idpUrl', 'Insert the SAML 2.0 Url', AccessMethodFieldType.list, idpUrlChoices),
          new AccessMethodField('idpArn', 'Insert the AWS Identity Provider ARN', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, awsNamedProfileChoices)
        ]),
        new AccessMethod(SessionType.awsIamRoleChained, 'IAM Role Chained', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('region', 'Select region', AccessMethodFieldType.list, awsRegionChoices),
          new AccessMethodField('roleArn', 'Insert Role ARN', AccessMethodFieldType.input),
          new AccessMethodField('parentSessionId', 'Select Assumer Session', AccessMethodFieldType.list, awsSessionChoices),
          new AccessMethodField('roleSessionName', 'Role Session Name', AccessMethodFieldType.input),
          new AccessMethodField('profileId', 'Select the Named Profile', AccessMethodFieldType.list, awsNamedProfileChoices),
        ])
      ]],
      [CloudProviderType.AZURE, [
        new AccessMethod(SessionType.azure, 'Azure', [
          new AccessMethodField('sessionName', 'Insert session alias', AccessMethodFieldType.input),
          new AccessMethodField('region', 'Select Location', AccessMethodFieldType.list, azureLocationChoices),
          new AccessMethodField('subscriptionId', 'Insert Subscription Id', AccessMethodFieldType.input),
          new AccessMethodField('tenantId', 'Insert Tenant Id', AccessMethodFieldType.input),
        ])
      ]]
    ])
  }

  private getAzureLocationChoices(): FieldChoice[] {
    return this.azureCoreService.getLocations().map(location => new FieldChoice(location.location, location.location))
  }

  private getAwsRegionChoices(): FieldChoice[] {
    return this.awsCoreService.getRegions().map(value => new FieldChoice(value.region, value.region))
  }

  private getAwsNamedProfileChoices(): FieldChoice[] {
    return this.repository.getProfiles().map(profile => new FieldChoice(profile.name, profile.id))
  }

  private getAwsSessionChoices(): FieldChoice[] {
    return this.repository.getSessions()
      .filter(session => AwsSessionTypes.includes(session.type))
      .map(session => new FieldChoice(session.sessionName, session.sessionId))
  }

  private getIdpUrls(): FieldChoice[] {
    return this.repository.getIdpUrls()
      .map(idpUrl => new FieldChoice(idpUrl.url, idpUrl.id))
  }
}
