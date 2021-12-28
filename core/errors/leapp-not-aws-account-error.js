import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappNotAwsAccountError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Not aws Account Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-not-aws-account-error.js.map