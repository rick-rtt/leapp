import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SessionsComponent } from "./sessions.component";
import { mustInjected } from "../../../base-injectables";

describe("SessionComponent", () => {
  let component: SessionsComponent;
  let fixture: ComponentFixture<SessionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SessionsComponent],
      providers: [].concat(mustInjected()),
      imports: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
