 

import fs from 'fs';
import path from 'path';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import dotenv from 'dotenv';

const envPath = '../homebridge-gsh-server/lightsail/installStack/.env.clone-gsh.homebridge.ca';
// Load environment variables from .env
dotenv.config({ path: envPath });

let driver: WebDriver;

const describeIf = (condition: boolean, ...args: Parameters<typeof describe>) =>
  condition ? describe(...args) : describe.skip(...args);

const testIf = (condition: boolean, ...args: Parameters<typeof test>) =>
  condition ? test(...args) : test.skip(...args);
let cancelCreateTests = false;
let cancelCancelTests = false;
const trace = true;

describe('Prepare Environment', () => {
  test.skip('should clear the Google Smart Home token in config.json', () => {
    const configPath = path.resolve(process.cwd(), 'test/hbConfig/config.json');
    // console.log('Config path:', configPath);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const gsh = config.platforms?.find((p: any) => p.platform === 'google-smarthome');
    if (gsh) {
      gsh.token = '';
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      // console.log('✅ Cleared token in config.json');
    } else {
      throw new Error('❌ Google Smart Home platform not found in config.json');
    }
    expect(gsh).toBeDefined();
  });
});

beforeEach(() => {
  checkCancel();
});

beforeAll(async () => {
  const userProfileDir = path.resolve(process.cwd(), 'chrome-profile');

  const options = new chrome.Options();
  options.addArguments(
    `--user-data-dir=${userProfileDir}`,
    '--profile-directory=Default',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    //  '--start-maximized',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  );

  options.excludeSwitches('enable-automation');
  options.setUserPreferences({
    'profile.default_content_setting_values.notifications': 2,
    'credentials_enable_service': false,
  });

  driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  // Clear cookies and local storage
  await driver.get('https://clone-gsh.homebridge.ca');
  await driver.manage().deleteAllCookies();
  await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
  await driver.get('http://localhost:8581/plugins');
});

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});

async function openPluginConfig(driver: WebDriver) {
  try {
    const closeBtn = await driver.findElement(By.css('.modal .btn-close'));
    if (await closeBtn.isDisplayed()) {
      await closeBtn.click();
      await driver.wait(until.stalenessOf(closeBtn), 3000);
    }
  } catch (e) {
    console.error('Error closing modal:', e);
  }

  const dropdownToggle = await driver.wait(
    until.elementLocated(By.css('a[ngbdropdowntoggle].dropdown-toggle')),
    5000,
  );
  await driver.wait(until.elementIsVisible(dropdownToggle), 5000);
  await dropdownToggle.click();

  const pluginConfigButton = await driver.wait(
    until.elementLocated(By.xpath('//button[contains(@class, \'dropdown-item\') and contains(normalize-space(), \'Plugin Config\')]')),
    5000,
  );
  await driver.wait(until.elementIsVisible(pluginConfigButton), 5000);
  await pluginConfigButton.click();

  const modalTitle = await driver.wait(
    until.elementLocated(By.css('.modal-title')),
    5000,
  );
  const text = await modalTitle.getText();
  expect(text).toBe('Homebridge Google Smart Home');
}

