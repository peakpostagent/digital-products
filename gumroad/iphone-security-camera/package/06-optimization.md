# Chapter 6: Optimization

Once your camera is set up and placed, fine-tuning the settings can make the difference between a useful security tool and a frustrating stream of false alerts. This chapter covers video quality, motion sensitivity, notifications, and storage management.

## Video quality settings

### Resolution trade-offs

| Resolution | Pro | Con |
|-----------|-----|-----|
| 480p | Lowest battery drain, smallest file size | Harder to identify details |
| 720p | Good balance of quality and efficiency | Moderate battery and storage use |
| 1080p | Best detail for identification | Higher battery drain, large files |

**Our recommendation:** Start with 720p. It's sharp enough to identify people and read text, while keeping battery and storage usage reasonable. Drop to 480p if battery life is a concern, or go to 1080p if the phone is always plugged in and storage isn't limited.

### Frame rate

Most camera apps default to 15 fps (frames per second), which is sufficient for security purposes. Higher frame rates (30 fps) produce smoother video but double the storage usage and increase battery drain. Stick with the default unless you have a specific reason to change it.

## Motion detection tuning

Motion detection is the most important feature to get right. Too sensitive and you'll get dozens of false alerts daily. Not sensitive enough and you'll miss actual events.

### Sensitivity levels

- **High**: Catches everything — moving shadows, lighting changes, pets, insects. Use only in low-traffic areas where any movement is significant.
- **Medium**: Good starting point. Catches people walking, doors opening, most pets. Occasional false alerts from dramatic lighting changes.
- **Low**: Only catches large, deliberate movement. Best for high-traffic areas where you only want alerts for unusual activity.

### Tuning process

1. **Start at Medium sensitivity**
2. Monitor for 48 hours
3. Count false alerts vs. real alerts
4. If too many false alerts (more than 5/day from nothing), lower sensitivity
5. If missing real events, increase sensitivity
6. Repeat until you find the right balance

### Reducing false alerts

Common causes of false motion alerts and how to fix them:

- **Changing sunlight / shadows**: Reposition camera away from windows or adjust so sunlight doesn't create moving shadows in the frame
- **Pets**: Lower sensitivity or use apps with AI detection (Presence) that can filter out animals
- **Ceiling fans**: Point the camera away from moving objects in the background
- **Reflections**: Remove or cover reflective surfaces in the camera's view
- **Insects/spiders near the lens**: Clean the lens regularly; a small light near the lens can attract bugs at night

### Motion zones (if supported)

Apps like iVCam support custom motion zones — you define which areas of the frame trigger alerts.

- Draw a zone covering just the door or walkway
- Exclude areas with trees, flags, or other regular movement
- This dramatically reduces false alerts

## Notification settings

### What you want

- Push notifications for motion events on your primary phone
- Optionally, sound alerts for urgent events
- No notifications for low-priority events

### How to configure

**On the camera app:**
- Enable push notifications for motion events
- Set a cooldown period between alerts (60-120 seconds is good — prevents notification floods)
- If the app supports it, enable "smart" alerts only (person detection vs. all motion)

**On your primary phone (iOS):**
1. Settings > Notifications > [Camera App]
2. Allow Notifications: **On**
3. Alert style: **Banners** (or Lock Screen if you want to see them without unlocking)
4. Sounds: **On** (choose a distinct sound so you recognize camera alerts)
5. Badges: **On**

**On your primary phone (Android):**
1. Settings > Apps > [Camera App] > Notifications
2. Enable notifications
3. Set priority to **High** or **Urgent** for motion alerts

### Scheduled notifications

Most apps let you set alert schedules:

- **Home hours** (evenings/weekends): Lower sensitivity or alerts off
- **Away hours** (work, school): Full sensitivity and alerts on
- **Night hours**: Highest sensitivity, loudest alert tone

## Storage management

### Local storage

If your app saves recordings locally (AtHome Camera, or any app in local mode):

**Check available storage:**
Settings > General > iPhone Storage

**Free up space:**
- Enable auto-deletion of old recordings in the app (7-day retention is usually sufficient)
- Lower video resolution to reduce file sizes
- Use motion-triggered recording instead of continuous
- Periodically connect the phone to a computer and transfer/delete old clips

**Estimated storage usage per day:**

| Resolution | Continuous (24hr) | Motion-triggered (~2hr actual) |
|-----------|-------------------|-------------------------------|
| 480p | ~6 GB | ~500 MB |
| 720p | ~12 GB | ~1 GB |
| 1080p | ~24 GB | ~2 GB |

### Cloud storage

If using cloud storage (Alfred, Presence, Manything):

- Free tiers auto-delete older recordings (7-14 days typically)
- No action needed — the app manages storage automatically
- Premium tiers extend retention periods
- Download important clips to your primary phone or computer before they expire

## Night monitoring optimization

Since most iPhone camera apps don't have true infrared night vision:

### Improve low-light performance

- Place a small LED night light in the room (a $3-5 plug-in night light provides enough ambient light for most cameras)
- Use a warm-tone light to reduce harsh shadows
- Position the light source behind or beside the camera (not in front)
- Enable any "night mode" or "low-light filter" in the app settings

### Outdoor night monitoring

- Porch lights or motion-activated lights help tremendously
- Solar-powered motion lights ($10-20) work well for outdoor areas
- Position the camera where existing outdoor lighting is strongest

## Performance optimization

### Keep the app running smoothly

- Close all other apps periodically (double-tap home button, swipe up on each app)
- Restart the phone weekly (covered in Chapter 5)
- Keep the camera app updated
- Monitor CPU and memory usage in Settings > Battery to check for abnormal drain

### Prevent the app from being killed

iOS can kill background apps to save resources. To prevent this:

- Keep the camera app in the foreground (on screen)
- Disable Background App Refresh for all apps except the camera app
- Make sure Low Power Mode is off (it can limit background activity)
- Some apps have a "keep screen on" option — enable it

## Settings summary by use case

### Baby monitor setup
- Resolution: 720p
- Motion detection: Medium
- Audio: On
- Two-way audio: On
- Night light in the room
- Notifications: Always on

### Front door security
- Resolution: 720p or 1080p
- Motion detection: High
- Audio: On
- Cloud recording: On (if available)
- Notifications: On, with person detection if available

### Pet monitoring
- Resolution: 480p
- Motion detection: Low (pets move a lot)
- Audio: Optional
- Notifications: Off or scheduled
- Cloud recording: Optional

### General home monitoring
- Resolution: 720p
- Motion detection: Medium
- Audio: On
- Notifications: Scheduled (on when away, off when home)
- Cloud recording: Optional
