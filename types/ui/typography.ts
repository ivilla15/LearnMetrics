export const TEXT_SIZES = ['xs', 'sm', 'md', 'base', 'lg', 'xl'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
