import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { MarkdownViewerComponent } from './markdown-viewer.component';
import { UserDataComponent } from './user-data.component';

import '@homebridge/plugin-ui-utils/dist/ui.interface';
import { TranslatePipe } from './translate.pipe';
import { DateToStringPipe } from './user-data.pipe';

@NgModule({
  declarations: [],
  bootstrap: [AppComponent],
  exports: [
    DateToStringPipe,
  ],
  imports: [
    BrowserModule,
    TranslatePipe,
    MarkdownViewerComponent,
    UserDataComponent,
    DateToStringPipe,
    AppComponent,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule { }
