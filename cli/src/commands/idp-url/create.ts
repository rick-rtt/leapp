import {Command} from '@oclif/core'
import {LeappCliService} from '../../service/leapp-cli-service'
import {Config} from '@oclif/core/lib/config/config'

export default class CreateIdpUrl extends Command {
    static description = 'Create a new identity provider URL'

    static examples = [
        `$leapp idp-url create`
    ]

    constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
        super(argv, config)
    }

    async run(): Promise<void> {
        try {
            const idpUrl = await this.getIdpUrl()
            this.createIdpUrl(idpUrl)
        } catch (error) {
            this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
        }
    }

    public async getIdpUrl(): Promise<string> {
        const answer: any = await this.leappCliService.inquirer.prompt([{
            name: 'idpUrl',
            message: `enter the identity provider URL`,
            type: 'input'
        }])
        return answer.idpUrl
    }

    public createIdpUrl(idpUrl: string) {
        this.leappCliService.idpUrlsService.createIdpUrl(idpUrl)
        this.log('identity provider URL created')
    }
}
