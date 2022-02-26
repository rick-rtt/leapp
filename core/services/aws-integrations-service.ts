import {Repository} from './repository'
import {AwsSsoRoleService, SsoRoleSession} from './session/aws/aws-sso-role-service'
import {AwsSsoIntegration} from '../models/aws-sso-integration'
import {formatDistance} from 'date-fns'

export class AwsIntegrationsService {

    constructor(private repository: Repository,
                private awsSsoRoleService: AwsSsoRoleService) {
    }

    public getIntegrations(): AwsSsoIntegration[] {
        return this.repository.listAwsSsoConfigurations()
    }

    public getOnlineIntegrations(): AwsSsoIntegration[] {
        return this.getIntegrations().filter(integration => this.isOnline(integration))
    }

    public getOfflineIntegrations(): AwsSsoIntegration[] {
        return this.getIntegrations().filter(integration => !this.isOnline(integration))
    }

    public isOnline(integration: AwsSsoIntegration): boolean {
        const expiration = new Date(integration.accessTokenExpiration).getTime()
        const now = this.getDate().getTime()
        return !!integration.accessTokenExpiration && now < expiration
    }

    public remainingHours(integration: AwsSsoIntegration): string {
        return formatDistance(new Date(integration.accessTokenExpiration), this.getDate(), {addSuffix: true})
    }

    async sync(integrationId: string): Promise<SsoRoleSession[]> {
        return await this.awsSsoRoleService.sync(integrationId)
    }

    private getDate(): Date {
        return new Date()
    }
}
