import {Component, OnInit} from '@angular/core';
import {environment} from '../environments/environment';
import {AppService} from './services/app.service';
import {Router} from '@angular/router';
import {UpdaterService} from './services/updater.service';
import compareVersions from 'compare-versions';
import {ElectronService} from './services/electron.service';
import {LeappCoreService} from './services/leapp-core.service';
import {LoggerLevel} from '@noovolari/leapp-core/services/logging-service';
import {Workspace} from '@noovolari/leapp-core/models/workspace';
import {constants} from '@noovolari/leapp-core/models/constants';
import {LeappParseError} from '@noovolari/leapp-core/errors/leapp-parse-error';
import {WindowService} from './services/window.service';
import {setTheme} from 'ngx-bootstrap/utils';
import {RetroCompatibilityService} from '@noovolari/leapp-core/services/retro-compatibility-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  /* Main app file: launches the Angular framework inside Electron app */
  constructor(
    public app: AppService,
    private router: Router,
    private updaterService: UpdaterService,
    private electronService: ElectronService,
    private leappCoreService: LeappCoreService,
    private windowService: WindowService,
    private retrocompatibilityService: RetroCompatibilityService
  ) {}

  async ngOnInit() {
    // We get the right moment to set an hook to app close
    const ipc = this.electronService.ipcRenderer;
    ipc.on('app-close', () => {
      this.leappCoreService.loggingService.logger('Preparing for closing instruction...', LoggerLevel.info, this);
      this.beforeCloseInstructions();
    });

    // Use ngx bootstrap 4
    setTheme('bs4');

    if (environment.production) {
      // Clear both info and warn message in production
      // mode without removing them from code actually
      console.warn = () => {};
      console.log = () => {};
    }

    // Prevent Dev Tool to show on production mode
    this.windowService.blockDevToolInProductionMode();

    // Create folders if missing
    this.updaterService.createFoldersIfMissing();

    // Before retrieving an actual copy of the workspace we
    // check and in case apply, our retro compatibility service
    if (this.retrocompatibilityService.isRetroPatchNecessary()) {
      await this.retrocompatibilityService.adaptOldWorkspaceFile();
    }

    if (this.retrocompatibilityService.isIntegrationPatchNecessary()) {
      await this.retrocompatibilityService.adaptIntegrationPatch();
    }

    let workspace;
    try {
      workspace = this.leappCoreService.repository.getWorkspace();
    } catch {
      throw new LeappParseError(this, 'We had trouble parsing your Leapp-lock.json file. It is either corrupt, obsolete, or with an error.');
    }

    // Check the existence of a pre-Leapp credential file and make a backup
    this.showCredentialBackupMessageIfNeeded(workspace);

    // All sessions start stopped when app is launched
    if (workspace.sessions.length > 0) {
      workspace.sessions.forEach((sess) => {
        const concreteSessionService = this.leappCoreService.sessionFactory.getSessionService(sess.type);
        concreteSessionService.stop(sess.sessionId);
      });
    }

    // Start Global Timer (1s)
    this.leappCoreService.timerService.start(this.leappCoreService.rotationService.rotate.bind(this.leappCoreService.rotationService));

    // Launch Auto Updater Routines
    this.manageAutoUpdate();

    // Go to initial page if no sessions are already created or
    // go to the list page if is your second visit
    await this.router.navigate(['/dashboard']);
    document.querySelector('#loader').classList.add('disable-loader');
  }

  closeAllRightClickMenus() {
    this.app.closeAllMenuTriggers();
  }

  /**
   * This is an hook on the closing app to remove credential file and force stop using them
   */
  private beforeCloseInstructions() {
    // Check if we are here
    this.leappCoreService.loggingService.logger('Closing app with cleaning process...', LoggerLevel.info, this);

    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Clean the config file
      this.leappCoreService.awsCoreService.cleanCredentialFile();
    } catch (err) {
      this.leappCoreService.loggingService.logger('No sessions to stop, skipping...', LoggerLevel.error, this, err.stack);
    }

    // Finally quit
    this.app.quit();
  }

  /**
   * Show that we created a copy of original credential file if present in the system
   */
  private showCredentialBackupMessageIfNeeded(workspace: Workspace) {
    const oldAwsCredentialsPath = this.electronService.os.homedir() + '/' + constants.credentialsDestination;
    const newAwsCredentialsPath = oldAwsCredentialsPath + '.leapp.bkp';
    const check = workspace.sessions.length === 0 &&
      this.electronService.fs.existsSync(oldAwsCredentialsPath) &&
      !this.electronService.fs.existsSync(newAwsCredentialsPath);

    this.leappCoreService.loggingService.logger(`Check existing credential file: ${check}`, LoggerLevel.info, this);

    if (check) {
      this.electronService.fs.renameSync(oldAwsCredentialsPath, newAwsCredentialsPath);
      this.electronService.fs.writeFileSync(oldAwsCredentialsPath,'');
      this.app.getDialog().showMessageBox({
        type: 'info',
        icon: __dirname + '/assets/images/Leapp.png',
        message: 'You had a previous credential file. We made a backup of the old one in the same directory before starting.'
      });
    } else if(!this.leappCoreService.fileService.existsSync(this.leappCoreService.awsCoreService.awsCredentialPath())) {
      this.leappCoreService.fileService.writeFileSync(this.leappCoreService.awsCoreService.awsCredentialPath(), '');
    }
  }

  /**
   * Launch Updater process
   *
   * @private
   */
  private manageAutoUpdate(): void {
    let savedVersion;

    try {
      savedVersion = this.updaterService.getSavedAppVersion();
    } catch (error) {
      savedVersion = this.updaterService.getCurrentAppVersion();
    }

    try {
      if (compareVersions(savedVersion, this.updaterService.getCurrentAppVersion()) <= 0) {
        // We always need to maintain this order: fresh <= saved <= online
        this.updaterService.updateVersionJson(this.updaterService.getCurrentAppVersion());
      }
    } catch (error) {
      this.updaterService.updateVersionJson(this.updaterService.getCurrentAppVersion());
    }

    const ipc = this.electronService.ipcRenderer;
    ipc.on('UPDATE_AVAILABLE', async (_, info) => {

      const releaseNote = await this.updaterService.getReleaseNote();
      this.updaterService.setUpdateInfo(info.version, info.releaseName, info.releaseDate, releaseNote);
      if (this.updaterService.isUpdateNeeded()) {
        this.updaterService.updateDialog();
        this.leappCoreService.workspaceService.sessions = [...this.leappCoreService.workspaceService.sessions];
      }
    });
  }
}
