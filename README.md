# ColdMail Studio - Local Desktop Cold Outreach & Email Automation Software

<div align="center">

![ColdMail Studio Banner](https://img.shields.io/badge/ColdMail-Studio-6366f1?style=for-the-badge&logo=electron&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-cyan?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-orange?style=for-the-badge)

**100% LOCALLY RUNNING DESKTOP SOFTWARE • ZERO EXTERNAL CLOUD BACKEND • EMBEDDED SQLITE DATABASE**

*High-deliverability cold outreach software running completely offline on your computer with multi-mailbox rotation, reactive 6-hour failover, organic human pacing, and instant global desktop hotkey (`Ctrl + M`).*

</div>

---

## ⚡ Global Desktop Hotkey: `Ctrl + M`

ColdMail Studio registers a desktop-wide global shortcut:
- Press **`Ctrl + M`** (or **`Cmd + M`** on macOS) from anywhere on your operating system (even when minimized or running behind other windows) to immediately restore, focus, and reveal the ColdMail Studio dashboard.
- Inside the application, pressing **`Ctrl + M`** instantly brings you back to the Inboxes / Dashboard overview.

---

## 🚀 Quick Setup & Execution Guide

Follow the instructions below depending on whether you already have the folder on your machine or you are downloading it fresh from GitHub.

---

### Option A: If You Already Have the Project on Your Computer

If you already downloaded or extracted the project into your Downloads folder:

1. **Open PowerShell or Terminal**.
2. **Navigate into the project folder first** (CRITICAL: Do not run `npm install` from `C:\Users\Dell`):
   ```powershell
   cd "C:\Users\Dell\Downloads\EMail automation"
   ```
3. **Install dependencies**:
   ```powershell
   npm install
   ```
4. **Build the application**:
   ```powershell
   npm run build
   ```
5. **Launch the desktop app**:
   ```powershell
   npm start
   ```

---

### Option B: If You Are Cloning Fresh from GitHub

If you are setting this up on a new computer or cloning from GitHub:

1. **Make sure you have Node.js and Git installed**:
   - Check Node.js: `node -v` (Needs v18, v20, or v22)
   - Check Git: `git -v`
   *(If not installed, get Node.js from [nodejs.org](https://nodejs.org/)).*

2. **Clone the repository**:
   ```powershell
   git clone https://github.com/NithinVarma50/Cold-Mail-studio.git
   ```

3. **Navigate into the cloned folder**:
   ```powershell
   cd Cold-Mail-studio
   ```

4. **Install all packages**:
   ```powershell
   npm install
   ```

5. **Build the application**:
   ```powershell
   npm run build
   ```

6. **Launch ColdMail Studio**:
   ```powershell
   npm start
   ```

---

### 💻 Development Mode (Live Hot-Reloading)
If you want to edit code and test live with hot-reloading:
```powershell
npm run dev
```

---

## ⚠️ Common Errors & Troubleshooting

### Error: `ENOENT: no such file or directory, open 'C:\Users\Dell\package.json'`
```text
npm error code ENOENT
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open 'C:\Users\Dell\package.json'
```
#### Why this happens:
Your terminal is currently located in your home folder (`C:\Users\Dell`) instead of the project directory where `package.json` resides.

#### How to fix:
Navigate into the folder before running any `npm` commands:
```powershell
cd "C:\Users\Dell\Downloads\EMail automation"
# OR if cloned from git:
# cd Cold-Mail-studio
```
Then run `npm install` again.

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

## 🧪 Testing with Included Sample Contacts

A pre-formatted sample file [`sample_contacts.csv`](./sample_contacts.csv) is included in the project:
1. Open ColdMail Studio and click **Connect Mailbox** to add your sending inboxes.
2. Click **New Campaign** in the navigation bar.
3. In Step 2, drag and drop `sample_contacts.csv`.
4. Observe the automatic detection:
   - Valid RFC 5322 emails detected
   - Duplicate email address quarantined
   - Invalid email address flagged
   - Empty company fields handled seamlessly via `{{company | your team}}` fallbacks.

---

## 📋 Full Command Reference

| Command | Action |
| :--- | :--- |
| `cd "C:\Users\Dell\Downloads\EMail automation"` | Navigate to existing local project folder |
| `git clone https://github.com/NithinVarma50/Cold-Mail-studio.git` | Clone the repository on a new machine |
| `cd Cold-Mail-studio` | Enter cloned repository directory |
| `npm install` | Install all dependencies |
| `npm run build` | Build Electron backend & React UI |
| `npm start` | Launch ColdMail Studio application |
| `npm run dev` | Launch development mode with hot-reloading |
| `npm run build:ui` | Build frontend only |
| `npm run build:electron` | Build Electron TypeScript backend only |

---

## 📄 License
MIT License. Free to use, modify, and distribute for private and commercial outreach.
