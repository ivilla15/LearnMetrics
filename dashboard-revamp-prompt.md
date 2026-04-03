# LearnMetrics — Teacher Dashboard Revamp Prompt

## Context

The current classroom overview page (`/teacher/classrooms/[id]`) is a v1 stub — it shows 6 basic stat cards (total students, active students, needs setup, active schedules, next test, last 7 days mastery/attempts) and nothing else. It uses `TeacherClassroomOverviewStatsDTO` from `getTeacherClassroomOverview()`.

The goal is to transform this into a real teacher dashboard that answers three questions in under 10 seconds:

1. **Is my class on track?**
2. **Who needs my attention right now?**
3. **What's coming up?**

Research shows teachers spend 30–90 seconds max on a dashboard. Every element must be immediately actionable — not just informative. This is distinct from the Progress page (which is for deep investigation). The dashboard is for fast, daily scanning.

---

## What Already Exists (Do Not Duplicate)

- **Progress page** (`/teacher/classrooms/[id]/progress`) — deep analytics, charts, full student table. Do not move these here.
- **Assignments page** (`/teacher/classrooms/[id]/assignments`) — full assignment list with filters. Do not move this here.
- **Calendar page** (`/teacher/classrooms/[id]/calendar`) — schedule management. Do not move this here.
- **People page** (`/teacher/classrooms/[id]/people`) — roster management. Do not move this here.

The dashboard surfaces the most time-sensitive signals from all of these and links to them — it does not replace them.

---

## Data Available (No New API Routes Needed)

All data for this dashboard already exists. Use a combination of:

| Data Needed                                             | Source                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| Student counts, next test, last 7 days mastery/attempts | `getTeacherClassroomOverview()` → `TeacherClassroomOverviewStatsDTO` |
| At-risk flags, student trends, streaks, stale students  | `getClassroomProgress()` → `ClassroomProgressDTO.students[]`         |
| Last 3 tests with mastery rates                         | `ClassroomProgressDTO.recent.last3Tests[]`                           |
| Top missed facts                                        | `ClassroomProgressDTO.insights.topMissedFacts[]`                     |
| Daily activity trend                                    | `ClassroomProgressDTO.charts.daily[]`                                |
| Upcoming assignments                                    | `getTeacherAssignments()` with status=upcoming                       |
| Class mastery rate, avg score                           | `ClassroomProgressDTO.summary`                                       |

Call `getClassroomProgress()` with `days=7` as the default for the dashboard. This gives a current-week snapshot without overloading the page with historical data.

---

## Page Structure

The dashboard is organized into **4 zones**, stacked vertically. Keep it scannable — no tabs, no filters needed to see the essentials.

---

### Zone 1 — Class Health Strip (top of page, always visible)

A horizontal row of **5 stat cards**, replacing the current 6-card grid. These are the only numbers a teacher needs at a glance:

| Stat                   | Data                                                              | Notes                                                                                                  |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Class Mastery Rate** | `ClassroomProgressDTO.summary.masteryRateInRange`                 | Format: "74%" with proficiency tier color chip (use `proficiencyTier()` from `core/progress/utils.ts`) |
| **Avg Score**          | `ClassroomProgressDTO.summary.avgPercentInRange`                  | Color-coded: <70 red, 70-84 amber, ≥85 green                                                           |
| **Active This Week**   | `ClassroomProgressDTO.summary.attemptsInRange > 0` count vs total | Format: "18 of 22 students"                                                                            |
| **At Risk**            | `ClassroomProgressDTO.summary.atRiskCount`                        | Clicking scrolls to the Needs Attention zone below; red if >0                                          |
| **Next Test**          | `TeacherClassroomOverviewStatsDTO.nextTest`                       | Show relative time: "Tomorrow 9am" or "In 3 days"; amber if within 24hrs                               |

**Skeleton loading:** Skeleton on each stat value only — not on the card labels. Cards render immediately; values fill in.

---

### Zone 2 — Needs Attention (most important section)

This is the heart of the dashboard. Surface students who need the teacher's eyes, categorized by type of concern. Teachers should be able to act from here — every student row links to their progress page.

