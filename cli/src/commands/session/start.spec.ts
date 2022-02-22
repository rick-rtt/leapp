import {describe, expect, jest, test} from '@jest/globals'
import StartSession from './start'
import {SessionStatus} from '@noovolari/leapp-core/models/session-status'

describe('StartSession', () => {

    test('startSession', async () => {

        const sessionService: any = {
            start: jest.fn(async () => {
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
        const command = new StartSession([], {} as any, leappCliService)
        command.log = jest.fn()
        await command.startSession(session)

        expect(sessionFactory.getSessionService).toHaveBeenCalledWith('sessionType')
        expect(sessionService.start).toHaveBeenCalledWith('sessionId')
        expect(command.log).toHaveBeenCalledWith('session started')
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
                    return {selectedSession: {name: 'sessionInactive', value: 'InactiveSession'}}
                })
            }
        }

        const command = new StartSession([], {} as any, leappCliService)
        const selectedSession = await command.selectSession()
        expect(leappCliService.inquirer.prompt).toHaveBeenCalledWith([{
            'choices': [{
                'name': 'sessionInactive',
                'value': {'sessionName': 'sessionInactive', 'status': SessionStatus.inactive}
            }], 'message': 'select a session', 'name': 'selectedSession', 'type': 'list'
        }])
        expect(selectedSession).toEqual({name: 'sessionInactive', value: 'InactiveSession'})
    })

    test('selectSession, no session available', async () => {
        const leappCliService: any = {
            repository: {
                getSessions: jest.fn(() => {
                    return []
                })
            }
        }

        const command = new StartSession([], {} as any, leappCliService)
        await expect(command.selectSession()).rejects.toThrow(new Error('no sessions available'))
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
        const command = new StartSession([], {} as any)

        command.selectSession = jest.fn(async (): Promise<any> => {
            return 'session'
        })

        command.startSession = jest.fn(async (): Promise<any> => {
            if (errorToThrow) {
                throw errorToThrow
            }
        })

        try {
            await command.run()
        } catch (error) {
            expect(error).toEqual(new Error(expectedErrorMessage))
        }
        expect(command.startSession).toHaveBeenCalledWith('session')
    }
})
