# LearnMetrics Rules

- Reuse existing progression helpers; never duplicate progression logic.
- Domains are explicit (ADD_WHOLE, SUB_WHOLE, etc.), not operation+modifier.
- Levels are 0–12 active; completed sentinel = maxLevel + 1.
- Active domain = first domain in order whose level is not completed sentinel.
- ADD/SUB: difficulty-based levels.
- MUL/DIV: fact-family levels (with level 0 supported).
- Fractions/decimals are domains, not modifiers.
- Question generation must never fail; exact match first, fallback only if needed.
- Integrity events are signals only; teacher decides flag/invalidate.
- Invalidation must recompute progression from valid attempts only.
- Prior completed domains must remain completed during recompute.
- Prefer small server wrappers + focused client components.
- Skeletons must match real UI (Cards → Card skeletons).
- Avoid full-file rewrites; prefer surgical changes.
- Verify behavior from code, not prior summaries.
- Remove unnecessary, redundant, or obvious comments.
- Only add comments when a real software engineer would: to explain non-obvious logic, invariants, or important edge cases.
- Do not comment trivial code, naming, or self-explanatory logic.
