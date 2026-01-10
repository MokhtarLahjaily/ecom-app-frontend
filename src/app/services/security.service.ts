import { Injectable, Injector, NgZone, signal, WritableSignal } from '@angular/core';
import { KeycloakProfile } from 'keycloak-js';

import { keycloak } from '../app.config';

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    private _profile?: KeycloakProfile;
    private authState: WritableSignal<boolean> = signal(false);
    public authStatus = this.authState.asReadonly();
    private authSyncHandle?: number;

    constructor(private zone: NgZone, private injector: Injector) {
        // Ensure watcher runs even if init events are missed
        this.startAuthWatcher();
    }

    public get profile(): KeycloakProfile | undefined {
        return this._profile;
    }

    public get token(): string | undefined {
        return keycloak.token;
    }

    public get loggedIn(): boolean {
        // Source of truth is the signal kept in sync with Keycloak state
        return this.authState();
    }

    public hasRoleIn(roles: string[]): boolean {
        if (!this.authState()) return false;
        const tokenParsed = keycloak.tokenParsed as any;
        const userRoles: string[] = tokenParsed?.realm_access?.roles || [];
        return roles.some(role => userRoles.includes(role));
    }

    public hasRole(role: string): boolean {
        return this.hasRoleIn([role]);
    }

    public get isAdmin(): boolean {
        return this.hasRole('ADMIN');
    }

    public async login() {
        console.log('[SecurityService] Login called');
        await keycloak.login({ redirectUri: window.location.origin + '/products' });
    }

    public async logout() {
        console.log('[SecurityService] Logout called');
        this.runInZone(() => {
            this.authState.set(false);
            this._profile = undefined;
        });
        await keycloak.logout({ redirectUri: window.location.origin });
    }

    /**
     * Syncs the current Keycloak user to the backend customer database.
     */
    private async syncCustomerToBackend(): Promise<void> {
        try {
            // Lazy import to avoid circular dependency
            const { CustomerService } = await import('./customer.service');
            const customerService = this.injector.get(CustomerService);
            customerService.syncCurrentUser().subscribe({
                next: (customer) => {
                    if (customer) {
                        console.log('[SecurityService] Customer synced:', customer.username);
                    }
                },
                error: (err) => console.warn('[SecurityService] Customer sync failed:', err)
            });
        } catch (e) {
            console.warn('[SecurityService] Could not sync customer:', e);
        }
    }

    /**
     * Called once after Keycloak init succeeds to hydrate profile and wire auth events.
     */
    public async handleAuthInit(authenticated: boolean): Promise<void> {
        console.log('[SecurityService] handleAuthInit:', authenticated);
        
        this.runInZone(() => {
            this.authState.set(authenticated);
        });

        if (authenticated && keycloak.token) {
            try {
                const profile = await keycloak.loadUserProfile();
                console.log('[SecurityService] Profile loaded:', profile.username);
                this.runInZone(() => {
                    this._profile = profile;
                });
                // Sync user to backend on successful auth
                await this.syncCustomerToBackend();
            } catch (err) {
                console.warn('[SecurityService] Could not load profile:', err);
            }
        }

        // Set up event handlers
        keycloak.onAuthSuccess = async () => {
            console.log('[SecurityService] onAuthSuccess');
            this.runInZone(() => this.authState.set(true));
            try {
                const profile = await keycloak.loadUserProfile();
                this.runInZone(() => { this._profile = profile; });
                await this.syncCustomerToBackend();
            } catch (e) { /* ignore */ }
        };

        keycloak.onAuthLogout = () => {
            console.log('[SecurityService] onAuthLogout');
            this.runInZone(() => {
                this._profile = undefined;
                this.authState.set(false);
            });
        };

        keycloak.onTokenExpired = () => {
            console.log('[SecurityService] Token expired, refreshing...');
            keycloak.updateToken(60).catch(() => this.logout());
        };
    }

    /**
     * Periodically mirrors keycloak.authenticated into the signal to avoid UI getting stuck.
     */
    private startAuthWatcher() {
        if (typeof window === 'undefined' || this.authSyncHandle) {
            return;
        }
        this.authSyncHandle = window.setInterval(() => {
            const current = !!keycloak.authenticated;
            if (this.authState() !== current) {
                console.log('[SecurityService] Watcher detected change:', current);
                this.runInZone(() => {
                    this.authState.set(current);
                    if (!current) {
                        this._profile = undefined;
                    }
                });
            }
        }, 500);
    }

    private runInZone(fn: () => void) {
        if (NgZone.isInAngularZone()) {
            fn();
        } else {
            this.zone.run(fn);
        }
    }
}
