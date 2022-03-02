import {Command} from '@oclif/core'
import {LeappCliService} from '../../service/leapp-cli-service'
import {Config} from '@oclif/core/lib/config/config'
import {AwsSsoIntegration} from '@noovolari/leapp-core/models/aws-sso-integration'

export default class LogoutIntegration extends Command {
  static description = 'Logout from integration'

  static examples = [
    '$leapp integration logout',
  ]

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    try {
      const selectedIntegration = await this.selectIntegration()
      await this.logout(selectedIntegration)
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
    }
  }

  public async logout(integration: AwsSsoIntegration): Promise<void> {
    await this.leappCliService.awsSsoIntegrationService.logout(integration.id)
    this.log('logout successful')
  }

  public async selectIntegration(): Promise<AwsSsoIntegration> {
    const onlineIntegrations = this.leappCliService.awsSsoIntegrationService.getOnlineIntegrations()
    if (onlineIntegrations.length === 0) {
      throw new Error('no online integrations available')
    }

    const answer: any = await this.leappCliService.inquirer.prompt([{
      name: 'selectedIntegration',
      message: 'select an integration',
      type: 'list',
      choices: onlineIntegrations.map((integration : any) => ({name: integration.alias, value: integration})),
    }])
    return answer.selectedIntegration
  }
}
