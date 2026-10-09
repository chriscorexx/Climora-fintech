
# Climora — Data Sources

## 1. Purpose

Climora uses public climate and weather data to demonstrate how location-based climate hazards may affect MSMEs.

## 2. Planned Data Sources

### A. Open-Meteo API

Website: https://open-meteo.com/

**Purpose:**

* Retrieve weather data for a selected location.
* Obtain temperature and precipitation indicators.
* Demonstrate how current or recent weather conditions can inform an assessment.

**Integration:** Access the API from the FastAPI backend using the selected location's latitude and longitude.

**Limitations:** Current weather is not the same as long-term climate risk. Short-term observations must not be presented as proof of future climate conditions.

### B. World Bank Climate Change Knowledge Portal

Website: https://climateknowledgeportal.worldbank.org/download-data

**Purpose:**

* Explore historical climate information and climate projections.
* Identify relevant country-level or regional climate indicators where available.

**Integration:** Use suitable downloaded data if it can be accessed and prepared within the hackathon timeframe.

**Limitations:** Country-level information may not represent conditions at an individual business location.

### C. World Bank Global Flood Exposure Dataset

Dataset: https://datacatalog.worldbank.org/search/dataset/0062763/global-flood-exposure-gridded-exposure-headcounts-bycountry

**Purpose:**

* Explore flood-exposure information as contextual evidence of potential hazard exposure.

**Integration:** Use only if the relevant data can be downloaded, interpreted, and matched to the prototype's geographic scope.

**Limitations:** Population exposure is not the same as direct flood risk to an individual business. Do not present population exposure values as business-specific flood probabilities.

## 3. Fallback Strategy

Because this is a 24-hour hackathon:

1. Prioritize a working Open-Meteo integration.
2. Use a small, clearly labelled sample dataset if an external source is unavailable.
3. Keep the application functional when an API request fails.
4. Label sample, live, historical, and modelled data accurately.

## 4. Data Handling

* Fetch external data through the node.js backend where practical.
* Validate API responses and handle missing values.
* Display the source and retrieval date when available.
* Do not invent observations or present sample data as live data.
* Avoid collecting unnecessary personal or sensitive financial information.

## 5. Future Improvements

* Add more granular regional climate datasets.
* Integrate verified flood-hazard maps.
* Include drought and other locally relevant climate hazards.
* Validate the scoring methodology against suitable historical data and expert guidance.
