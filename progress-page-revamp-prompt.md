# LearnMetrics — Teacher Progress Page Revamp Prompt

## Context

The current teacher progress page is a v1 that was built assuming a single operation with no modifiers. Since then, the app has grown to support:

- Multiple operations: `ADD | SUB | MUL | DIV`
- Modifiers: `DECIMAL` and `FRACTION` (configurable per classroom via `ProgressionPolicyDTO`)
- Multiple assignment types: `TEST | PRACTICE | REMEDIATION | PLACEMENT`
- Rich student-level data: streaks, trends, at-risk flags, missed facts

The progress page needs a full revamp to reflect what real teachers expect when sharing data with stakeholders (parents, administrators, school boards). The new design should follow mastery-based reporting standards used by platforms like Khan Academy, DreamBox, and IXL.

---

## What to Build

### 1. Classroom Progress Page (`/teacher/classrooms/{id}/progress`)

#### Header / Summary Strip

Replace `ProgressSummaryCard` with a cleaner **4-stat summary strip**:

- **Class Mastery Rate** — % of attempts that hit mastery in the selected range
- **Avg Score** — mean percent across all attempts
- **Active Students** — count of students with ≥1 attempt in range (out of total enrolled)
- **At-Risk Students** — students flagged `atRisk` (clickable, scrolls to filtered table)

Keep the recent test callout (last 3 TEST assignments) but make it more compact — a horizontal row of pill-style cards, each showing assignment name, date, mastery rate.

#### Operation Switcher

Add a **tab or segmented control** at the top of the charts section to filter the entire page by operation:

- Tabs: `All | ADD | SUB | MUL | DIV`
- Only show tabs for operations enabled in the classroom's `ProgressionPolicyDTO.enabledOperations`
- When a specific operation is selected, all charts and the student table filter to that operation's data
- The existing `?primaryOperation=MUL` query param can drive this — wire it to the tab UI

#### Charts Section (revamp from scratch)

Replace the current custom `BarRow` chart components with proper Recharts components. The charts section should have **3 charts in a responsive grid**:

**Chart 1 — Score Distribution (Bar Chart)**

- X-axis: Score buckets `0-49 | 50-69 | 70-84 | 85-99 | 100`
- Y-axis: Number of attempts
- Color the bars by proficiency zone:
  - `0-49` → destructive/red token
  - `50-69` → warning/amber token
  - `70-84` → muted/gray token
  - `85-99` → success/green token
  - `100` → primary/brand token
- Use `BarChart` + `Bar` + `Cell` from Recharts with `ResponsiveContainer`

**Chart 2 — Level Distribution (Bar Chart)**

- X-axis: Levels 1–12 (only render levels with data or ±1 neighbor)
- Y-axis: Number of students currently at that level
- Single color, use `primary` token
- Add a `ReferenceLine` at the class median level

**Chart 3 — Mastery Trend Over Time (Line Chart)**

- X-axis: Dates (use `daily` chart data from `ClassroomProgressDTO.charts.daily`)
- Y-axis: Mastery rate (0–100%)
- Two lines: `masteryRate` (primary color) and `avgPercent` (muted color)
- Use `CartesianGrid`, `Tooltip`, `Legend`
- Keep the existing `LevelProgressChart` pattern as reference

#### Modifier Awareness (new)

When the classroom has `DECIMAL` or `FRACTION` modifiers enabled:

- Add a small **modifier badge** next to the operation tab label (e.g., "MUL · Fractions")
- In the student table, add a column or tooltip showing which modifier the student is currently on for the selected operation

#### Students Table (revamp `StudentsTableCard`)

This is the most important stakeholder-facing element. Revamp it with:

**Columns:**
| Column | Data | Notes |
|---|---|---|
| Student | `name`, `username` | Sortable |
| Level | `level` | Show per-operation level if operation is selected |
| Mastery Rate | `masteryRateInRange` | Format as `% (n attempts)` |
| Avg Score | `avgPercentInRange` | Color-coded: <70 red, 70-84 amber, ≥85 green |
| Trend | `trendLast3` | Icon + label: ↑ Improving / → Steady / ↓ Regressing |
| Last Active | `daysSinceLastAttempt` | Relative time: "2 days ago", "14+ days" in amber |
| Status | `flags` | Pill badges: At Risk, No Attempts, Missed Test |
| Actions | — | "View Progress" link |

**Filters (above table):**

