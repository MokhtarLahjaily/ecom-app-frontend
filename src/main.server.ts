// Remember: pass BootstrapContext to bootstrapApplication to avoid NG0401.
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context?: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;