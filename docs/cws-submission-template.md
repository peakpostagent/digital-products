# Chrome Web Store Submission Template

Use this template every time Claude provides CWS upload info.
Copy-paste each field into the Chrome Web Store Developer Console.

---

## TAB 1: Product Details

### Product details (For all languages)

**Description** (paste into Description* box, max 16,000 chars):
```
[DESCRIPTION HERE]
```

**Category**: `[CATEGORY]`
<!-- Options: Communication | Developer Tools | Education | Tools | Workflow & Planning | Art & Design | Entertainment | Games | Household | Just for Fun | News & Weather | Shopping | Social Networking | Travel | Well-being | Accessibility | Functionality & UI | Privacy & Security -->

**Language**: `English (United States)`

### Graphic assets

**Store Icon**: 128x128px PNG (no alpha)
> File: `[PATH TO ICON FILE]`

**Global promo video**: `[YOUTUBE URL or leave blank]`

**Screenshots** (1280x800 or 640x400, JPEG or 24-bit PNG, up to 5):
> File 1: `[PATH]`
> File 2: `[PATH]`

**Small promo tile** (440x280, JPEG or 24-bit PNG, optional):
> File: `[PATH or N/A]`

**Marquee promo tile** (1400x560, JPEG or 24-bit PNG, optional):
> File: `[PATH or N/A]`

### Additional fields

**Official URL**: `None`
**Homepage URL**: `[URL or blank]`
**Support URL**: `[URL or blank]`
**Mature content**: `No`

---

## TAB 2: Privacy

**Single purpose description** (max 1,000 chars):
```
[SINGLE PURPOSE HERE]
```

### Permission justifications (only fill in ones that appear)

**storage justification** (max 1,000 chars):
```
[STORAGE JUSTIFICATION]
```

**activeTab justification** (max 1,000 chars):
```
[ACTIVETAB JUSTIFICATION]
```

**Host permission justification** (max 1,000 chars):
```
[HOST PERMISSION JUSTIFICATION]
```

**Are you using remote code?**: `No, I am not using remote code`

### Data usage

Check NONE of the boxes (no data is collected):
- [ ] Personally identifiable information
- [ ] Health information
- [ ] Financial and payment information
- [ ] Authentication information
- [ ] Personal communications
- [ ] Location
- [ ] Web history
- [ ] User activity
- [ ] Website content

### Certifications (check ALL three):
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL** (max 2,048 chars):
```
https://peakpostagent.github.io/digital-products/extensions/[EXTENSION-FOLDER-NAME]/store-listing/privacy-policy.html
```
<!-- URL pattern: replace [EXTENSION-FOLDER-NAME] with the extension's folder name (e.g., read-cost, pay-decoder, tab-brake) -->

---

## TAB 3: Distribution (if applicable)

**Visibility**: `Public`
**Distribution**: `All regions`

---

# HOW CLAUDE SHOULD FORMAT EACH EXTENSION

When providing CWS info for an extension, use EXACTLY this format.
Each text field gets its own fenced code block so the user can triple-click or click-to-copy.

---

## [EXTENSION NAME] — CWS Submission Info

### TAB 1: Product Details

**Description** (paste into Description box):
```
[full description — ready to copy]
```

**Category**: `[exact category name from dropdown]`

**Language**: `English (United States)`

**Graphic assets**:
- Store Icon (128x128): `[file path]`
- Screenshots: `[status / file paths]`
- Promo video: `[YouTube URL or "skip"]`
- Small promo tile: `skip`
- Marquee promo tile: `skip`

**Additional fields**:
- Official URL: `None`
- Homepage URL: _(leave blank)_
- Support URL: _(leave blank)_
- Mature content: `No`

---

### TAB 2: Privacy

**Single purpose description** (paste into box):
```
[single purpose — ready to copy]
```

**storage justification** (paste into box):
```
[storage justification — ready to copy]
```

**activeTab justification** (paste into box, if field appears):
```
[activeTab justification — ready to copy]
```

**Host permission justification** (paste into box, if field appears):
```
[host permission justification — ready to copy]
```

**Are you using remote code?**: `No, I am not using remote code`

**Data usage checkboxes**: Check NONE

**Certifications**: Check ALL THREE

**Privacy policy URL** (paste into box):
```
https://peakpostagent.github.io/digital-products/extensions/[EXTENSION-FOLDER-NAME]/store-listing/privacy-policy.html
```

---

### TAB 3: Distribution

**Visibility**: `Public`
**Distribution**: `All regions`
