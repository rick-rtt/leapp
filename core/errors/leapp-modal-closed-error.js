import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappModalClosedError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Modal Closed', context, LoggerLevel.info, message);
    }
}
//# sourceMappingURL=leapp-modal-closed-error.js.map