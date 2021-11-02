import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../../../core/services/logging-service';

export class LeappSamlError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Saml Error', context, LoggerLevel.warn, message);
  }
}