describe('Plugin Config', () => {
  test('Ready for Testing', () => {
    if (process.env.PAYPAL_PER_USERNAME === undefined || process.env.PAYPAL_PER_PASSWORD === undefined) {
      const cancelCreateTests = true;
      const cancelCancelTests = true;
    }
    expect(process.env.PAYPAL_PER_USERNAME).toBeDefined();
    expect(process.env.PAYPAL_PER_PASSWORD).toBeDefined();
  });
  describe.skip('New User', () => {
    test('should load NEWUSER.md content in iframe', async () => {
      await openPluginConfig(driver);

      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      const body = await driver.findElement(By.css('body'));
      const text = await body.getText();
      // eslint-disable-next-line max-len
      expect(text).toContain('The Homebridge Google Smart Home plugin allows you to control your Homebridge accessories from a Google Home enabled smart speaker or the Google Home mobile app');

      await driver.switchTo().defaultContent();
    });
    describe('Account Linking', () => {
      describe('when clicking Link Account', () => {
        let originalWindow: string;
        let popupWindow: string;

        beforeAll(async () => {
          // Clear the Google Smart Home token in config.json
          const configPath = path.resolve(process.cwd(), 'test/hbConfig/config.json');
          // console.log('Config path:', configPath);
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

          const gsh = config.platforms?.find((p: any) => p.platform === 'google-smarthome');
          if (gsh) {
            gsh.token = '';
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            // console.log('✅ Cleared token in config.json');
          } else {
            throw new Error('❌ Google Smart Home platform not found in config.json');
          }
          expect(gsh).toBeDefined();

          await openPluginConfig(driver);

          originalWindow = await driver.getWindowHandle();

          const iframe = await driver.findElement(By.css('.modal-body iframe'));
          await driver.switchTo().frame(iframe);

          const linkBtn = await driver.findElement(By.xpath('//button[contains(text(), \'Link Account\')]'));
          await linkBtn.click();

          await driver.wait(async () => {
            const handles = await driver.getAllWindowHandles();
            return handles.length > 1;
          }, 10000);

          const handles = await driver.getAllWindowHandles();
          popupWindow = handles.find(h => h !== originalWindow)!;
        });

        afterAll(async () => {
          const handles = await driver.getAllWindowHandles();

          if (handles.includes(popupWindow)) {
            await driver.switchTo().window(popupWindow);
            await driver.close();
          }

          await driver.switchTo().window(originalWindow);
        });

        test('should open a new popup window', async () => {
          expect(popupWindow).toBeDefined();
        });

        test('should redirect to Auth0', async () => {
          await safeSwitchToWindow(popupWindow);
          console.log('-1 Current URL:', await driver.getCurrentUrl());
          // await driver.wait(until.urlContains('https://clone-gsh.homebridge.ca/link-account'));
          await driver.wait(until.urlContains('auth0.com'));
          const url = await driver.getCurrentUrl();
          expect(url).toContain('auth0.com');
          expect(url).not.toContain('https://clone-gsh.homebridge.ca/link-account');
        });

        test('should click the Log in with Google button', async () => {
          await safeSwitchToWindow(popupWindow);
          console.log('1 Current URL:', await driver.getCurrentUrl());
          const googleBtn = await driver.wait(
            until.elementLocated(By.css('button[data-provider="google-oauth2"]')),
          );
          await driver.wait(until.elementIsVisible(googleBtn));
          console.log('2 Current URL:', await driver.getCurrentUrl());
          const googleText = await googleBtn.getText();
          console.log('3 Google login button text:', googleText);
          expect(googleText).toContain('LOG IN WITH GOOGLE');
          await googleBtn.click();

          const url = await driver.getCurrentUrl();
          console.log('Redirected URL after click:', url);
          expect(url).toContain('https://accounts.google.com/v3/signin');
        }, 20000);


        test('should enter Google login credentials', async () => {
          await safeSwitchToWindow(popupWindow);
          console.log('4 Current URL:', await driver.getCurrentUrl());
          const emailInput = await driver.wait(
            until.elementLocated(By.id('identifierId')),
          );
          await emailInput.clear();
          await emailInput.sendKeys(process.env.GOOGLE_USERNAME);
          console.log('5 Current URL:', await driver.getCurrentUrl());
          await driver.findElement(By.id('identifierNext')).click();
          console.log('6 Current URL:', await driver.getCurrentUrl());
          // const html = await driver.getPageSource();
          // fs.writeFileSync('test/hbConfig/google-login.html', html);
          // console.log(html);
          const passwordInput = await driver.wait(
            until.elementLocated(By.name('password')),
          );
          console.log('7 Current URL:', await driver.getCurrentUrl());
          await passwordInput.clear();
          await passwordInput.sendKeys(process.env.GOOGLE_PASSWORD);
          console.log('8 Current URL:', await driver.getCurrentUrl());
          await driver.findElement(By.id('passwordNext')).click();

        });

        // No need for actual login, browser used stored credentials

        test('Confirm account linking', async () => {
          await safeSwitchToWindow(popupWindow);

          const confirmButton = await driver.wait(
            until.elementLocated(By.xpath('//button[contains(text(), \'Confirm\')]')),
          );
          console.log('a Current URL:', await driver.getCurrentUrl());
          await driver.wait(until.elementIsVisible(confirmButton));
          console.log('b Current URL:', await driver.getCurrentUrl());
          await confirmButton.click();
          console.log('c Current URL:', await driver.getCurrentUrl());

          await driver.wait(async () => {
            const handles = await driver.getAllWindowHandles();
            return !handles.includes(popupWindow);
          });
          console.log('d Popup window closed');

          const remainingHandles = await driver.getAllWindowHandles();
          console.log('e Popup window closed');
          expect(remainingHandles).not.toContain(popupWindow);
        });

        test('should confirm the popup window has closed', async () => {
          const handles = await driver.getAllWindowHandles();

          // Optional debug
          console.log('223: Remaining window handles:', handles);

          // Expect only the main window to remain
          expect(handles.length).toBe(1);
          await safeSwitchToWindow(originalWindow);
        });


      });
      test('sleep 10 seconds to observe the popup', async () => {
        console.log('Sleeping for 10 seconds to observe the popup...');
        await driver.sleep(120000);
      }, 121000);
    });
  });

  describe('Create Subscription', () => {
    let originalWindow: string;
    let popupWindow: string;
    beforeAll(async () => {
      await openPluginConfig(driver);
    });
    test('should show Account Status as Trial with expiry', async () => {


      console.log('256: AS Current URL:', await driver.getCurrentUrl());
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      const statusElement = await driver.wait(
        until.elementLocated(By.xpath('//p[contains(., \'Account Status:\')]')),
        5000,
      );
      const statusText = await statusElement.getText();
      console.log('265: Account status text:', statusText);
      if (!statusText.includes('Trial')) {
        cancelCreateTests = true;
        console.log('268: Canceling all tests due to Trial status');
      }
      expect(statusText).toMatch(/Account Status: Trial, Expiry: \d{1,2} \w{3} 20\d{2}/); // ✅ RegExp
      originalWindow = await driver.getWindowHandle();
      await driver.switchTo().defaultContent();
    });

    test('should expand the Create Subscription section', async () => {
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      // Click the legend
      const legend = await driver.wait(
        until.elementLocated(By.xpath('//legend[contains(normalize-space(), \'Create Subscription\')]')),
        5000,
      );
      expect(legend).toBeDefined();
      await legend.click();

      await driver.switchTo().defaultContent();
    });

    test('should click the PayPal button in first container', async () => {
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      const paypalContainer = await driver.findElement(By.id('paypal-button-container-0'));
      // console.log('297: 💡 Dumping page source before wait...');
      // const html = await driver.getPageSource();
      // console.log(html);
      const paypalIframe = await driver.wait(
        until.elementLocated(By.css('#paypal-button-container-0 iframe.component-frame')),
        10000, // wait up to 10s
      );
      await driver.switchTo().frame(paypalIframe);

      const paypalButton = await driver.wait(
        until.elementLocated(By.css('div.paypal-button[data-funding-source="paypal"]')),
        10000,
      );

      expect(paypalButton).toBeDefined();

      await driver.wait(until.elementIsVisible(paypalButton), 5000);
      await paypalButton.click();

      console.log('296: PayPal button clicked.');

      await driver.switchTo().defaultContent();
    });

    test('Enter PayPal login credentials in popup', async () => {
      // Wait for popup to open
      await driver.wait(async () => (await driver.getAllWindowHandles()).length > 1, 10000);
      const handles = await driver.getAllWindowHandles();
      const popupHandle = handles.find(h => h !== handles[0])!;
      await driver.switchTo().window(popupHandle);
      await driver.wait(until.titleIs('Log in to your PayPal account'));
      expect(await driver.getTitle()).toContain('Log in to your PayPal account');
      if (trace) {
        console.log('314: ', await driver.getTitle());
      }
      //    expect(await driver.findElement(By.css("body")).getText()).toContain('Subscription Options');
      if (trace) {
        console.log('316: ', await driver.findElement(By.css('body')).getText());
      }

      // expect(await driver.findElement(By.css("body")).getText()).toContain('Pay with PayPal');

      const emailInput = await driver.findElement(By.id('email'));
      await emailInput.clear();
      await emailInput.sendKeys(process.env.PAYPAL_PER_USERNAME);
      if (trace) {
        console.log('323: ', await driver.findElement(By.css('body')).getText());
      }
      //await driver.findElement(By.id('btnNext')).click();

      try {
        const nextButton = await driver.findElement(By.id('btnNext'));
        await nextButton.click();
        if (trace) {
          console.log('400: Clicked Next button');
        }
        // Optionally wait for password field to be present
        await driver.wait(until.elementLocated(By.id('password')), 5000);
      } catch (err) {
        if (trace) {
          console.log('Next button not shown, skipping to password entry');
        }
      }
      //      sleep(1000);
      if (trace) {
        console.log('327: ', await driver.getTitle());
      }
      if (trace) {
        console.log('328: ', await driver.findElement(By.css('body')).getText());
      }
      //await driver.wait(until.titleIs('Log in to your PayPal account'));
      //expect(await driver.findElement(By.css("body")).getText()).toContain('Pay with PayPal');

      await driver.findElement(By.id('password')).sendKeys(process.env.PAYPAL_PER_PASSWORD);

      console.log('421: password entered');
      await driver.findElement(By.id('btnLogin')).click();
      console.log('423: password entered');
      await driver.wait(until.titleIs('PayPal Checkout - Choose a way to pay'));
      console.log('425: Choose a way to pay');
      expect(await driver.getTitle()).toContain('PayPal Checkout - Choose a way to pay');

      if (trace) {
        console.log('341: ', await driver.getTitle());
      }
      if (trace) {
        console.log('342: ', await driver.findElement(By.css('body')).getText());
      }

      //  expect(await driver.findElement(By.css("body")).getText()).toContain('Subscription Options');
      await driver.findElement(By.xpath('//button[contains(@ng-click, \'continue()\')]')).click();

      await driver.wait(until.titleIs('PayPal Checkout - Review your payment'));
      expect(await driver.getTitle()).toContain('PayPal Checkout - Review your payment');
      //      sleep(1000);
      if (trace) {
        console.log('334', await driver.getTitle());
      }
      if (trace) {
        console.log('335', await driver.findElement(By.css('body')).getText());
      }

      //  expect(await driver.findElement(By.css("body")).getText()).toContain('Subscription Options');
      if ((await driver.getTitle()) === 'PayPal Checkout - Choose a way to pay') {
        if (trace) {
          console.log('339 - Clicking continue', await driver.getTitle());
        }
        await driver.findElement(By.xpath('//button[contains(@ng-click, \'continue()\')]')).click();
      }

      // await driver.wait(until.titleIs('PayPal Checkout - Review your payment'));
      //      sleep(1000);
      if (trace) {
        console.log('344', await driver.getTitle());
      }
      const confirmButton = await driver.wait(
        until.elementLocated(By.id('confirmButtonTop')),
        5000,
      );
      if (trace) {
        console.log('345', await driver.findElement(By.css('body')).getText());
      }
      expect(confirmButton).toBeDefined();
      await driver.findElement(By.id('confirmButtonTop')).click();
      if (trace) {
        console.log('348', await driver.getTitle());
      }
      await driver.wait(until.titleIs('PayPal Checkout - Review your payment'));
      if (trace) {
        console.log('350', await driver.getTitle());
      }
      expect(await driver.getTitle()).toContain('PayPal Checkout - Review your payment');
      // sleep(1000);
      if (trace) {
        console.log('358', await driver.getTitle());
      }
      if (trace) {
        console.log('359', await driver.findElement(By.css('body')).getText());
      }

      await driver.wait(async () => {
        const handles = await driver.getAllWindowHandles();
        return handles.length === 1;
      }, 10000);

      await safeSwitchToWindow(originalWindow);
      if (trace) {
        console.log('362: ', await driver.getTitle());
      }
      expect(await driver.getTitle()).toContain('HB GSH Test');
      // await driver.wait(until.elementLocated(By.id('notification')));
      // Click the legend
      // console.log('💡 Dumping page source before wait...');
      // const html = await driver.getPageSource();
      // console.log(html);
      await driver.wait(
        until.elementLocated(By.xpath('//div[contains(@class, \'toast-message\') and contains(text(), \'Service Subscription Created\')]')),
        10000,
      );
      if (trace) {
        console.log('388: ', await driver.getTitle());
      }
      // Wait for the toast notification to appear
      /*
      await driver.wait(
        until.elementLocated(By.id('toast-container')),
        3000
      );
      const toast = await driver.wait(
        until.elementLocated(By.css('#toast-container .toast')),
        7000
      );
      expect(toast).toBeDefined();
      const toastText = await toast.getText();
      expect(toastText).toBeDefined();
      // Assert the toast message confirms cancellation
      expect(toastText.toLowerCase()).toContain('cancelled');
      */
      if (trace) {
        console.log('364', await driver.getTitle());
      }
      // sleep(1000);
    }, 30000);


    test('should confirm the popup window has closed', async () => {
      const handles = await driver.getAllWindowHandles();

      // Optional debug
      console.log('399: Remaining window handles:', handles);

      // Expect only the main window to remain
      expect(handles.length).toBe(1);
      await safeSwitchToWindow(originalWindow);
    });

    test('should show Account Status as Subscription:', async () => {
      if (trace) {
        console.log('407', await driver.getTitle());
      }
      expect(await driver.getTitle()).toContain('HB GSH Test');
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      // Wait for the paypal buttons to disappear

      await driver.wait(async () => {
        const frames = await driver.findElements(By.css('iframe.component-frame'));
        return frames.length === 0;
      }, 10000); // wait up to 10s

      const statusElement = await driver.wait(
        until.elementLocated(By.xpath('//p[contains(., \'Account Status:\')]')),
        5000,
      );

      // console.log('💡 Dumping page source before wait...');
      // const html = await driver.getPageSource();
      // console.log(html);

      const statusText = await statusElement.getText();
      console.log('417: Account status text:', statusText);
      if (statusText.includes('Trial')) {
        // cancelAllTests = true;
        console.log('448: Canceling all tests due to Trial status');
      }
      expect(statusText).toMatch(/Account Status: Subscription: Euro Monthly/); // ✅ RegExp
      originalWindow = await driver.getWindowHandle();
      await driver.switchTo().defaultContent();
    });

    test('sleep 10 seconds to observe the popup', async () => {
      console.log('Sleeping for 10 seconds to observe the popup...');
      await driver.sleep(10000);
    }, 121000);
  });

  describe('Manage Subscription', () => {
    let originalWindow: string;
    let popupWindow: string;
    beforeAll(async () => {
      await openPluginConfig(driver);
    });

    test('should show Account Status as Subscription:', async () => {
      if (trace) {
        console.log('440', await driver.getTitle());
      }
      if (await driver.getTitle() !== 'HB GSH Test') {
        console.log('Canceling all tests due to incorrect title');
        cancelCancelTests = true;
      }
      expect(await driver.getTitle()).toContain('HB GSH Test');
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      const statusElement = await driver.wait(
        until.elementLocated(By.xpath('//p[contains(., \'Account Status:\')]')),
        5000,
      );
      const statusText = await statusElement.getText();
      console.log('475: Account status text:', statusText);
      if (statusText.includes('Trial')) {
        cancelCancelTests = true;
        console.log('Canceling all tests due to Trial status');
      }
      expect(statusText).toMatch(/Account Status: Subscription: Euro Monthly/); // ✅ RegExp
      originalWindow = await driver.getWindowHandle();
      await driver.switchTo().defaultContent();
    });

    test('should expand the Subscription Details section', async () => {
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      // Click the legend
      const legend = await driver.wait(
        until.elementLocated(By.xpath('//legend[contains(normalize-space(), \'Subscription Details\')]')),
        5000,
      );
      expect(legend).toBeDefined();
      await legend.click();

      await driver.switchTo().defaultContent();
    });

    test('should click the Cancel Subscription button', async () => {
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);
      const button = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(text(), \'Cancel Subscription\')]')),
        1000,
      );

      await driver.wait(until.elementIsVisible(button), 3000);
      await driver.wait(until.elementIsEnabled(button), 3000);

      expect(button).toBeDefined();
      await button.click();
      await driver.switchTo().defaultContent();
    });

    test('should confirm subscription cancellation', async () => {
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      await driver.switchTo().frame(iframe);

      // Click "Yes, Cancel" in the confirm dialog
      const confirmButton = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(text(), \'Yes, Cancel\')]')),
        3000,
      );

      await driver.wait(until.elementIsVisible(confirmButton), 3000);
      await driver.wait(until.elementIsEnabled(confirmButton), 3000);
      await confirmButton.click();

      // Wait for overlay to disappear
      await driver.wait(
        until.stalenessOf(confirmButton),
        1000,
      );
    });

    test('Validate updated status', async () => {
      await driver.switchTo().defaultContent();
      const iframe = await driver.findElement(By.css('.modal-body iframe'));
      expect(iframe).toBeDefined();
      // await driver.switchTo().frame(iframe);
      // Wait for the toast notification to appear
      // console.log('550: 💡 Dumping page source before wait...');
      // const html = await driver.getPageSource();
      // console.log(html);

      // Verify updated account status
      const toast = await driver.wait(
        until.elementLocated(By.xpath('//div[contains(@class, \'toast-message\')]')),
        10000,
      );
      if (trace) {
        console.log('580: Toast message found', await toast.getText());
      }
      const toastText = await toast.getText();
      expect(toastText).toBe('Subscription Cancelled');
      const bodyText = await driver.findElement(By.css('body')).getText();
      expect(bodyText).not.toContain('Subscription: Euro Monthly');

      await driver.switchTo().defaultContent();
    });

    test('confirm no popup windows are open', async () => {
      const handles = await driver.getAllWindowHandles();

      // Optional debug
      if (trace) {
        console.log('590: Remaining window handles:', handles);
      }

      // Expect only the main window to remain
      expect(handles.length).toBe(1);
      await safeSwitchToWindow(originalWindow);
    });

    test('sleep 10 seconds to observe the popup', async () => {
      console.log('Sleeping for 10 seconds to observe the popup...');
      await driver.sleep(10000);
    }, 11000);
  });
});

// Helpers

async function safeSwitchToWindow(handle: string) {
  const handles = await driver.getAllWindowHandles();
  if (!handles.includes(handle)) {
    throw new Error(`Window handle ${handle} no longer exists`);
  }
  await driver.switchTo().window(handle);
}

function checkCancel() {
  if (cancelCancelTests || cancelCreateTests) {
    throw new Error('Test run canceled');
  }
}