Split into **3 collapsible categories**, each showing a count badge. Collapsed by default if count is 0, expanded by default if count > 0:

**Category A — At Risk 🔴**
Students with `flags.atRisk === true`.
Show per student: name, mastery rate last 7 days, non-mastery streak count, trend arrow.
Link: "View Progress" → `/teacher/classrooms/[id]/students/[studentId]/progress`

**Category B — No Recent Activity 🟡**
Students with `flags.stale14Days === true` OR `flags.noAttemptsInRange === true`.
Show per student: name, days since last attempt (`daysSinceLastAttempt`), last score if available.
Link: "View Progress" → student progress page

**Category C — Missed Last Test 🟡**
Students with `flags.missedLastTest === true`.
Show per student: name, the assignment they missed (use `recent.last3Tests` to find it), username for reference.
Link: "View Progress" → student progress page

**If all three categories are empty:**
Show a single green confirmation state: "All students are on track this week." — no empty state cards for each category.

**Design rules:**

- Each student row is one line: name + key signal + action link
- Max 5 students shown per category before a "Show X more" expander
- Use the existing `Pill` component for the count badges
- Do NOT use a table here — use a clean list layout, each row is a flex row with name on left and action on right
- Skeleton: show 3 skeleton rows per category while loading

---

### Zone 3 — This Week's Snapshot (middle section)

Two cards side by side (stack on mobile):

**Card A — Activity Sparkline**
A compact line chart showing daily attempts + mastery rate for the last 7 days.

- Use `ClassroomProgressDTO.charts.daily[]` (filter to last 7 entries)
- Two lines: attempts (muted color, right Y-axis) and mastery rate % (primary color, left Y-axis)
- No axis labels — this is a sparkline, not a full chart. Just the shape of the week.
- Add a one-line summary below the chart: "Most active on Tuesday · Best mastery on Wednesday"
- Use Recharts `ComposedChart` with `Line` for both series, `ResponsiveContainer`
- Keep it compact: ~180px tall

**Card B — Top Missed Facts**
The top 3 facts the class is struggling with most this week.

- Use `ClassroomProgressDTO.insights.topMissedFacts[]` (first 3)
- Show: operation symbol (+ − × ÷), the fact (e.g., "7 × 8"), error rate %
- Use modifier-aware formatting via `OperandValue` helpers
- Link at bottom: "See all missed facts →" → `/teacher/classrooms/[id]/progress`
- Skeleton: 3 skeleton rows while loading

---

### Zone 4 — Coming Up (bottom section)

Two cards side by side (stack on mobile):

**Card A — Recent Tests**
The last 3 tests with their results. Use `ClassroomProgressDTO.recent.last3Tests[]`.
Show per test: assignment name/type, date, participation count, mastery rate.
Each row links to the assignment detail page `/teacher/classrooms/[id]/assignments/[assignmentId]`.
If no recent tests: "No tests have been completed yet."

**Card B — Upcoming Assignments**
Assignments with `status=upcoming`, limited to next 3.
Use the existing assignment list API `GET /api/teacher/classrooms/[id]/assignments?status=upcoming&limit=3`.
Show per assignment: type pill (TEST/PRACTICE), opens date (relative: "Tomorrow", "In 3 days"), closes date.
If within 24 hours, show the date in amber.
Link: "View all assignments →" → `/teacher/classrooms/[id]/assignments`
If none upcoming: "No upcoming assignments. Create one →" with a link to the assignments page.
Skeleton: 3 skeleton rows while loading.

---

## Skeleton Loading Rules

Apply the same rules established for the progress pages:

**Skeleton on (data-driven values):**

- All 5 stat values in Zone 1
- Student rows in the Needs Attention section (Zone 2) — show 3 placeholder rows per category
- The sparkline chart area in Zone 3 Card A
- The missed facts list rows in Zone 3 Card B
- Recent test rows in Zone 4 Card A
- Upcoming assignment rows in Zone 4 Card B

**No skeleton on (static structure):**

