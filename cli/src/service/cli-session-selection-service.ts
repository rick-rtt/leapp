import CliInquirer from 'inquirer'
import { Session } from '@noovolari/leapp-core/models/session'
import { Repository } from '@noovolari/leapp-core/services/repository'

export class CliSessionSelectionService {

  constructor(private inquirer: CliInquirer.Inquirer, private repository: Repository) {
  }

  public async chooseSession(filter: (session: Session) => boolean): Promise<Session> {
    const availableSessions = this.repository
      .getSessions()
      .filter(filter)

    const cloudProviderAnswer: any = await this.inquirer.prompt([{
      name: 'selectedSession',
      message: 'select a session',
      type: 'list',
      choices: availableSessions.map(session => ({name: session.sessionName, value: session})),
    }])

    return cloudProviderAnswer.selectedSession
  }
}
