import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface UserDataResponse {
  user_id: string;

  subscriptionRequired: boolean; // Causes UI to display subscription box, set for accounts created after launch date, 
  // and 30 days after launch for accounts created before launch
  subscriptionActive: boolean; // Used by client to determine if the subscription is active or not
  serviceActive: boolean; // Used by client to determine if the service is active or not
  expiryDate: Date; // Date of the next payment or trial period end - service s/b active until this date
  subscriptionType: number; // 0 - Contributor, 1 - Trial ( trialExpiryDate), 2 - Vendor Managed Subscription ( no expiry ), 
  // 3 - Manual Subscription ( subscriptionExpiryDate )

  accountStatus: { text: string; color: string };

  paypalSubscriptionID: string;
  //  paypalProductID: string;
  paypalPlanID: string;
  paypalPlanName?: string;
  paypalPlanDescription?: string;
  // paypalSubscribeDate: Date;

  paypalPlans: PayPalPlanResponse[];
  paypalScript: string;
}

export interface PayPalPlanResponse {
  id: string;
  name: string;
  description: string;
}

export interface LocalUserData extends UserDataResponse {
  startDate?: Date; // client-only field
}

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private http = inject(HttpClient);

  private userData: LocalUserData;

  private createHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getUserData(domain: string, token: string): Observable<LocalUserData> {
    if (token) {
      const headers = this.createHeaders(token);
      const url = `${domain}/userData/userData`;

      return this.http
        .get<{ userData: UserDataResponse }>(url, { headers })
        .pipe(
          map((response) => {
            this.userData = response.userData;
            this.userData.startDate = startDate(this.userData.expiryDate);
            return this.userData;
          }),
        );
    } else {
      return new Observable<LocalUserData>((observer) => {
        observer.next(this.userData);
        observer.complete();
      });
    }
  }

  cancelSubscription(
    subscriptionID: string,
    linkDomain: string,
    token: string,
  ): Promise<any> {
    const headers = this.createHeaders(token);
    return fetch(`${linkDomain}/userData/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionID }),
    }).then((res) => res.json());
  }

  saveSubscription(
    details: any,
    linkDomain: string,
    token: string,
  ): Promise<any> {
    return fetch(`${linkDomain}/userData/subscribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(details),
    }).then((res) => res.json());
  }

  private scriptLoaded = false;

  loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scriptLoaded) {
        resolve();
        return;
      }

      if (!this.userData?.paypalScript) {
        reject(new Error('PayPal script URL is not available.'));
        return;
      }
      const script = document.createElement('script');
      script.src = this.userData?.paypalScript;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;

      document.body.appendChild(script);
    });
  }
}

function startDate(expiryDate: Date | string | undefined): Date {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const startDate =
    !isNaN(expiry.getTime()) && expiry > now
      ? expiry
      : new Date(now.getTime() + 10 * 60 * 1000); // Add 10 minutes to current time

  return startDate;
}
