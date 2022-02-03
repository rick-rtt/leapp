import { IMfaCodePrompter } from '@noovolari/leapp-core/interfaces/i-mfa-code-prompter'
import CliInquirer from 'inquirer'

export class CliMfaCodePromptService implements IMfaCodePrompter {
  constructor(private inquirer: CliInquirer.Inquirer) {
  }
  promptForMFACode(_sessionName: string, callback: any): void {
    this.inquirer.prompt([{
      name: 'mfaCode',
      message: `Insert MFA code`,
      type: 'input'
    }]).then(mfaResponse => callback(mfaResponse.mfaCode))
  }
}
