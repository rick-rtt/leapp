import {Command, Flags} from '@oclif/core';
import {awsIamUserService} from "../../bootstrap";

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
    const parserOuput = await this.parse(Stop)

    try {
      await awsIamUserService.stop(parserOuput.flags.sessionId);
    } catch (e: any) {
      this.log(e);
    }
  }
}
