# Climora --- Research & Analysis

**Project:** Real-Time Climate Risk Scoring for MSMEs\
**Purpose:** Document the research sources, data collected, analysis
plan, and limitations supporting the Climora prototype.

> **Evidence status:** The weather sample below is from the uploaded
> `pune.xlsx` workbook. The flood sample is extracted from the uploaded
> `adm2_flood_exposure_15cm_1in100.csv` file, filtered to `ISO3 = IND`.
> The India flood rows contain administrative-area codes, not readable
> district names. Do not assign a district name without the dataset's
> official code-to-region lookup.

## 1. Research objectives

Climora aims to help users examine how location-specific climate hazards
and business vulnerability may affect MSMEs. Research focuses on:

-   Heat and temperature indicators.
-   Rainfall and precipitation indicators.
-   Flood exposure context.
-   Weather-data access and comparison.
-   Transparent, explainable risk scoring and data-quality limitations.

The prototype's rule-based score is an illustrative decision-support
measure, **not** a validated credit rating, probability of default, or
automatic lending decision.

## 2. Research source: PLOS Climate paper

**Paper:** *The IPCC Interactive Atlas DataLab: Online reusability for
regional climate change assessment* (Cimadevilla et al., 2025).

-   [Read the
    article](https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000644)
-   [Download
    PDF](https://journals.plos.org/climate/article/file?id=10.1371%2Fjournal.pclm.0000644&type=printable)
-   [IPCC Interactive Atlas](https://interactive-atlas.ipcc.ch)
-   [Atlas DataLab source code and
    notebooks](https://github.com/SantanderMetGroup/IPCC-Atlas-Datalab)

### Findings relevant to Climora

-   Climate impacts vary by region, and both average and extreme
    conditions matter.
-   The paper describes regional analysis of climate indicators, maps,
    time series, and future projections under different scenarios.
-   It emphasizes transparent, reproducible, reusable climate-data
    workflows.
-   These ideas inform Climora's location-specific indicators,
    visualizations, source documentation, and clear communication of
    uncertainty.

**Scope note:** This is background research. The paper does not supply a
ready-made, validated MSME risk-scoring formula, and Climora does not
claim to implement the IPCC Atlas DataLab.

## 3. Primary weather source: Open-Meteo

-   [Weather API documentation](https://open-meteo.com/en/docs)
-   [Historical Weather
    API](https://open-meteo.com/en/docs/historical-weather-api)
-   [Flood API](https://open-meteo.com/en/docs/flood-api)
-   [Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
-   [Open-Meteo terms and attribution
    information](https://open-meteo.com/en/terms)

### Data to collect

For each location and retrieval period, record the coordinates,
requested dates, variable names, units, retrieval timestamp, and missing
values. Useful indicators include daily maximum/minimum temperature,
precipitation, precipitation duration where available, wind speed, and
river discharge from the separate Flood API.

### Use in Climora

-   Temperature indicators support the extreme-heat dimension.
-   Precipitation indicators support the heavy-rainfall dimension.
-   River discharge may provide flood-related context but is not a
    direct measurement of whether a particular shop will flood.
-   Geocoding helps translate a place name into coordinates.

**Integration status:** Open-Meteo is the planned primary live data
source. Confirm actual implementation in the code before describing it
as integrated.

## 4. Alternative weather source: Visual Crossing

-   [Weather data
    overview](https://www.visualcrossing.com/weather-data/)
-   [Timeline Weather API
    documentation](https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/)

Visual Crossing documentation describes historical weather and forecast
data, with fields such as date, maximum/minimum temperature,
precipitation, precipitation probability, wind speed, and conditions
depending on the query.

### Analysis task

Compare its available fields, date coverage, units, output format, and
access/API-key requirements with Open-Meteo. Use the same location and
dates if making a direct comparison.

**Status:** Alternative-source research only unless a working
integration is completed.

## 5. Historical weather source: Meteostat

-   [Meteostat documentation](https://dev.meteostat.net/)
-   [Daily data
    API](https://dev.meteostat.net/python/api/meteostat.daily.html)

Meteostat can be studied for historical weather observations and
station-based data. Review its date coverage, measurement fields,
station metadata, and missing observations before using it for
comparison.

### Analysis task

If data is downloaded, produce a historical temperature or precipitation
chart and document the station/location and date range. Historical
observations should not be confused with a weather forecast or a
long-term climate projection.

**Status:** Supplementary research unless integrated.

## 6. World Bank Climate Change Knowledge Portal

-   [Climate data download
    page](https://climateknowledgeportal.worldbank.org/download-data)
-   [India climate
    resources](https://climateknowledgeportal.worldbank.org/country/india/resources)
-   [Observed climate data --- CRU TS 4.07
    catalog](https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0040276/climate-change-knowledge-portal-observed-climate-data-cru-ts4-07-0-5-degree)
-   [Projected climate data --- CMIP6
    catalog](https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0042297/climate-change-knowledge-portal-projected-climate-data-cmip6-0-25-degree)

### What to study or download

For India, select historical temperature and precipitation data, and
optionally climate projections with their scenario metadata. Record the
spatial coverage, time period, variable definitions, units, and
scenario.

### Use in Climora

This source can provide broader historical and projected climate
context. It is supplementary and should not be described as a live feed
or integrated data source unless the application actually retrieves it.

## 7. World Bank Global Flood Exposure Dataset

-   [Official Global Flood Exposure dataset
    page](https://datacatalog.worldbank.org/search/dataset/0062763/global-flood-exposure-gridded-exposure-headcounts-by-country)
-   [Space2Stats database
    catalog](https://datacatalog.worldbank.org/search/dataset/0066820/space2stats-database)

The supplied CSV is named `adm2_flood_exposure_15cm_1in100.csv`. It
contains 38,734 records and five columns. Filtering `ISO3 = IND` returns
**683 India records**.

### Column descriptions

  -----------------------------------------------------------------------
  Column                  Meaning based on field  Notes
                          name                    
  ----------------------- ----------------------- -----------------------
  `ADM2CD_c`              Administrative-area     A lookup is needed to
                          code                    resolve the code to a
                                                  named region.

  `pop`                   Population field        Confirm units and
                                                  definition in the
                                                  official metadata.

  `pop_flood`             Flood-exposed           Confirm definition and
                          population field        units in the official
                                                  metadata.

  `pop_flood_pct`         Flood-exposure          Some supplied values
                          percentage/indicator    exceed 100; do not
                          field                   interpret as a
                                                  conventional percentage
                                                  until the data
                                                  definition is verified.

  `ISO3`                  Three-letter country    `IND` identifies India.
                          code                    
  -----------------------------------------------------------------------

### India sample extracted from the supplied CSV

The rows below are the first eight India records in the supplied file.
They are retained as raw sample values; **the area codes are not
district names**.

  ADM2CD_c              pop     pop_flood   pop_flood_pct ISO3
  ----------- ------------- ------------- --------------- ------
  IND001001       16949.912      1964.795           4.064 IND
  IND001002       77043.899     20020.371          12.848 IND
  IND001003      178511.489     22500.130           9.233 IND
  IND002001     4510176.345    806935.931          90.162 IND
  IND002002     4626674.460    743612.681          57.187 IND
  IND002003     3163763.303    625957.288          72.065 IND
  IND002004     5341273.336   1071274.930          61.133 IND
  IND002005     5501916.299    986813.999          56.848 IND

### Interpretation and limitations

-   The dataset is flood-exposure context, not an individual MSME's
    flood probability.
-   Join administrative codes to the official geographic lookup before
    naming districts or states.
-   Validate field definitions and units against the dataset metadata,
    especially because `pop_flood_pct` contains values above 100.
-   Do not claim this dataset is integrated into Climora unless it is
    actually processed by the application.

## 8. Pune weather sample collected from Visual Crossing

The uploaded `pune.xlsx` workbook contains 15 daily records for Pune,
dated **9--23 October 2026**, with weather fields including temperature,
humidity, precipitation, wind, and conditions.

### Sample rows

  --------------------------------------------------------------------------------------------------
  datetime       tempmax   tempmin    temp   humidity   precip   precipprob   windspeed conditions
  ------------ --------- --------- ------- ---------- -------- ------------ ----------- ------------
  2026-10-09       90.40     73.10   81.20      53.00     0.00            0        7.60 Clear

  2026-10-10       90.50     72.50   80.60      59.00     0.00            0        8.00 Partially
                                                                                        cloudy

  2026-10-11       90.90     72.70   81.10      55.00     0.00            0       11.50 Partially
                                                                                        cloudy

  2026-10-12       90.70     70.00   79.80      51.40     0.00            0       12.10 Clear

  2026-10-13       90.80     69.80   79.60      50.40     0.00            0       10.50 Clear
  --------------------------------------------------------------------------------------------------

### Analysis notes

-   The workbook's temperature values appear to be in Fahrenheit (for
    example, `tempmax = 90.4`); verify the export's selected units
    before charting or combining it with Celsius-based sources.
-   In the supplied sample, most precipitation values are zero, with
    small non-zero values on some dates.
-   Keep the original units and data source in chart labels and analysis
    notes.
-   These are the values in the supplied workbook; they are not
    independently verified observations.

## 9. How the research informs Climora's risk model

Climora's proposed rule-based scoring design uses five dimensions:

  -----------------------------------------------------------------------------
  Dimension                                        Weight Possible supporting
                                                          evidence
  -------------------------- ---------------------------- ---------------------
  Flood exposure                                      30% Flood API indicators
                                                          and supplementary
                                                          flood-exposure
                                                          datasets, where
                                                          geographically
                                                          matched

  Heavy rainfall                                      25% Precipitation and
                                                          rainfall-duration
                                                          indicators

  Extreme heat                                        20% Maximum temperature
                                                          and suitable heat
                                                          indicators

  Business vulnerability                              15% Business profile and
                                                          location/context
                                                          entered by the user

  Financial                                           10% User-provided
  vulnerability/resilience                                financial
                                                          information, when
                                                          available
  -----------------------------------------------------------------------------

The intended weighted score is:

`Overall Risk Score = sum(dimension risk score × dimension weight)`

Each dimension is intended to be normalized to 0--100 before weighting.
The proposed score bands are Low (0--24), Moderate (25--49), High
(50--74), and Very High (75--100). These are **provisional hackathon
assumptions**, not empirically validated thresholds.

Missing climate data must not automatically be treated as zero risk. If
financial information is absent, the system should not infer poor
resilience. Missing indicators should be flagged and handled
transparently, for example by proportionally reweighting available
dimensions or marking the assessment incomplete when too few dimensions
are available.

## 10. Recommended research outputs for the presentation

1.  A short literature-review summary and a cited figure from the PLOS
    Climate paper.
2.  A real Open-Meteo request and response, with location and units
    shown.
3.  A Visual Crossing weather chart based on the supplied Pune workbook.
4.  A comparison table of Open-Meteo, Visual Crossing, and Meteostat.
5.  A documented India flood-exposure sample with code-to-region mapping
    and metadata caveats.
6.  A diagram showing how collected indicators feed the five proposed
    risk dimensions.

Label each item accurately as **collected and analyzed**, **studied as a
reference**, or **proposed for future integration**.

## References

1.  [PLOS Climate research
    paper](https://doi.org/10.1371/journal.pclm.0000644)
2.  [Open-Meteo Weather API](https://open-meteo.com/en/docs)
3.  [Open-Meteo Historical Weather
    API](https://open-meteo.com/en/docs/historical-weather-api)
4.  [Open-Meteo Flood API](https://open-meteo.com/en/docs/flood-api)
5.  [Open-Meteo Geocoding
    API](https://open-meteo.com/en/docs/geocoding-api)
6.  [Visual Crossing Weather
    Data](https://www.visualcrossing.com/weather-data/)
7.  [Visual Crossing Timeline Weather
    API](https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/)
8.  [Meteostat documentation](https://dev.meteostat.net/)
9.  [World Bank Climate Change Knowledge Portal --- Download
    Data](https://climateknowledgeportal.worldbank.org/download-data)
10. [World Bank Global Flood Exposure
    Dataset](https://datacatalog.worldbank.org/search/dataset/0062763/global-flood-exposure-gridded-exposure-headcounts-by-country)
11. [World Bank Space2Stats
    database](https://datacatalog.worldbank.org/search/dataset/0066820/space2stats-database)
