import { Command, Flags } from '@oclif/core'
import { LeappCLiService } from '../../service/leapp-cli.service'

//TODO: this is not the real implementation, it's just a dummy version!
export default class Stop extends Command {
  static description = 'Stop a specific session'

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
