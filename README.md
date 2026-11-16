# ColdMail Studio - Local Desktop Cold Outreach & Email Automation Software

<div align="center">

![ColdMail Studio Banner](https://img.shields.io/badge/ColdMail-Studio-6366f1?style=for-the-badge&logo=electron&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-cyan?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-orange?style=for-the-badge)

**100% LOCALLY RUNNING DESKTOP SOFTWARE • ZERO EXTERNAL CLOUD BACKEND • EMBEDDED SQLITE DATABASE**

*High-deliverability cold outreach software running completely offline on your computer with multi-mailbox rotation, reactive 6-hour failover, organic human pacing, and instant global desktop hotkeys (`Ctrl + M`, `F9`).*

</div>

---

## ⚡ 1-Line Setup & Run (Copy & Paste Into PowerShell)

Open PowerShell and paste this **single line** (it works from anywhere, even `PS C:\Users\Dell>`):

```powershell
git clone https://github.com/NithinVarma50/Cold-Mail-studio.git; cd Cold-Mail-studio; npm install; npm run build; npm start
```

### What this single command does automatically:
1. Clones the project from GitHub into `Cold-Mail-studio`
2. Enters the folder (`cd Cold-Mail-studio`)
3. Installs all dependencies (`npm install`)
4. Compiles the Electron backend and React UI (`npm run build`)
5. Launches the ColdMail Studio desktop application window (`npm start`)

---

## 🖱️ 1-Click Double-Click Launcher (`start.bat`)

Once downloaded or cloned:
1. Open the **`Cold-Mail-studio`** folder.
2. Double-click the file **`start.bat`**.
3. It will automatically check dependencies, compile, and open ColdMail Studio without you typing any commands!

*(On macOS or Linux, run `./start.sh` in your terminal).*

---

## ⌨️ Desktop Hotkeys & Quick Access

ColdMail Studio is equipped with global and in-app shortcuts:

### 🌐 System-Wide Hotkeys (Works anywhere on your desktop, even when minimized):
| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Ctrl + M`** (or `Cmd + M`) | Reveal & Focus App | Primary global shortcut to bring the dashboard to the front |
| **`Ctrl + Shift + M`** | Fail-Safe Hotkey | Guaranteed conflict-free if another app hooks `Ctrl + M` |
| **`F9`** | 1-Key Quick Toggle | Instant single-key launcher to toggle dashboard to the front |

### 🎯 In-App Shortcuts:
| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + 1`** | Navigate to Inboxes / Dashboard overview |
| **`Ctrl + 2`** / **`Ctrl + N`** | Start New Campaign Wizard |
| **`Ctrl + 3`** | Navigate to Live Transmission Telemetry Console |
| **`Ctrl + 4`** | Navigate to Transmission Audit Logs |
| **`Ctrl + B`** | Open Connect Mailbox Modal |
| **`Ctrl + /`** or **`?`** | Open Interactive Shortcuts Cheat Sheet |

---

## 🔄 Daily Launch & Update Commands

### How to Start the App Later:
```powershell
cd Cold-Mail-studio; npm start
```
*(Or simply double-click `start.bat`).*

### How to Update to the Latest Version:
```powershell
cd Cold-Mail-studio; git pull; npm install; npm run build; npm start
```

---

## 🗑️ How to Completely Uninstall / Clean Remove

ColdMail Studio runs 100% locally with zero cloud backend. To cleanly remove both the software and its local embedded SQLite database:

### In Windows PowerShell (Run from anywhere):
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\.email-automation" -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force "Cold-Mail-studio" -ErrorAction SilentlyContinue
```

### In Windows Command Prompt (CMD):
```cmd
rmdir /s /q "%APPDATA%\.email-automation" & rmdir /s /q "Cold-Mail-studio"
```

### In macOS / Linux Terminal:
```bash
rm -rf ~/.email-automation && rm -rf Cold-Mail-studio
```

---

## 🏗️ Core Architecture (Zero-Backend)

1. **Local Storage**: Embedded SQLite database (`coldmail.db` via `better-sqlite3`) storing:
   - `mailboxes`: Host, port, AES-256 encrypted credentials, daily quotas, burst counters, status.
   - `campaigns`: Sequences, templates, pacing configuration, mailbox pool assignment.
   - `contacts`: Mapped recipient attributes, custom CSV fields, dispatch status, error logs.
   - `send_logs`: Low-level SMTP handshakes, delivery timestamps, failure codes.
2. **Credential Security**:
   - Outgoing mailbox passwords encrypted using **AES-256-GCM** with unique initialization vectors (IV) and authentication tags.
3. **Low-Level Network Engine**:
   - Direct socket connections over port **465 (SSL)** or port **587 (STARTTLS)** with automatic greeting, TLS handshake, and socket timeout controls.

---

## 🔄 Multi-Mailbox Rotation & Reactive Failover

### 1. Provider Auto-Detection & Preset Handshakes
- `*@gmail.com` / `*@googlemail.com` ➔ `smtp.gmail.com:465` (SSL)
- `*@outlook.com` / `*@hotmail.com` / `*@office365.com` ➔ `smtp.office365.com:587` (TLS)
- `*@zoho.com` ➔ `smtp.zoho.com:465` (SSL)
- Custom Domains ➔ `smtp.<domain>:465` (Customizable)

### 2. Proactive Burst Rotation Ceilings
To prevent mail servers from identifying automated batch sending patterns, the engine limits consecutive transmissions per inbox before rotating round-robin:
- **Gmail / Workspace**: `40` emails / burst ceiling
- **Outlook / 365**: `30` emails / burst ceiling
- **Zoho Mail**: `25` emails / burst ceiling
- **Custom Business Domains**: `60` emails / burst ceiling

### 3. Reactive Error Failover
Monitors incoming SMTP responses in real time. If any response matches:
```regexp
/421|452|550 5\.4\.5|daily user sending limit|quota|too many recipients|throttled|temporarily blocked/i
```
- The affected mailbox is automatically flagged for a **6-Hour Cooldown**.
- The current contact is immediately **re-queued** without loss and dispatched via the next healthy mailbox in the rotation pool.
- If all configured mailboxes are in cooldown or hit their daily limit, the sequence safely pauses and alerts the operator.

---

## ⏱️ Organic Human Pacing Engine

Sender mailboxes are grouped into profiles with micro-jitters to protect domain reputation:
- **Consumer Free Mailboxes (@gmail, @outlook, @zoho)**:
  - Batch size: 10 emails.
  - Per-email delay: `850ms` to `2,500ms` random jitter.
  - Batch cooldown: `3s` to `6s` between batches.
- **Custom Business Domains (@company.com)**:
  - Batch size: 35 emails.
  - Per-email delay: `150ms` to `400ms`.
  - Batch cooldown: `500ms` to `1s` between batches.
- **Stealth Human Warmup Mode (UI Toggle)**:
  - Emulates a human typing and sending individual messages.
  - Delay: `15s` to `45s` random jitter per email.
  - Batch size: 5 emails, batch cooldown `30s` to `60s`.

---

## 📁 Contacts & Dynamic Template Engine

- **Drag & Drop CSV / Excel Importer**:
  - Supports `.csv`, `.xlsx`, and `.xls`.
  - Automated column mapping for Email, First Name, Last Name, Company, and custom headers.
  - Instant **RFC 5322 regex validation**. Syntax invalid addresses and duplicates are automatically flagged and quarantined before queueing.
- **Dynamic Variable Interpolation & Fallbacks**:
  - `{{first_name | there}}` ➔ Renders recipient first name, or "there" if blank ("Hi John," or "Hi there,").
  - `{{company | your team}}` ➔ Renders company name or fallback.
  - Custom CSV fields supported: `{{role}}`, `{{industry}}`, etc.
  - **Live Side-by-Side Preview**: Cycle through contacts to verify real output before sending.

---

## 🧪 Testing with Included Sample Contacts & 1-Click Demo

There are two ways to immediately test:
1. **1-Click In-App Demo**: In Step 2 of the Campaign Wizard, simply click **`Load Demo Contacts`**. It will instantly populate contacts with valid rows, duplicate rows, and missing company fields to test fallbacks!
2. **File Import**: Drag and drop the included [`sample_contacts.csv`](./sample_contacts.csv) file from the root directory.

---

## 📋 Full Command Reference

| Command | Action |
| :--- | :--- |
| `git clone https://github.com/NithinVarma50/Cold-Mail-studio.git; cd Cold-Mail-studio; npm install; npm run build; npm start` | **All-in-One: Clone, Install, Build & Run** |
| `cd Cold-Mail-studio; npm start` | Start the app anytime |
| `start.bat` | Double-click launcher for Windows |
| `./start.sh` | Bash script launcher for macOS / Linux |
| `git pull; npm install; npm run build; npm start` | Update to the latest code and launch |
| `Remove-Item -Recurse -Force "$env:APPDATA\.email-automation"; Remove-Item -Recurse -Force "Cold-Mail-studio"` | Completely uninstall app and local database |

---

## 📄 License
MIT License. Free to use, modify, and distribute for private and commercial outreach.
