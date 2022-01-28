import { CloudProviderType } from '../models/cloud-provider-type'
import { CloudProviderService } from './cloud-provider.service'

describe('CloudProviderService', () => {
  it('availableCloudProviders', function () {
    const service = new CloudProviderService()

    expect(service.availableCloudProviders()).toEqual(['aws', 'azure'])
  })

  it('availableAccessMethods', function () {
    const service = new CloudProviderService()

    expect(service.availableAccessMethods(CloudProviderType.AWS)).toEqual([{
      'label': 'IAM User',
      'sessionType': 'awsIamUser'
    },
      {
        'label': 'IAM Role Federated',
        'sessionType': 'awsIamRoleFederated'
      },
      {
        'label': 'IAM Role Chained',
        'sessionType': 'awsIamRoleChained'
      },
      {
        'label': 'Single Sign-On',
        'sessionType': 'awsSsoRole'
      }
    ])
  })


  it('availableAccessMethods', function () {
    const service = new CloudProviderService()

    expect(service.availableAccessMethods(CloudProviderType.AZURE)).toEqual([
      {
        'label': 'Azure',
        'sessionType': 'azure'
      }
    ])
  })
})
