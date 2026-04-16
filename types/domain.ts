export const DOMAIN_CODES = [
  'ADD_WHOLE',
  'SUB_WHOLE',
  'MUL_WHOLE',
  'DIV_WHOLE',
  'ADD_FRACTION',
  'SUB_FRACTION',
  'MUL_FRACTION',
  'DIV_FRACTION',
  'ADD_DECIMAL',
  'SUB_DECIMAL',
  'MUL_DECIMAL',
  'DIV_DECIMAL',
] as const;

export type DomainCode = (typeof DOMAIN_CODES)[number];
export const PROGRESSION_STYLES = ['DIFFICULTY_BAND', 'FACT_FAMILY'] as const;
export type ProgressionStyle = (typeof PROGRESSION_STYLES)[number];

export type DomainMeta = {
  label: string;
  progressionStyle: ProgressionStyle;
  maxLevel: number;
  displayOrder: number;
};
