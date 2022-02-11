import { Command } from '@oclif/core'
import { LeappCliService } from '../../service/leapp-cli-service'
import { Config } from '@oclif/core/lib/config/config'
import { Session } from '@noovolari/leapp-core/models/session'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'

export default class StartSession extends Command {
  static description = 'Start a session'

  static examples = [
    `$leapp session start`,
  ]

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {

    const selectedSession = await this.selectSession()
    try {
      await this.startSession(selectedSession)
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
    }
  }

  public async startSession(session: Session): Promise<void> {
    const sessionService = this.leappCliService.sessionFactory.getSessionService(session.type)
    await sessionService.start(session.sessionId)
    this.log('Session started')
  }

  public async selectSession(): Promise<Session> {
    const availableSessions = this.leappCliService.repository
      .getSessions()
      .filter((session: Session) => session.status === SessionStatus.inactive)

    const answer: any = await this.leappCliService.inquirer.prompt([{
      name: 'selectedSession',
      message: 'select a session',
      type: 'list',
      choices: availableSessions.map(session => ({name: session.sessionName, value: session})),
    }])
    return answer.selectedSession
  }
}
