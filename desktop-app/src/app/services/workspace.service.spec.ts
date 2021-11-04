import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../../../core/models/workspace';
import {mustInjected} from '../../base-injectables';
import {Session} from '../../../core/models/session';
import {AwsIamUserSession} from '../../../core/models/aws-iam-user-session';
import {serialize} from 'class-transformer';
import {AppService} from './app.service';
import SpyObj = jasmine.SpyObj;
import {FileService} from '../../../core/services/file-service';
import Repository from '../../../core/services/repository';

describe('WorkspaceService', () => {
  let repository: Repository;
  let workspaceService: WorkspaceService;
  let workspace;
  let mockedSession;
  let spyAppService: SpyObj<AppService>;
  let spyFileService;

  beforeEach(() => {

    spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
    spyFileService.exists.and.returnValue(true);
    spyFileService.newDir.and.returnValue(true);
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
    spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );

    TestBed.configureTestingModule({
      providers: [
        Repository,
        WorkspaceService,
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService }
      ].concat(mustInjected())
    });

    repository = TestBed.inject(Repository) as Repository;
    repository.create();
    workspaceService = TestBed.inject(WorkspaceService) as WorkspaceService;

    mockedSession = new AwsIamUserSession('a', 'eu-west-1', 'profile', '');
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
  });

  describe('create()', () => {
    it('should persist code in the .Leapp-lock.json file the first time is called', () => {
      spyOn<any>(workspaceService, 'persist').and.callThrough();
      // Mock first time access
      spyFileService.exists.and.returnValue(false);
      spyFileService.newDir.and.returnValue(false);
      // Call create
      repository.create();
      expect((workspaceService as any).persist).toHaveBeenCalled();
    });

    it('should not create a second instance of Workspace after first one', () => {
      spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()));
      repository.create();
      const workspace1 = repository.get();
      workspace1.sessions.push(mockedSession);
      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace1) );
      (workspaceService as any).updatePersistedSessions(workspace1.sessions);

      repository.create();
      const workspace2 = repository.get();
      expect(serialize(workspace1)).toEqual(serialize(workspace2));
    });
  });

  describe('get()', () => {
    it('should return a workspace object', () => {
      workspace = repository.get();

      expect(workspace).toBeDefined();
      expect(workspace).toBeInstanceOf(Workspace);
    });
  });

  describe('getPersistedSessions()', () => {
    it('should return a Session array: Session[]', () => {
      workspace = new Workspace();

      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace));
      repository.get();

      workspace.sessions.push(mockedSession);

      expect((workspaceService as any).getPersistedSessions()).toBeInstanceOf(Array);
      expect((workspaceService as any).getPersistedSessions()[0]).toBeInstanceOf(Session);
    });
  });

  describe('get sessions()', () => {
    it('should return an array of sessions', () => {
      workspace = new Workspace();
      workspace.sessions.push(mockedSession);
      workspaceService.sessions = [...workspace.sessions];

      expect(workspaceService.sessions).toBeInstanceOf(Array);
      expect(workspaceService.sessions[0]).toBeInstanceOf(Session);
    });
  });

  describe('set sessions()', () => {
    it('should set sessions to an array of session', () => {
      workspace = new Workspace();
      workspace.sessions.push(mockedSession);

      workspaceService.sessions = [...workspace.sessions];

      expect(workspaceService.sessions).toBeInstanceOf(Array);
      expect(workspaceService.sessions[0]).toBeInstanceOf(Session);
    });

    it('should call next to notify observers', () => {
      workspace = new Workspace();
      workspace.sessions.push(mockedSession);

      spyOn((workspaceService as any)._sessions, 'next').and.callThrough();

      workspaceService.sessions = [...workspace.sessions];

      expect((workspaceService as any)._sessions.next).toHaveBeenCalled();
    });
  });

  describe('getProfileName()', () => {
    it('should return a profile name when an id matches', () => {
      workspace = new Workspace();
      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace));
      expect(repository.getProfileName(repository.get().profiles[0].id)).toEqual('default');
    });

    it('should return null  when an id NOT matches', () => {
      expect(repository.getProfileName('fakeid')).toEqual(null);
    });
  });

  describe('addSession()', () => {
    it('should add a session to the session array of workspace service', () => {
      const oldLength = workspaceService.sessions.length;
      workspaceService.addSession(mockedSession);
      expect(workspaceService.sessions.length).toEqual(oldLength + 1);
      expect(serialize(workspaceService.sessions[oldLength])).toEqual(serialize(mockedSession));
    });

    it('should invoke next and persist data', () => {

      spyOn((workspaceService as any)._sessions, 'next').and.callThrough();
      spyOn<any>(workspaceService, 'persist').and.callThrough();

      workspaceService.addSession(mockedSession);

      expect((workspaceService as any)._sessions.next).toHaveBeenCalled();
      expect((workspaceService as any).persist).toHaveBeenCalled();
    });
  });

  describe('removeSession()', () => {
    it('should remove a session from the workspace sessions', () => {

      workspaceService.addSession(mockedSession);

      const sessionId = mockedSession.sessionId;
      const oldLength = workspaceService.sessions.length;
      workspaceService.removeSession(sessionId);

      expect(workspaceService.sessions.length).toEqual(oldLength - 1);
      expect(workspaceService.sessions.find(s => s.sessionId === sessionId)).toBeUndefined();
    });
  });
});
