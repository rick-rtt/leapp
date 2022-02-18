import { Command, CliUx } from '@oclif/core'
import { LeappCliService } from '../../service/leapp-cli-service'
import { Config } from '@oclif/core/lib/config/config'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'

export default class ListSessions extends Command {
  static description = 'Show sessions list'
  static examples = [`$leapp session list`]

  static flags = {
    ...CliUx.ux.table.flags()
  }

  constructor(argv: string[], config: Config, private leappCliService = new LeappCliService()) {
    super(argv, config)
  }

  async run(): Promise<void> {
    try {
      await this.showSessions()
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`)
    }
  }

  public async showSessions(): Promise<void> {
    const {flags} = await this.parse(ListSessions)
    const data = this.leappCliService.repository.getSessions() as unknown as Record<string, unknown> []
    const namedProfilesMap = this.leappCliService.namedProfilesService.getNamedProfilesMap()
    const sessionTypeLabelMap = this.leappCliService.cloudProviderService.getSessionTypeMap()

    const columns = {
      sessionName: {header: 'Session Name'},
      type: {
        get: (row: any) => sessionTypeLabelMap.get(row.type)
      },
      profileId: {
        header: 'Named Profile',
        get: (row: any) => 'profileId' in row
          ? namedProfilesMap.get(row.profileId)?.name
          : '-'
      },
      region: {header: 'Region/Location'},
      status: {get: (row: any) => SessionStatus[row.status]},
    }

    CliUx.ux.table(data, columns, {...flags})
  }
}
