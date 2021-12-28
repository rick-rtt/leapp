import { LeappBaseError } from './leapp-base-error';
import { LoggerLevel } from '../services/logging-service';
export class LeappSamlError extends LeappBaseError {
    constructor(context, message) {
        super('Leapp Saml Error', context, LoggerLevel.warn, message);
    }
}
//# sourceMappingURL=leapp-saml-error.js.map