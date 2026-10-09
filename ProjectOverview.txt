
# Climora — Real-Time Climate Risk Scoring for MSMEs

**Tagline:** Turning Climate Data into Business Resilience.

## 1. Project Overview

Climora is a climate-intelligence and lending-readiness application designed to help banks, financial institutions, and Micro, Small and Medium Enterprises (MSMEs) understand how climate-related hazards can affect business operations, financial stability, and loan repayment capacity.

Traditional lending assessments often focus on financial indicators such as revenue, expenses, existing debt, credit history, and repayment records. However, these indicators may not fully capture the impact of floods, extreme heat, droughts, storms, or climate-related supply-chain disruptions.

Climora combines climate hazard information, business characteristics, operational vulnerabilities, and financial indicators to generate an explainable preliminary climate-risk assessment.

It also introduces a **Loan Improvement Roadmap**, which helps business owners understand potential weaknesses in their loan readiness and take practical steps toward a stronger future application if a loan is rejected or additional conditions are requested.

## 2. Problem Statement

MSMEs are essential to economic growth, employment, and local communities. Many depend on loans to purchase inventory, maintain operations, acquire equipment, or expand their businesses.

However, climate-related hazards can threaten their ability to operate and repay loans.

For example, a grocery store located in a flood-prone area may experience inventory damage, temporary closure, higher repair costs, and delayed deliveries. Another grocery store with similar financial performance but lower flood exposure may face fewer of these specific risks.

A traditional financial assessment might not adequately capture this difference.

Furthermore, when an MSME's loan application is rejected, the owner may not receive a clear, practical explanation of which financial or operational areas could be improved.

**Climora addresses both challenges:** it helps lenders identify climate-related business vulnerabilities and helps MSME owners improve their financial preparedness, operational resilience, and future loan readiness.

## 3. The Problem in Simple English

Imagine two businesses with similar revenue, expenses, and repayment histories.

**Business A — Lower flood exposure**

* Located in an area with relatively low flood exposure.
* Maintains emergency inventory and backup suppliers.
* Has sufficient funds to cover routine operating expenses.

**Business B — Higher flood exposure**

* Located in a flood-prone area.
* Depends on deliveries that may be interrupted by flooding.
* Has limited emergency funds and could struggle during a prolonged closure.

Although their financial records may look similar, Business B could face greater climate-related financial disruption.

Climora helps identify this difference before a disruption occurs, explains the factors contributing to the risk, and suggests possible ways to reduce vulnerability.

## 4. Climate Hazards and Their Business Impact

### Floods and heavy rainfall

Can damage buildings, inventory, equipment, and transport routes, interrupt deliveries, and prevent customers from reaching a business.

### Extreme heat

Can increase cooling expenses, reduce worker productivity, affect machinery, and damage temperature-sensitive products.

### Drought and water shortages

Can disrupt agriculture, food processing, manufacturing, and other water-dependent industries.

### Storms and severe weather

Can damage infrastructure, interrupt transport, and temporarily prevent business operations.

### Utility and supply-chain disruptions

Power outages, water shortages, and delayed raw materials can interrupt production even when the business itself is not directly damaged.

The impact depends on the business's location, industry, infrastructure, operational dependencies, and capacity to recover.

## 5. Proposed Solution

Climora provides two connected experiences through a single application.

### A. Lender Dashboard

Helps lenders and credit-risk analysts:

* Review MSME profiles and preliminary climate-risk assessments.
* Identify businesses exposed to significant climate hazards.
* Understand the main contributors to each risk score.
* Review financial resilience and operational vulnerabilities.
* Explore recommended mitigation measures.
* Monitor assessments and changes in available climate information.
* Support more informed human-led lending reviews.

### B. MSME Owner Dashboard

Helps business owners:

* Understand their business's climate vulnerabilities.
* View the financial and operational indicators used in their assessment.
* Understand potential loan-readiness weaknesses.
* Receive a personalized improvement roadmap.
* Track completed actions and progress over time.
* Prepare supporting documents and information for a future lender review.

The two experiences should share relevant assessment information while respecting appropriate access permissions and protecting sensitive financial data.

## 6. Core Application Workflow

**Step 1 — Business profile**

Enter the business name, location, industry, business size, revenue, expenses, existing debt, available financial buffer, and relevant operational dependencies.

**Step 2 — Climate data collection**

Retrieve or load available location-specific weather and hazard information, including relevant rainfall, heat, and flood indicators. Use clearly labelled fallback or sample data when a reliable source is unavailable.

