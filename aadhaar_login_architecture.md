# 🆔 How Aadhaar-Based Login & Dashboard Works

```
| Enter / Speak Aadhaar No.    | ---> | 4-Digit Mobile OTP         | ---> | Beneficiary Dashboard          |
| (12-Digit or Last 4 Digits) |      | (Sent to Aadhaar Mobile)   |      | (Application Status,           |
|                              |      |                            |      |  Stipend, BDO Grant Tracker)   |
```

### 1. Zero-Friction Aadhaar Verification Screen
* **Voice-Guided Input:** The assistant asks: *"कृपया अपना 12 अंकों का आधार नंबर दर्ज करें या बोलें"* (Please enter or speak your 12-digit Aadhaar number).
* **Big Number Keypad + Voice Mic:** Beneficiary can either type on a clean 3x4 large number keypad or simply speak their 12-digit Aadhaar number.

### 2. Instant Aadhaar OTP Authentication
* 4-digit OTP sent to their Aadhaar-registered mobile phone.
* Auto-reads SMS or allows simple voice/keypad entry.

### 3. Personal PM-AJAY Beneficiary Dashboard (For Returning Users)
Once verified via Aadhaar, returning beneficiaries can immediately see:
* 👤 **Beneficiary Profile:** Name, SC Category Status, District.
* 📜 **Active NSQF Qualification:** Solar PV Installer (`ELE/Q5901`).
* 💰 **₹50,000 PM-AJAY GIA Grant Tracker:**
    * [✓] Voice Profiling Completed
    * [✓] BDO Proposal Generated
    * [⏳] Government Grant Approval (Pending BDO Clearance)
    * [ ] Bank Loan Disbursed
* 🏫 **Training Center Stipend Tracker:** Days attended & ₹150/day stipend payouts.
* 📄 **1-Click Redownload Proposal PDF:** Re-download their 1-page application anytime.

---

### Benefits of Aadhaar Login for AJAY-VANI:
1. **Zero Password Memory Hassle:** No passwords or usernames to forget.
2. **Official Government Alignment:** Directly matches PM-AJAY SCA guidelines requiring Aadhaar-seeded beneficiary identification.
3. **Multi-Session Continuity:** Beneficiary can log in from their own phone or a Gram Sahayak's device and access their exact application status anywhere.

---

## 🎯 How to Make Aadhaar Login Work Flawlessly for SIH Judges & Real Users

We implement a **Dual-Mode Demo Architecture**:

```
                              |     Aadhaar Login Screen     |
                              |______________________________|
                                              |
                       _______________________|_______________________
                      |                                               |
                      v                                               v
|         Real SC Beneficiary Mode        |         |            SIH Judge / Demo Mode        |
|-----------------------------------------|         |-----------------------------------------|
| - Enter any 12-digit Aadhaar            |         | - 1-Click "Demo Beneficiary"            |
| - Real OTP / Live flow                  |         | - Demo Aadhaar: 9999 8888 7777          |
|                                         |         | - Bypass OTP: "1234"                    |
```