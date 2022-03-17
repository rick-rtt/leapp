import { CloudProviderType } from "../models/cloud-provider-type";

const authenticationUrlRegexes = new Map([
  [
    CloudProviderType.aws,
    [
      /^https:\/\/.*\.onelogin\.com\/.*/,
      /^https:\/\/.*\/adfs\/ls\/idpinitiatedsignon.*loginToRp=urn:amazon:webservices.*/,
      /^https:\/\/.*\.okta\.com\/.*/,
      /^https:\/\/accounts\.google\.com\/ServiceLogin.*/,
      /^https:\/\/login\.microsoftonline\.com\/.*\/oauth2\/authorize.*/,
    ],
  ],
]);
const samlAssertionRegexes = new Map([[CloudProviderType.aws, [/^https:\/\/signin\.aws\.amazon\.com\/saml/]]]);

export class AuthenticationService {
  isAuthenticationUrl(cloudProvider: CloudProviderType, url: string): boolean {
    return authenticationUrlRegexes.get(cloudProvider).some((regex) => regex.test(url));
  }

  isSamlAssertionUrl(cloudProvider: CloudProviderType, url: string): boolean {
    return samlAssertionRegexes.get(cloudProvider).some((regex) => regex.test(url));
  }
}
