import { AwsSessionService } from './aws-session-service'

describe('AwsSessionService', () => {

  test('getDependantSessions', () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ['session1', 'session2'])
    } as any
    const sessionNotifier = {
      getSessionById: jest.fn( () => 'session1')
    } as any

    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository)
    const sessionId = 'sessionId'

    const dependantSessions = awsSessionService.getDependantSessions(sessionId)

    expect(awsSessionService.repository.listIamRoleChained).toHaveBeenCalledWith('session1')
    expect(sessionNotifier.getSessionById).toHaveBeenCalledWith(sessionId)
    expect(dependantSessions).toEqual(['session1', 'session2'])
  });
});
