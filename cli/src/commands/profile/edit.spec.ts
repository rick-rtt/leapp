import { jest, describe, test, expect } from '@jest/globals'
import EditNamedProfile from './edit'

describe('EditNamedProfile', () => {

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
            message: `select a profile`,
            type: 'list',
            choices: [{name: namedProfile.name, value: namedProfile}]
          }])
          return {selectedNamedProfile: namedProfile}
        }
      }
    }

    const command = new EditNamedProfile([], {} as any, leappCliService)
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

    const command = new EditNamedProfile([], {} as any, leappCliService)
    await expect(command.selectNamedProfile()).rejects.toThrow(new Error('no profiles available'))
  })

  test('getProfileName', async () => {
    const leappCliService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toMatchObject([{
            name: 'namedProfileName',
            message: `choose a new name for the profile`,
            type: 'input'
          }])
          expect(params[0].validate('profileName')).toBe('validationResult')
          return {namedProfileName: 'profileName'}
        },
      },
      namedProfilesService: {
        validateNewProfileName: jest.fn(() => 'validationResult'),
      },
    }

    const command = new EditNamedProfile([], {} as any, leappCliService)
    const profileName = await command.getProfileName()
    expect(profileName).toBe('profileName')
    expect(leappCliService.namedProfilesService.validateNewProfileName).toHaveBeenCalledWith('profileName')
  })

  test('editNamedProfile', async () => {
    const leappCliService: any = {
      namedProfilesService: {
        editNamedProfile: jest.fn()
      }
    }

    const command = new EditNamedProfile([], {} as any, leappCliService)
    command.log = jest.fn()
    await command.editNamedProfile('profileId', 'profileName')

    expect(leappCliService.namedProfilesService.editNamedProfile).toHaveBeenCalledWith('profileId', 'profileName')
    expect(command.log).toHaveBeenCalledWith('profile edited')
  })

  test('run', async () => {
    await runCommand(undefined, '')
  })

  test('run - editNamedProfile throws exception', async () => {
    await runCommand(new Error('errorMessage'), 'errorMessage')
  })

  test('run - editNamedProfile throws undefined object', async () => {
    await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
  })

  async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
    const namedProfile = {id: '1'}
    const profileName = 'newName'

    const command = new EditNamedProfile([], {} as any)
    command.selectNamedProfile = jest.fn(async (): Promise<any> => namedProfile)
    command.getProfileName = jest.fn(async (): Promise<any> => profileName)
    command.editNamedProfile = jest.fn(async () => {
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
    expect(command.getProfileName).toHaveBeenCalled()
    expect(command.editNamedProfile).toHaveBeenCalledWith(namedProfile.id, profileName)
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage))
    }
  }
})

