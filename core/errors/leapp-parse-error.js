import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappParseError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Parse Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-parse-error.js.map