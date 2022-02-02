import { AccessMethod } from '@noovolari/leapp-core/models/access-method'
import { CloudProviderType } from '@noovolari/leapp-core/models/cloud-provider-type'
import { Command } from '@oclif/core'
import { Config } from '@oclif/core/lib/config/config'
import inquirerDep from 'inquirer'
import { LeappCliService } from '../../service/leapp-cli-service'

export default class AddSession extends Command {
  static description = 'Add a new session'

  static examples = [
    '$leapp session add',
  ]

  constructor(argv: string[], config: Config,
              private inquirer: inquirerDep.Inquirer = inquirerDep,
              private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    const selectedCloudProvider = await this.chooseCloudProvider()
    const selectedAccessMethod = await this.chooseAccessMethod(selectedCloudProvider)
    const selectedParams = await this.chooseAccessMethodParams(selectedAccessMethod)
    try {
      await this.createSession(selectedAccessMethod, selectedParams)
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
    }
  }

  public async createSession(accessMethod: AccessMethod, selectedParams: Map<string, string>): Promise<void> {
    const creationRequest = accessMethod.getSessionCreationRequest(selectedParams)
    await this.leappCliService.sessionFactory.createSession(accessMethod.sessionType, creationRequest)
    this.log('Session added')
  }

  public async chooseCloudProvider(): Promise<CloudProviderType> {
    const availableCloudProviders = this.leappCliService.cloudProviderService.availableCloudProviders()
    const cloudProviderAnswer: any = await this.inquirer.prompt([{
      name: 'selectedProvider',
      message: 'select a provider',
      type: 'list',
      choices: availableCloudProviders.map(cloudProvider => ({name: cloudProvider})),
    }])
    return cloudProviderAnswer.selectedProvider
  }

  public async chooseAccessMethod(cloudProviderType: CloudProviderType): Promise<AccessMethod> {
    const accessMethods = this.leappCliService.cloudProviderService.availableAccessMethods(cloudProviderType)
    const accessMethodAnswer: any = await this.inquirer.prompt([{
      name: 'selectedMethod',
      message: 'select an access method',
      type: 'list',
      choices: accessMethods.map(accessMethod => ({name: accessMethod.label, value: accessMethod})),
    }])
    return accessMethodAnswer.selectedMethod
  }

  public async chooseAccessMethodParams(selectedAccessMethod: AccessMethod): Promise<Map<string, string>> {
    const fieldValuesMap = new Map<string, string>()
    for (const field of selectedAccessMethod.accessMethodFields) {
      const fieldAnswer: any = await this.inquirer.prompt([{
        name: field.creationRequestField,
        message: field.message,
        type: field.type,
        choices: field.choices?.map(choice => ({name: choice.fieldName, value: choice.fieldValue})),
      }])
      fieldValuesMap.set(field.creationRequestField, fieldAnswer[field.creationRequestField])
    }

    return fieldValuesMap
  }
}
