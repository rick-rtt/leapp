import { SessionFactory } from "./session-factory";
import { Repository } from "./repository";
import * as uuid from "uuid";
import { Session } from "../models/session";
import { IdpUrl } from "../models/idp-url";
import { AwsIamRoleFederatedSession } from "../models/aws-iam-role-federated-session";

export class IdpUrlsService {
  constructor(private sessionFactory: SessionFactory, private repository: Repository) {}

  getIdpUrls(): IdpUrl[] {
    return this.repository.getIdpUrls();
  }

  createIdpUrl(idpUrl: string): IdpUrl {
    const newIdpUrl = new IdpUrl(this.getNewId(), idpUrl.trim());
    this.repository.addIdpUrl(newIdpUrl);
    return newIdpUrl;
  }

  editIdpUrl(id: string, newIdpUrl: string): void {
    this.repository.updateIdpUrl(id, newIdpUrl.trim());
  }

  async deleteIdpUrl(id: string): Promise<void> {
    for (const sessionToDelete of this.getDependantSessions(id, false)) {
      const sessionService = this.sessionFactory.getSessionService(sessionToDelete.type);
      await sessionService.delete(sessionToDelete.sessionId);
    }
    this.repository.removeIdpUrl(id);
  }

  validateIdpUrl(url: string): boolean | string {
    const trimmedUrl = url.trim();
    if (trimmedUrl.length === 0) {
      return "Empty IdP URL";
    }
    const existingUrls = this.getIdpUrls().map((idpUrl) => idpUrl.url);
    if (existingUrls.includes(trimmedUrl)) {
      return "IdP URL already exists";
    }
    return true;
  }

  getDependantSessions(idpUrlId: string, includingChained: boolean = true): Session[] {
    const dependantSessions = this.repository.getSessions().filter((session) => (session as AwsIamRoleFederatedSession).idpUrlId === idpUrlId);
    return includingChained
      ? dependantSessions.flatMap((parentSession) => [parentSession, ...this.repository.listIamRoleChained(parentSession)])
      : dependantSessions;
  }

  private getNewId() {
    return uuid.v4();
  }
}
