import {Command, flags} from '@oclif/command'
import AwsIamUserService from '../../../core/services/session/aws/method/aws-iam-user-service';

export default class AddPlain extends Command {

  static description = 'Add AWS Plain Credentials'

  static examples = [
    '$ leapp add-plain',
  ]

  static flags = {
    help: flags.help({char: 'h'}),

  }

  static args = [{name: 'file'}]

  async run() {
    await AwsIamUserService.getInstance().start('test')
  }
}
