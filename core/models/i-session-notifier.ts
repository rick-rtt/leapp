import {Session} from './session';

export default interface ISessionNotifier  {
  addSession(session: Session): void;
  setSessions(sessions: Session[]): void;
  getSession(sessionId: string): Session;
  getSessions(): Session[];
  deleteSession(sessionId: string): void;

  listIamRoleChained(session: Session): Session[];
  listAwsSsoRoles(): Session[];

  listPending(): Session[];
  listActive(): Session[];
}
