import {describe, expect, jest, test} from '@jest/globals'
import DeleteSession from './delete'
import {SessionStatus} from '@noovolari/leapp-core/models/session-status'

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
        expect(command.log).toHaveBeenCalledWith('Session deleted')
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
        await expect(command.selectSession()).rejects.toThrow(new Error('No sessions available'))
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

        command.selectSession = jest.fn(async (): Promise<any> => {
            return 'session'
        })

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
    }
})
