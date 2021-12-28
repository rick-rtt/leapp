var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Input } from '@angular/core';
import { constants } from "../../../../../../core/models/constants";
let ConfirmationDialogComponent = class ConfirmationDialogComponent {
    /* Just a restyled modal to show a confirmation for delete actions */
    constructor(bsModalRef) {
        this.bsModalRef = bsModalRef;
    }
    ngOnInit() {
    }
    /**
     * Launch a callback on yes (which is the actual action), then close
     */
    confirm() {
        if (this.callback) {
            this.callback(constants.confirmed);
            this.close();
        }
    }
    close() {
        this.bsModalRef.hide();
        this.callback(constants.confirmClosed);
    }
};
__decorate([
    Input()
], ConfirmationDialogComponent.prototype, "message", void 0);
__decorate([
    Input()
], ConfirmationDialogComponent.prototype, "callback", void 0);
ConfirmationDialogComponent = __decorate([
    Component({
        selector: 'app-confirmation-dialog',
        templateUrl: './confirmation-dialog.component.html',
        styleUrls: ['./confirmation-dialog.component.scss']
    })
], ConfirmationDialogComponent);
export { ConfirmationDialogComponent };
//# sourceMappingURL=confirmation-dialog.component.js.map