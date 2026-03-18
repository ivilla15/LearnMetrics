export const ASSIGNMENT_TARGET_KINDS = ['ASSESSMENT', 'PRACTICE_TIME'] as const;
export type AssignmentTargetKind = (typeof ASSIGNMENT_TARGET_KINDS)[number];

export const ASSIGNMENT_TYPES = ['TEST', 'PRACTICE', 'REMEDIATION', 'PLACEMENT'] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

export const ASSIGNMENT_MODES = ['SCHEDULED', 'MAKEUP', 'MANUAL'] as const;
export type AssignmentMode = (typeof ASSIGNMENT_MODES)[number];

export const RECIPIENT_RULES = ['ALL', 'NOT_MASTERED_DEPENDENCY'] as const;
export type RecipientRule = (typeof RECIPIENT_RULES)[number];

export const OPERATION_CODES = ['ADD', 'SUB', 'MUL', 'DIV'] as const;
export type OperationCode = (typeof OPERATION_CODES)[number];

export const MODIFIER_CODES = ['DECIMAL', 'FRACTION'] as const;
export type ModifierCode = (typeof MODIFIER_CODES)[number];

export const TEACHER_PLANS = ['TRIAL', 'PRO', 'SCHOOL'] as const;
export type TeacherPlanCode = (typeof TEACHER_PLANS)[number];

export const ENTITLEMENT_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELED'] as const;
export type EntitlementStatusCode = (typeof ENTITLEMENT_STATUSES)[number];

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WeekdayEnum = WEEKDAYS;
export type Weekday = (typeof WEEKDAYS)[number];
