# Chapter 8: Troubleshooting

This chapter covers the most common issues you'll encounter and how to fix them quickly.

## Wi-Fi connectivity issues

### Camera keeps disconnecting from Wi-Fi

**Cause:** Weak signal, router timeout, or interference.

**Fixes:**
1. Check signal strength at the camera location (Settings > Wi-Fi)
2. Move the camera closer to the router
3. Add a Wi-Fi extender or mesh node near the camera
4. Switch to the 2.4 GHz band (longer range than 5 GHz)
5. Restart your router
6. On the camera phone: Settings > Wi-Fi > tap your network > Forget This Network, then reconnect
7. Check if your router has a "kick idle devices" setting and disable it

### Camera connected but feed won't load

**Cause:** Internet outage, app server issues, or NAT/firewall blocking.

**Fixes:**
1. Check if your home internet is working (test on another device)
2. Restart the camera app on both phones
3. Restart the camera phone
4. Check the app's status page or social media for outage reports
5. If on a corporate or restricted network, the app's ports may be blocked

### Slow or choppy feed

**Cause:** Insufficient bandwidth or overloaded network.

**Fixes:**
1. Lower video resolution in the camera app
2. Disconnect other devices from Wi-Fi temporarily to test
3. Check your internet upload speed (need at least 2 Mbps for 720p)
4. Restart your router to clear any congestion

## App crashes and freezes

### App crashes on launch

**Fixes:**
1. Force quit the app (double-tap home, swipe up on the app)
2. Restart the phone
3. Check for app updates in the App Store
4. Delete and reinstall the app (you may need to reconfigure)
5. Check that your iOS version is supported by the app

### App freezes during recording

**Fixes:**
1. Close all other apps on the camera phone
2. Check available storage (Settings > General > iPhone Storage) — if storage is nearly full, the app may crash
3. Lower video resolution to reduce processing load
4. Restart the phone
5. Disable features you're not using (two-way audio, cloud sync)

### App stops running in background

**Cause:** iOS kills the app to save resources.

**Fixes:**
1. Keep the camera app in the foreground (on screen)
2. Disable Background App Refresh for all other apps
3. Turn off Low Power Mode
4. Make sure the phone has enough storage (low storage can cause iOS to aggressively close apps)
5. Some apps have a "prevent sleep" setting — enable it

## Overheating

### Phone displays temperature warning

**Cause:** Continuous processing + charging + warm environment.

**Immediate fixes:**
1. Move the phone to a cooler location
2. Remove any case (cases trap heat)
3. Stop recording temporarily until the phone cools down
4. Place the phone on a metal or hard surface (not fabric)

**Long-term prevention:**
1. Lower video resolution (reduces processing heat)
2. Use a 5W charger instead of a fast charger (generates less heat)
3. Ensure good airflow around the phone
4. Avoid direct sunlight
5. Consider a small USB fan pointed at the phone in hot environments
6. Place the phone near an AC vent in hot climates

### Phone shuts down from overheating

If the phone displays a temperature warning and shuts down:
1. Unplug the charger
2. Let the phone cool completely (15-30 minutes)
3. Move to a cooler location before restarting
4. Lower video resolution and close unnecessary features
5. If this happens repeatedly, the location is too warm for always-on use

## Storage issues

### "Storage Almost Full" message

**Fixes:**
1. Delete old recordings: Open the camera app > Recordings > Delete old clips
2. Enable auto-delete in the camera app settings
3. Lower video resolution to reduce file sizes
4. Switch from continuous recording to motion-triggered only
5. Transfer recordings to a computer: Connect via USB, open Finder/iTunes, browse camera app storage
6. Delete other unnecessary data: Settings > General > iPhone Storage > review and delete

### Recording stops unexpectedly

**Cause:** Usually storage full or the app crashing.

**Fixes:**
1. Free up storage (see above)
2. Set up auto-delete for recordings older than 3-7 days
3. Lower recording quality
4. Use cloud storage instead of local if the app supports it

## Motion detection problems

### Too many false alerts

**Fixes:**
1. Lower motion sensitivity in the app settings
2. Adjust camera angle to exclude areas with regular movement (trees, fans, busy streets)
3. Use motion zones (if supported) to limit detection to specific areas
4. Use an AI-detection app (Presence) that can distinguish people from other movement
5. Set an alert cooldown period (60-120 seconds between alerts)
6. Check for reflective surfaces in the camera's view

### Not detecting motion / missing events

**Fixes:**
1. Increase motion sensitivity
2. Check that motion detection is turned on (it may have been disabled after an app update)
3. Make sure the camera phone screen is on or the app is in the foreground
4. Check that the app has camera permissions (Settings > Privacy > Camera)
5. Clean the camera lens
6. Improve lighting in the monitored area
7. Restart the camera app

### Delayed notifications

**Fixes:**
1. Check viewer phone notification settings (Settings > Notifications > [Camera App])
2. Disable Low Power Mode on the viewer phone
3. Disable Do Not Disturb on the viewer phone (or allow the camera app through)
4. Check internet connection on both phones
5. Check the app's alert cooldown settings — reduce the interval

## Audio issues

### No audio in live feed

**Fixes:**
1. Check that the camera app has microphone permission (Settings > Privacy > Microphone)
2. Turn up the volume on the viewer phone
3. Enable audio in the camera app settings
4. Restart both phones

### Two-way audio not working

**Fixes:**
1. Make sure the app supports two-way audio (AtHome does not)
2. Check microphone permissions on both phones
3. Tap the microphone/speaker icon in the viewer app to activate
4. Check that the volume is up on the camera phone

## Connection issues between devices

### Viewer phone can't find camera

**Fixes:**
1. Make sure both phones are signed into the same account
2. Check that the camera app is running on the camera phone
3. Force quit and reopen the app on both phones
4. Check internet connection on both phones
5. Sign out and sign back in on both phones
6. Uninstall and reinstall the app on the viewer phone

### Camera feed shows "offline"

**Fixes:**
1. Check that the camera phone is powered on and connected to Wi-Fi
2. Open the camera app on the camera phone (it may have been closed)
3. Restart the camera phone
4. Check your home internet connection
5. If the camera phone restarted (power outage, iOS update), you'll need to reopen the camera app manually

## Quick fix checklist

When something goes wrong, try these steps in order:

1. **Check Wi-Fi** on the camera phone
2. **Check that the camera app is running** (open it if not)
3. **Restart the camera app** (force quit and reopen)
4. **Restart the camera phone** (power off and on)
5. **Check storage** (free up space if needed)
6. **Check for app updates** (update if available)
7. **Restart your Wi-Fi router**
8. **Reinstall the camera app** (last resort — will require reconfiguration)
