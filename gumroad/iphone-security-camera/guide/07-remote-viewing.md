# Chapter 7: Remote Viewing

One of the biggest advantages of using a smartphone as a security camera is the ability to check in from anywhere. This chapter covers setting up remote access, sharing with family members, and managing multiple cameras.

## How remote viewing works

When your camera phone records video, the camera app sends the stream to its cloud servers. When you open the viewer app on your primary phone, it connects to those servers and pulls the live feed. This works over any internet connection — Wi-Fi, cellular, or even from another country.

**Requirements for remote viewing:**
- Camera phone connected to Wi-Fi with internet access
- Viewer phone with internet access (Wi-Fi or cellular)
- Both phones signed into the same camera app account
- The camera app running on the camera phone

## Setting up remote access by app

### Alfred Camera

Remote viewing works automatically once both devices are signed in with the same Google account.

1. Open Alfred on your primary phone
2. Tap on the camera in your device list
3. The live feed loads automatically
4. Tap the play button if the feed doesn't start

**Remote features:**
- Live streaming (real-time)
- Motion event timeline (scroll through past events)
- Screenshot capture from live feed
- Two-way audio (tap the microphone icon)
- Flashlight toggle (turns on the camera phone's flash)
- Camera flip (switch between front and back cameras)

### Presence

1. Open Presence on your primary phone
2. Your camera appears in the device list
3. Tap to view the live feed
4. Swipe to switch between cameras (if you have multiple)

**Remote features:**
- Live streaming
- AI-filtered event history
- Two-way audio
- Screenshot and clip saving
- Alert history with thumbnails

### AtHome Camera

AtHome requires both devices on the same account. Remote viewing over cellular data requires the premium plan on some configurations.

1. Open AtHome Video Streamer on your primary phone
2. Your camera should appear in the device list
3. Tap to connect and view the live feed

**Remote features:**
- Live streaming
- Local recording playback (when on the same network)
- Motion event notifications

## Sharing with family members

You can give family members access to your camera feeds so multiple people can check in.

### Method 1: Shared account

The simplest approach — share your camera app login credentials with family members.

1. Install the camera app on their phone
2. Sign in with your account
3. They can now view all your cameras

**Pros:** Simple, no extra setup
**Cons:** They have full access to all settings; changing the password logs everyone out

### Method 2: App-specific sharing (if supported)

Some apps have built-in sharing features:

**Alfred Camera:**
1. Open Alfred on the viewer phone
2. Go to Settings > Trust Circle
3. Add family members by email
4. They receive an invitation to view your cameras

**Presence:**
1. Open Presence on the viewer phone
2. Go to Settings > Family Sharing
3. Invite family members by email
4. They get view-only access

### Method 3: Screen sharing (workaround)

If the app doesn't support sharing:
1. Open the camera app live feed on your phone
2. Use screen sharing (FaceTime SharePlay, screen recording, or a quick screenshot) to show the feed to others
3. Not ideal for continuous access, but works for occasional check-ins

## Multi-camera setup

If you have multiple old iPhones, you can create a multi-camera system.

### Same app, multiple cameras

Most apps support multiple camera devices on one account:

1. Set up each phone as a camera using the same account
2. Name each camera clearly (e.g., "Front Door," "Living Room," "Baby Room")
3. On your viewer phone, all cameras appear in a list
4. Tap any camera to view its live feed

### Tips for multi-camera systems

- **Name cameras clearly** — You'll want to quickly identify which camera triggered an alert
- **Stagger sensitivity** — Front door can be high sensitivity; living room can be low
- **Check Wi-Fi capacity** — Each streaming camera uses bandwidth. With 3+ cameras, make sure your router can handle the load (most modern routers handle 5+ devices easily)
- **Use different alert tones** — If your app supports it, assign different notification sounds to different cameras so you know which one triggered without looking

### Viewing multiple cameras at once

Most apps show one camera at a time. To monitor multiple feeds simultaneously:

- **Alfred Camera**: Swipe between cameras; premium users get a grid view
- **Presence**: Dashboard shows thumbnails of all cameras
- **AtHome**: Tap between cameras in the device list

For a true multi-camera dashboard, view the feeds on a tablet (iPad) — the larger screen makes it practical to switch between cameras quickly.

## Bandwidth and data usage

### Home Wi-Fi (camera phone)

Each camera uses approximately:
- 480p streaming: 0.5-1 Mbps
- 720p streaming: 1-2 Mbps
- 1080p streaming: 2-4 Mbps

This is one-way upload from the camera phone. Your home internet upload speed needs to support this.

**Check your upload speed:**
1. On any device connected to your Wi-Fi, go to speedtest.net
2. Note the **upload** speed (not download)
3. You need at least 2x the streaming bitrate for reliable performance

### Cellular data (viewer phone)

Viewing the live feed on cellular data consumes:
- 480p: ~200-400 MB per hour
- 720p: ~400-700 MB per hour
- 1080p: ~700 MB-1.5 GB per hour

**Tips to reduce cellular data usage:**
- Only check the live feed when you receive a motion alert
- Keep viewing sessions short (30 seconds to check, then close)
- Lower the streaming quality in the app settings for remote viewing
- Use Wi-Fi on the viewer phone whenever possible

## Remote viewing troubleshooting

**Cannot connect to camera remotely:**
- Check that the camera phone is still connected to Wi-Fi
- Check that the camera app is still running on the camera phone
- Restart the camera app on both devices
- Make sure your home internet is working (ask someone at home to check, or check your router remotely)

**Feed is laggy or buffering:**
- Lower the streaming resolution
- Check your viewer phone's internet speed
- Check the camera phone's Wi-Fi signal strength
- Close other apps on the viewer phone

**Feed disconnects frequently:**
- This usually indicates weak Wi-Fi on the camera phone
- Move the camera closer to the router or add a Wi-Fi extender
- Check if your router has a connection timeout setting and increase it

**Alert notifications delayed:**
- Check that notifications are enabled for the camera app on your viewer phone
- Check that the viewer phone has a stable internet connection
- Some apps batch notifications — check the app settings for alert frequency/cooldown settings
- Make sure the camera app is not being killed by the phone's battery optimization
