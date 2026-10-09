
## Complete Application Functions

Climora is designed as an interactive desktop application with two primary user experiences: a lender workspace and an MSME owner workspace.

### Function 1 — Business Registration and Profile Management

**Purpose:** Collect the information required to assess a business.

**What the application does:**

* Allows users to create or select a business profile.
* Records business name, location, industry, and business size.
* Collects monthly revenue, operating expenses, existing debt obligations, and available financial reserves.
* Records operational dependencies such as electricity, water, transport, inventory, and suppliers.
* Allows users to edit and update their business information.
* Validates required fields and highlights missing information before assessment.

**Example:** A grocery store owner enters their business location, monthly revenue, expenses, inventory dependency, and flood-preparedness measures.

**Expected output:** A saved business profile that can be used for climate-risk assessment and loan-readiness tracking.

### Function 2 — Climate Data Retrieval

**Purpose:** Obtain relevant environmental information for a business location.

**What the application does:**

* Accepts a location or geographic coordinates.
* Retrieves available weather information from Open-Meteo.
* Displays relevant rainfall, temperature, and forecast indicators.
* Uses available historical weather information where appropriate.
* Supports additional flood-exposure or long-term climate data when a suitable source is integrated.
* Displays the source, observation or forecast period, and last-updated time.
* Shows an error or clearly labelled sample data if a live source is unavailable.

**Expected output:** A location-specific climate information panel.

**Important:** A weather forecast is not the same as a long-term climate projection, and a weather API alone does not establish a precise flood probability for an individual business.

### Function 3 — Industry-Specific Hazard Analysis

**Purpose:** Identify which climate hazards are relevant to different businesses.

**What the application does:**

* Considers the business location and industry.
* Identifies relevant hazard categories, including flooding, heavy rainfall, extreme heat, and water shortages.
* Considers operational dependencies such as cold storage, water-intensive production, and transport access.
* Explains how each hazard could affect the selected business.
* Avoids assigning an industry-specific hazard score when the necessary evidence is unavailable.

**Example:**

* Grocery store: stock damage, delivery interruptions, and refrigeration disruption.
* Manufacturing unit: heat exposure, water dependency, and machinery downtime.
* Food-processing business: water availability, temperature conditions, and supply-chain disruption.

**Expected output:** A list of relevant hazards, their available indicators, and their possible business impacts.

### Function 4 — Climate-Adjusted Risk Scoring

**Purpose:** Generate an explainable preliminary risk assessment.

**What the application does:**

* Calculates the scores for individual risk dimensions.
* Combines them using the configured scoring weights.
* Generates an overall score between 0 and 100.
* Assigns an illustrative risk category.
* Displays the main factors contributing to the score.
* Identifies missing or unreliable information.
* Allows the assessment to be recalculated when relevant inputs change.

**Expected output:** An overall risk score, category, dimension breakdown, and explanation.

The score is an illustrative decision-support measure, not a validated probability of default or official credit rating.

### Function 5 — Risk Explanation and Recommendations

**Purpose:** Explain what the assessment means and what the user can do about it.

**What the application does:**

* Identifies the highest-contributing risk factors.
* Explains their potential operational and financial consequences.
* Generates recommendations based on the factors actually identified.
* Prioritizes recommendations by urgency and potential usefulness.
* Distinguishes data-supported findings from general guidance.
* Allows the lender or business owner to review recommended actions.

**Example:** If a business has elevated flood exposure and limited backup inventory, Climora might suggest evaluating stock protection, identifying alternative suppliers, and preparing a business continuity plan.

**Expected output:** A prioritized list of findings and recommended mitigation actions.

### Function 6 — Lender Portfolio Dashboard

**Purpose:** Give lenders an overview of the businesses being assessed.

**What the application does:**

* Displays the number of businesses in the current portfolio.
* Summarizes the distribution of illustrative risk categories.
* Shows businesses that may require additional review.
* Filters assessments by industry, location, and risk category.
* Provides searchable business records.
* Opens a detailed assessment when a business is selected.
* Shows the date and status of each assessment.

**Expected output:** A portfolio overview that helps users decide which assessments to review first.

All portfolio metrics must be calculated from the records actually stored in the application. Sample records must be clearly labelled as demo data.

### Function 7 — Loan Application Management

**Purpose:** Track the progress and outcome of a loan application.

**What the application does:**

* Allows an authorized lender user to create a loan application record.
* Links an application to a business profile.
* Records the requested loan amount and application date.
* Tracks application status: Draft, Submitted, Under Review, Additional Information Required, Approved, or Rejected.
* Records lender-provided reasons for requesting additional information or rejecting an application, when available.
* Displays the application timeline and outstanding requirements.
* Allows authorized users to update the status.

