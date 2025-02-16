import { jest, describe, test, expect } from "@jest/globals";
import { IdpUrlsService } from "./idp-urls-service";
import { IdpUrl } from "../models/idp-url";

describe("IdpUrlsService", () => {
  test("getIdpUrls", () => {
    const repository = {
      getIdpUrls: () => [{ id: "1" }, { id: "2" }],
    };
    const idpUrlsService = new IdpUrlsService(null, repository as any);
    const idpUrls = idpUrlsService.getIdpUrls();

    expect(idpUrls).toEqual([{ id: "1" }, { id: "2" }]);
  });

  test("createIdpUrl", () => {
    const repository = {
      addIdpUrl: jest.fn(),
    };
    const idpUrlsService = new IdpUrlsService(null, repository as any);
    (idpUrlsService as any).getNewId = () => "newId";

    const newIdpUrl = idpUrlsService.createIdpUrl("  newUrl  ");

    expect(repository.addIdpUrl).toHaveBeenCalledWith(new IdpUrl("newId", "newUrl"));
    expect(newIdpUrl).toEqual(new IdpUrl("newId", "newUrl"));
  });

  test("editIdpUrl", () => {
    const repository = {
      updateIdpUrl: jest.fn(),
    };
    const idpUrlsService = new IdpUrlsService(null, repository as any);

    idpUrlsService.editIdpUrl("id", "  newUrl  ");

    expect(repository.updateIdpUrl).toHaveBeenCalledWith("id", "newUrl");
  });

  test("getDependantSessions, includingChained", () => {
    const session1 = { idpUrlId: "id1" };
    const session2 = { idpUrlId: "id2" };
    const session3 = { idpUrlId: "id1" };
    const trustedSessions1 = [{ trusted: "1" }, { trusted: "2" }];
    const trustedSessions3 = [{ trusted: "3" }, { trusted: "4" }];

    const repository = {
      getSessions: () => [session1, session2, session3],
      listIamRoleChained: (session) => {
        if (session === session1) {
          return trustedSessions1;
        } else {
          expect(session).toEqual(session3);
          return trustedSessions3;
        }
      },
    };
    const idpUrlsService = new IdpUrlsService(null, repository as any);
    const dependantSessions = idpUrlsService.getDependantSessions("id1");

    expect(dependantSessions).toEqual([session1, ...trustedSessions1, session3, ...trustedSessions3]);
  });

  test("getDependantSessions, not includingChained", () => {
    const session1 = { idpUrlId: "id1" };
    const session2 = { idpUrlId: "id2" };
    const session3 = { idpUrlId: "id1" };

    const repository = {
      getSessions: () => [session1, session2, session3],
    };
    const idpUrlsService = new IdpUrlsService(null, repository as any);
    const dependantSessions = idpUrlsService.getDependantSessions("id1", false);

    expect(dependantSessions).toEqual([session1, session3]);
  });

  test("deleteIdpUrl", async () => {
    const sessionService = {
      delete: jest.fn(),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    };
    const repository = {
      removeIdpUrl: jest.fn(),
    };
    const idpUrlsService = new IdpUrlsService(sessionFactory as any, repository as any);
    idpUrlsService.getDependantSessions = jest.fn(() => [{ sessionId: "sessionId", type: "sessionType" } as any]);

    await idpUrlsService.deleteIdpUrl("id");

    expect(idpUrlsService.getDependantSessions).toHaveBeenCalledWith("id", false);
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.delete).toHaveBeenCalledWith("sessionId");
    expect(repository.removeIdpUrl).toHaveBeenCalledWith("id");
  });

  test("getNewId", () => {
    const idpUrlsService = new IdpUrlsService(null, null) as any;
    const id1 = idpUrlsService.getNewId();
    const id2 = idpUrlsService.getNewId();
    expect(id1).not.toEqual(id2);
  });

  test("validateIdpUrl", () => {
    const idpUrlsService = new IdpUrlsService(null, null);
    idpUrlsService.getIdpUrls = () => [];

    expect(idpUrlsService.validateIdpUrl("www.url.com")).toBe(true);
  });

  test("validateIdpUrl, empty url", () => {
    const idpUrlsService = new IdpUrlsService(null, null);
    expect(idpUrlsService.validateIdpUrl("")).toBe("Empty IdP URL");
  });

  test("validateIdpUrl, whitespaces url", () => {
    const idpUrlsService = new IdpUrlsService(null, null);
    expect(idpUrlsService.validateIdpUrl("  ")).toBe("Empty IdP URL");
  });

  test("validateIdpUrl, existent url", () => {
    const idpUrlsService = new IdpUrlsService(null, null);
    idpUrlsService.getIdpUrls = () => [new IdpUrl("1", "url1")];

    expect(idpUrlsService.validateIdpUrl(" url1 ")).toBe("IdP URL already exists");
  });
});
