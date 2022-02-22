import {SessionType} from '../models/session-type'

export const AwsAssumableSessionTypes = [
    SessionType.awsIamUser,
    SessionType.awsIamRoleFederated,
    SessionType.awsSsoRole
]
