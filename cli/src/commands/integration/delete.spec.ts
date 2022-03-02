import {jest, describe, test, expect} from '@jest/globals'
import DeleteIntegration from "./delete";

describe('DeleteIntegration', () => {

  test('selectIntegration', async () => {
    const integration = {alias: 'integration1'}
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getIntegrations: jest.fn(() => [integration]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([{
            name: 'selectedIntegration',
            message: 'select an integration to delete',
            type: 'list',
            choices: [{name: integration.alias, value: integration}],
          }])
          return {selectedIntegration: integration}
        },
      },
    }

    const command = new DeleteIntegration([], {} as any, leappCliService)
    const selectedIntegration = await command.selectIntegration()

    expect(leappCliService.awsSsoIntegrationService.getIntegrations).toHaveBeenCalled()
    expect(selectedIntegration).toBe(integration)
  })

  test('selectIntegration, no integrations', async () => {
    const leappCliService: any = {
      awsSsoIntegrationService: {
        getIntegrations: jest.fn(() => []),
      },
    }

    const command = new DeleteIntegration([], {} as any, leappCliService)
    await expect(command.selectIntegration()).rejects.toThrow(new Error('no integrations available'))
  })

  test('delete', async () => {
    const leappCliService: any = {
      awsSsoIntegrationService: {
        deleteIntegration: jest.fn(),
      },
    }

    const command = new DeleteIntegration([], {} as any, leappCliService)
    command.log = jest.fn()

    const integration = {id: 'integration1'} as any
    await command.delete(integration)

    expect(leappCliService.awsSsoIntegrationService.deleteIntegration).toHaveBeenCalledWith(integration.id)
    expect(command.log).toHaveBeenLastCalledWith('integration deleted')
  })

  test('run', async () => {
    await runCommand(undefined, '')
  })

  test('run - delete throws exception', async () => {
    await runCommand(new Error('errorMessage'), 'errorMessage')
  })

  test('run - delete throws undefined object', async () => {
    await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
  })

  async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
    const selectedIntegration = {id: '1'}

    const command = new DeleteIntegration([], {} as any, null)
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration)
    command.delete = jest.fn(async () => {
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
    expect(command.delete).toHaveBeenCalledWith(selectedIntegration)
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage))
    }
  }
})

