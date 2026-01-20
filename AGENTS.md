# Flowcy Agent Charter

This folder defines specialist agents and how they collaborate. It is the single entry point for responsibilities, boundaries, and escalation.

## Source of Truth
- SPEC.md: product scope, MVP, personas, acceptance criteria.
- DATA.md: datasets, schemas, provenance, update cadence.
- ARCH.md: types, contracts, versioning, events, store interfaces.
- datasets/: versioned offline datasets and samples.

## Collaboration Rules
- One source of truth only: update the relevant doc before implementing.
- Strong contracts between agents: no guessing fields or formats.
- Definition of Done for any feature:
  - Visible in UI.
  - Typed in TypeScript.
  - Smoke-tested.
  - Documented in SPEC.md (1-2 lines).

## Agents (start with A+B+D+E)
- A: Product/Specs orchestrator.
- B: Domain/Mobility & Catchment expert.
- C: Data/Sources & Pipelines.
- D: Frontend/UI (Vue + TS + Tailwind).
- E: Map Engineer (Leaflet/MapLibre).
- F: Architecture/Types/Contracts.
- G: QA/Testing/Release.

Each agent has its own doc in `agents/`.

## Escalation
- If a product choice blocks work, involve Agent A.
- If a method risks incorrect analysis, involve Agent B.
- If data formats are unclear, involve Agent C and F.
- If UI behavior is unclear, involve Agent D.
- If map performance or UX is unclear, involve Agent E.
- If quality or release is unclear, involve Agent G.
