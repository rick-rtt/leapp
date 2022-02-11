import ListSessions from './list'
import { CliUx } from '@oclif/core'
import { describe, expect, jest, test } from '@jest/globals'
import { AwsIamUserSession } from '@noovolari/leapp-core/models/aws-iam-user-session'
import { SessionType } from '@noovolari/leapp-core/models/session-type'

describe('ListSessions', () => {
  test('run', async () => {
    const command = new ListSessions([], {} as any)
    command.showSessions = jest.fn()
   await command.run()

    expect(command.showSessions).toHaveBeenCalled()
  })

  test('run - showSessions throw an error', async ()=>{
    const command = new ListSessions([], {} as any, {} as any)
    command.showSessions = jest.fn(async ()=>{ throw Error('error')})
    try {
      await command.run()
    }catch (error) {
      expect(error).toEqual(new Error('error'))
    }
  })

  test('run - showSessions throw an object', async()=>{
    const command = new ListSessions([], {} as any, {} as any)
    command.showSessions = jest.fn(async()=>{throw 'string'})
    try {
     await command.run()
    }catch (error) {
      expect(error).toEqual(new Error('Unknown error: string'))
    }
  })

  test('showSessions', async () => {
    const sessions = [new AwsIamUserSession('sessionName', 'region', 'profileId',)]
    const namedProfileMap = new Map([['profileId', {id: 'profileId', name: 'profileName'}]])
    const sessionTypeMap = new Map([[SessionType.awsIamUser, 'sessionTypeLabel']])
    const leapCliService: any = {
      repository: {
        getSessions: () => {
          return sessions
        },
        getProfilesMap: () => {
          return namedProfileMap
        }
      },
      cloudProviderService: {
        getSessionTypeMap: () => {
          return sessionTypeMap
        }
      }
    }

    const command = new ListSessions([], {} as any, leapCliService)
    command.log = jest.fn()
    const tableSpy = jest.spyOn(CliUx.ux, 'table')

    await command.showSessions()
    expect(command.log).toHaveBeenCalledWith('sessions list:')
    expect(tableSpy.mock.calls[0][0]).toEqual(sessions)
  })
})
