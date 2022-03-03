import { describe, expect, jest, test } from '@jest/globals'
import DeleteSession from './delete'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'

describe('DeleteSession', () => {
  test('deleteSession', async () => {
    const sessionService: any = {
      delete: jest.fn(async () => {
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
    const command = new DeleteSession([], {} as any, leappCliService)
    command.log = jest.fn()
    await command.deleteSession(session)

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith('sessionType')
    expect(sessionService.delete).toHaveBeenCalledWith('sessionId')
    expect(command.log).toHaveBeenCalledWith('session deleted')
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
          return {selectedSession: {name: 'sessionName', value: 'sessionValue'}}
        })
      }
    }

    const command = new DeleteSession([], {} as any, leappCliService)
    const selectedSession = await command.selectSession()
    expect(leappCliService.inquirer.prompt).toHaveBeenCalledWith([{
      'choices': [
        {
          'name': 'sessionActive',
          'value': {
            'sessionName': 'sessionActive',
            'status': SessionStatus.active
          }
        },
        {
          'name': 'sessionPending',
          'value': {
            'sessionName': 'sessionPending',
            'status': SessionStatus.pending
          }
        },
        {
          'name': 'sessionInactive',
          'value': {
            'sessionName': 'sessionInactive',
            'status': SessionStatus.inactive
          }
        }
      ], 'message': 'select a session', 'name': 'selectedSession', 'type': 'list'
    }])
    expect(selectedSession).toEqual({name: 'sessionName', value: 'sessionValue'})
  })

  test('selectSession, no session available', async () => {
    const leappCliService: any = {
      repository: {
        getSessions: jest.fn(() => {
          return []
        })
      }
    }

    const command = new DeleteSession([], {} as any, leappCliService)
    await expect(command.selectSession()).rejects.toThrow(new Error('no sessions available'))
  })

  test('getAffectedSessions', async () => {
    const session = {
      type: 'sessionType',
      sessionId: 'sessionId'
    } as any
    const sessionService = {
        getDependantSessions: jest.fn(() => 'sessions')
    }
    const leappCliService: any = {
      sessionFactory: {
        getSessionService: jest.fn(() => sessionService)
      }
    }
    const command = new DeleteSession([], {} as any, leappCliService)

    const sessions = command.getAffectedSessions(session)
    expect(sessions).toBe('sessions')
    expect(sessionService.getDependantSessions).toHaveBeenCalledWith(session.sessionId)
    expect(leappCliService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type)
  })

  test('askForConfirmation', async () => {
    const leappCliService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([{
            name: 'confirmation',
            message: 'deleting this session will delete also these chained sessions\n' +
              '- sess1\n' +
              '- sess2\n' +
              'Do you want to continue?',
            type: 'confirm'
          }])
          return {confirmation: true}
        }
      }
    }
    const command = new DeleteSession([], {} as any, leappCliService)

    const affectedSessions = [{sessionName: 'sess1'}, {sessionName: 'sess2'}] as any
    const confirmation = await command.askForConfirmation(affectedSessions)

    expect(confirmation).toBe(true)
  })

  test('run - without confirmation', async () => {
    const command = new DeleteSession([], {} as any)

    command.selectSession = jest.fn(async (): Promise<any> => 'session')
    command.getAffectedSessions = jest.fn((): any => ['session1'])
    command.askForConfirmation = jest.fn(async () => false)
    command.deleteSession = jest.fn()

    await command.run()

    expect(command.getAffectedSessions).toHaveBeenCalledWith('session')
    expect(command.askForConfirmation).toHaveBeenCalledWith(['session1'])
    expect(command.deleteSession).not.toHaveBeenCalled()
  })

  test('run - all ok', async () => {
    await runCommand(undefined, '')
  })

  test('run - deleteSession throws exception', async () => {
    await runCommand(new Error('errorMessage'), 'errorMessage')
  })

  test('run - deleteSession throws undefined object', async () => {
    await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
  })

  async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
    const command = new DeleteSession([], {} as any)

    command.selectSession = jest.fn(async (): Promise<any> => 'session')

    command.getAffectedSessions = jest.fn((): any => ['session1'])

    command.askForConfirmation = jest.fn(async () => true)

    command.deleteSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow
      }
    })

    try {
      await command.run()
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage))
    }
    expect(command.deleteSession).toHaveBeenCalledWith('session')
    expect(command.getAffectedSessions).toHaveBeenCalledWith('session')
    expect(command.askForConfirmation).toHaveBeenCalledWith(['session1'])
  }
})
