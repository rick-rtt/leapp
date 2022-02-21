import {Command} from '@oclif/core'
import {LeappCliService} from '../../service/leapp-cli-service'
import {Config} from '@oclif/core/lib/config/config'
import {Session} from '@noovolari/leapp-core/models/session'
import {SessionStatus} from '@noovolari/leapp-core/models/session-status'

export default class StopSession extends Command {
    static description = 'Stop a session'

    static examples = [
        `$leapp session stop`
    ]

    constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
        super(argv, config)
    }

    async run(): Promise<void> {
        try {
            const selectedSession = await this.selectSession()
            await this.stopSession(selectedSession)
        } catch (error) {
            this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
        }
    }

    public async stopSession(session: Session): Promise<void> {
        const sessionService = this.leappCliService.sessionFactory.getSessionService(session.type)
        await sessionService.stop(session.sessionId)
        this.log('Session stopped')
    }

    public async selectSession(): Promise<Session> {
        const availableSessions = this.leappCliService.repository
            .getSessions()
            .filter((session: Session) => session.status === SessionStatus.active ||
                session.status === SessionStatus.pending)
        if (availableSessions.length === 0) {
            throw new Error('No active sessions available')
        }
        const answer: any = await this.leappCliService.inquirer.prompt([{
            name: 'selectedSession',
            message: 'select a session',
            type: 'list',
            choices: availableSessions.map(session => ({name: session.sessionName, value: session}))
        }])
        return answer.selectedSession
    }
}
