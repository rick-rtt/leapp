import {Command} from '@oclif/core'
import {Config} from '@oclif/core/lib/config/config'
import {LeappCliService} from '../../service/leapp-cli-service'
import {SessionType} from '@noovolari/leapp-core/models/session-type'
import {constants} from '@noovolari/leapp-core/models/constants'
import {
  AwsSsoIntegrationService,
  IntegrationCreationParams,
} from '@noovolari/leapp-core/services/aws-sso-integration-service'

export default class CreateSsoIntegration extends Command {
  static description = 'Create a new AWS SSO integration'
  static examples = [
    '$leapp integration create',
  ]

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    try {
      const creationParams = await this.askConfigurationParameters()
      await this.createIntegration(creationParams)
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
    }
  }

  public async askConfigurationParameters(): Promise<IntegrationCreationParams> {
    const creationParams = {browserOpening: constants.inBrowser} as IntegrationCreationParams
    const aliasAnswer: any = await this.leappCliService.inquirer.prompt([{
      name: 'selectedAlias',
      message: 'Insert an alias',
      validate: AwsSsoIntegrationService.validateAlias,
      type: 'input',
    }])
    creationParams.alias = aliasAnswer.selectedAlias

    const portalUrlAnswer: any = await this.leappCliService.inquirer.prompt([{
      name: 'selectedPortalUrl',
      message: 'Insert a portal URL',
      validate: AwsSsoIntegrationService.validatePortalUrl,
      type: 'input',
    }])
    creationParams.portalUrl = portalUrlAnswer.selectedPortalUrl

    const awsRegions = this.leappCliService.cloudProviderService.availableRegions(SessionType.aws)
    const regionAnswer = await this.leappCliService.inquirer.prompt([{
      name: 'selectedRegion',
      message: 'Select a region',
      type: 'list',
      choices: awsRegions.map(region => ({name: region.fieldName, value: region.fieldValue})),
    }])
    creationParams.region = regionAnswer.selectedRegion

    return creationParams
  }

  public async createIntegration(creationParams: IntegrationCreationParams): Promise<void> {
    await this.leappCliService.awsSsoIntegrationService.createIntegration(creationParams)
    this.log('aws sso integration created')
  }
}