**Step 3 — Vulnerability assessment**

Evaluate the interaction between climate exposure, business operations, financial resilience, and recovery capacity.

**Step 4 — Explainable risk scoring**

Generate a preliminary score on a 0–100 scale and explain the factors that contribute to it.

**Step 5 — Recommendations**

Suggest appropriate actions, such as flood preparedness, emergency reserves, backup suppliers, equipment protection, or improved financial documentation.

**Step 6 — Loan readiness and follow-up**

If a loan is rejected or additional requirements are identified, provide a Loan Improvement Roadmap that helps the owner address the stated reasons and prepare for a future application.

## 7. Dynamic Climate-Adjusted Financial Risk Score

Climora combines three important ideas:

* **Financial risk:** Indicators of potential financial difficulty and repayment pressure.
* **Climate-adjusted risk:** Climate hazards are considered alongside financial and operational information.
* **Dynamic assessment:** The assessment can be refreshed when new weather information, hazard data, or business details become available.

Example:

**Earlier assessment:** 35/100 — illustrative lower-risk result.

**Updated assessment:** 68/100 — illustrative elevated-risk result.

A score can change when relevant inputs change. A higher climate-risk score does not automatically mean a business is unable to repay a loan; it indicates that additional risks may warrant attention.

For the hackathon prototype, the score should be explicitly described as an illustrative heuristic rather than a validated probability of default or official credit rating.

## 8. Proposed Risk-Scoring Model

The initial prototype can use a transparent, rule-based scoring model.

| Risk dimension                         | Proposed weight |
| -------------------------------------- | --------------: |
| Flood exposure                         |             30% |
| Heavy rainfall exposure                |             25% |
| Extreme heat exposure                  |             20% |
| Business and operational vulnerability |             15% |
| Financial resilience                   |             10% |
| **Total**                              |        **100%** |

Each dimension receives a score between 0 and 100, with higher values representing greater vulnerability.

The weighted result is:

**Overall score =** sum of each dimension's risk score multiplied by its weight.

Suggested illustrative categories:

* 0–24: Lower risk
* 25–49: Moderate risk
* 50–74: High risk
* 75–100: Very high risk

These weights and thresholds are provisional and must be tested and calibrated before any real-world lending use.

Missing data must not automatically be interpreted as zero risk. The application should disclose missing information and mark assessments as incomplete or use a clearly documented fallback method.

## 9. New Feature: Loan Improvement Roadmap

### The problem

A rejected loan application can leave a small-business owner unsure what to do next. The owner may not know whether the main issue was insufficient repayment capacity, high existing debt, inadequate documentation, limited financial reserves, or climate-related operational vulnerability.

Climora turns available assessment findings into a practical improvement plan.

### How it works

**Step 1 — Record the outcome**

The lender records an application outcome, such as approved, pending, additional information required, or rejected.

For rejected applications, the lender records the applicable reasons using clear categories and, where available, the lender's stated explanation.

**Step 2 — Identify improvement areas**

Climora maps those reasons to relevant actions. It must distinguish between an actual lender-provided reason and a potential weakness inferred by the prototype.

Examples include:

* Low cash-flow coverage.
* High existing debt obligations.
* Insufficient financial records.
* Limited emergency reserves.
* High exposure to a relevant climate hazard.
* Lack of a business continuity or disaster recovery plan.
* Missing business, ownership, tax, or other required documentation.

**Step 3 — Generate a personalized roadmap**

Each recommendation includes:

* The issue to address.
* Why it matters.
* A practical next step.
* Suggested supporting documents or evidence.
* A priority level.
* A progress status.

**Step 4 — Track improvement**

The business owner can mark actions as not started, in progress, or completed and record evidence of completed actions.

**Step 5 — Prepare for a future review**

Climora generates a loan-readiness summary showing completed actions, remaining gaps, and relevant supporting documents. The owner can use it to prepare for a conversation with a lender or a future application.

Completing the roadmap does not guarantee loan approval. The final decision remains with the lender under its own policies and applicable regulations.

### Example: Loan Improvement Roadmap

**Illustrative business:** Local grocery store

**Application outcome:** Rejected

**Recorded reasons:** Insufficient financial documentation and concerns about repayment capacity.

