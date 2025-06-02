import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PluginConfig } from '@homebridge/plugin-ui-utils/dist/ui.interface';
import { TranslateService } from './translate.service';
import { LocalUserData, UserDataService } from './user-data.service';

import { GITHUB_REPO } from '../../../../src/settings';

@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.scss']
})
export class UserDataComponent implements OnInit {
  @Input() pluginConfig!: PluginConfig;
  @Input() linkDomain!: string;
  @Input() user_id!: string;
  @Output() userDataChange = new EventEmitter<LocalUserData>();

  public userData!: LocalUserData;
  public createSubscriptionExpanded = false;
  public subscriptionDetailsExpanded = false;

  public isCancelling: boolean = false;
  public isLoadingPayPalButtons: boolean = true;

  public readonly subscriptionDetailsURL = GITHUB_REPO + 'wiki/Subscription-Service#Background';

  constructor(
    private userDataService: UserDataService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  async loadUserData() {
    this.userDataService.getUserData(this.linkDomain, this.pluginConfig.token).subscribe({
      next: data => {
        this.userData = data;
        this.userDataChange.emit(this.userData); // Emit userData to parent
        console.log('✅ User data loaded:', data);
      },
      error: err => {
        console.log('❌ Failed to load user data:', err);
      }
    });
  }

  cancelSubscription() {
    this.showConfirmModal = true; // Show modal
  }

  public showConfirmModal = false;

  async confirmCancel() {
    this.showConfirmModal = false;
    this.isCancelling = true; // Start spinner

    if (!this.userData?.paypalSubscriptionID) {
      console.error('No subscription ID found');
      window.homebridge.toast.error('Failed to cancel subscription', this.translateService.translations['toast.title_error']);
      this.isCancelling = false; // Stop spinner
      return;
    }

    console.log('Cancelling subscription:', this.userData.paypalSubscriptionID);

    const body = {
      subscriptionID: this.userData.paypalSubscriptionID
    };

    fetch(`${this.linkDomain}/userData/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.pluginConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text(); // prevent json() on bad body
          throw new Error(`Backend responded with ${res.status}: ${errorText}`);
        }
        return res.json();
      })
      .then(response => {
        if (response.success) {
          window.homebridge.toast.success('Subscription Cancelled', this.translateService.translations['toast.title_success']);
          // Refresh UI after cancel
          this.userDataService.getUserData(this.linkDomain, this.pluginConfig.token).subscribe({
            next: updatedData => {
              this.userData = updatedData;
              this.userDataChange.emit(this.userData); // Emit updated userData
              console.log('✅ Refreshed user data after cancel:', updatedData);
            },
            error: err => {
              console.error('❌ Failed to refresh user data after cancel:', err);
            }
          });
        } else {
          window.homebridge.toast.error('Failed to cancel subscription', this.translateService.translations['toast.title_error']);
          console.error('❌ Failed to cancel subscription:', response.message);
        }
      })
      .catch(err => {
        // Suppress fetch errors and log cleanly
        window.homebridge.toast.error('Failed to cancel subscription', this.translateService.translations['toast.title_error']);
        console.error('❌ Cancel subscription failed:', err.message || err);
      }).finally(() => {
        this.isCancelling = false; // Stop spinner
      });
  }

  toggleCreateSubscriptionExpand(): void {
    this.createSubscriptionExpanded = !this.createSubscriptionExpanded;
    this.subscriptionDetailsExpanded = false;

    if (this.createSubscriptionExpanded) {
      setTimeout(() => {
        console.log('Expanded and DOM updated, now rendering PayPal buttons');
        this.renderPayPalButtons();
      }, 0);
    }
  }

  toggleSubscriptionDetailsExpand() {
    this.subscriptionDetailsExpanded = !this.subscriptionDetailsExpanded;
    this.createSubscriptionExpanded = false;
  }

  renderPayPalButtons(): void {
    if (!this.createSubscriptionExpanded || !this.userData?.paypalPlans?.length) {
      console.log('❌ No PayPal plans available or subscription creation not expanded');
      return;
    }

    this.userDataService.loadScript()
      .then(async () => {
        const renderPromises: Promise<void>[] = [];

        this.userData?.paypalPlans?.forEach((plan, index) => {
          const container = document.getElementById(`paypal-button-container-${index}`);
          if (container) {
            container.innerHTML = '';
          }
          renderPromises.push(this.renderPayPalButton(plan, index));
        });

        try {
          await Promise.all(renderPromises);
        } catch (error) {
          console.error('Error rendering PayPal buttons:', error);
        } finally {
          this.isLoadingPayPalButtons = false;
          console.log('✅ All PayPal buttons rendered');
        }
      })
      .catch(error => {
        console.error('PayPal script failed to load', error);
        this.isLoadingPayPalButtons = false;
      });
  }

  async renderPayPalButton(plan: any, index: number): Promise<void> {
    if (!(window as any).paypal?.Buttons) {
      console.error('PayPal SDK not available.');
      throw new Error('PayPal SDK not available');
    }

    console.log(`Rendering PayPal button for plan ${plan.id}`);

    return new Promise<void>((resolve, reject) => {
      (window as any).paypal.Buttons({
        createSubscription: (data, actions) => {
          console.log('Creating subscription for plan:', this.userData.startDate.toISOString());
          return actions.subscription.create({
            plan_id: plan.id,
            custom_id: 'GSH|' + this.user_id,
            start_time: this.userData.startDate.toISOString(),
            application_context: {
              shipping_preference: "NO_SHIPPING"
            },
          });
        },
        onApprove: async (data, actions) => {
          console.log('✅ Subscription approved:', data);

          const body = {
            planId: plan.id,
            subscriptionID: data.subscriptionID,
            orderID: data.orderID,
            paymentSource: data.paymentSource,
            facilitatorAccessToken: data.facilitatorAccessToken,
          };

          try {
            const res = await fetch(`${this.linkDomain}/userData/subscribe`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.pluginConfig.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body)
            });
            const response = await res.json();
            console.log('✅ Backend subscription saved:', response);
            window.homebridge.toast.success('Service Subscription Created', this.translateService.translations['toast.title_success']);
          } catch (err) {
            console.error('❌ Failed to store subscription in backend:', err);
            window.homebridge.toast.error('Failed to create subscription', this.translateService.translations['toast.title_error']);
          }

          this.userDataService.getUserData(this.linkDomain, this.pluginConfig.token).subscribe({
            next: updatedData => {
              this.userData = updatedData;
              this.userDataChange.emit(this.userData); // Emit updated userData
              console.log('✅ Refreshed user data after subscription:', updatedData);
            },
            error: err => {
              console.error('❌ Failed to refresh user data after subscription:', err);
            }
          });
        },
        onError: (err) => {
          console.error(`PayPal error for ${plan.id}:`, err);
          window.homebridge.toast.error('Failed to create subscription', this.translateService.translations['toast.title_error']);
        }
      }).render(`#paypal-button-container-${index}`)
        .then(() => {
          console.log(`✅ PayPal button rendered for plan ${plan.id}`);
          resolve(); // resolve the promise when rendering succeeds
        })
        .catch((err) => {
          console.error(`❌ Failed to render PayPal button for plan ${plan.id}:`, err);
          reject(err); // reject the promise if rendering fails
        });
    });
  }
}