import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappAwsStsError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Aws Sts Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-aws-sts-error.js.map