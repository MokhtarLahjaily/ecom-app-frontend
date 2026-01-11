import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap, of, catchError } from 'rxjs';
import { keycloak } from '../app.config';

/**
 * Minimum token validity in seconds before triggering a refresh.
 * If the token will expire within this window, we proactively refresh it.
 */
const MIN_TOKEN_VALIDITY_SECONDS = 20;

/**
 * Auth interceptor that attaches the Keycloak JWT token to outgoing requests.
 * Automatically refreshes the token if it's expired or about to expire.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip auth header for non-authenticated requests or if Keycloak isn't initialized
  if (!keycloak.authenticated || !keycloak.token) {
    return next(req);
  }

  // Check if token is expired or will expire soon
  const isExpired = keycloak.isTokenExpired(MIN_TOKEN_VALIDITY_SECONDS);

  if (isExpired) {
    // Token is expired or about to expire - refresh it first
    return from(keycloak.updateToken(MIN_TOKEN_VALIDITY_SECONDS)).pipe(
      switchMap((refreshed) => {
        if (refreshed) {
          console.log('[AuthInterceptor] Token refreshed successfully');
        }
        // Attach the fresh token
        return next(cloneWithAuth(req, keycloak.token!));
      }),
      catchError((err) => {
        console.error('[AuthInterceptor] Failed to refresh token:', err);
        // Token refresh failed - redirect to login
        keycloak.login();
        // Return the original request without auth (will likely fail with 401)
        return next(req);
      })
    );
  }

  // Token is valid - attach it directly
  return next(cloneWithAuth(req, keycloak.token));
};

/**
 * Clones the request with the Authorization header attached.
 */
function cloneWithAuth(req: Parameters<HttpInterceptorFn>[0], token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
