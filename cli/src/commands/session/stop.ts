import { Command } from '@oclif/core'
import { LeappCliService } from '../../service/leapp-cli-service'
import { Config } from '@oclif/core/lib/config/config'
import { Session } from '@noovolari/leapp-core/models/session'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'

export default class Stop extends Command {
  static description = 'Stop session'

  static examples = [
    `$leapp session stop`,
  ]

  constructor(argv: string[], config: Config,
              private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    const selectedSession = await this.leappCliService.cliSessionSelectionService
      .chooseSession(session => session.status === SessionStatus.active ||  session.status === SessionStatus.pending)
    try {
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
}
