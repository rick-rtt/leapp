// TODO: could we refactor it as an enum?
export var SessionType;
(function (SessionType) {
    SessionType["awsIamRoleFederated"] = "awsIamRoleFederated";
    SessionType["awsIamUser"] = "awsIamUser";
    SessionType["awsIamRoleChained"] = "awsIamRoleChained";
    SessionType["awsSsoRole"] = "awsSsoRole";
    SessionType["azure"] = "azure";
})(SessionType || (SessionType = {}));
//# sourceMappingURL=session-type.js.map