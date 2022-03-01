import {SessionFactory} from './session-factory'
import {Repository} from './repository'
import * as uuid from 'uuid'
import {Session} from '../models/session'
import {IdpUrl} from '../models/IdpUrl'
import {AwsIamRoleFederatedSession} from '../models/aws-iam-role-federated-session'

export class IdpUrlsService {

  constructor(private sessionFactory: SessionFactory, private repository: Repository) {
  }

  public getIdpUrls(): IdpUrl[] {
    return this.repository.getIdpUrls()
  }

  public createIdpUrl(idpUrl: string): IdpUrl {
    const newIdpUrl = new IdpUrl(this.getNewId(), idpUrl.trim())
    this.repository.addIdpUrl(newIdpUrl)
    return newIdpUrl
  }

  public editIdpUrl(id: string, newIdpUrl: string) {
    this.repository.updateIdpUrl(id, newIdpUrl.trim())
  }

  public async deleteIdpUrl(id: string) {
    for (const sessionToDelete of this.getDependantSessions(id, false)) {
      const sessionService = this.sessionFactory.getSessionService(sessionToDelete.type)
      await sessionService.delete(sessionToDelete.sessionId)
    }
    this.repository.removeIdpUrl(id)
  }

  public validateIdpUrl(url: string): boolean | string {
    const trimmedUrl = url.trim()
    if (trimmedUrl.length === 0) {
      return 'Empty IdP URL'
    }
    const existingUrls = this.getIdpUrls().map(idpUrl => idpUrl.url)
    if (existingUrls.includes(trimmedUrl)) {
      return 'IdP URL already exists'
    }
    return true
  }

  public getDependantSessions(idpUrlId: string, includingChained: boolean = true): Session[] {
    const dependantSessions = this.repository.getSessions()
      .filter(session => (session as AwsIamRoleFederatedSession).idpUrlId === idpUrlId)
    return includingChained ? dependantSessions
        .flatMap(parentSession => [parentSession, ...this.repository.listIamRoleChained(parentSession)]) :
      dependantSessions
  }

  private getNewId() {
    return uuid.v4()
  }
}