**Expected output:** A clear view of each application's status, outstanding requirements, and recorded outcome.

The prototype does not automatically approve or reject loans.

### Function 8 — Loan Improvement Roadmap

**Purpose:** Help an MSME owner respond constructively to a rejected application or additional lender requirements.

**What the application does:**

* Displays the recorded application outcome.
* Shows lender-provided reasons separately from potential weaknesses identified by Climora.
* Maps relevant issues to practical improvement actions.
* Assigns a priority and progress status to each action.
* Explains why each action may help.
* Suggests evidence or documents the owner can prepare.
* Tracks actions marked Not Started, In Progress, or Completed.
* Recalculates roadmap progress as actions are completed.
* Generates a summary of completed actions and remaining gaps.

**Example:** If a lender records insufficient financial documentation as a reason, Climora may suggest organizing bank statements, sales records, expense records, and relevant tax documents.

If the application identifies limited climate preparedness, it may separately suggest reviewing backup suppliers or developing a flood-response plan.

**Expected output:** A personalized improvement plan that supports future lender discussions.

Completing the roadmap does not guarantee loan approval.

### Function 9 — Loan Readiness Assessment

**Purpose:** Help business owners understand how prepared they are to approach a lender.

**What the application does:**

* Checks whether required business information has been entered.
* Tracks the availability of financial records.
* Reviews whether the owner has documented revenue, expenses, and existing debt obligations.
* Checks the status of requested supporting documents.
* Tracks relevant business continuity and climate-preparedness actions.
* Identifies outstanding information and recommended next steps.
* Presents a transparent readiness checklist.

**Example output:**

* Business profile: Complete.
* Financial records: Needs attention.
* Existing debt information: Complete.
* Climate preparedness plan: In progress.
* Supporting documents: 3 of 5 marked ready.

The readiness indicator measures preparation against the application's checklist; it does not estimate the probability of loan approval.

### Function 10 — Document Checklist and Evidence Management

**Purpose:** Help business owners organize information needed for a lender review.

**What the application does:**

* Displays a configurable checklist of relevant documents.
* Allows users to mark documents as Not Ready, In Progress, or Ready.
* Associates evidence with a relevant improvement action.
* Tracks outstanding document requirements.
* Optionally allows files to be attached or stored locally.
* Displays a document-preparation summary.

Possible document categories include bank statements, sales and expense records, tax documentation, existing loan details, business registration records, and a business continuity plan.

The application must not imply that every lender requires the same documents. Requirements vary by institution and loan product.

### Function 11 — Assessment History and Change Tracking

**Purpose:** Help users understand how a business's assessment changes over time.

**What the application does:**

* Saves previous assessments.
* Records the business inputs and available data used for each assessment.
* Displays previous and current scores side by side.
* Highlights changes in relevant indicators.
* Explains which inputs changed between assessments.
* Shows timestamps and data-source information.

**Expected output:** An assessment history that makes changes easier to understand.

A score change should not be attributed to climate conditions unless the underlying data supports that explanation.

### Function 12 — Reports and Export

**Purpose:** Produce a concise summary for review and discussion.

**What the application does:**

* Generates a business assessment summary.
* Includes the overall illustrative score and risk breakdown.
* Lists relevant hazards and important limitations.
* Summarizes recommended mitigation actions.
* Produces a loan-readiness and improvement-progress summary.
* Optionally exports the report as a PDF or CSV.

Reports must identify illustrative calculations, sample data, and missing information clearly.

### Function 13 — Notifications and Follow-Up

**Purpose:** Help users keep track of outstanding actions.

**What the application does:**

* Highlights overdue or incomplete roadmap actions.
* Flags missing assessment information.
* Displays when climate data was last updated.
* Notifies users when an assessment is refreshed and relevant inputs change.
* Reminds users of outstanding document requirements within the application.

For the first prototype, these can be in-app notifications rather than email or mobile push notifications.

### Function 14 — User Roles and Data Access

**Purpose:** Separate the lender experience from the business-owner experience.

**What the application does:**

* Provides a lender workspace and an MSME owner workspace.
* Displays the appropriate navigation and features for each role.
* Limits access to records and actions according to the configured permissions.
* Prevents the renderer from accessing unrestricted Node.js/TypeScript backend runtime or local system capabilities.
* Protects sensitive financial information and avoids exposing one business's records to another owner.

For a 24-hour demo, role switching can be simulated with clearly labelled demo accounts. Real multi-user authentication and production-grade access control would require further implementation.

---

## 12. Functional Dashboard Layout

### Lender workspace

**Sidebar navigation**

