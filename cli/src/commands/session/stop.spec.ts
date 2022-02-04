import { describe, expect, jest, test } from '@jest/globals'
import StopSession from './stop'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'

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

  test('selectSession', async () => {

    const leappCliService: any = {
      repository: {
        getSessions: jest.fn(() => {
          return [
            {sessionName: 'sessionActive', status: SessionStatus.active},
            {sessionName: 'sessionPending', status: SessionStatus.pending},
            {sessionName: 'sessionInactive', status: SessionStatus.inactive}
          ]
        })
      },
      inquirer: {
        prompt: jest.fn(() => {
          return {selectedSession: {name: 'sessionActive', value: 'ActiveSession'}}
        })
      }
    }

    const command = new StopSession([], {} as any, leappCliService)
    const selectedSession = await command.selectSession()
    expect(leappCliService.inquirer.prompt).toHaveBeenCalledWith([{
      'choices': [
        {'name': 'sessionActive', 'value': {'sessionName': 'sessionActive', 'status': SessionStatus.active}},
        {'name': 'sessionPending', 'value': {'sessionName': 'sessionPending', 'status': SessionStatus.pending}}
      ],
      'message': 'select a session',
      'name': 'selectedSession',
      'type': 'list'
    }])
    expect(selectedSession).toEqual({name: 'sessionActive', value: 'ActiveSession'})
  })

  test('run - all ok', async () => {
    await runCommand(undefined, '')
  })

  test('run - createSession throws exception', async () => {
    await runCommand(new Error('errorMessage'), 'errorMessage')
  })

  test('run - createSession throws undefined object', async () => {
    await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
  })

  async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
    const command = new StopSession([], {} as any)

    command.selectSession = jest.fn(async (): Promise<any> => {
      return 'session'
    })

    command.stopSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow
      }
    })

    try {
      await command.run()
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage))
    }
    expect(command.stopSession).toHaveBeenCalledWith('session')
  }
})
