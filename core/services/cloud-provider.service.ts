import { AccessMethod } from '../models/access-method'
import { cloudProviderSessionTypeMap } from '../models/cloud-provider-session-type.map'
import { CloudProviderType } from '../models/cloud-provider-type'

export class CloudProviderService {

  public availableCloudProviders(): CloudProviderType[] {
    return [CloudProviderType.AWS, CloudProviderType.AZURE]
  }

  public availableAccessMethods(cloudProviderType: CloudProviderType): AccessMethod[] {
    return cloudProviderSessionTypeMap.get(cloudProviderType)
  }
}
