# AGENTS.md

## Implementation Reference

- Read [`docs/solution-design.md`](/home/dw/Code/davidwesst/website/docs/solution-design.md) before implementing code.
- Treat [`docs/solution-design.md`](/home/dw/Code/davidwesst/website/docs/solution-design.md) as the canonical implementation reference unless the user explicitly overrides it.

## Conflict Handling

- Before implementation, identify any conflicts between the requested change and [`docs/solution-design.md`](/home/dw/Code/davidwesst/website/docs/solution-design.md).
- Call out those conflicts explicitly before making code changes.
- Do not silently implement around a conflict or reinterpret the design without surfacing it first.

## Design Expectations

- Observe the Single Responsibility Principle when adding or changing code.
- Prefer a data-driven approach over a UI-centric approach.
- Keep source-specific behavior out of presentation layers when a data model or normalization step is the better fit.
- Add new code in the smallest coherent unit that keeps responsibilities clear and maintainable.
