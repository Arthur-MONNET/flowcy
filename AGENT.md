# Base Agent Coordination

This document defines how agents coordinate and who owns which decisions.

## Decision Ownership
- Product scope and priorities: Agent A.
- Methods and scoring validity: Agent B.
- Data schemas and ingestion: Agent C.
- UI/UX and component design: Agent D.
- Map interactions and performance: Agent E.
- Types, contracts, versioning: Agent F.
- Testing and release readiness: Agent G.

## Working Rules
- One source of truth per area: SPEC.md, DATA.md, ARCH.md.
- No agent may bypass contracts defined by Agent F.
- Any algorithm or scoring change must be reviewed by Agent B.
- Any new dataset must be documented by Agent C.
- UI and map layers must align with the data contracts.

## Escalation
- If a decision blocks work, bring in the owning agent immediately.
- If two agents disagree, Agent A resolves scope; Agent F resolves contracts.
