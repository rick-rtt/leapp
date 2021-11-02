import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../../../core/services/logging-service';

export class LeappParseError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Parse Error', context, LoggerLevel.warn, message);
  }
}