- Keep existing filter tabs: `All | At Risk | Missed Last Test | Mastery Streak | Non-Mastery Streak`
- Add search by name/username
- Add sort by any column header

**Visual treatment:**

- At-risk rows get a subtle left border in the destructive color token
- Stale students (14+ days) get `daysSinceLastAttempt` rendered in amber
- Use the existing `Card`, `Button`, `Pill` design system components — do not introduce new patterns

#### Most Missed Facts (keep but improve `MostMissedFactsCard`)

- Show top 5 instead of top 3
- Display the operation symbol properly: + − × ÷
- Show modifier format when relevant (e.g., `0.5 + 0.25` for decimals, `1/2 + 1/4` for fractions)
- Use `OperandValue` display helpers — do not hardcode formats
- Keep the drill-down modal (which students missed it)

---

### 2. Student Progress Page (`/teacher/classrooms/{id}/students/{studentId}/progress`)

The individual student page has a fundamentally different purpose from the classroom page. The classroom page is about identifying patterns across students. The student page is about telling the story of one student's learning journey — precise enough for an administrator, understandable enough for a parent. Every section should answer: "Is this student growing, and where do they need support?"

#### Header — Proficiency + Growth Summary (revamp `SummaryCard`)

Replace the current generic summary card with two distinct zones:

**Zone 1 — Current Proficiency (large, prominent)**
Map the student's overall mastery rate to a proficiency tier and display it as the dominant visual on the page:

- `< 60%` → **Beginning** (destructive/red token)
- `60–74%` → **Developing** (warning/amber token)
- `75–89%` → **Proficient** (success/green token)
- `≥ 90%` → **Advanced** (primary/blue token)

Display: large tier label + color chip + numeric mastery rate (e.g., "Proficient — 81%"). This is the language parents and admins understand immediately without needing to interpret raw numbers.

**Zone 2 — Growth Snapshot (stat row)**
Show these 5 stats in a compact row beneath the proficiency tier:

- **Level** — current level (per operation if one is selected)
- **Attempts** — total in selected date range
- **Avg Score** — `avgPercentInRange` formatted as %
- **Streak** — mastery streak count with 🔥 icon, or non-mastery streak in amber with warning icon
- **Last Active** — relative time (e.g., "2 days ago", "14+ days" shown in amber)

**Zone 3 — Standing Comparison (new, subtle)**
Below the stat row, add a single-line benchmark indicator:

- "Above class average" / "At class average" / "Below class average"
- Derived by comparing this student's `avgPercentInRange` to the classroom-level `avgPercentInRange` from `ClassroomProgressDTO.summary`
- Use a small directional icon (↑ / → / ↓) with muted styling — not alarming, just contextual

#### Operation Tabs (new — same pattern as classroom page)

Add operation tabs at the top of the data section: `All | ADD | SUB | MUL | DIV`

- Only show tabs for operations enabled in the classroom
- Selecting an operation filters all charts and tables below to that operation's attempts only
- Show modifier badge on the tab when applicable (e.g., "MUL · Fractions")

#### Growth Chart (replace/improve `LevelProgressChart`)

This is the centerpiece of the student page — the teacher's primary evidence of whether learning is happening. Redesign it:

**Multi-operation line chart:**

- One line per enabled operation (distinct colors, labeled in legend)
- X-axis: real date-based time axis so growth _velocity_ is visible (faster improvement = steeper slope)
- Y-axis: level number
- Each data point: a dot colored **green** if that attempt was mastery, **red** if not
- Add a `ReferenceLine` at the student's current level (dashed, labeled "Current Level")
- Tooltip on hover: date, level, operation, score %, mastery status

**Effort + Persistence annotation (new):**
When a student had 2+ consecutive non-mastery attempts before finally mastering a level, show a small annotation marker at the mastery point: "Took 3 attempts" — this surfaces perseverance for teachers to acknowledge and for parent conversations.

#### Skill Journey Table (new section — replaces or augments attempt table intro)

Above the attempt history, add a **per-operation skill summary table** — one row per operation the student has worked on. This gives the teacher a quick snapshot of the student's skill journey:

| Operation        | Modifier  | Current Level | Mastery Rate | Attempts | Trend        |
| ---------------- | --------- | ------------- | ------------ | -------- | ------------ |
| × Multiplication | Fractions | 7             | 83%          | 12       | ↑ Improving  |
| + Addition       | Integers  | 12            | 96%          | 8        | → Steady     |
| − Subtraction    | Decimals  | 5             | 61%          | 6        | ↓ Regressing |

