import {jest, describe, test, expect} from '@jest/globals'
import CreateNamedProfile from './create'

describe('CreateNamedProfile', () => {

    test('getProfileName', async () => {
        const leappCliService: any = {
            inquirer: {
                prompt: async (params: any) => {
                    expect(params).toEqual([{
                        name: 'namedProfileName',
                        message: `choose a name for the profile`,
                        type: 'input'
                    }])
                    return {namedProfileName: 'profileName'}
                }
            }
        }

        const command = new CreateNamedProfile([], {} as any, leappCliService)
        const profileName = await command.getProfileName()
        expect(profileName).toBe('profileName')
    })

    test('createNamedProfile', async () => {
        const leappCliService: any = {
            namedProfilesService: {
                createNamedProfile: jest.fn()
            }
        }

        const command = new CreateNamedProfile([], {} as any, leappCliService)
        command.log = jest.fn()
        command.createNamedProfile('profileName')

        expect(leappCliService.namedProfilesService.createNamedProfile).toHaveBeenCalledWith('profileName')
        expect(command.log).toHaveBeenCalledWith('Profile created')
    })

    test('run', async () => {
        await runCommand(undefined, '')
    })

    test('run - createNamedProfile throws exception', async () => {
        await runCommand(new Error('errorMessage'), 'errorMessage')
    })

    test('run - createNamedProfile throws undefined object', async () => {
        await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
    })

    async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
        const profileName = 'profile1'
        const command = new CreateNamedProfile([], {} as any)
        command.getProfileName = jest.fn(async (): Promise<any> => profileName)
        command.createNamedProfile = jest.fn(() => {
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

        expect(command.getProfileName).toHaveBeenCalled()
        expect(command.createNamedProfile).toHaveBeenCalledWith(profileName)
        if (errorToThrow) {
            expect(occurredError).toEqual(new Error(expectedErrorMessage))
        }
    }
})

