import {INativeService} from "../interfaces/i-native-service";


export class KeychainService {
  constructor(private nativeService: INativeService) {}

  /**
   * Save your secret in the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @param password - secret
   */
  saveSecret(service: string, account: string, password: string) {
    return this.nativeService.keytar.setPassword(service, account, password);
  }

  /**
   * Retrieve a Secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @returns the secret
   */
  getSecret(service: string, account: string): any {
    return this.nativeService.keytar.getPassword(service, account);
  }

  /**
   * Delete a secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   */
  deletePassword(service: string, account: string) {
    return this.nativeService.keytar.deletePassword(service, account);
  }
}
