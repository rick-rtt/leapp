import { AccessMethod } from "@noovolari/leapp-core/models/access-method";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";
import { LeappCommand } from "../../leappCommand";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrlAccessMethodField } from "@noovolari/leapp-core/models/idp-url-access-method-field";
import CreateIdpUrl from "../idp-url/create";

export default class AddSession extends LeappCommand {
  static description = "Add a new session";
  static examples = ["$leapp session add"];

  constructor(argv: string[], config: Config, private createIdpUrlCommand: CreateIdpUrl = new CreateIdpUrl(argv, config)) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedCloudProvider = await this.chooseCloudProvider();
      const selectedAccessMethod = await this.chooseAccessMethod(selectedCloudProvider);
      const selectedParams = await this.chooseAccessMethodParams(selectedAccessMethod);
      await this.createSession(selectedAccessMethod, selectedParams);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async createSession(accessMethod: AccessMethod, selectedParams: Map<string, string>): Promise<void> {
    const creationRequest = accessMethod.getSessionCreationRequest(selectedParams);
    await this.leappCliService.sessionFactory.createSession(accessMethod.sessionType, creationRequest);
    this.log("session added");
  }

  async chooseCloudProvider(): Promise<CloudProviderType> {
    const availableCloudProviders = this.leappCliService.cloudProviderService.availableCloudProviders();
    const cloudProviderAnswer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedProvider",
        message: "select a provider",
        type: "list",
        choices: availableCloudProviders.map((cloudProvider) => ({ name: cloudProvider })),
      },
    ]);
    return cloudProviderAnswer.selectedProvider;
  }

  async chooseAccessMethod(cloudProviderType: CloudProviderType): Promise<AccessMethod> {
    const accessMethods = this.leappCliService.cloudProviderService.creatableAccessMethods(cloudProviderType);
    const accessMethodAnswer: any = await this.leappCliService.inquirer.prompt([
      {
        name: "selectedMethod",
        message: "select an access method",
        type: "list",
        choices: accessMethods.map((accessMethod) => ({ name: accessMethod.label, value: accessMethod })),
      },
    ]);
    return accessMethodAnswer.selectedMethod;
  }

  async chooseAccessMethodParams(selectedAccessMethod: AccessMethod): Promise<Map<string, string>> {
    const fieldValuesMap = new Map<string, string>();
    for (const field of selectedAccessMethod.accessMethodFields) {
      const fieldAnswer: any = await this.leappCliService.inquirer.prompt([
        {
          name: field.creationRequestField,
          message: field.message,
          type: field.type,
          choices: field.choices?.map((choice) => ({ name: choice.fieldName, value: choice.fieldValue })),
        },
      ]);
      let fieldAnswerValue = fieldAnswer[field.creationRequestField];
      if (field instanceof IdpUrlAccessMethodField && field.isIdpUrlToCreate(fieldAnswerValue)) {
        const newIdpUrl = await this.createIdpUrlCommand.promptAndCreateIdpUrl();
        fieldAnswerValue = newIdpUrl.id;
      }
      fieldValuesMap.set(field.creationRequestField, fieldAnswerValue);
    }

    return fieldValuesMap;
  }
}
