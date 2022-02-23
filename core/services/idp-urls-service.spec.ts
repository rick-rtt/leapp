import {EmptyIdpUrlError, IdpUrlAlreadyExistsError, IdpUrlsService} from './idp-urls-service'
import {IdpUrl} from '../models/IdpUrl'

describe('IdpUrlsService', () => {

    test('getIdpUrls', () => {
        const repository = {
            getIdpUrls: () => [{id: '1'}, {id: '2'}]
        }
        const idpUrlsService = new IdpUrlsService(null, repository as any)
        const idpUrls = idpUrlsService.getIdpUrls()

        expect(idpUrls).toEqual([{id: '1'}, {id: '2'}])
    })

    test('createIdpUrl', () => {
        const repository = {
            addIdpUrl: jest.fn()
        }
        const idpUrlsService = new IdpUrlsService(null, repository as any)
        idpUrlsService.validateNewIdpUrl = jest.fn(() => 'validUrl')
        idpUrlsService.getNewId = () => 'newId'

        const newIdpUrl = idpUrlsService.createIdpUrl('newUrl')

        expect(idpUrlsService.validateNewIdpUrl).toHaveBeenCalledWith('newUrl')
        expect(repository.addIdpUrl).toHaveBeenCalledWith(new IdpUrl('newId', 'validUrl'))
        expect(newIdpUrl).toEqual(new IdpUrl('newId', 'validUrl'))
    })

    test('editIdpUrl', () => {
        const repository = {
            updateIdpUrl: jest.fn()
        }
        const idpUrlsService = new IdpUrlsService(null, repository as any)
        idpUrlsService.validateNewIdpUrl = jest.fn(() => 'validUrl')

        idpUrlsService.editIdpUrl('id', 'newUrl')

        expect(idpUrlsService.validateNewIdpUrl).toHaveBeenCalledWith('newUrl')
        expect(repository.updateIdpUrl).toHaveBeenCalledWith('id', 'validUrl')
    })

    test('getDependantSessions, includingChained', () => {
        const session1 = {idpUrlId: 'id1'}
        const session2 = {idpUrlId: 'id2'}
        const session3 = {idpUrlId: 'id1'}
        const trustedSessions1 = [{trusted: '1'}, {trusted: '2'}]
        const trustedSessions3 = [{trusted: '3'}, {trusted: '4'}]

        const repository = {
            getSessions: () => [session1, session2, session3],
            listIamRoleChained: session => {
                if (session === session1) {
                    return trustedSessions1
                } else {
                    expect(session).toEqual(session3)
                    return trustedSessions3
                }
            }
        }
        const idpUrlsService = new IdpUrlsService(null, repository as any)
        const dependantSessions = idpUrlsService.getDependantSessions('id1')

        expect(dependantSessions).toEqual([session1, ...trustedSessions1, session3, ...trustedSessions3])
    })

    test('getDependantSessions, not includingChained', () => {
        const session1 = {idpUrlId: 'id1'}
        const session2 = {idpUrlId: 'id2'}
        const session3 = {idpUrlId: 'id1'}

        const repository = {
            getSessions: () => [session1, session2, session3]
        }
        const idpUrlsService = new IdpUrlsService(null, repository as any)
        const dependantSessions = idpUrlsService.getDependantSessions('id1', false)

        expect(dependantSessions).toEqual([session1, session3])
    })

    test('deleteIdpUrl', async () => {
        const sessionService = {
            delete: jest.fn()
        }
        const sessionFactory = {
            getSessionService: jest.fn(() => sessionService)
        }
        const repository = {
            removeIdpUrl: jest.fn()
        }
        const idpUrlsService = new IdpUrlsService(sessionFactory as any, repository as any)
        idpUrlsService.getDependantSessions = jest.fn(() => [{sessionId: 'sessionId', type: 'sessionType'} as any])

        await idpUrlsService.deleteIdpUrl('id')

        expect(idpUrlsService.getDependantSessions).toHaveBeenCalledWith('id', false)
        expect(sessionFactory.getSessionService).toHaveBeenCalledWith('sessionType')
        expect(sessionService.delete).toHaveBeenCalledWith('sessionId')
        expect(repository.removeIdpUrl).toHaveBeenCalledWith('id')
    })

    test('getNewId', () => {
        const idpUrlsService = new IdpUrlsService(null, null)
        const id1 = idpUrlsService.getNewId()
        const id2 = idpUrlsService.getNewId()
        expect(id1).not.toEqual(id2)
    })

    test('validateNewIdpUrl', () => {
        const idpUrlsService = new IdpUrlsService(null, null)
        idpUrlsService.getIdpUrls = () => []

        expect(idpUrlsService.validateNewIdpUrl('   www.url.com   ')).toBe('www.url.com')
    })

    test('validateNewIdpUrl, empty url', () => {
        const idpUrlsService = new IdpUrlsService(null, null)
        expect(() => idpUrlsService.validateNewIdpUrl('  ')).toThrow(new EmptyIdpUrlError())
    })

    test('validateNewIdpUrl, existent url', () => {
        const idpUrlsService = new IdpUrlsService(null, null)
        idpUrlsService.getIdpUrls = () => [new IdpUrl('1', 'url1')]

        expect(() => idpUrlsService.validateNewIdpUrl('url1')).toThrow(new IdpUrlAlreadyExistsError())
    })
})
