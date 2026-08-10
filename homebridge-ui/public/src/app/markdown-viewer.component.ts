import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { marked } from 'marked';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-markdown-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
})
export class MarkdownViewerComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() filename!: string;

  public html = '';
  public loading = false;

  private readonly baseUrl =
    'https://raw.githubusercontent.com/homebridge-plugins/homebridge-gsh/refs/heads/latest/homebridge-ui/public/src/assets/markdown/';

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['filename'] && this.filename) {
      await this.loadMarkdown(this.filename);
    }
  }

  async loadMarkdown(filename: string): Promise<void> {
    this.loading = true;
    this.html = '';

    // Determine path based on TESTING env variable

    const url = !environment.production
      ? `assets/markdown/${filename}` // Dev/testing: local assets
      : this.baseUrl + filename;

    console.log('Loading markdown from:', url);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${filename}: ${res.status}`);
      }
      const markdown = await res.text();
      this.html = await marked.parse(markdown);
    } catch (err: any) {
      console.error('Markdown fetch failed:', err);
      window.homebridge.toast.error(`Failed to load ${filename}`, 'Error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
