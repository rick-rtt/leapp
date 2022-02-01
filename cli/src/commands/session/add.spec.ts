import { jest, describe, test, expect } from '@jest/globals'
import { CloudProviderType } from '@noovolari/leapp-core/models/cloud-provider-type'
import AddSession from './add'

describe('add session', () => {
  test('add', async () => {
    const leappCliService: any = {
      cloudProviderService: {
        availableCloudProviders: () => {
          return [CloudProviderType.AWS]
        },
        availableAccessMethods: () => {
          return [{label: 'accessMethod'}]
        }
      },
      sessionFactory: {
        createSession: jest.fn()
      }
    }

    let callCounter = 0
    let inquirer: any = {
      prompt: async (params: any) => {
        if (callCounter === 0) {

          expect(params).toEqual([{
            'name': 'selectedProvider',
            'message': 'select a provider',
            'type': 'list',
            'choices': [{'name': 'aws'}],
          }])
          callCounter++
          return {selectedProvider: 'aws'}
        } else if (callCounter === 1) {

          expect(params).toEqual([{
            'name': 'selectedMethod',
            'message': 'select an access method',
            'type': 'list',
            'choices': [{'name': 'accessMethod', 'value': {'label': 'accessMethod'}}],
          }])
          callCounter++
          return {
            selectedMethod: {
              accessMethodFields: [{
                creationRequestField: 'field',
                message: 'message',
                type: 'type',
                choices: [{fieldName: 'fieldName', fieldValue: 'fieldValue'}]
              }],
              getSessionCreationRequest: (fieldValues: any) => {
                expect(fieldValues).toEqual(new Map([['field', 'fieldValue']]))
                return 'sessionCreationRequest'
              },
              sessionType: 'sessionType'
            }
          }
        } else {

          expect(params).toEqual([{
            name: 'field',
            message: 'message',
            type: 'type',
            choices: [{name: 'fieldName', value: 'fieldValue'}]
          }])
          callCounter++
          return {field: 'fieldValue'}
        }

      }
    }

    const command = new AddSession([], {} as any, inquirer, leappCliService)
    command.log = jest.fn()
    await command.run()

    expect(leappCliService.sessionFactory.createSession).toHaveBeenCalledWith('sessionType', 'sessionCreationRequest')
    expect(command.log).toHaveBeenCalledWith('Session added')
  })
})
