import {Command} from '@oclif/core'
import {LeappCliService} from '../../service/leapp-cli-service'
import {Config} from '@oclif/core/lib/config/config'
import {AwsSsoIntegration} from '@noovolari/leapp-core/models/aws-sso-integration'

export default class LoginIntegration extends Command {
  static description = 'Login to synchronize integration sessions'

  static examples = [
    '$leapp integration login',
  ]

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    try {
      const selectedIntegration = await this.selectIntegration()
      await this.login(selectedIntegration)
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
    }
  }

  public async login(integration: AwsSsoIntegration): Promise<void> {
    this.log('waiting for browser authorization using your AWS sign-in...')
    const sessionsToSync = await this.leappCliService.awsIntegrationsService.sync(integration.id)
    this.log(`login successful (${sessionsToSync.length} sessions ready to be synchronized)`)
    await this.leappCliService.cliVerificationWindowService.closeBrowser()
  }

  public async selectIntegration(): Promise<AwsSsoIntegration> {
    const offlineIntegrations = this.leappCliService.awsIntegrationsService.getOfflineIntegrations()
    if (offlineIntegrations.length === 0) {
      throw new Error('no offline integrations available')
    }

    const answer: any = await this.leappCliService.inquirer.prompt([{
      name: 'selectedIntegration',
      message: 'select an integration',
      type: 'list',
      choices: offlineIntegrations.map(integration => ({name: integration.alias, value: integration})),
    }])
    return answer.selectedIntegration
  }
}
