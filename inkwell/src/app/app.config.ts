import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHotToastConfig } from '@ngneat/hot-toast';

// Attach the JWT Bearer token to every outgoing request automatically.
// Also sets withCredentials so cross-origin cookies work (OAuth2 session).
const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Guard localStorage for SSR
  const isBrowser = typeof localStorage !== 'undefined';
  const token = isBrowser ? localStorage.getItem('inkwell_token') : null;

  const cloned = req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

  return next(cloned);
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideHotToastConfig(),
  ]
};
