import { mergeApplicationConfig, ApplicationConfig, inject } from '@angular/core';
import { BEFORE_APP_SERIALIZED } from '@angular/platform-server';
import { Accessibility } from './core/accessibility/accessibility.service';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideUniversal } from '@ng-web-apis/universal';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideUniversal(),
    {
      provide: BEFORE_APP_SERIALIZED,
      useFactory: () => {
        const accessibility = inject(Accessibility);
        return () => {
          accessibility.applyPreferencesToDocument();
        };
      },
      deps: [Accessibility],
      multi: true,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
