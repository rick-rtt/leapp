import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../../../core/services/logging-service';

export class LeappExecuteError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Execute Error', context, LoggerLevel.warn, message);
  }
}
