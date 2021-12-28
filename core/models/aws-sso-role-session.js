import { SessionType } from './session-type';
import { Session } from './session';
export class AwsSsoRoleSession extends Session {
    constructor(sessionName, region, roleArn, profileId, email) {
        super(sessionName, region);
        this.email = email;
        this.roleArn = roleArn;
        this.profileId = profileId;
        this.type = SessionType.awsSsoRole;
    }
}
//# sourceMappingURL=aws-sso-role-session.js.map