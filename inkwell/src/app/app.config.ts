import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHotToastConfig } from '@ngneat/hot-toast';

import { environment } from '../environments/environment';

// Attach the JWT Bearer token to every outgoing request automatically.
// Also sets withCredentials so cross-origin cookies work (OAuth2 session).
// Automatically prepends the API Base URL for relative paths.
const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Guard localStorage for SSR
  const isBrowser = typeof localStorage !== 'undefined';
  const token = isBrowser ? localStorage.getItem('inkwell_token') : null;

  // Prepend API Base URL if the request is relative (doesn't start with http/https)
  let url = req.url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Ensure we don't have double slashes
    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${baseUrl}${cleanPath}`;
  }

  const cloned = req.clone({
    url,
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
