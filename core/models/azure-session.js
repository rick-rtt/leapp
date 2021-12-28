import { SessionType } from './session-type';
import { Session } from './session';
export class AzureSession extends Session {
    constructor(sessionName, region, subscriptionId, tenantId) {
        super(sessionName, region);
        this.subscriptionId = subscriptionId;
        this.tenantId = tenantId;
        this.type = SessionType.azure;
    }
}
//# sourceMappingURL=azure-session.js.map