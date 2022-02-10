import ListSessions from './list'
import { describe, expect, jest, test } from '@jest/globals'
import { SessionStatus } from '@noovolari/leapp-core/models/session-status'


describe('ShowSessions', () => {

  test('run', () => {

    const command = new ListSessions([], {} as any, {} as any)
    command.showSessions = jest.fn()
    command.run()
    expect(command.showSessions).toHaveBeenCalled()

  })

  test('showSessions', () => {

    const sessions = [
      {sessionName: 'sessionName1', status: SessionStatus.active},
      {sessionName: 'sessionName2', status: SessionStatus.pending},
      {sessionName: 'sessionName3', status: SessionStatus.inactive}]
    const leappCliService: any = {
      repository: {
        getSessions: jest.fn(() => {
          return sessions
        })
      }
    }
    const command = new ListSessions([], {} as any, leappCliService)
    command.log = jest.fn()
    command.showSessions()

    expect(leappCliService.repository.getSessions).toHaveBeenCalled()
    expect(command.log).toBeCalledTimes(4)
    expect(command.log).toHaveBeenCalledWith('sessions list:')
    expect(command.log).toHaveBeenCalledWith('- sessionName1')
    expect(command.log).toHaveBeenCalledWith('- sessionName2')
    expect(command.log).toHaveBeenCalledWith('- sessionName3')
  })
})
