import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  globalFilteredSessions,
  globalHasFilter,
  globalResetFilter,
  globalSegmentFilter
} from '../command-bar/command-bar.component';
import {BehaviorSubject} from 'rxjs';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ConfirmationDialogComponent} from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import Segment from '@noovolari/leapp-core/models/Segment';
import Folder from '@noovolari/leapp-core/models/folder';
import {WorkspaceService} from '@noovolari/leapp-core/services/workspace-service';
import {Session} from '@noovolari/leapp-core/models/session';
import {Repository} from '@noovolari/leapp-core/services/repository';
import {LeappCoreService} from '../../services/leapp-core.service';
import {constants} from '@noovolari/leapp-core/models/constants';
import {integrationHighlight} from '../integration-bar/integration-bar.component';

export interface SelectedSegment {
  name: string;
  selected: boolean;
}

export interface HighlightSettings {
  showAll: boolean;
  showPinned: boolean;
  selectedSegment?: number;
}

export const segmentFilter = new BehaviorSubject<Segment[]>([]);
// eslint-disable-next-line max-len
export const sidebarHighlight = new BehaviorSubject<HighlightSettings>({ showAll: false, showPinned: true, selectedSegment: -1 });

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit, OnDestroy {

  folders: Folder[];
  segments: Segment[];
  selectedS: SelectedSegment[];
  subscription;
  showAll: boolean;
  showPinned: boolean;
  modalRef: BsModalRef;

  private repository: Repository;
  private workspaceService: WorkspaceService;

  constructor(private bsModalService: BsModalService,
              private leappCoreService: LeappCoreService,
  ) {
    this.repository = leappCoreService.repository;
    this.workspaceService = leappCoreService.workspaceService;
    this.showAll = true;
    this.showPinned = false;
  }

  public ngOnInit(): void {
    this.subscription = segmentFilter.subscribe((segments) => {
      this.segments = segments;
      this.selectedS = this.segments.map((segment) => ({ name: segment.name, selected: false }));
    });
    segmentFilter.next(this.repository.getSegments());

    sidebarHighlight.subscribe((value) => {
      this.highlightSelectedRow(value.showAll, value.showPinned, value.selectedSegment);
    });
    sidebarHighlight.next({showAll: true, showPinned: false, selectedSegment: -1});
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public resetFilters(): void {
    this.showAll = true;
    this.showPinned = false;
    this.selectedS.forEach((s) => s.selected = false);
    globalFilteredSessions.next(this.workspaceService.sessions);
    globalHasFilter.next(false);
    globalResetFilter.next(true);
  }

  public showOnlyPinned(): void {
    this.showAll = false;
    this.showPinned = true;
    this.selectedS.forEach((s) => s.selected = false);

    globalFilteredSessions.next(this.workspaceService.sessions.filter(
      (s: Session) => this.repository.getWorkspace().pinned.indexOf(s.sessionId) !== -1));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public applySegmentFilter(segment: Segment, event: any): void {
    event.preventDefault();
    event.stopPropagation();

    this.showAll = false;
    this.showPinned = false;
    this.selectedS.forEach((s) => s.selected = false);

    const selectedIndex = this.selectedS.findIndex((s) => s.name === segment.name);
    this.selectedS[selectedIndex].selected = true;

    globalSegmentFilter.next(JSON.parse(JSON.stringify(segment)));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public deleteSegment(segment: Segment, event: any): void {
    event.preventDefault();
    event.stopPropagation();

    this.repository.removeSegment(segment);
    this.segments = JSON.parse(JSON.stringify(this.repository.getSegments()));
  }

  public selectedSegmentCheck(segment: Segment): string {
    const index = this.selectedS.findIndex((s) => s.name === segment.name);
    return this.selectedS[index].selected ? 'selected-segment' : '';
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public showConfirmationDialog(segment: Segment, event: any): void {
    const message = `Are you sure you want to delete the segment "${segment.name}"?`;
    const confirmText = 'Delete';
    const callback = (answerString: string) => {
      if(answerString === constants.confirmed.toString()) {
        this.deleteSegment(segment, event);
      }
    };
    this.modalRef = this.bsModalService.show(ConfirmationDialogComponent, {
      animated: false,
      initialState: {
        message,
        callback,
        confirmText
      }
    });
  }

  public highlightSelectedRow(showAll: boolean, showPinned: boolean, selectedSegmentIndex?: number): void {
    this.showAll = showAll;
    this.showPinned = showPinned;
    this.selectedS.forEach((s) => s.selected = false);
    if(selectedSegmentIndex >= 0) {
      this.selectedS[selectedSegmentIndex].selected = true;
    }
    integrationHighlight.next(-1);
  }
}
