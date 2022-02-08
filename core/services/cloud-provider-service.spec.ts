import { CloudProviderType } from '../models/cloud-provider-type'
import { SessionType } from '../models/session-type'
import { CloudProviderService } from './cloud-provider-service'

describe('CloudProviderService', () => {
  it('availableCloudProviders', function () {
    const service = new CloudProviderService(null, null, null)

    expect(service.availableCloudProviders()).toEqual(['aws', 'azure'])
  })

  it('availableAccessMethods - AWS', function () {
    const awsCoreService: any = {
      getRegions: () => [{region: 'region1'}, {region: 'region2'}]
    }
    const azureCoreService: any = {getLocations: () => []}
    const repository: any = {
      getSessions: () => [
        {type: SessionType.awsIamUser, sessionName: 'session1', sessionId: 's1'},
        {type: SessionType.awsIamRoleFederated, sessionName: 'session2', sessionId: 's2'},
        {type: SessionType.awsIamRoleChained, sessionName: 'session3', sessionId: 's3'},
        {type: SessionType.awsSsoRole, sessionName: 'session4', sessionId: 's4'},
        {type: SessionType.azure, sessionName: 'session5', sessionId: 's5'},
      ],
      getProfiles: () => [{name: 'profileName', id: 'p1'}],
      getIdpUrls: () => [{url: 'idpUrl1', id: 'id1'}],
    }
    const service = new CloudProviderService(awsCoreService, azureCoreService, repository)

    const expectedRegionChoices = [
      {
        'fieldName': 'region1',
        'fieldValue': 'region1'
      },
      {
        'fieldName': 'region2',
        'fieldValue': 'region2'
      }
    ]

    const expectedNamedProfilesChoices = [
      {
        'fieldName': 'profileName',
        'fieldValue': 'p1'
      }
    ]

    const expectedIdpUrlChoices = [
      {
        'fieldName': 'idpUrl1',
        'fieldValue': 'id1'
      }
    ]

    expect(service.availableAccessMethods(CloudProviderType.AWS)).toEqual([
      {
        'accessMethodFields': [
          {
            'creationRequestField': 'sessionName',
            'message': 'Insert session alias',
            'type': 'input'
          },
          {
            'creationRequestField': 'accessKey',
            'message': 'Insert Access Key ID',
            'type': 'input'
          },
          {
            'creationRequestField': 'secretKey',
            'message': 'Insert Secret Access Key',
            'type': 'input'
          },
          {
            'choices': expectedRegionChoices,
            'creationRequestField': 'region',
            'message': 'Select region',
            'type': 'list'
          },
          {
            'creationRequestField': 'mfaDevice',
            'message': 'Insert Mfa Device ARN',
            'type': 'input'
          },
          {
            'choices': expectedNamedProfilesChoices,
            'creationRequestField': 'profileId',
            'message': 'Select the Named Profile',
            'type': 'list'
          }
        ],
        'label': 'IAM User',
        'sessionType': 'awsIamUser'
      },
      {
        'accessMethodFields': [
          {
            'creationRequestField': 'sessionName',
            'message': 'Insert session alias',
            'type': 'input'
          },
          {
            'choices': expectedRegionChoices,
            'creationRequestField': 'region',
            'message': 'Select region',
            'type': 'list'
          },
          {
            'creationRequestField': 'roleArn',
            'message': 'Insert Role ARN',
            'type': 'input'
          },
          {
            'choices': expectedIdpUrlChoices,
            'creationRequestField': 'idpUrl',
            'message': 'Insert the SAML 2.0 Url',
            'type': 'list'
          },
          {
            'creationRequestField': 'idpArn',
            'message': 'Insert the AWS Identity Provider ARN',
            'type': 'input'
          },
          {
            'choices': expectedNamedProfilesChoices,
            'creationRequestField': 'profileId',
            'message': 'Select the Named Profile',
            'type': 'list'
          }
        ],
        'label': 'IAM Role Federated',
        'sessionType': 'awsIamRoleFederated'
      },
      {
        'accessMethodFields': [
          {
            'creationRequestField': 'sessionName',
            'message': 'Insert session alias',
            'type': 'input'
          },
          {
            'choices': expectedRegionChoices,
            'creationRequestField': 'region',
            'message': 'Select region',
            'type': 'list'
          },
          {
            'creationRequestField': 'roleArn',
            'message': 'Insert Role ARN',
            'type': 'input'
          },
          {
            'choices': [
              {
                'fieldName': 'session1',
                'fieldValue': 's1'
              },
              {
                'fieldName': 'session2',
                'fieldValue': 's2'
              },
              {
                'fieldName': 'session3',
                'fieldValue': 's3'
              },
              {
                'fieldName': 'session4',
                'fieldValue': 's4'
              }
            ],
            'creationRequestField': 'parentSessionId',
            'message': 'Select Assumer Session',
            'type': 'list'
          },
          {
            'creationRequestField': 'roleSessionName',
            'message': 'Role Session Name',
            'type': 'input'
          },
          {
            'choices': expectedNamedProfilesChoices,
            'creationRequestField': 'profileId',
            'message': 'Select the Named Profile',
            'type': 'list'
          }
        ],
        'label': 'IAM Role Chained',
        'sessionType': 'awsIamRoleChained'
      }
    ])
  })

  it('availableAccessMethods - Azure', function () {
    const awsCoreService: any = {getRegions: () => []}
    const azureCoreService: any = {
      getLocations: () => [{location: 'location1'}, {location: 'location2'}]
    }
    const repository: any = {getSessions: () => [], getProfiles: () => [], getIdpUrls: () => []}
    const service = new CloudProviderService(awsCoreService, azureCoreService, repository)

    expect(service.availableAccessMethods(CloudProviderType.AZURE)).toEqual([
      {
        'accessMethodFields': [
          {
            'creationRequestField': 'sessionName',
            'message': 'Insert session alias',
            'type': 'input'
          },
          {
            'choices': [
              {
                'fieldName': 'location1',
                'fieldValue': 'location1'
              },
              {
                'fieldName': 'location2',
                'fieldValue': 'location2'
              }
            ],
            'creationRequestField': 'region',
            'message': 'Select Location',
            'type': 'list'
          },
          {
            'creationRequestField': 'subscriptionId',
            'message': 'Insert Subscription Id',
            'type': 'input'
          },
          {
            'creationRequestField': 'tenantId',
            'message': 'Insert Tenant Id',
            'type': 'input'
          }
        ],
        'label': 'Azure',
        'sessionType': 'azure'
      }
    ])
  })
})
