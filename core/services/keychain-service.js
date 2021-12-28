import NativeService from './native-service';
export class KeychainService {
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new KeychainService();
        }
        return this.instance;
    }
    /**
     * Save your secret in the keychain
     *
     * @param service - environment.appName
     * @param account - unique identifier
     * @param password - secret
     */
    saveSecret(service, account, password) {
        return NativeService.getInstance().keytar.setPassword(service, account, password);
    }
    /**
     * Retrieve a Secret from the keychain
     *
     * @param service - environment.appName
     * @param account - unique identifier
     * @returns the secret
     */
    getSecret(service, account) {
        return NativeService.getInstance().keytar.getPassword(service, account);
    }
    /**
     * Delete a secret from the keychain
     *
     * @param service - environment.appName
     * @param account - unique identifier
     */
    deletePassword(service, account) {
        return NativeService.getInstance().keytar.deletePassword(service, account);
    }
}
//# sourceMappingURL=keychain-service.js.map