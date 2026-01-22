# SPEC v0.1 (Baseline)

## Vision (v0.1)
Flowcy is a generic web tool to analyze and visualize customer flows using territorial data. It helps users understand where potential customers come from, how they move, and which places already capture attention.

## Core Concepts (v0.1)
- Sources: population origins (schools, residential areas, activity hubs).
- Mobility: transport infrastructure and dominant travel modes.
- Attractions: existing places that draw attention (competitors, venues, hubs).
- Personas: profiles that weight sources, modes, and time sensitivity.
- Catchment: approximated influence area around sources or candidates.
- Flow: simplified representation of movement intensity between sources and attractions.

## MVP Scope (v0.1)
- Map with layers: sources, attractions, simple flows, constraints.
- Sidebar with layer toggles and persona selector.
- Simple scoring v1 using explicit weights (placeholder values).
- Data-driven rendering from GeoJSON-like inputs.

## Out of Scope (v0.1)
- Real-time isochrones or routing (assumption: v2).
- Live data APIs (assumption: local datasets only).
- Advanced analytics (clustering, ML, predictive models).
- Multi-user collaboration or account system.

## User Stories (v0.1)
- As a user, I can toggle layers to focus on sources or attractions.
- As a user, I can select a persona to adjust the map view and scoring.
- As a user, I can compare candidate areas by a simple score.

## Acceptance Criteria (v0.1)
- Layers render from data files without manual edits to components.
- Persona changes update visible labels and scoring output.
- Each layer can be enabled or disabled independently.

## Decisions and Assumptions
- Assumption: v1 uses proxy catchment circles instead of real isochrones.
- Assumption: scoring is linear and interpretable.
- Placeholder: exact scoring formula pending Agent B.
- Placeholder: minimal candidate comparison UI (list-based).

## Scoring v1 (Definition)
### Catchment Rules
- Default catchment radius by source category:
  - education: 800 m
  - residential: 1200 m
  - leisure: 1000 m
  - other: 900 m
- Distance is measured as straight line (no routing).
- If a source has a custom radius, it overrides the default category radius.

### Score Formula
For a candidate location:
- For each source within its catchment radius:
  - sourceContribution = source.weight * persona.sourceWeight
  - distanceFactor = 1 - (distanceToCandidate / catchmentRadius)
  - contribution = sourceContribution * distanceFactor
- For each attraction within its influence radius:
  - attractionPenalty = attraction.influence * persona.attractionWeight
  - distanceFactor = 1 - (distanceToCandidate / attractionRadius)
  - penalty = attractionPenalty * distanceFactor
- Total score = clamp( (sum(contribution) - sum(penalty)) * persona.globalWeight, 0, 1 )

### Weights (v1 Defaults)
- persona.sourceWeight = 1.0
- persona.attractionWeight = 0.7
- persona.globalWeight = 1.0

### Limitations
- Straight-line distance only; no travel time modeling.
- Linear weights; no saturation effects.
- Scores are relative and depend on dataset coverage.

## Versioning
- This is v0.1. All decisions are reversible.

## Agent Feedback: Improvements on Current Features (v0.1+)
### Product Scope (Agent A)
- Clarify the candidate comparison UX: list view with score, distance to sources, and main influences.
- Lock MVP priorities: layers + personas + basic score, defer advanced analytics to v0.2.
- Add a short glossary and explicit non-goals to avoid feature creep.

### Method & Domain (Agent B)
- Define the v1 scoring formula and its limitations (linear weights, proxy catchments).
- Make catchment rules explicit (default radius per source category).
- Document assumptions and potential bias for each dataset type.

### UI & Map (Agents D + E)
- Add layer legends, visible units, and a "what am I seeing?" tooltip per layer.
- Ensure map state and sidebar state stay consistent on toggles and selection.
- Add performance guardrails: simplified geometry, clustering for large points.

### Data & Contracts (Agents C + F)
- Require dataset metadata (source, date, accuracy) and schema versioning.
- Enforce strict TypeScript contracts for datasets and stores.

### QA & Release (Agent G)
- Add a smoke-test checklist for layers, persona change, and scoring.
- Define minimal CI steps: lint, typecheck, build.