| Improvement area     | Suggested action                                                               | Priority |
| -------------------- | ------------------------------------------------------------------------------ | -------- |
| Financial records    | Organize recent bank statements, sales records, expenses, and tax documents    | High     |
| Cash-flow visibility | Prepare a monthly cash-flow statement and forecast                             | High     |
| Existing debt        | Compile current loan balances and repayment obligations                        | High     |
| Emergency reserves   | Develop a realistic plan to build a reserve for essential expenses             | Medium   |
| Climate preparedness | Document flood exposure, stock protection, and backup suppliers where relevant | Medium   |
| Business continuity  | Prepare a basic plan for temporary closure and supply disruption               | Medium   |

**Progress indicator:** 2 of 6 actions completed.

The recommendations are examples, not an assertion that every listed issue caused the rejection. Climora should show only the lender's recorded reasons as confirmed reasons.

## 10. Dashboard Design

The dashboard is the central interface of Climora. It should provide an overview first, with detailed assessments and improvement tools accessible from the navigation.

### A. Lender Dashboard — Overview

**Top summary cards**

* Total MSMEs assessed.
* Businesses with elevated climate exposure.
* Assessments requiring review.
* Loan applications awaiting follow-up.

**Climate-risk overview**

* Risk-category distribution.
* Breakdown by industry.
* Breakdown by location, where reliable geographic data is available.
* Most common identified climate hazards.

**Assessment table**

| Business     | Industry        | Climate risk | Main concern     | Status    |
| ------------ | --------------- | ------------ | ---------------- | --------- |
| Green Basket | Retail          | High         | Flood exposure   | Review    |
| Apex Tools   | Manufacturing   | Moderate     | Heat exposure    | Monitored |
| Fresh Grain  | Food processing | Very high    | Water dependency | Review    |

These are illustrative records for the demo.

Selecting a business opens its full assessment, score breakdown, data sources, uncertainty notes, and recommended interventions.

### B. Business Assessment Page

The page should include:

* Business profile and location.
* Overall illustrative risk score.
* Individual hazard scores.
* Financial resilience indicators.
* Operational dependency indicators.
* Explanation of the highest-contributing factors.
* Available data sources and last-updated timestamps.
* Suggested mitigation actions.
* Missing-data and uncertainty warnings.

Use charts to explain the assessment rather than presenting a score without context.

### C. Loan Readiness Dashboard — MSME Owner

**Summary cards**

* Current loan-readiness status.
* Improvement actions completed.
* High-priority actions remaining.
* Supporting documents prepared.

**Main sections**

1. **My Business:** Business profile and key financial indicators.
2. **Climate Exposure:** Relevant local hazards and business vulnerabilities.
3. **Loan Readiness:** Financial documentation, cash flow, debt obligations, and other relevant preparation areas.
4. **Improvement Roadmap:** Prioritized actions with progress tracking.
5. **Documents:** A checklist of supporting documents, with upload functionality if time permits.
6. **Assessment History:** Previous assessments and the changes in available input data.

Loan readiness should be presented as a preparation checklist or transparent indicator, not as a promise of approval.

### D. Application Outcome and Improvement Page

When an application is rejected, the owner sees:

* The recorded outcome and lender-provided reasons, where available.
* A clear distinction between confirmed reasons and additional potential weaknesses.
* Recommended next steps.
* Priority levels and progress tracking.
* Suggested supporting evidence.
* A summary for a future discussion with a lender.

The dashboard should avoid blaming the business owner or presenting climate exposure as an immutable personal failing. It should focus on practical, achievable ways to reduce vulnerability and improve readiness.

### E. Visual Design

Use a professional financial-technology interface:

* Dark navy or charcoal background with restrained teal or blue accents.
* Clear typography and accessible contrast.
* Simple charts and concise explanations.
* Neutral status indicators for ordinary information and distinct warning colours only when meaningful.
* Consistent navigation for lender and business-owner views.

Suggested sidebar:

**Lender view**

* Overview
* MSME Assessments
* Climate Risk
* Loan Applications
* Reports
* Settings

**Business-owner view**

* My Dashboard
* My Business
* Climate Exposure
* Loan Readiness
* Improvement Roadmap
* Documents
* Assessment History

## 11. Data Sources

### Open-Meteo

Provides weather forecasts, current conditions, and historical weather data where available. It can support rainfall and heat indicators. Weather data should not be described as a complete measure of long-term climate risk.

Website: https://open-meteo.com/

### World Bank Climate Change Knowledge Portal

Provides historical climate information and climate projections that may support longer-term context.

