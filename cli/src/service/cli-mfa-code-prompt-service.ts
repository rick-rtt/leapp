import { IMfaCodePrompter } from '@noovolari/leapp-core/interfaces/i-mfa-code-prompter'

export class CliMfaCodePromptService implements IMfaCodePrompter {
  promptForMFACode(sessionName: string, callback: any): void {
    console.log(`prompting mfa for session ${sessionName}`)
    if (callback !== undefined) {
      callback()
    }
  }
}
