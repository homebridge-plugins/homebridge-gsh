# Change Log

All notable changes to `homebridge-gsh` will be documented in this file. This project tries to adhere to [Semantic Versioning](http://semver.org/).

## v4.0.1 (2025-06-06)

### Changes

- Added new Plugin Config help message for the linking status to Google Home App
- Added support for Dark Mode switching in the Plugin Config screens, need Homebridge UI version 5.x
- Added two new config options to support more complex configurations, Discovery Wait and Discovery Timeout #19
- Add activeThermostatMode to thermostat query response #17, tks @rukuh

### Fixes

- Fix for Thermostat changing modes - Error executing command #12

## v4.0.0 (2025-05-12)

### Changes

- Refreshed plugin config screen to include User ID and updated link account images
- Added more documentation for new users of the service
- Migrated cloud server address from older DNS entry to newer DNS entry
- Added new feature to debug mode, logging of the discovered homebridge services to `homebridge-gsh-discovery.json`.  To assist in debugging of issues

### Fixes

- Fix for Thermostat changing modes - Error executing command #12

## v3.1.2 (2025-02-18)

### Changes

- New feature for Heater Cooler devices and the ability to have it be an AC Unit - #13 Tks @noamcohen97 

### Fixes

- Fixed an issue with Security Services, and automations not triggering on Security Mode changes
- Fixed an issue with hap event processing, and not handling concurrent events

### Outstanding Issue

- Changing thermostat modes - not working #12
  
## v3.1.1 (2024-12-05)

### Changes

### Fixes

- Fixed an issue where the plugin restarted when another child bridge restarted.
- Dependency Updates

## v3.1.0 (2024-11-11)

### Changes

- Updated dependent software packages. This included a major overhaul of the plugin to homebridge interface.
- Make homebridge-gsh Homebridge 2.0 Ready
- Updates to Heater/Cooler #4 tks to @noamcohen97
- Added ability to invert accessory name filter, tks @UiharuKazari2008
- Added a significant number of test cases, to support future enhancements
- Added support for beta testing of Cloud Server
- Complete transistion of dependencies to Homebridge organization

## v3.0.0 (2024-10-27)

Recently Oznu annouced that he no longer had the resources or free time required to maintain this plugin. So we worked with him to transfer the operational assets of the service over to us, so that we could continue to offer this service for Google Home users.

So at the present time, we have created a new cloud server to support this offering, and have successfully migrated operations over. We want to thank Oznu for his time and efforts over the last few years in creating and running this great service for the community.

Going forward we will be updating the cloud server and plugin code base, to bring its patch level up to date, and making other enhancements as needed.

Thank You
