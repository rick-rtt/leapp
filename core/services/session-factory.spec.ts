import { jest, describe, test, expect } from "@jest/globals";
import { SessionType } from "../models/session-type";
import { SessionFactory } from "./session-factory";
import { CreateSessionRequest } from "./session/create-session-request";

describe("sessionFactory", () => {
  test("getSessionService", () => {
    const awsIamUserService: any = { name: "IamUser" };
    const awsIamRoleFederatedService: any = { name: "IamRoleFederated" };
    const awsIamRoleChainedService: any = { name: "IamRoleChained" };
    const awsSsoRoleService: any = { name: "SsoRole" };
    const azureService: any = { name: "Azure" };
    const sessionFactory = new SessionFactory(
      awsIamUserService,
      awsIamRoleFederatedService,
      awsIamRoleChainedService,
      awsSsoRoleService,
      azureService
    );

    expect((sessionFactory.getSessionService(SessionType.awsIamUser) as any).name).toEqual("IamUser");
    expect((sessionFactory.getSessionService(SessionType.awsIamRoleFederated) as any).name).toEqual("IamRoleFederated");
    expect((sessionFactory.getSessionService(SessionType.awsIamRoleChained) as any).name).toEqual("IamRoleChained");
    expect((sessionFactory.getSessionService(SessionType.awsSsoRole) as any).name).toEqual("SsoRole");
    expect((sessionFactory.getSessionService(SessionType.azure) as any).name).toEqual("Azure");
  });

  test("createSession", async () => {
    const fakeSessionService: any = { create: jest.fn() };
    const sessionFactory = new SessionFactory(null, null, null, null, null);
    sessionFactory.getSessionService = (sessionType: SessionType) => {
      expect(sessionType).toEqual(SessionType.azure);
      return fakeSessionService;
    };
    const createSessionRequest = { sessionName: "sessionName1" } as CreateSessionRequest;

    await sessionFactory.createSession(SessionType.azure, createSessionRequest);
    expect(fakeSessionService.create).toHaveBeenCalledWith(createSessionRequest);
  });
});
