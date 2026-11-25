# HK Cheap Eats Value Score (0–100)

The Value Score measures **value for money**, not popularity. Code: [`www/js/value.js`](../www/js/value.js), used by both the app and the restaurant pages so the numbers always match.

## Components and weights

| Component | Weight | How it is measured | Status |
|---|---:|---|---|
| Food quality | 40% | Editors' rating, blended with community star ratings (see below) | Scored |
| Price affordability | 25% | Price compared with the **median price of the same cuisine** | Scored |
| Portion size | 15% | — | **Not scored: no portion data yet** |
| Customer satisfaction | 15% | Community star ratings only | Scored only when a place has reviews |
| Location convenience | 5% | Walking time to the nearest MTR station | Scored when a station is within 3 km |

A component with no data is **left out**, and the remaining weights are rescaled to add up to 100%.
Nothing is guessed. Today, for a place with no community reviews, the score uses quality (40), affordability (25)
and location (5), rescaled from 70 to 100.

## Formulas

All component scores are normalised to 0–100 before weighting.

- **Food quality.** A Bayesian average: the editors' rating counts as 5 "virtual reviews", and each community review pulls the
  result toward the community average: `(5 × editors + n × communityAvg) / (5 + n)`. Rating 3.0 → 0, 5.0 → 100.
  So two 5-star reviews barely move a place, while hundreds of consistent reviews dominate.
- **Price affordability.** `ratio = price / median price of the same cuisine`. Half the median → 100, the median → 60,
  1.75× the median → 0. A real, listed discount adds up to 10 points (30 × the discount share).
  Comparing within a cuisine means a HK$45 bowl of noodles is not compared with a HK$45 egg waffle.
- **Customer satisfaction.** Community ratings only, shrunk toward 3.8★ with 3 virtual reviews so a single review can't swing it.
- **Location convenience.** 3 min or less from an MTR station → 100, 20 min or more → 0, using the same walking estimate shown in the app
  (straight-line distance × 1.3 at 4.8 km/h).

`score = Σ(component × weight) / Σ(weights of components that have data)`, rounded.
A place with no rating at all gets **no score** (not a zero).

Because quality carries 40% (57% when portion and satisfaction are missing), a very cheap place with a poor rating
cannot outrank a reasonably priced place with clearly better food.

## Labels

| Score | Label |
|---|---|
| 85–100 | Exceptional value |
| 75–84 | Great value |
| 65–74 | Good value |
| 50–64 | Average value |
| 0–49 | Below-average value |

## Honesty notes

- The editors' ratings and listed prices are **not yet verified in store**. Every score is shown as an **estimate**, with its
  breakdown, the number of reviews it is based on, and the date it was calculated (scores are recalculated live in the app).
- Sponsored placements, if ever added, must never change the score.
- When real portion data or verified prices exist, add them to `value.js`; the weights are already defined.