- Data derived from filtering `TeacherStudentProgressDTO.recent.attempts` by operation
- Mastery rate and trend computed client-side per operation using existing `trendFromLast3` utility
- Modifier derived from the operand kinds in the most recent attempt items for that operation
- Click a row to jump to that operation's tab

#### Attempt History Table (improve `AttemptResultsTable`)

Add columns that are currently missing:

- **Operation** — show symbol (+ − × ÷) derived from `AttemptRowDTO.operation`
- **Modifier** — show "Integer" / "Decimal" / "Fraction" (derive from `AttemptDetailItemDTO` operand kinds on drill-down; show "—" for collapsed rows)
- **Type** — TEST / PRACTICE / REMEDIATION / PLACEMENT with a colored pill (keep existing pills if already styled)
- Keep existing: Score, %, Mastery badge, Date, drill-down chevron

**Grouping (new):** Group attempt rows by week (collapsed by default, expandable). This surfaces patterns like "had a strong week in week 2, then dropped off" without requiring the teacher to mentally parse a flat list.

Week headers show: date range, attempt count, mastery rate for that week.

#### Missed Facts Card (improve `MissedFactsCard`)

Same improvements as classroom level, plus:

- Show the **error rate** for each fact (e.g., "missed 4 of 6 times — 67% error rate")
- Add a **"Most Recent Miss"** date so the teacher can see if this is a persistent issue or resolved
- Format operands using `OperandValue` display helpers — proper symbols and modifier formatting
- Keep top 5 facts

#### Intervention + Acceleration Callout (new — below header)

When the student has active flags from `TeacherStudentProgressDTO.student.flags`, surface a dismissible callout banner between the header and the charts:

**At-risk scenarios (destructive/amber styling):**

- `nonMasteryStreak2` → "This student has missed mastery on their last 2+ attempts. Consider a check-in or remediation assignment."
- `stale14Days` → "No activity in 14+ days. Consider re-engagement."
- `atRisk` → "This student is flagged at risk based on recent performance trends."

**Positive momentum (subtle green styling):**

- `masteryStreak` ≥ 3 → "On a mastery streak! This student has mastered their last {n} attempts."

These are static, data-driven messages — do NOT generate AI narrative text. Use the flags that already exist in the DTO.

---

### 3. Print / Export View

The existing `PrintHeader` component exists but is incomplete. Improve it:

- When `?print=true` query param is set, render a clean print layout:
  - School name, classroom name, student name, date range, generated date
  - Summary stats in a clean table (no interactive elements)
  - Charts as static SVG snapshots (Recharts renders as SVG — should work)
  - Student table with all rows (no pagination)
  - Proficiency tier prominently displayed
- Add a **"Print / Export" button** to the page header that navigates to `?print=true` and triggers `window.print()`

---

## Existing Patterns to Reuse (Do Not Deviate)

- **Charts**: Use `Recharts` only — already in the project at `recharts@^3.6.0`
- **Components**: Use `Card`, `Button`, `Pill` from the design system
- **Colors**: Use HSL theme tokens (e.g., `hsl(var(--destructive))`) — no hardcoded hex/rgb
- **Types**: All data comes from existing DTOs in `types/api/progress.ts`, `types/api/attempts.ts`, `types/api/question.ts` — do not redefine shapes
- **Hooks**: `useClassroomProgress` and `useStudentProgress` already manage state — extend them, don't replace
- **Server/Client split**: `ProgressSection` and `StudentProgressSection` are server components that fetch data; client components receive data as props — keep this pattern
- **Formatting helpers**: Use `extractNumericValue()` for operand display; do not hardcode number formats

---

## Data Already Available (No New API Routes Needed)

All the data needed for the revamp is already returned by existing endpoints:

| Need                  | Source                                                         |
| --------------------- | -------------------------------------------------------------- |
| Operation filter      | `?primaryOperation=` query param → `ClassroomProgressDTO`      |
| Score buckets         | `ClassroomProgressDTO.charts.scoreBuckets`                     |
| Level buckets         | `ClassroomProgressDTO.charts.levelBuckets`                     |
| Daily trend           | `ClassroomProgressDTO.charts.daily`                            |
| At-risk flags         | `ClassroomProgressStudentRowDTO.flags`                         |
| Trend direction       | `ClassroomProgressStudentRowDTO.trendLast3`                    |
| Missed facts          | `ClassroomProgressDTO.insights.topMissedFacts` (MissedFactDTO) |
| Student mastery rate  | `ClassroomProgressStudentRowDTO.masteryRateInRange`            |
| Proficiency tier      | Compute from `masteryRateInRange` on the client                |
| Attempt history       | `TeacherStudentProgressDTO.recent.attempts` (AttemptRowDTO)    |
| Operation per attempt | `AttemptRowDTO.operation`                                      |
| Modifier per attempt  | Derive from `AttemptDetailItemDTO` operand kinds               |

