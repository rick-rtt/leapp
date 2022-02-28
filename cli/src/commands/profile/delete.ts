import {Command} from '@oclif/core'
import {LeappCliService} from '../../service/leapp-cli-service'
import {Config} from '@oclif/core/lib/config/config'
import {AwsNamedProfile} from '@noovolari/leapp-core/models/aws-named-profile'
import {Session} from '@noovolari/leapp-core/models/session'

export default class DeleteNamedProfile extends Command {
    static description = 'Delete an AWS named profile'

    static examples = [
        `$leapp profile delete`
    ]

    constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
        super(argv, config)
    }

    async run(): Promise<void> {
        try {
            const selectedNamedProfile = await this.selectNamedProfile()
            const affectedSessions = this.getAffectedSessions(selectedNamedProfile.id)
            if (await this.askForConfirmation(affectedSessions)) {
                await this.deleteNamedProfile(selectedNamedProfile.id)
            }
        } catch (error) {
            this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
        }
    }

    public async selectNamedProfile(): Promise<AwsNamedProfile> {
        const namedProfiles = this.leappCliService.namedProfilesService.getNamedProfiles(true)
        if (namedProfiles.length === 0) {
            throw new Error('no profiles available')
        }
        const answer: any = await this.leappCliService.inquirer.prompt([{
            name: 'selectedNamedProfile',
            message: `select a profile to delete`,
            type: 'list',
            choices: namedProfiles.map(profile => ({name: profile.name, value: profile}))
        }])
        return answer.selectedNamedProfile
    }

    public getAffectedSessions(namedProfileId: string): Session[] {
        return this.leappCliService.namedProfilesService.getSessionsWithNamedProfile(namedProfileId)
    }

    public async askForConfirmation(affectedSessions: Session[]): Promise<boolean> {
        if (affectedSessions.length === 0) {
            return true
        }
        const sessionsList = affectedSessions.map(session => `- ${session.sessionName}`).join('\n')
        const answer: any = await this.leappCliService.inquirer.prompt([{
            name: 'confirmation',
            message: `Deleting this profile will set default to these sessions\n${sessionsList}\nDo you want to continue?`,
            type: 'confirm'
        }])
        return answer.confirmation
    }

    public async deleteNamedProfile(id: string) {
        await this.leappCliService.namedProfilesService.deleteNamedProfile(id)
        this.log('profile deleted')
    }
}
