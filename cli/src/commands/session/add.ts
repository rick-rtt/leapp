import { Command } from '@oclif/core'
import inquirer from 'inquirer'
import { LeappCLiService } from '../../service/leapp-cli.service'

export default class AddSession extends Command {
  static description = 'Add a new session'

  static examples = [
    `$leapp add`,
  ]

  static flags = {
    //sessionId: Flags.string({char: 'i', description: 'Session ID', required: true}),
  }
  /*static flags = {
    cloudProvider: Flags.string({options: ['development', 'staging', 'production']})
  }*/

  //static args = [{name: '', description: '', required: true}]

  async run(): Promise<void> {
    //const parserOutput = await this.parse(AddSession)
    const leappCliService = new LeappCLiService()
    const availableCloudProviders = leappCliService.cloudProviderService.availableCloudProviders()

    const cloudProviderAnswer: any = await inquirer.prompt([{
      name: 'selectedProvider',
      message: 'select a provider',
      type: 'list',
      choices: availableCloudProviders.map((cloudProvider)=> ({name: cloudProvider}))
    }])
    console.log(cloudProviderAnswer.selectedProvider)

    const accessMethods  = leappCliService.cloudProviderService.availableAccessMethods(cloudProviderAnswer.selectedProvider)

    const accessMethodAnswer: any = await inquirer.prompt([{
      name: 'selectedMethod',
      message: 'select an access method',
      type: 'list',
      choices: accessMethods.map(accessMethod => ({name: accessMethod.label, value:accessMethod}))
    }])
    console.log(accessMethodAnswer.selectedMethod)
    //ask n questions based on SessionType the user choose

    //constructor(sessionName: string, region: string, profileId: string, mfaDevice?: string)
    //
    const sessionNameAnswer: any = await inquirer.prompt([{
      name: 'sessionName',
      message: 'What is your sessions name?',
      type: 'input',
    }])
    console.log(sessionNameAnswer.sessionName)





    /*
    try {
      await leappCliService.awsIamUserService.start("123")
    } catch (e: any) {
      this.log(e)
    }*/
  }
}
