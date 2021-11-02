import NativeService from './native-service';

export class KeychainService {
  private static instance: KeychainService;

  private constructor() {}

  static getInstance() {
    if(!this.instance) {
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
  saveSecret(service: string, account: string, password: string) {
    return NativeService.getInstance().keytar.setPassword(service, account, password);
  }

  /**
   * Retrieve a Secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @returns the secret
   */
  getSecret(service: string, account: string): any {
    return NativeService.getInstance().keytar.getPassword(service, account);
  }

  /**
   * Delete a secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   */
  deletePassword(service: string, account: string) {
    return NativeService.getInstance().keytar.deletePassword(service, account);
  }
}
