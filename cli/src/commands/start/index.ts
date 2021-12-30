import {Command, Flags} from '@oclif/core';
import {awsIamUserService} from "../../bootstrap";

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
    const parserOuput = await this.parse(Start)

    try {
      await awsIamUserService.start(parserOuput.flags.sessionId);
    } catch (e: any) {
      this.log(e);
    }
  }
}