---

## Files to Change

**Classroom progress:**

- `modules/teacher/progress/components/ProgressSummaryCard.tsx` — revamp
- `modules/teacher/progress/components/ScoreDistributionCard.tsx` — replace with Recharts BarChart
- `modules/teacher/progress/components/LevelDistributionCard.tsx` — replace with Recharts BarChart
- `modules/teacher/progress/components/MostMissedFactsCard.tsx` — improve display
- `modules/teacher/progress/components/StudentsTableCard.tsx` — revamp columns + styling
- `modules/teacher/progress/ClassroomProgressClient.tsx` — add operation tabs, wire filters
- `modules/teacher/progress/hooks/useClassroomProgress.ts` — extend for operation tab state

**Student progress:**

- `modules/teacher/student-progress/components/SummaryCard.tsx` — proficiency tier, growth snapshot, class benchmark comparison
- `modules/teacher/student-progress/components/AttemptResultsTable.tsx` — add operation/modifier columns, weekly grouping
- `modules/teacher/student-progress/components/MissedFactsCard.tsx` — error rate, most recent miss date, modifier-aware formatting
- `modules/teacher/student-progress/StudentProgressClient.tsx` — add operation tabs, intervention/acceleration callout banner
- `modules/teacher/student-progress/hooks/useStudentProgress.ts` — extend for operation tab state, per-operation skill summary derivation
- `components/LevelProgressChart.tsx` — multi-operation lines, date-based X-axis, mastery dots, persistence annotations
- `modules/teacher/student-progress/components/SkillJourneyTable.tsx` — **new** per-operation skill summary table
- `modules/teacher/student-progress/components/InterventionCallout.tsx` — **new** flag-driven callout banner

**Shared:**

- Add a `ProficiencyTier` utility (compute tier from mastery rate) in `core/progress/utils.ts`
- Add operand display helpers (format OperandValue as string with modifier awareness) if not already present

---

## Skeleton Loading States

Use skeleton loaders on any element whose content depends on fetched data. Do **not** put skeletons on static elements.

**Use skeletons on:**

- Chart areas (score distribution, level distribution, mastery trend)
- The stats strip values (mastery rate %, avg score, active count, at-risk count)
- The student table rows
- The missed facts list
- The proficiency tier label and numeric rate on the student page
- The attempt history table rows
- The level progress chart

**Do NOT use skeletons on:**

- Page titles (e.g., "Class Progress", "Student Progress")
- Section headers (e.g., "Score Distribution", "Missed Facts")
- Column headers in tables
- Tab labels (All / ADD / SUB / MUL / DIV)
- Filter pill labels
- Static UI chrome (card borders, layout containers, buttons)

**Implementation rule:** Import `Skeleton` from the existing design system. Wrap only the data-driven values in `<Skeleton>` while the surrounding labels and structure render immediately. This prevents layout shift and keeps the page feeling responsive — the teacher sees the structure instantly and the numbers fill in.

Example pattern:

```tsx
// ✅ Correct — skeleton only on the value
<div className="flex flex-col">
  <span className="text-sm text-muted-foreground">Mastery Rate</span>
  {isLoading ? (
    <Skeleton className="h-8 w-20" />
  ) : (
    <span className="text-2xl font-bold">{masteryRate}%</span>
  )}
</div>;

// ❌ Wrong — skeleton on the whole card including static label
{
  isLoading ? <Skeleton className="h-24 w-full" /> : <MasteryRateCard />;
}
```

---

## Constraints

- Do NOT modify Prisma schema or any API route handlers
- Do NOT introduce new chart libraries — Recharts only
- Do NOT add new design system components — use existing `Card`, `Button`, `Pill`, `Skeleton`
- Do NOT use `any` type — use existing `OperandValue`, `AnswerValue`, `AttemptRowDTO`, etc.
- Do NOT rewrite hooks from scratch — extend existing `useClassroomProgress` and `useStudentProgress`
- Keep the server/client boundary: data fetching stays in server components
- Make incremental changes — do not rewrite entire files unless necessary
- Show only changed files in output
