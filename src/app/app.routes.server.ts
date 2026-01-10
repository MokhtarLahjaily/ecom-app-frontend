import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Skip prerendering for routes with params - use client-side rendering
  { path: 'products/:id', renderMode: RenderMode.Client },
  { path: 'bills/:customerId', renderMode: RenderMode.Client },
  { path: 'bill-details/:billId', renderMode: RenderMode.Client },
  // Prerender static routes
  { path: '**', renderMode: RenderMode.Prerender }
];
