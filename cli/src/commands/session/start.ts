import { Command, Flags } from '@oclif/core'
import { LeappCliService } from '../../service/leapp-cli-service'

//TODO: this is not the real implementation, it's just a dummy version!
export default class Start extends Command {
  static description = 'Start a specific session'

  static examples = [
    `$ oex start --sessionId 1234567890`,
  ]

  static flags = {
    sessionId: Flags.string({char: 'i', description: 'Session ID', required: true}),
  }

  //static args = [{name: '', description: '', required: true}]

  async run(): Promise<void> {
    const parserOutput = await this.parse(Start)
    const leappCliService = new LeappCliService()

    try {
      await leappCliService.awsIamUserService.start(parserOutput.flags.sessionId)
    } catch (e: any) {
      this.log(e)
    }
  }
}
