import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import { WindowService } from '../../services/window.service'

@Component({
  selector: 'app-wizard-page',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent {

  @Input() versionLabel = '...';

  /**
   * Dependencies Page is used to check if we already have the correct configuration and send you to the session page or to the setup managing otherwise
   */
  constructor(private windowService: WindowService, private router: Router) {}

  goToSetup() {
    this.router.navigate(['/managing', 'create-account'], { queryParams: { firstTime: true }}).then(_ => {});
  }

  openDocumentation() {
    this.windowService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }
}
