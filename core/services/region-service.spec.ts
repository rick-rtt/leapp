import {RegionService} from './region-service'
import {SessionStatus} from '../models/session-status'

describe('RegionService', () => {

    test('changeRegion, session not active', async () => {
        const session = {sessionId: 'sid1', type: 'sessionType', status: SessionStatus.pending, region: 'oldRegion'}
        const sessionFactory = {
            getSessionService: jest.fn()
        }

        const repositorySessions = [{sessionId: 'sid0'}, {sessionId: 'sid1'}]
        const repository = {
            getSessions: () => repositorySessions,
            updateSessions: jest.fn()
        }

        const workspaceService = {
            updateSession: jest.fn()
        }

        const regionService = new RegionService(sessionFactory as any, repository as any, workspaceService as any)
        await regionService.changeRegion(session as any, 'newRegion')

        expect(session.region).toBe('newRegion')
        expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type)
        expect(repository.updateSessions).toHaveBeenCalledWith([repositorySessions[0], session])
        expect(workspaceService.updateSession).toHaveBeenCalledWith(session.sessionId, session)
    })

    test('changeRegion, session active', async () => {
        const session = {sessionId: 'sid1', type: 'sessionType', status: SessionStatus.active, region: 'oldRegion'}
        const sessionService = {
            stop: jest.fn(),
            start: jest.fn()
        }
        const sessionFactory = {
            getSessionService: jest.fn(() => sessionService)
        }

        const repositorySessions = [{sessionId: 'sid0'}, {sessionId: 'sid1'}]
        const repository = {
            getSessions: () => repositorySessions,
            updateSessions: jest.fn()
        }

        const workspaceService = {
            updateSession: jest.fn()
        }

        const regionService = new RegionService(sessionFactory as any, repository as any, workspaceService as any)
        await regionService.changeRegion(session as any, 'newRegion')

        expect(session.region).toBe('newRegion')
        expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type)
        expect(sessionService.stop).toHaveBeenCalledWith(session.sessionId)
        expect(repository.updateSessions).toHaveBeenCalledWith([repositorySessions[0], session])
        expect(workspaceService.updateSession).toHaveBeenCalledWith(session.sessionId, session)
        expect(sessionService.start).toHaveBeenCalledWith(session.sessionId)
    })
})
