import {FieldChoice} from '../services/field-choice'
import {AccessMethodFieldType} from './access-method-field-type'
import {AccessMethodField} from './access-method-field'
import {CreateNewIdpUrlFieldChoice} from '../services/cloud-provider-service'

export class IdpUrlAccessMethodField extends AccessMethodField {
    constructor(public creationRequestField: string, public message: string, public type: AccessMethodFieldType,
                public choices?: FieldChoice[]) {
        super(creationRequestField, message, type, choices)
    }

    isIdpUrlToCreate(choiceValue: string): boolean {
        return choiceValue === CreateNewIdpUrlFieldChoice
    }
}
