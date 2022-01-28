import { AccessMethodField } from './access-method-field'
import { SessionType } from './session-type'

export class AccessMethod {
  constructor(public sessionType: SessionType, public label: string, public accessMethodFields: AccessMethodField[]) {
  }

  getSessionCreationRequest(fieldValues: Map<string, string>):any {
    const requestToFill = {}
    for (const field of this.accessMethodFields) {
      requestToFill[field.creationRequestField] = fieldValues.get(field.creationRequestField)
    }
  }
}
