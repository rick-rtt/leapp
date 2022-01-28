import { AccessMethodFieldType } from './access-method-field-type'

export class AccessMethodField {
  constructor(public creationRequestField: string, public message: string, public type: AccessMethodFieldType,
              public choices?: string[]) {
  }
}
