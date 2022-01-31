import { AccessMethod } from '@noovolari/leapp-core/models/access-method'
import { Command } from '@oclif/core'
import inquirer from 'inquirer'
import { LeappCliService } from '../../service/leapp-cli-service'

export default class AddSession extends Command {
  static description = 'Add a new session'

  static examples = [
    `$leapp session add`,
  ]

  /*static flags = {sessionId: Flags.string({char: 'i', description: 'Session ID', required: true}),
  }
  static flags = {
    cloudProvider: Flags.string({options: ['development', 'staging', 'production']})
  }
  static args = [{name: '', description: '', required: true}]*/

  async run(): Promise<void> {
    const leappCliService = new LeappCliService()

    const availableCloudProviders = leappCliService.cloudProviderService.availableCloudProviders()
    const cloudProviderAnswer: any = await inquirer.prompt([{
      name: 'selectedProvider',
      message: 'select a provider',
      type: 'list',
      choices: availableCloudProviders.map((cloudProvider) => ({name: cloudProvider}))
    }])

    const accessMethods = leappCliService.cloudProviderService.availableAccessMethods(cloudProviderAnswer.selectedProvider)
    const accessMethodAnswer: any = await inquirer.prompt([{
      name: 'selectedMethod',
      message: 'select an access method',
      type: 'list',
      choices: accessMethods.map(accessMethod => ({name: accessMethod.label, value: accessMethod}))
    }])

    const selectedAccessMethod = accessMethodAnswer.selectedMethod as AccessMethod
    const fieldValuesMap = new Map<string, string>()
    for (const field of selectedAccessMethod.accessMethodFields) {
      const sessionNameAnswer: any = await inquirer.prompt([{
        name: field.creationRequestField,
        message: field.message,
        type: field.type,
        choices: field.choices?.map(choice => ({name: choice.fieldName, value: choice.fieldValue}))
      }])
      fieldValuesMap.set(field.creationRequestField, sessionNameAnswer[field.creationRequestField])
    }

    let creationRequest = selectedAccessMethod.getSessionCreationRequest(fieldValuesMap)
    leappCliService.sessionFactory.createSession(selectedAccessMethod.sessionType, creationRequest)
  }
}
