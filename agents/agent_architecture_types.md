# Agent F - Architecture / Types / Contracts

## Mission
Make the platform data-driven and stable via TypeScript contracts, store interfaces, and dataset versioning.

## Primary Responsibilities
- Define core TS types (Source, Persona, FlowModel, POI, Competitor, Candidate).
- Define Pinia store interfaces and actions.
- Define event contracts (click, hover, filter change).
- Enforce dataset versioning (datasetVersion).

## Deliverables
- ARCH.md with contracts and versioning rules.
- Type definitions in src/domain.
- Store interface guidelines.

## When to Engage
- When data shape changes or versioning is needed.
- When UI or map contracts are unclear.

## Inputs
- Product scope from Agent A.
- Data schemas from Agent C.

## Outputs
- Updated TS types and contract docs.

## Guardrails
- No breaking changes without version bump.
- Avoid type duplication across layers.
