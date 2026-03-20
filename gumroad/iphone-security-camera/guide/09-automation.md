# Chapter 9: Automation

Take your iPhone security camera to the next level by connecting it to automation platforms. This chapter covers Apple Shortcuts and IFTTT recipes that add smart behavior to your setup.

## What automation can do

With the right automations, your camera can:

- Send a custom notification with a screenshot when motion is detected
- Turn on smart lights when motion is detected at night
- Log all motion events to a spreadsheet
- Automatically enable/disable the camera based on your location
- Save clips to cloud storage automatically
- Send alerts to multiple family members simultaneously

## Apple Shortcuts automations

Apple Shortcuts is built into every iPhone running iOS 13 or later. It can trigger actions based on time, location, or app events.

### Automation 1: Location-based camera toggle

Automatically arm the camera when you leave home and disarm when you arrive.

**Setup:**
1. Open the Shortcuts app on your **primary** phone
2. Tap **Automation** at the bottom
3. Tap **+ New Automation**
4. Select **Leave** (location trigger)
5. Set your home address
6. For the action, add: **Open App** > select your camera app
7. Optionally, add a notification action: "Camera armed — you left home"
8. Repeat for **Arrive** to disarm (open the app and disable motion alerts)

**Note:** This automation runs on your primary phone, not the camera phone. It can open the camera app to check the feed, but cannot directly control the camera phone's app. Some camera apps (like Alfred) have their own home/away detection that works better for this.

### Automation 2: Scheduled recording

Only record during specific hours (e.g., overnight or while at work).

**Setup:**
1. Open Shortcuts > Automation > New Automation
2. Select **Time of Day**
3. Set the time you want recording to start (e.g., 11:00 PM)
4. For the action: Send a notification reminder to check that the camera is on
5. Create a second automation for the morning (e.g., 7:00 AM) to remind you to check camera status

### Automation 3: Daily camera health check

Get a daily reminder to verify your camera is working.

**Setup:**
1. Open Shortcuts > Automation > New Automation
2. Select **Time of Day** > set to your preferred time (e.g., 9:00 AM)
3. Add actions:
   - Show Notification: "Daily camera check — tap to view"
   - Open App: [Your camera app]
4. This takes 10 seconds a day and catches issues early

## IFTTT automations

IFTTT (If This Then That) connects apps and services together. Some camera apps (notably Manything and Alfred) have IFTTT integration.

### Getting started with IFTTT

1. Download the **IFTTT** app on your primary phone
2. Create an account
3. Search for your camera app in IFTTT's services
4. Connect your camera app account to IFTTT

### Recipe 1: Motion alert to email

When the camera detects motion, send yourself an email with the timestamp.

**Setup:**
1. In IFTTT, tap **Create**
2. **If This**: Select your camera app > "Motion Detected"
3. **Then That**: Select **Email** > "Send me an email"
4. Customize the email subject and body with the timestamp
5. Save and enable

### Recipe 2: Motion event logging

Log every motion event to a Google Sheets spreadsheet for review.

**Setup:**
1. In IFTTT, tap **Create**
2. **If This**: Select your camera app > "Motion Detected"
3. **Then That**: Select **Google Sheets** > "Add row to spreadsheet"
4. Configure columns: Date, Time, Camera Name
5. Save and enable

This creates an automatic log of all motion events — useful for seeing patterns (e.g., "motion detected every day at 3:15 PM" might be the mail carrier).

### Recipe 3: Smart light integration

Turn on lights when motion is detected (requires smart lights).

**Setup:**
1. In IFTTT, tap **Create**
2. **If This**: Select your camera app > "Motion Detected"
3. **Then That**: Select your smart light service (Philips Hue, LIFX, TP-Link, etc.) > "Turn on lights"
4. Select which lights to turn on
5. Save and enable

**Tip:** Create a second applet to turn lights off after 5 minutes using IFTTT's "Wait" action or a separate time-based trigger.

### Recipe 4: Alert multiple people

Send a push notification to multiple family members when motion is detected.

**Setup:**
1. Each family member installs IFTTT and connects to the camera service
2. Create the same applet on each person's IFTTT account
3. Or use IFTTT's webhook feature to send notifications to a shared channel

## Advanced: Webhooks and custom notifications

For more technical users, webhooks allow you to trigger custom actions from motion events.

### Sending a webhook on motion detection

Some camera apps can send a webhook (HTTP request) when motion is detected. This can trigger:

- A custom push notification via Pushover or Pushbullet
- A Slack or Discord message
- A custom script on your computer or server

**Example with Pushover (custom push notifications):**
1. Create a Pushover account and install the app
2. In IFTTT, create an applet: Camera motion > Webhooks > send request to Pushover API
3. Configure the notification title, message, and priority

## Home/away detection

Some camera apps have built-in home/away detection:

### Alfred Camera
- Uses your primary phone's location to detect if you're home or away
- Can automatically enable/disable motion alerts based on your location
- Configure in the Alfred app: Settings > Home/Away

### Presence
- Built-in geofencing (location-based triggers)
- Automatically arms the camera when you leave home
- Configure in Settings > Home/Away

### Manual approach (any app)
If your app doesn't have built-in home/away:
1. Create a Shortcut automation triggered by leaving/arriving home
2. The automation opens the camera app and sends you a reminder to arm/disarm

## Practical automation recommendations

### For beginners
Start with just one automation:
- **Daily health check** (Shortcuts) — takes 2 minutes to set up, saves you from discovering the camera was offline for days

### For intermediate users
Add location-based arming:
- **Home/away detection** — either built into your app or via Shortcuts
- **Motion event logging** to Google Sheets (IFTTT)

### For advanced users
Build a complete smart home integration:
- Motion-triggered lights
- Multi-person notifications
- Webhook-based custom alerts
- Scheduled recording windows

## Limitations to be aware of

- Apple Shortcuts cannot directly control apps on another phone (the camera phone). Most automations run on your primary phone.
- IFTTT requires a stable internet connection on the camera phone to trigger events.
- Free IFTTT accounts are limited to a small number of applets. Premium is $3.99/month.
- Automation adds complexity. If something breaks, check the automation platform (Shortcuts or IFTTT) in addition to the camera app.
- Some camera apps have limited or no IFTTT integration. Check your app's supported integrations before setting up complex automations.