Website: https://climateknowledgeportal.worldbank.org/download-data

### World Bank Global Flood Exposure Dataset

Can provide geographic flood-exposure information, subject to the dataset's coverage and methodology. Population exposure must not be treated as a direct measurement of the flood risk to a specific business.

Dataset: https://datacatalog.worldbank.org/search/dataset/0062763/global-flood-exposure-gridded-exposure-headcounts-bycountry

### Business financial indicators

Business-entered or sample financial information can help illustrate cash-flow resilience, debt obligations, operating costs, and emergency reserves.

### Location and industry

These determine which hazards and operational vulnerabilities may be most relevant to the business.

The application should show the source, date, coverage, and limitations of its inputs wherever practical. If a source is unavailable, it should not fabricate a live data result.

## 12. Technology Stack

The prototype will use an Electron desktop application with a React interface and Node.js logic.

* **Electron:** Desktop application framework.
* **React:** Dashboard and user interface.
* **Vite:** Frontend development and build tooling.
* **Node.js:** Climate-data requests, assessment calculations, and application logic in the Electron main process.
* **Open-Meteo API:** Weather-related indicators.
* **SQLite (optional):** Local storage for demo assessments and improvement progress.
* **Kilo CLI:** AI-assisted development workflow.

No separate FastAPI backend is required for the initial version.

The Electron application should use a secure preload script and a narrowly scoped IPC bridge. Keep context isolation enabled and Node integration disabled in the renderer; do not expose unrestricted Node.js access to the React interface.

## 13. Hackathon MVP Scope

The aim is to demonstrate one complete, understandable workflow rather than a large collection of unfinished features.

### Must-have features

1. Business profile form.
2. Location and industry selection.
3. Climate indicator retrieval or a clearly labelled sample-data fallback.
4. Explainable risk-scoring engine.
5. Lender dashboard and assessment details.
6. Application outcome recording.
7. Loan Improvement Roadmap.
8. Progress tracking for recommended actions.
9. Sample data for a convincing demonstration.
10. Responsible-use disclaimer and missing-data handling.

### Optional features

* Interactive hazard map.
* Exportable assessment report.
* Document upload.
* Assessment history and trend charts.
* Portfolio comparisons across industries or locations.
* Notifications when updated information materially changes an assessment.

### Out of scope for the first prototype

* A production-grade credit-scoring model.
* Claims of validated default prediction.
* Direct integration with bank lending systems.
* Automated loan rejection or approval.
* Guaranteed loan-approval predictions.
* Complete satellite, utility, insurance, and supply-chain integrations.

## 14. Responsible Use

Climora is a decision-support prototype, not a replacement for a lender's formal underwriting process.

Its climate-risk score must not be represented as an official credit rating or a validated probability of default. A high climate-risk score alone should not automatically disqualify a business from financing.

The application should:

* Explain the factors behind each score.
* Display the provenance and limitations of its data.
* Flag missing or stale information.
* Separate lender-recorded rejection reasons from inferred improvement opportunities.
* Protect financial and personal information.
* Allow a human reviewer to assess context and correct inaccurate inputs.
* Present recommendations as support for business resilience and loan preparation rather than guaranteed approval criteria.

## 15. Expected Outcome

Climora aims to make climate-related financial risk easier to understand and act upon.

For lenders, it provides a structured view of climate exposure, business vulnerability, and potential areas for review.

For MSME owners, it provides clearer explanations, practical climate-preparedness guidance, and a roadmap for improving financial readiness.

Its central goal is to move beyond a simple risk number and answer three important questions:

1. **What climate-related risks could affect this business?**
2. **Why might those risks create financial or operational difficulties?**
3. **What can the lender or business owner do next?**

By combining explainable risk assessment with actionable loan-readiness guidance, Climora seeks to support more informed lending decisions and more resilient small businesses.1. The problem in simple EnglishThe problem statement is:Real-Time Climate Risk Scoring for MSMEsMSMEs are Micro, Small and Medium Enterprises — small businesses such as grocery stores, factories, restaurants, workshops and small manufacturers.These businesses often need loans from banks to operate or grow.Here's the problem: banks know a lot about a business's finances, but they might not know how climate disasters could affect that business in the near future.Let's use an example.2. Imagine two small businessesAdd to FavoritesBusiness AGrocery store in a location with relatively low flood exposure.Lower flood riskIts finances look healthy, and it has backup stock.Add to FavoritesBusiness BSimilar grocery store in a flo