- Zone headings ("Needs Attention", "This Week", "Coming Up")
- Category labels within Needs Attention ("At Risk", "No Recent Activity", "Missed Last Test")
- Card titles ("Top Missed Facts", "Recent Tests", "Upcoming")
- Stat card labels ("Class Mastery Rate", "Avg Score", etc.)
- Navigation, page title, action buttons

**Pattern to follow:**

```tsx
// ✅ Correct
<span className="text-sm text-muted-foreground">Class Mastery Rate</span>;
{
  isLoading ? (
    <Skeleton className="h-8 w-20" />
  ) : (
    <span className="text-2xl font-bold">{masteryRate}%</span>
  );
}

// ❌ Wrong — skeleton swallows the whole card including static label
{
  isLoading ? <Skeleton className="h-24 w-full" /> : <MasteryCard />;
}
```

---

## Files to Change

**Page:**

- `app/teacher/(app)/classrooms/[id]/page.tsx` — update to fetch both `getTeacherClassroomOverview()` and `getClassroomProgress({ days: 7 })` in parallel

**Server section:**

- `modules/teacher/dashboard/ClassroomOverviewSection.tsx` — extend to pass combined data down

**Client:**

- `modules/teacher/dashboard/ClassroomOverviewClient.tsx` — **new or full rewrite** — main client component orchestrating the 4 zones

**New components (create in `modules/teacher/dashboard/_components/`):**

- `ClassHealthStrip.tsx` — Zone 1 stat cards
- `NeedsAttentionSection.tsx` — Zone 2 with 3 categories
- `NeedsAttentionCategory.tsx` — single collapsible category (At Risk / No Activity / Missed Test)
- `StudentAttentionRow.tsx` — single student row within a category
- `WeeklySnapshotSection.tsx` — Zone 3 wrapper
- `ActivitySparklineCard.tsx` — Zone 3 Card A with Recharts ComposedChart
- `TopMissedFactsCard.tsx` — Zone 3 Card B (reuse patterns from progress page MostMissedFactsCard)
- `ComingUpSection.tsx` — Zone 4 wrapper
- `RecentTestsCard.tsx` — Zone 4 Card A
- `UpcomingAssignmentsCard.tsx` — Zone 4 Card B

**Hook:**

- `modules/teacher/dashboard/hooks/useClassroomDashboard.ts` — **new** — manages combined data state, loading, and derived values (counts per category, sparkline summary text)

---

## Existing Patterns to Follow (Do Not Deviate)

- **Server/client split**: Fetch data in server component (`ClassroomOverviewSection`), pass as props to client component. Do not fetch in client.
- **Recharts only** for charts — `ComposedChart`, `Line`, `ResponsiveContainer`. No new chart libraries.
- **Design system only** — `Card`, `Button`, `Pill`, `Skeleton`. No new UI components.
- **HSL theme tokens** — `hsl(var(--destructive))`, `hsl(var(--primary))`, etc. No hardcoded colors.
- **Types** — use `ClassroomProgressDTO`, `TeacherClassroomOverviewStatsDTO`, `MissedFactDTO`, `TeacherAssignmentListItemDTO`. Do not redefine shapes.
- **`proficiencyTier()`** — already in `core/progress/utils.ts` from the progress page refactor. Use it for the mastery rate color chip.
- **`OPERATION_SYMBOL`** — already defined from the progress page refactor. Use it for missed facts display.
- **No `any` types** — use existing DTOs and `OperandValue` helpers.
- **Incremental changes** — do not rewrite files that don't need changes. Show only changed files in output.

---

## Constraints

- Do NOT add a new API route — all data comes from existing endpoints
- Do NOT move or duplicate the charts from the progress page — just link to it
- Do NOT build a notification bell or persistent notification system — that's out of scope
- Do NOT add real-time polling — fetch on page load only
- Keep the page fast — parallel fetch `getTeacherClassroomOverview()` and `getClassroomProgress({ days: 7 })` in the server component
- The dashboard must feel lighter than the progress page — if it feels like too much, remove something rather than adding more
