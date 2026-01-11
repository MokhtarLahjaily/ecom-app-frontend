import { Injectable, Injector, NgZone, signal, WritableSignal, computed, Signal } from '@angular/core';
import { KeycloakProfile } from 'keycloak-js';

import { keycloak } from '../app.config';

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    private _profile: WritableSignal<KeycloakProfile | undefined> = signal(undefined);
    private authState: WritableSignal<boolean> = signal(false);
    
    // Writable signal for user roles - updated when auth state changes
    private userRoles: WritableSignal<string[]> = signal([]);
    
    // Public readonly signals for reactive UI binding
    public authStatus = this.authState.asReadonly();
    public profile = this._profile.asReadonly();
    
    // Computed signal for admin check - reacts immediately to role/auth changes
    public isAdmin: Signal<boolean> = computed(() => {
        const authenticated = this.authState();
        const roles = this.userRoles();
        const result = authenticated && roles.includes('ADMIN');
        console.log('[SecurityService] isAdmin computed:', { authenticated, roles, result });
        return result;
    });
    
    // Computed signal for logged in state
    public loggedIn: Signal<boolean> = computed(() => this.authState());
    
    private authSyncHandle?: number;

    constructor(private zone: NgZone, private injector: Injector) {
        // Ensure watcher runs even if init events are missed
        this.startAuthWatcher();
    }

    public get profileValue(): KeycloakProfile | undefined {
        return this._profile();
    }

    public get token(): string | undefined {
        return keycloak.token;
    }

    /**
     * Check if user has any of the specified roles.
     * Returns a computed signal for reactive UI binding.
     */
    public hasRoleIn(roles: string[]): boolean {
        if (!this.authState()) return false;
        const currentRoles = this.userRoles();
        return roles.some(role => currentRoles.includes(role));
    }

    public hasRole(role: string): boolean {
        return this.hasRoleIn([role]);
    }

    /**
     * Updates the userRoles signal from the current Keycloak token.
     * Call this whenever authentication state changes.
     */
    private updateRolesFromToken(): void {
        const tokenParsed = keycloak.tokenParsed as any;
        const realmRoles: string[] = tokenParsed?.realm_access?.roles || [];
        // Also check resource_access for client-specific roles
        const clientRoles: string[] = tokenParsed?.resource_access?.['ecomm-app']?.roles || [];
        // Merge and dedupe roles, normalize to uppercase
        const allRoles = [...new Set([...realmRoles, ...clientRoles])].map(r => r.toUpperCase());
        console.log('[SecurityService] Updating roles:', allRoles);
        this.userRoles.set(allRoles);
    }

    public async login() {
        console.log('[SecurityService] Login called');
        await keycloak.login({ redirectUri: window.location.origin + '/products' });
    }

    public async logout() {
        console.log('[SecurityService] Logout called');
        this.runInZone(() => {
            this.authState.set(false);
            this.userRoles.set([]);
            this._profile.set(undefined);
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
            if (authenticated) {
                this.updateRolesFromToken();
            } else {
                this.userRoles.set([]);
            }
        });

        if (authenticated && keycloak.token) {
            try {
                const profile = await keycloak.loadUserProfile();
                console.log('[SecurityService] Profile loaded:', profile.username);
                this.runInZone(() => {
                    this._profile.set(profile);
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
            this.runInZone(() => {
                this.authState.set(true);
                this.updateRolesFromToken();
            });
            try {
                const profile = await keycloak.loadUserProfile();
                this.runInZone(() => { this._profile.set(profile); });
                await this.syncCustomerToBackend();
            } catch (e) { /* ignore */ }
        };

        keycloak.onAuthLogout = () => {
            console.log('[SecurityService] onAuthLogout');
            this.runInZone(() => {
                this._profile.set(undefined);
                this.userRoles.set([]);
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
                    if (current) {
                        this.updateRolesFromToken();
                    } else {
                        this._profile.set(undefined);
                        this.userRoles.set([]);
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
