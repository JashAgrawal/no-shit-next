---

# **PRD — NO SHIT (Updated)**

*Startup Judgment Engine + Multi-Agent Boardroom*

---

# **1. Product Name**

**NO SHIT**
If your idea sucks, it says so. Loudly.

---

# **2. Mission**

Gatekeep quality.
Destroy weak ideas fast.
Power strong ones with a hostile but brilliant AI board.

---

# **3. User Flow (Updated)**

## **3.1 Landing Page → Oracle Gate**

When user visits the site:

**Hero section:**

* One giant text area (center stage)
* Minimal UI
* CTA button: **“Judge my idea”**

This is the *only* thing they see.
No sidebar. No agents. No dashboard. Nothing.

### **Flow:**

1. User dumps idea into textarea.
2. Hits **Judge**.
3. Oracle analyzes the raw text.
4. Oracle gives a **brutal verdict**:

   * **TRASH → Flow Ends**
     Show: “Idea rejected. Try again or go cry.”
     Nothing else unlocked.

   * **MID → Locked**
     Give hints but still **lock agents + dashboard**.
     Explain: “Improve this garbage and come back.”

   * **VIABLE / FIRE → Unlock Full System**
     Sidebar appears.
     Idea Workspace unlocks.
     All agents + dashboards + meeting room now accessible.

The Oracle is the gatekeeper to the rest of the product.

---

# **4. Global Layout (Updated)**

After the idea passes Oracle, the entire app becomes:

### **Left Sidebar**

Persistent items:

* **Idea Overview** (name, status)
* **Dashboard**
* **Agents** (each listed)

  * CEO
  * Assistant
  * CTO
  * CMO
  * CFO
  * Pitch
  * Legal
  * Growth
  * Psych
* **Meeting Room**
* **Assets**
* **Settings (later)**

Simple. Vertical. Minimal.

### **Main Panel**

Context switches per route:

* Dashboard
* Individual agent chats
* Meeting room
* Assets
* Workspace

Everything is chat-based or card-based.

---

# **5. Core Systems**

## **5.1 The Oracle (Gatekeeper)**

* Takes raw idea dump.
* Parses into structured object.
* Judges.
* Unlocks or denies access.
* Tone = ruthless.

### **If verdict < VIABLE**

Agents + dashboard remain locked.

---

## **5.2 Agents (Individual Chats)**

Each agent has:

* Unique system prompt
* Personality tone
* Domain knowledge
* Access to idea memory

UI:

* Each agent opens in its own chat window (like ChatGPT tabs)
* Messages persist in LocalStorage
* Shared global state through Zustand

Agents:

* **CEO** — strategy
* **Assistant** — ops
* **CTO** — architecture
* **CMO** — brand + GTM
* **CFO** — numbers
* **Pitch** — storytelling
* **Legal (Harvey)** — risk + legal
* **Growth** — channels
* **Psych** — mindset

All blunt. All Gen-Z. All connected.

---

## **5.3 HiveMind Orchestrator**

Central router with three roles:

### **1. Routing**

Reads user message → chooses correct agent automatically.

### **2. Board Meeting Conductor**

Controls conversation turn-taking in the meeting room.

### **3. End-Of-Transmission Logic**

Decides:

* When discussion ends
* Which agent speaks next
* When to request user action
* When to generate outcomes

---

# **6. Meeting Room (Updated)**

## **6.1 Purpose**

Simulate a savage, chaotic startup boardroom.
Agents debate.
HiveMind moderates.

## **6.2 Flow**

When user enters meeting room:

* HiveMind starts transmission
* Agents respond in sequence
* They argue, roast each other, critique the idea
* After 2–5 turns, HiveMind pauses

### **6.3 Decision Point**

If there is a fork:

* HiveMind surfaces **two choices**
* Prompts user:
  “Pick one. Don’t overthink.”

User selects Option A or B.
Agents react.
Meeting continues or ends.

### **6.4 End of Transmission**

HiveMind says:
“Board meeting concluded.”
Meeting log is saved as a transcript.

---

# **7. Idea Workspace**

Once unlocked:

* Structured cards auto-filled from Oracle
* User can refine text
* Agents update this object
* Safe, minimal editing only

Fields:

* Problem
* Solution
* Market
* Competitors
* Business model
* Pricing
* Tech plan
* Legal risks
* Growth paths
* Funding needs
* Strengths/risks
* Notes

---

# **8. Idea Validator Dashboard**

UI similar to the screenshot you referenced (clean cards).

Sections:

* Scores (0–10)
* Pros / Cons
* Red / Yellow / Green flags
* Summary
* Brutal conclusion
* Recommended path forward

Non-editable.
Source of truth.
Updated by Oracle only.

---

# **9. Generators**

Available ONLY for **VIABLE / FIRE** ideas.

* Tech spec (Cursor-ready)
* Logo generation
* Names if missing
* GTM plan
* Pitch outline
* Basic docs (T&C, Privacy)
* Roadmap

Triggered per module.
Outputs appear in Assets section.

---

# **10. Tone Rules**

Universal:

* Not Afraid
* Ambitious but not delusional
* Spartan
* Direct
* Gen-Z slang
* No politeness
* No soft language
* Calls out stupidity
* Short sentences
* High signal, zero fluff

---

# **11. Tech Stack**

### **Frontend**

* Next.js
* React
* Zustand
* LocalStorage (v1)
* Tailwind

### **Backend**

* Gemini API (all intelligence)
* No auth in v1
* No DB in v1
* Optional Supabase for later

### **State**

* Global: Zustand
* Per-agent chat: LocalStorage
* Idea workspace: LocalStorage → synced into global

---

# **12. Metrics**

**Primary**:

* Idea Kill Rate

**Secondary**:

* Successful unlock rate (Oracle → Agents)

**Tertiary**:

* Agent Engagement
* Board Meeting usage
* Regeneration Rate (Oracle misreads)

---

# **13. Versioning**

### **v1**

* Oracle
* Unlock system
* Sidebar layout
* Individual agent chats
* Dashboard
* Meeting room basic debate
* Asset generators (logo + GTM + tech spec)

### **v2**

* Multi-round meetings
* Better decision trees
* Export features
* Auth + saved ideas

---
