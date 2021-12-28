import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappExecuteError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Execute Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-execute-error.js.map