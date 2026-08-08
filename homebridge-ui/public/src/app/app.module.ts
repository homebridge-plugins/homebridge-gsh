import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { MarkdownViewerComponent } from './markdown-viewer.component';
import { UserDataComponent } from './user-data.component';

import '@homebridge/plugin-ui-utils/dist/ui.interface';
import { TranslatePipe } from './translate.pipe';
import { DateToStringPipe } from './user-data.pipe';

@NgModule({ declarations: [
        AppComponent,
        TranslatePipe,
        MarkdownViewerComponent,
        UserDataComponent,
        DateToStringPipe,
    ],
    bootstrap: [AppComponent],
    exports: [
        DateToStringPipe // so it can be used elsewhere
    ], imports: [BrowserModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
