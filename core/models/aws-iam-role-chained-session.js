import { SessionType } from './session-type';
import { Session } from './session';
export class AwsIamRoleChainedSession extends Session {
    constructor(sessionName, region, roleArn, profileId, parentSessionId, roleSessionName) {
        super(sessionName, region);
        this.roleArn = roleArn;
        this.profileId = profileId;
        this.parentSessionId = parentSessionId;
        this.type = SessionType.awsIamRoleChained;
        this.roleSessionName = roleSessionName ? roleSessionName : `assumed-from-leapp`;
    }
}
//# sourceMappingURL=aws-iam-role-chained-session.js.map