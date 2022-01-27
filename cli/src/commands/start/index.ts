import { Command, Flags } from '@oclif/core'
import { LeappCLiService } from '../../service/leapp-cli.service'

export default class Start extends Command {
  static description = 'Start Session'

  static examples = [
    `$ oex start --sessionId 1234567890`,
  ]

  static flags = {
    sessionId: Flags.string({char: 'i', description: 'Session ID', required: true}),
  }

  //static args = [{name: '', description: '', required: true}]

  async run(): Promise<void> {
    const parserOutput = await this.parse(Start)
    const leappCliService = new LeappCLiService()

    try {
      await leappCliService.awsIamUserService.start(parserOutput.flags.sessionId)
    } catch (e: any) {
      this.log(e)
    }
  }
}
