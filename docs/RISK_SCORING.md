# Climora — Risk Scoring Methodology

## 1. Purpose

Climora produces an illustrative climate-risk score to help lenders identify MSMEs that may be exposed to climate-related hazards.

The score is a transparent prototype heuristic. It is not a validated credit rating, probability of default, or lending recommendation.

## 2. Risk Dimensions

### A. Flood Exposure

Assess available flood-risk or flood-exposure information for the business location.

### B. Heavy Rainfall

Use available weather data to identify rainfall conditions that may disrupt business operations.

### C. Extreme Heat

Use available temperature data to identify potential heat-related operational stress.

### D. Business Vulnerability

Consider the business type and its potential sensitivity to climate disruptions. For example, agriculture-related businesses may be sensitive to rainfall variability, while outdoor operations may be sensitive to extreme heat.

### E. Financial Resilience

Use optional, user-provided financial indicators to describe the business's capacity to absorb disruptions. Avoid treating missing financial data as evidence of poor resilience.

## 3. Prototype Score

For the initial demonstration, assign each dimension a normalized risk value from 0 to 100.

Proposed weights:

| Dimension              |   Weight |
| ---------------------- | -------: |
| Flood exposure         |      30% |
| Heavy rainfall         |      25% |
| Extreme heat           |      20% |
| Business vulnerability |      15% |
| Financial resilience   |      10% |
| **Total**              | **100%** |

Formula:

`Overall Risk Score = Σ (Dimension Risk × Dimension Weight)`

The financial resilience dimension should represent vulnerability, so a less resilient business receives a higher risk value.

## 4. Risk Categories

- **0–24:** Low
- **25–49:** Moderate
- **50–74:** High
- **75–100:** Very High

These thresholds are provisional and are intended only for the hackathon prototype.

## 5. Explainability

For each assessment, show:

- Overall score and category.
- Individual dimension scores.
- Main factors contributing to the score.
- Data sources and assessment date.
- Recommended mitigation actions.
- Missing data and limitations.

## 6. Missing or Uncertain Data

- Do not silently treat missing values as zero risk.
- Clearly mark unavailable indicators.
- If a dimension cannot be assessed, either exclude it and proportionally reweight the available dimensions or show that the assessment is incomplete.
- Distinguish observed weather data from historical climate indicators and modelled flood exposure.

## 7. Responsible Use

The prototype is for decision support and demonstration only. It must not automatically approve or reject loans, claim validated predictive accuracy, or disadvantage a business solely because it operates in a hazard-prone area.

Before real-world deployment, the methodology would require domain-expert review, historical validation, bias testing, and ongoing monitoring.
