# Prepared Workflow Challenge input inventory

Every asset is comma-delimited UTF-8 with a header and no saved dataframe index. Exact ordered columns, stored types, target, first-eight-row preview, row count and full SHA-256 are in [inputs.json](../ml-learning/inputs.json). The reconstruction and independent decode tests verify all of these, not just the totals.

| Challenge input | Rows | Columns | Target | SHA-256 prefix |
|---|---:|---:|---|---|
| [ML-X01.csv](../data/ml-learning/ML-X01.csv) | 142 | 4 | lifeExp | `d4d20c6d4d88` |
| [ML-X02.csv](../data/ml-learning/ML-X02.csv) | 85 | 2 | winpercent | `b917b9b0aaae` |
| [ML-X03.csv](../data/ml-learning/ML-X03.csv) | 85 | 12 | winpercent | `493998f13d72` |
| [ML-X04.csv](../data/ml-learning/ML-X04.csv) | 8760 | 12 | Rented Bike Count | `27790af6fc3b` |
| [ML-X05.csv](../data/ml-learning/ML-X05.csv) | 333 | 8 | species | `6ae46cde86a2` |
| [ML-X06.csv](../data/ml-learning/ML-X06.csv) | 1728 | 7 | acceptability | `976b0e0a4446` |
| [ML-X07.csv](../data/ml-learning/ML-X07.csv) | 333 | 5 | species | `f08c3275b518` |
| [ML-X08.csv](../data/ml-learning/ML-X08.csv) | 569 | 6 | diagnosis | `940477a05f3c` |
| [ML-X09.csv](../data/ml-learning/ML-X09.csv) | 1728 | 7 | acceptability | `976b0e0a4446` |
| [ML-X10.csv](../data/ml-learning/ML-X10.csv) | 85 | 13 | popular | `1d5c474787d9` |
| [ML-X11.csv](../data/ml-learning/ML-X11.csv) | 569 | 6 | diagnosis | `940477a05f3c` |
| [ML-X12.csv](../data/ml-learning/ML-X12.csv) | 85 | 10 | popular | `7b4f204bbea1` |
| [ML-X13.csv](../data/ml-learning/ML-X13.csv) | 1728 | 7 | acceptability | `976b0e0a4446` |
| [ML-X14.csv](../data/ml-learning/ML-X14.csv) | 333 | 5 | species | `f08c3275b518` |
| [ML-X15.csv](../data/ml-learning/ML-X15.csv) | 600 | 12 | quality | `3c107d3f1db7` |
| [ML-X16.csv](../data/ml-learning/ML-X16.csv) | 569 | 6 | diagnosis | `940477a05f3c` |
| [ML-X17.csv](../data/ml-learning/ML-X17.csv) | 333 | 4 | None; measurements only | `2a4767f91f98` |
| [ML-X18.csv](../data/ml-learning/ML-X18.csv) | 569 | 5 | None; measurements only | `e705ad35f5cf` |
| [ML-X19.csv](../data/ml-learning/ML-X19.csv) | 569 | 30 | None; measurements only | `afc2d85af290` |

X10 retains winpercent solely as an explicitly forbidden leakage source. X12 contains the derived popular target without winpercent. X15 needs no deduplication or resampling. X18 intentionally supplies the full 569-row measurement population because the capped 500-row sample is a learner deliverable. X17/X18/X19 contain no species/diagnosis labels. Original source files remain separately labelled provenance links in every brief.
