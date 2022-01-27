import { Command, Flags } from '@oclif/core'
import { LeappCLiService } from '../../service/leapp-cli.service'

export default class Stop extends Command {
  static description = 'Stop Session'

  static examples = [
    `$ oex stop --sessionId 1234567890`,
  ]

  static flags = {
    sessionId: Flags.string({char: 'i', description: 'Session ID', required: true}),
  }

  //static args = [{name: '', description: '', required: true}]

  async run(): Promise<void> {
    const parserOutput = await this.parse(Stop)
    const leappCliService = new LeappCLiService()

    try {
      await leappCliService.awsIamUserService.stop(parserOutput.flags.sessionId)
    } catch (e: any) {
      this.log(e)
    }
  }
}
