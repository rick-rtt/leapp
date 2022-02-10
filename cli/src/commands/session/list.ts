import { Command, CliUx } from '@oclif/core'
import { LeappCliService } from '../../service/leapp-cli-service'
import { Config } from '@oclif/core/lib/config/config'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'

export default class ListSessions extends Command {
  static description = 'Show sessions list'

  static flags = {
    ...CliUx.ux.table.flags()
  }

  static examples = [`$leapp session list`]

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    await this.showSessions()
  }

  public async showSessions() {

    const {flags} = await this.parse(ListSessions)
    const data = this.leappCliService.repository.getSessions() as unknown as Record<string, unknown> []

    this.log('sessions list:')

    const columns = {
      sessionName: {},
      type: {},
      region:{header: 'Region/Location'},
      status:{ get: row => SessionStatus[row.status]}

    }

    CliUx.ux.table(data, columns, {...flags})
  }
}
