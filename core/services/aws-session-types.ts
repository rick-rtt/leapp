import { SessionType } from '../models/session-type'

export const AwsSessionTypes = [
  SessionType.awsIamUser,
  SessionType.awsIamRoleFederated,
  SessionType.awsIamRoleChained,
  SessionType.awsSsoRole
]
