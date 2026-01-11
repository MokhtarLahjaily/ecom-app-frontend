import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import Keycloak from 'keycloak-js';

import { routes } from './app.routes';
import { SecurityService } from './services/security.service';

// Singleton Keycloak instance used by the initializer
export const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'ecom-realm',
  clientId: 'ecom-app-frontend'
});

function initKeycloak() {
  const platformId = inject(PLATFORM_ID);
  const security = inject(SecurityService);
  return async () => {
    const isBrowser = isPlatformBrowser(platformId);
    if (!isBrowser || typeof window === 'undefined') {
      return; // Skip Keycloak init in SSR
    }
    
    try {
      // Use 'login-required' to force login on app start
      const authenticated = await keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256'
      });
      
      await security.handleAuthInit(authenticated);
    } catch (err) {
      console.error('[Keycloak] Init error:', err);
      await security.handleAuthInit(false);
    }
  };
}

import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initKeycloak,
      multi: true
    }
  ]
};
