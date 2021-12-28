import { SessionType } from './session-type';
import { Session } from './session';
export class AwsIamUserSession extends Session {
    constructor(sessionName, region, profileId, mfaDevice) {
        super(sessionName, region);
        this.mfaDevice = mfaDevice;
        this.type = SessionType.awsIamUser;
        this.profileId = profileId;
    }
}
//# sourceMappingURL=aws-iam-user-session.js.map