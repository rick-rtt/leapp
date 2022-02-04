import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppService} from '../../../services/app.service';
import {FormControl, FormGroup} from '@angular/forms';
import {globalFilterGroup} from '../../command-bar/command-bar.component';
import {NgSelectComponent} from '@ng-select/ng-select';
import {segmentFilter} from '../../side-bar/side-bar.component';
import Segment from '@noovolari/leapp-core/models/Segment';
import {LeappCoreService} from '../../../services/leapp-core.service';

@Component({
  selector: 'app-segment-dialog',
  templateUrl: './segment-dialog.component.html',
  styleUrls: ['./segment-dialog.component.scss']
})
export class SegmentDialogComponent implements OnInit, OnDestroy {

  @ViewChild('ngSelectComponent')
  ngSelectComponent: NgSelectComponent;

  form = new FormGroup({
    segmentName: new FormControl('')
  });

  selectedSegment;
  segments: Segment[];

  currentFilterGroup;
  temporaryName;

  private subscription;

  constructor(
    private appService: AppService,
    private leappCoreService: LeappCoreService
  ) {
    this.temporaryName = '';
    this.segments = [...this.leappCoreService.repository.getSegments()];
    this.subscription = globalFilterGroup.subscribe((value) => this.currentFilterGroup = Object.assign({}, value));
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public addNewSegment(): void {
    const newSegment = { name: this.temporaryName, filterGroup: Object.assign({}, this.currentFilterGroup) };
    console.log(newSegment);

    this.segments.push(newSegment);
    this.segments = [...this.segments];
  }

  public saveSegment(): void {
    const segments = [...this.leappCoreService.repository.getSegments()];
    const index = segments.findIndex((s) => s.name === this.selectedSegment);
    if(index === -1) {
      segments.push({ name: this.selectedSegment, filterGroup: this.currentFilterGroup });
    } else {
      segments[index].filterGroup = this.currentFilterGroup;
    }
    this.leappCoreService.repository.setSegments(segments);
    segmentFilter.next(this.leappCoreService.repository.getWorkspace().segments);
    this.appService.closeModal();
  }

  public closeModal(): void {
    this.appService.closeModal();
  }

  public checkNewSegment(): boolean {
    return this.temporaryName !== '' &&
           this.segments.filter((s) => s.name.indexOf(this.temporaryName) > -1).length === 0;
  }

  public setTemporaryName($event: any): void {
    this.temporaryName = $event.target.value;
  }
}
