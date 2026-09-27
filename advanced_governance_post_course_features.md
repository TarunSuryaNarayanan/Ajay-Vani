# Feature Implementation Specification: Advanced Governance & Post-Course System

This document outlines the implementation requirements for the Voice-Based Grievance Redressal, Automated WhatsApp Nudges, and the Post-Course AI Guidance System.

## 1. Voice-Based Grievance Redressal (Whistleblowing Engine)

### **Objective**

Enable rural beneficiaries to report corrupt practices (e.g., absent trainers, extortion/bribes, missing toolkits) directly via voice audio.

### **Workflow & Technical Logic**

1. **UI Component:** Add a prominent **"Report Issue"** microphone button on the beneficiary interface.

2. **Audio Capture & STT:** Capture audio in local dialect and process via Speech-to-Text (STT) into Devanagari/English text (e.g., *"Sir, teacher pichle teen din se nahi aaye hain."*).

3. Alternatively, include a form that can be filled out for a complaint, make this the default option. The complaint should be saved on the respective profile.

4. **Automated Metadata Tagging:** Extract and append the beneficiary's ID, active District, and assigned Training Center ID to the transcript payload.

5. **Ticket Generation:** Create a structured ticket in the system database and automatically forward it to the Ministry Monitoring Dashboard.

## 2. Automated Lifecycle Nudges via WhatsApp (Twilio API)

### **Objective**

Maintain engagement and check on beneficiary progress throughout their training duration without requiring deep ITI portal integration.

### **Workflow & Technical Logic**

1. **Trigger Mechanism:** Initiate a time-based scheduler based on the timestamp recorded when the user clicks **"Enroll"**.

2. **Backend Integration:** Implement using the Twilio WhatsApp API (\~10 lines in Node.js backend service).

3. **Lifecycle Schedule:**

   * **Day 45 Check-in:**

     * *Message:* *"Namaste \[Beneficiary Name\] ji! Hope training is going well. Any issues? Let us know!"*

     * *Behavior:* Beneficiary replies route directly back to their profile stream in the web portal dashboard.

   * **Day 90 Completion Nudge:**

     * *Message:* *"Namaste \[Beneficiary Name\] ji! Your course is almost complete. Revisit AJAY-VANI to apply for your ₹50,000 grant or explore local job openings!"*

## 3. Post-Course AI Guidance System (Second Conversation Loop)

### **Objective**

Guide certified beneficiaries into self-employment or formal salaried employment upon completion of training.

### **Workflow & Technical Logic**

When a beneficiary logs back in post-training completion (Day 90+ state), the application initiates the **Post-Training AI Loop**:

#### **Path A: "Open Your Business" (Self-Employment)**

* **AI Voice Prompt:** *"Kya aap apna khud ka vyapar shuru karna chahte hain?"*

* **Execution:**

  * Auto-populate the beneficiary's registered details and certified NSQF trade into the **PM-AJAY ₹50,000 Business Proposal PDF** (`pdfGenerator.ts`).

  * Display a step-by-step checklist for physical submission to the local Block Development Officer (BDO).

#### **Path B: "Find a Job" (Salaried Employment)**

* **AI Voice Prompt:** *"Kya aap kisi company mein naukri dhundhna chahte hain?"*

* **Execution:**

  * Query the job registry for verified local employers hiring within the user's specific district for their NSQF skill code.

#### **Path C: PM MUDRA Loan Guidance**

* **Execution:**

  * For business setup requiring capital beyond the ₹50,000 grant, display guided instructions for applying for a **Pradhan Mantri MUDRA Loan** (up to ₹10 Lakh) at nearest bank branches.

> ### ⚠️ Mandatory Development Guardrail
>
> **DO NOT replace, overwrite, or discard any existing application features or legacy fallback logic.** In case of conflict between new updates and legacy implementations, always preserve existing code paths as fallbacks.