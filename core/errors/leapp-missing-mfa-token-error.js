import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappMissingMfaTokenError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Missing Mfa Token Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-missing-mfa-token-error.js.map