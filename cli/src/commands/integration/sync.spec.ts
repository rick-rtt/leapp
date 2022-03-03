import {jest, describe, test, expect} from '@jest/globals'
import SyncIntegration from './sync'

describe('SyncIntegration', () => {

  test('selectIntegration', async () => {
    const integration = {alias: 'integration1'}
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getOnlineIntegrations: jest.fn(() => [integration]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([{
            name: 'selectedIntegration',
            message: 'select an integration',
            type: 'list',
            choices: [{name: integration.alias, value: integration}],
          }])
          return {selectedIntegration: integration}
        },
      },
    }

    const command = new SyncIntegration([], {} as any, leappCliService)
    const selectedIntegration = await command.selectIntegration()

    expect(leappCliService.awsSsoIntegrationService.getOnlineIntegrations).toHaveBeenCalled()
    expect(selectedIntegration).toBe(integration)
  })

  test('selectIntegration, no integrations', async () => {
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getOnlineIntegrations: jest.fn(() => []),
      },
    }

    const command = new SyncIntegration([], {} as any, leappCliService)
    await expect(command.selectIntegration()).rejects.toThrow(new Error('no online integrations available'))
  })

  test('sync', async () => {
    const sessionsSynced = ['session1', 'session2']
    const leappCliService: any = {
      awsSsoIntegrationService: {
        syncSessions: jest.fn(async () => sessionsSynced),
      }
    }

    const command = new SyncIntegration([], {} as any, leappCliService)
    command.log = jest.fn()

    const integration = {id: 'id1'} as any
    await command.sync(integration)

    expect(leappCliService.awsSsoIntegrationService.syncSessions).toHaveBeenCalledWith(integration.id)
    expect(command.log).toHaveBeenCalledWith(`${sessionsSynced.length} sessions synchronized`)
  })

  test('run', async () => {
    await runCommand(undefined, '')
  })

  test('run - sync throws exception', async () => {
    await runCommand(new Error('errorMessage'), 'errorMessage')
  })

  test('run - sync throws undefined object', async () => {
    await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
  })

  async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
    const selectedIntegration = {id: '1'}

    const command = new SyncIntegration([], {} as any, null)
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration)
    command.sync = jest.fn(async () => {
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

    expect(command.selectIntegration).toHaveBeenCalled()
    expect(command.sync).toHaveBeenCalledWith(selectedIntegration)
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage))
    }
  }
})

