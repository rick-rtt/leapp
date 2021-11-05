import {Session} from '../models/session';

export default interface ISessionNotifier  {
  getSessions(): Session[];
  getSessionById(sessionId: string): Session;
  setSessions(sessions: Session[]): void;
  addSession(session: Session): void;
  deleteSession(sessionId: string): void;
  listPending(): Session[];
  listActive(): Session[];
  listAwsSsoRoles(): Session[];
  listIamRoleChained(session: Session): Session[];
}
