import * as uuid from 'uuid';
import { SessionStatus } from './session-status';
import { constants } from './constants';
export class Session {
    constructor(sessionName, region) {
        this.sessionId = uuid.v4();
        this.sessionName = sessionName;
        this.status = SessionStatus.inactive;
        this.startDateTime = undefined;
        this.region = region;
    }
    expired() {
        if (this.startDateTime === undefined) {
            return false;
        }
        const currentTime = new Date().getTime();
        const startTime = new Date(this.startDateTime).getTime();
        return (currentTime - startTime) / 1000 > constants.sessionDuration;
    }
    ;
}
//# sourceMappingURL=session.js.map