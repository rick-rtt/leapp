import {jest, describe, test, expect} from '@jest/globals'
import DeleteNamedProfile from './delete'

describe('DeleteNamedProfile', () => {

    test('selectNamedProfile', async () => {
        const namedProfile = {name: 'profileName'}
        const leappCliService: any = {
            namedProfilesService: {
                getNamedProfiles: jest.fn(() => [namedProfile])
            },
            inquirer: {
                prompt: async (params: any) => {
                    expect(params).toEqual([{
                        name: 'selectedNamedProfile',
                        message: `select a profile to delete`,
                        type: 'list',
                        choices: [{name: namedProfile.name, value: namedProfile}]
                    }])
                    return {selectedNamedProfile: namedProfile}
                }
            }
        }

        const command = new DeleteNamedProfile([], {} as any, leappCliService)
        const selectedProfile = await command.selectNamedProfile()

        expect(leappCliService.namedProfilesService.getNamedProfiles).toHaveBeenCalledWith(true)
        expect(selectedProfile).toBe(namedProfile)
    })

    test('selectNamedProfile, no named profiles', async () => {
        const leappCliService: any = {
            namedProfilesService: {
                getNamedProfiles: jest.fn(() => [])
            }
        }
        const command = new DeleteNamedProfile([], {} as any, leappCliService)

        await expect(command.selectNamedProfile()).rejects.toThrow(new Error('no profiles available'))
    })

    test('getAffectedSessions', async () => {
        const leappCliService: any = {
            namedProfilesService: {
                getSessionsWithNamedProfile: jest.fn(() => 'sessions')
            }
        }
        const command = new DeleteNamedProfile([], {} as any, leappCliService)

        const sessions = command.getAffectedSessions('profileId')
        expect(sessions).toBe('sessions')
        expect(leappCliService.namedProfilesService.getSessionsWithNamedProfile).toHaveBeenCalledWith('profileId')
    })

    test('askForConfirmation', async () => {
        const leappCliService: any = {
            inquirer: {
                prompt: async (params: any) => {
                    expect(params).toEqual([{
                        name: 'confirmation',
                        message: 'Deleting this profile will set default to these sessions\n' +
                            '- sess1\n' +
                            '- sess2\n' +
                            'Do you want to continue?',
                        type: 'confirm'
                    }])
                    return {confirmation: true}
                }
            }
        }
        const command = new DeleteNamedProfile([], {} as any, leappCliService)

        const affectedSessions = [{sessionName: 'sess1'}, {sessionName: 'sess2'}] as any
        const confirmation = await command.askForConfirmation(affectedSessions)

        expect(confirmation).toBe(true)
    })

    test('askForConfirmation, no affected sessions', async () => {
        const command = new DeleteNamedProfile([], {} as any, null as any)

        const confirmation = await command.askForConfirmation([])
        expect(confirmation).toBe(true)
    })

    test('deleteNamedProfile', async () => {
        const leappCliService: any = {
            namedProfilesService: {
                deleteNamedProfile: jest.fn()
            }
        }

        const command = new DeleteNamedProfile([], {} as any, leappCliService)
        command.log = jest.fn()
        await command.deleteNamedProfile('profileId')

        expect(leappCliService.namedProfilesService.deleteNamedProfile).toHaveBeenCalledWith('profileId')
        expect(command.log).toHaveBeenCalledWith('profile deleted')
    })

    test('run', async () => {
        await runCommand(undefined, '')
    })

    test('run - deleteNamedProfile throws exception', async () => {
        await runCommand(new Error('errorMessage'), 'errorMessage')
    })

    test('run - deleteNamedProfile throws undefined object', async () => {
        await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
    })

    async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
        const namedProfile = {id: '1'}
        const affectedSessions = [{sessionId: '2'}] as any

        const command = new DeleteNamedProfile([], {} as any)
        command.selectNamedProfile = jest.fn(async (): Promise<any> => namedProfile)
        command.getAffectedSessions = jest.fn(() => affectedSessions)
        command.askForConfirmation = jest.fn(async (): Promise<any> => true)
        command.deleteNamedProfile = jest.fn(async () => {
            if (errorToThrow) {
                throw errorToThrow
            }
        })

        let occurredError
        try {
            await command.run()
        } catch (error) {
            occurredError = error
        }

        expect(command.selectNamedProfile).toHaveBeenCalled()
        expect(command.getAffectedSessions).toHaveBeenCalledWith(namedProfile.id)
        expect(command.askForConfirmation).toHaveBeenCalledWith(affectedSessions)
        expect(command.deleteNamedProfile).toHaveBeenCalledWith(namedProfile.id)
        if (errorToThrow) {
            expect(occurredError).toEqual(new Error(expectedErrorMessage))
        }
    }
})

