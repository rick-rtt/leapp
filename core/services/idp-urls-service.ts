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

    createIdpUrl(idpUrl: string): IdpUrl {
        const validIdpUrl = this.validateNewIdpUrl(idpUrl)
        const newIdpUrl = new IdpUrl(this.getNewId(), validIdpUrl)
        this.repository.addIdpUrl(newIdpUrl)
        return newIdpUrl
    }

    editIdpUrl(id: string, newIdpUrl: string) {
        const validIdpUrl = this.validateNewIdpUrl(newIdpUrl)
        this.repository.updateIdpUrl(id, validIdpUrl)
    }

    getDependantSessions(idpUrlId: string, includingChained: boolean = true): Session[] {
        const dependantSessions = this.repository.getSessions()
            .filter(session => (session as AwsIamRoleFederatedSession).idpUrlId === idpUrlId)
        return includingChained ? dependantSessions
                .flatMap(parentSession => [parentSession, ...this.repository.listIamRoleChained(parentSession)]) :
            dependantSessions
    }

    async deleteIdpUrl(id: string) {
        for (const sessionToDelete of this.getDependantSessions(id, false)) {
            const sessionService = this.sessionFactory.getSessionService(sessionToDelete.type)
            await sessionService.delete(sessionToDelete.sessionId)
        }
        this.repository.removeIdpUrl(id)
    }

    getNewId() {
        return uuid.v4()
    }

    validateNewIdpUrl(url: string) {
        const trimmedUrl = url.trim()
        if (trimmedUrl.length === 0) {
            throw new EmptyIdpUrlError()
        }
        const existingUrls = this.getIdpUrls().map(idpUrl => idpUrl.url)
        if (existingUrls.includes(trimmedUrl)) {
            throw new IdpUrlAlreadyExistsError()
        }
        return trimmedUrl
    }
}

export class EmptyIdpUrlError extends Error {
    constructor() {
        super('Empty IdP URL')
    }
}

export class IdpUrlAlreadyExistsError extends Error {
    constructor() {
        super('IdP URL already exists')
    }
}
