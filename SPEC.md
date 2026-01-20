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

## Versioning
- This is v0.1. All decisions are reversible.
