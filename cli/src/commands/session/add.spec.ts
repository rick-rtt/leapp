import { jest, describe, test, expect } from '@jest/globals'
import { CloudProviderType } from '@noovolari/leapp-core/models/cloud-provider-type'
import AddSession from './add'

describe('add session', () => {
  test('chooseCloudProvider', async () => {
    const leappCliService: any = {
      cloudProviderService: {
        availableCloudProviders: () => {
          return [CloudProviderType.AWS]
        }
      }
    }

    const inquirer: any = {
      prompt: async (params: any) => {
        expect(params).toEqual([{
          'name': 'selectedProvider',
          'message': 'select a provider',
          'type': 'list',
          'choices': [{'name': 'aws'}],
        }])
        return {selectedProvider: 'aws'}
      }
    }

    const command = new AddSession([], {} as any, inquirer, leappCliService)
    const selectedCloudProvider = await command.chooseCloudProvider()
    expect(selectedCloudProvider).toBe('aws')
  })

  test('chooseAccessMethod', async () => {
    const leappCliService: any = {
      cloudProviderService: {
        availableAccessMethods: () => {
          return [{label: 'IAmUser'}]
        }
      }
    }
    const inquier: any = {
      prompt: (param: any) => {
        expect(param).toEqual([
          {
            'choices': [{'name': 'IAmUser', 'value': {'label': 'IAmUser'}}],
            'message': 'select an access method',
            'name': 'selectedMethod',
            'type': 'list'
          }
        ])
        return {selectedMethod: 'Method'}
      }
    }
    const command = new AddSession([], {} as any, inquier, leappCliService)
    const accessMethod = await command.chooseAccessMethod(CloudProviderType.AWS)
    expect(accessMethod).toStrictEqual('Method')
  })

  test('chooseAccessMethodParams', async () => {
    const expectedMap: any = new Map<string, {}>([['field', {name: 'choice1', value: 'choice1value'}]])
    const selectedAccessMethod: any = {
      accessMethodFields: [
        {
          creationRequestField: 'field', message: 'message', type: 'type', choices: [
            {fieldName: 'choice1', fieldValue: 'choice1value'}
          ]
        }
      ]
    }
    const inquier: any = {
      prompt: (params: any) => {
        expect(params).toStrictEqual([{
          name: 'field',
          message: 'message',
          type: 'type',
          choices: [{name: 'choice1', value: 'choice1value'}]
        }])
        return {field: {name: 'choice1', value: 'choice1value'}}
      }
    }

    const command = new AddSession([], {} as any, inquier, undefined)
    const map = await command.chooseAccessMethodParams(selectedAccessMethod)
    expect(map).toEqual(expectedMap)
  })

  test('createSession', async () => {
    const selectedParams = new Map<string, string>([['name', 'prova']])
    const accessMethod: any = {
      getSessionCreationRequest: (params: any) => {
        expect(params).toEqual(selectedParams)
        return 'creationRequest'
      }, sessionType: 'sessionType'
    }

    const leappCliService: any = {sessionFactory: {createSession: jest.fn()}}
    const command = new AddSession([], {} as any, undefined, leappCliService)
    command.log = jest.fn()

    await command.createSession(accessMethod, selectedParams)
    expect(leappCliService.sessionFactory.createSession).toHaveBeenCalledWith('sessionType', 'creationRequest')
    expect(command.log).toHaveBeenCalledWith('Session added')
  })

  test('run', async () => {
    await runCommand(undefined, '')
  })

  test('run - createSession throws exception', async () => {
    await runCommand(new Error('errorMessage'), 'errorMessage')
  })

  test('run - createSession throws undefined object', async () => {
    await runCommand({hello:'randomObj'}, 'Unknown error: [object Object]')
  })

  async function runCommand(errorToThrow: any, expectedErrorMessage: string){
    const cloudProvider = 'cloudProvider'
    const accessMethod = 'accessMethod'
    const params = 'params'
    const command = new AddSession([], {} as any, undefined, undefined)
    command.chooseCloudProvider = jest.fn(async (): Promise<any> => {
      return cloudProvider
    })
    command.chooseAccessMethod = jest.fn(async (): Promise<any> => {
      return accessMethod
    })
    command.chooseAccessMethodParams = jest.fn(async (): Promise<any> => {
      return params
    })
    command.createSession = jest.fn(async (): Promise<void> => {
      if(errorToThrow){
        throw errorToThrow
      }
    })

    let occurredError
    try {
      await command.run()
    }
    catch (error){
      occurredError = error
    }

    expect(command.chooseCloudProvider).toHaveBeenCalled()
    expect(command.chooseAccessMethod).toHaveBeenCalledWith(cloudProvider)
    expect(command.chooseAccessMethodParams).toHaveBeenCalledWith(accessMethod)
    expect(command.createSession).toHaveBeenCalledWith(accessMethod, params)
    if (errorToThrow){
      expect(occurredError).toEqual(new Error(expectedErrorMessage))
    }
  }
})

