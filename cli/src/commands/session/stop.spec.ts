import { describe, expect, jest, test } from '@jest/globals'
import StopSession from './stop'

describe('StopSession', () => {

  test('stopSession', async () => {

    const sessionService: any = {
      stop: jest.fn(async () => {
      })
    }
    const sessionFactory: any = {
      getSessionService: jest.fn(() => {
        return sessionService
      })
    }

    const leappCliService: any = {
      sessionFactory: sessionFactory
    }

    const session: any = {sessionId: 'sessionId', type: 'sessionType'}
    const command = new StopSession([], {} as any, leappCliService)
    command.log = jest.fn()
    await command.stopSession(session)

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith('sessionType')
    expect(sessionService.stop).toHaveBeenCalledWith('sessionId')
    expect(command.log).toHaveBeenCalledWith('Session stopped')
  })
})
