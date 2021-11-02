import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../../../core/services/logging-service';

export class LeappNotAwsAccountError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Not aws Account Error', context, LoggerLevel.warn, message);
  }
}