1. Overview
2. Business Portfolio
3. Climate Risk Assessments
4. Loan Applications
5. Improvement Follow-Up
6. Reports
7. Settings

**Overview dashboard**

* Total businesses assessed.
* Businesses by illustrative risk category.
* Assessments requiring review.
* Pending loan applications.
* Recent assessment updates.
* Risk distribution charts.
* A searchable business table.

**Business detail screen**

* Business profile.
* Climate information.
* Risk score and contributing factors.
* Financial and operational indicators.
* Recommended interventions.
* Assessment history.
* Related loan applications.

**Loan application screen**

* Application status and timeline.
* Requested amount.
* Recorded decision reasons.
* Additional information required.
* Relevant assessment findings.
* Follow-up actions.

### MSME owner workspace

**Sidebar navigation**

1. My Dashboard
2. My Business
3. Climate Exposure
4. Loan Readiness
5. Improvement Roadmap
6. Documents
7. Assessment History

**Owner dashboard**

* Current assessment summary.
* Key climate hazards.
* Loan-readiness checklist.
* Improvement progress.
* Outstanding high-priority actions.
* Documents still to prepare.

**Improvement roadmap screen**

* Recorded application outcome.
* Confirmed lender-provided reasons.
* Additional potential improvement areas.
* Prioritized actions.
* Progress controls.
* Supporting evidence checklist.
* Future-review preparation summary.

---

## 13. User Actions and Expected App Behaviour

| User action                  | What Climora should do                                                   |
| ---------------------------- | ------------------------------------------------------------------------ |
| Add a business               | Validate the form and save the profile                                   |
| Select a location            | Retrieve available location-specific climate information                 |
| Run an assessment            | Calculate and explain the preliminary score                              |
| Select a risk factor         | Show its value, source, limitations, and possible business impact        |
| Refresh an assessment        | Retrieve available updated data and recalculate using the current inputs |
| Filter the portfolio         | Update the visible business records                                      |
| Open a loan application      | Display its status, timeline, and recorded requirements                  |
| Record a rejection           | Save the outcome and the reasons provided by the lender                  |
| Open the improvement roadmap | Display relevant actions and priorities                                  |
| Complete an action           | Update progress and the remaining-action count                           |
| Mark a document ready        | Update the document checklist                                            |
| Open assessment history      | Compare previous and current assessments                                 |
| Export a report              | Generate a summary of the selected assessment                            |
| Encounter missing data       | Show a clear warning rather than silently treating it as zero risk       |

## 14. Proposed Application Data Model

The application can organize its records into the following entities:

* **Business:** Business profile, location, industry, financial indicators, and operational dependencies.
* **ClimateObservation:** Source, location, observation or forecast period, indicator values, and retrieval time.
* **Assessment:** Business reference, assessment date, input snapshot, risk dimensions, overall score, and uncertainty notes.
* **LoanApplication:** Business reference, requested amount, status, application date, and recorded reasons.
* **ImprovementAction:** Related business or application, issue, recommended action, priority, status, and supporting evidence.
* **DocumentChecklist:** Required document category, readiness status, and related improvement action.
* **AssessmentHistory:** Previous assessment references and the changes between assessment inputs.
* **UserProfile:** Demo role and authorized application access.

For a hackathon, these records can initially be stored in SQLite or in carefully structured sample data. Persistent storage should be introduced once the main workflow is working.

## 15. What Must Actually Work in the Hackathon Demo?

Not every function above needs to be fully implemented in 24 hours. The following are the most important working features.

### Priority 1 — Core experience

* Business profile form.
* Climate-data retrieval or a clearly labelled fallback.
* Risk scoring and explanation.
* Lender dashboard.
* Business assessment details.

### Priority 2 — Climora's differentiator

* Loan application outcome recording.
* Rejection reasons.
* Personalized improvement roadmap.
* Action completion and progress tracking.
* MSME loan-readiness dashboard.

### Priority 3 — Polish and additional functionality

* Assessment history.
* Document checklist.
* Search and filters.
* Exportable report.
* In-app notifications.

A button should perform its advertised action. If a feature is not implemented, label it as a preview or leave it out of the demo rather than making it appear functional.

## 16. Final Definition of Climora

Climora is an explainable climate-risk and loan-readiness desktop application for MSMEs and lenders. It combines location-specific climate indicators, business vulnerabilities, and financial information to generate a preliminary risk assessment. It helps lenders review potential climate-related risks and helps business owners respond to identified weaknesses through actionable recommendations, document preparation, and a trackable improvement roadmap.

Its main value is not merely generating a score. It connects **risk identification, risk explanation, practical mitigation, and future loan preparation** in one application.
