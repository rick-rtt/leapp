import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CommandBarComponent } from "./command-bar.component";
import { mustInjected } from "../../../base-injectables";
import { LeappCoreService } from "../../services/leapp-core.service";

describe("CommandBarComponent", () => {
  let component: CommandBarComponent;
  let fixture: ComponentFixture<CommandBarComponent>;

  beforeEach(async () => {
    const spyWorkspaceService = jasmine.createSpyObj("WorkspaceService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      workspaceService: spyWorkspaceService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [] },
    });
    await TestBed.configureTestingModule({
      declarations: [CommandBarComponent],
      providers: [].concat(mustInjected().concat({ provide: LeappCoreService, useValue: spyLeappCoreService })),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
