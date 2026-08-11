import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class TranslateService {
  public translations: Record<string, string>
  public ready = false
  /** Resolves once translations have loaded — lets OnPush components know when to re-check. */
  public readonly whenReady: Promise<void>

  constructor() {
    this.whenReady = window.homebridge.i18nGetTranslation()
      .then((translations) => {
        this.translations = translations
        this.ready = true
      })
  }
}
