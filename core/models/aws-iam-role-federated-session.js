import { SessionType } from './session-type';
import { Session } from './session';
export class AwsIamRoleFederatedSession extends Session {
    constructor(sessionName, region, idpUrlId, idpArn, roleArn, profileId) {
        super(sessionName, region);
        this.idpUrlId = idpUrlId;
        this.idpArn = idpArn;
        this.roleArn = roleArn;
        this.profileId = profileId;
        this.type = SessionType.awsIamRoleFederated;
    }
}
//# sourceMappingURL=aws-iam-role-federated-session.js.map