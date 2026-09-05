# SignalIQ — PRD

## Problem
Product teams receive customer feedback across support tickets, interviews, surveys, reviews, sales calls, and communities. The feedback is fragmented and expensive to synthesize manually, so teams often prioritize the loudest request rather than the highest-impact problem.

## ICP
Primary:
- PMs at seed to Series B B2B SaaS companies
- Product/engineering orgs of roughly 5–100 people
- Hundreds of feedback items per month
- Feedback spread across several tools

Secondary:
- Founders acting as PM
- Product Ops / Customer Success leaders

## JTBD
When I have customer feedback from multiple channels, I want to understand recurring problems and see the evidence quickly so I can make prioritization decisions without manually reading everything.

## MVP
Must have:
- CSV feedback upload
- Feedback classification
- Theme extraction
- Bug / feature request / pain point labels
- Sentiment + severity
- Evidence drill-down
- Transparent priority score
- Opportunity dashboard

Later:
- Slack / Zendesk / Intercom
- Jira / Linear push
- Segmentation
- Trend detection
- Weekly digest
- Team collaboration
- Feedback-to-PRD generation

## AI quality rules
Every insight must:
1. Link to source feedback.
2. Avoid invented evidence.
3. Expose confidence.
4. Be testable against human labels.

## Initial priority score
- 35% frequency
- 30% severity
- 20% negative sentiment
- 15% source diversity

## MVP success criteria
- 80%+ feedback-type agreement with human labels
- 75%+ theme assignment agreement
- <60 seconds to analyze 100 items
- 50%+ reduction in synthesis time during testing
- 70%+ of users can identify their top 3 issues without help
