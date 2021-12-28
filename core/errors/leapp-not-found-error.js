import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappNotFoundError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Not Found Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-not-found-error.js.map