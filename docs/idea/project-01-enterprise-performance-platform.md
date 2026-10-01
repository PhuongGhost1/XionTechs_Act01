# Project 01 — Enterprise Performance Management Platform

> **Purpose:** Landing-page project showcase draft for XionTechs.
>
> **Important:** This document is written as a reusable context file for an AI coding/design agent. It intentionally avoids client names, business KPIs, and claims that have not been explicitly confirmed. Anything marked **[VERIFY]** should be confirmed before being shown as public-facing copy.

---

## 1. Project positioning

### Internal showcase title
**Enterprise Performance Management Platform**

This is a **descriptive showcase title**, not necessarily the real internal project name. The landing page should present it as a type of solution built by XionTechs rather than exposing a client/project name.

### One-line description
A workflow-driven enterprise platform that manages employee goals, performance reviews, manager actions, approvals, and calibration across the review cycle.

### Landing-page message
Show that XionTechs can build enterprise software around a complex business workflow, integrate with existing enterprise systems, and turn a multi-stage process into a structured digital experience.

---

## 2. Business context

The solution supports a formal employee performance management process with multiple stages and roles.

The known workflow includes:

1. **Goal Setting**
2. **Mid-Year Review**
3. **End-Year Review**
4. **Calibration / management review** where applicable

The system involves different users and permissions, especially:

- Employee
- Manager
- HR / administrator roles **[VERIFY exact roles]**

The platform also needs to move information and status from one stage of the review lifecycle into the next.

---

## 3. Problems the platform addresses

### Before the platform
A complex performance process can involve:

- Multiple review stages
- Different responsibilities for employees and managers
- Approval / submission actions
- Goal classification and master data dependencies
- Repeated profile and employee-data lookups
- Enterprise-system integration
- Difficult-to-track status transitions

### What the platform provides
The software creates one connected workflow for:

- Goal creation and management
- Goal classification
- Employee submission
- Manager review
- Approve / reject actions
- Review-stage progression
- Calibration workflows
- Related employee information
- API-driven integration with enterprise systems

---

## 4. Core workflow

```text
Employee / Manager
        |
        v
   Goal Setting
        |
        v
   Mid-Year Review
        |
        v
   End-Year Review
        |
        v
    Calibration
        |
        v
Final review outcome
```

A more detailed conceptual workflow:

```text
Employee creates / updates goals
            |
            v
      Goal submission
            |
            v
     Manager review
        /       \
       /         \
   Approve       Reject / revise
      |                |
      |                +------> Employee updates
      v
    Next stage
      |
      v
 Mid-Year Review
      |
      v
 End-Year Review
      |
      v
  Calibration
```

**Note:** Exact state names and transitions should be taken from the final product UI/API definitions. The diagram above is a landing-page storytelling abstraction.

---

## 5. Major functional areas

### 5.1 Goal Setting

Possible UI screens to showcase:

- Goal list
- Goal creation / editing
- Goal classification
- Employee goal submission
- Manager review
- Remove / update goal actions
- Submission status

The goal-setting stage is especially useful visually because it demonstrates forms, structured data, business rules, and approval workflow.

### 5.2 Performance Review

Show how the platform carries information from one review stage to another.

Possible screens:

- Review overview
- Employee performance details
- Manager review details
- Review stage status
- Submission confirmation
- Approval / rejection experience

### 5.3 Calibration

Calibration is a strong showcase of enterprise workflow complexity.

Possible UI:

- Calibration list
- Employee / review selection
- Calibration detail
- Updated review status
- Manager / authorized-user actions

### 5.4 Employee context

Performance review data may be enriched with employee profile information.

Possible UI elements:

- Employee profile summary
- Education / experience / identification information where appropriate
- Profile image
- Current review context

Only show sensitive employee fields if the screenshots are sanitized and explicitly approved for public use.

---

## 6. Integration context

The project has known integration context with **Microsoft Dynamics 365**.

The backend work involved D365 entities and OData-based access patterns. The broader engineering context includes APIs that retrieve and update enterprise data.

### Public-facing message
Do not turn the landing page into a technical D365/OData document. Instead communicate:

> **Connected to existing enterprise systems**

Then, optionally, reveal:

> Dynamics 365 integration · API workflows · Enterprise data synchronization

Exact technologies shown publicly should be confirmed by XionTechs before publication.

---

## 7. Suggested screenshots for the landing page

For the case-study card, prioritize **3–5 screenshots**.

### Screenshot A — Performance overview
A clean page showing the employee's current review stage and status.

### Screenshot B — Goal Setting
Goal cards/table with classification, progress, and submission state.

### Screenshot C — Review detail
A rich detail screen showing goals, review content, and role-specific actions.

### Screenshot D — Manager approval
A clear Approve / Reject interaction.

### Screenshot E — Calibration
A management-level view showing comparison/review actions, if public.

---

## 8. Visual treatment for the landing page

The section should feel like a **real enterprise product**, not a generic portfolio screenshot.

Recommended presentation:

```text
┌─────────────────────────────────────────────┐
│                                             │
│          PRODUCT SCREENSHOT                 │
│                                             │
│       Performance Management UI             │
│                                             │
└─────────────────────────────────────────────┘

ENTERPRISE PLATFORM

Performance Management Platform

A connected workflow for goals, reviews,
approvals and calibration.

[ Enterprise ] [ Workflow ] [ D365 ]

Explore the workflow →
```

On hover, show a subtle zoom / parallax effect on the screenshot and reveal the workflow metadata.

---

## 9. What this project proves

Use these as **capability statements**, not exaggerated marketing claims:

- Complex business workflow implementation
- Role-aware enterprise applications
- Multi-stage approval flows
- Enterprise-system integration
- API-driven software architecture
- Data-driven UI experiences
- Support for evolving business rules

Do not claim measurable ROI, percentages, user counts, or performance improvements unless those figures are provided and approved.

---

## 10. Suggested landing-page copy

### Card title
**Performance Management Platform**

### Description
A connected enterprise workflow for employee goals, performance reviews, approvals, and calibration.

### Proof points
**Goal workflows** · **Manager approvals** · **Enterprise integration**

### Optional expanded copy
XionTechs designed and engineered a role-aware platform that connects multiple stages of the performance review lifecycle, from goal setting through review and calibration.

### CTA
**Explore the workflow →**

---

## 11. Data / privacy requirements

Before using screenshots publicly:

- Remove employee names
- Remove emails and phone numbers
- Remove profile images unless permitted
- Remove client-specific logos unless approved
- Remove confidential HR data
- Use realistic anonymized values
- Confirm that D365 / enterprise system branding can be shown

---

## 12. Agent implementation guidance

The AI coding/design agent should use this project as a **realistic enterprise software showcase**.

### The agent should build

- A polished project card
- A screenshot-focused presentation
- An expandable project detail area or modal
- A workflow visual matching the story
- Responsive desktop/mobile layouts
- Subtle transitions only; do not make the project card more interactive than the Agent Demo

### The agent should not invent

- Client identity
- Revenue impact
- Number of users
- Number of employees
- Delivery duration
- Business outcomes
- Security/compliance certifications
- Exact cloud architecture
- Exact technology list beyond what is confirmed

Use `[VERIFY]` or neutral wording for unsupported details.
