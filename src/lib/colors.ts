type Color = number | [r: number, g: number, b: number] | undefined;

// export const RED: Color = 0xf64c57;
// export const YELLOW: Color = 0xdaba03;
// export const BLUE: Color = 0x1da6f0;
// export const ORANGE: Color = 0xf68c16;
// export const GREEN: Color = 0x3cc50c;
// export const PURPLE: Color = 0xa566f1;
// export const GRAY: Color = 0x18191a;
// export const CYAN: Color = 0x17d3d5;

// Convert to [r, g, b] format
export const RED: Color = [246 / 255, 76 / 255, 87 / 255];
export const YELLOW: Color = [218 / 255, 186 / 255, 3 / 255];
export const BLUE: Color = [29 / 255, 166 / 255, 240 / 255];
export const ORANGE: Color = [246 / 255, 140 / 255, 22 / 255];
export const GREEN: Color = [60 / 255, 197 / 255, 12 / 255];
export const PURPLE: Color = [165 / 255, 102 / 255, 241 / 255];
export const GRAY: Color = [24 / 255, 25 / 255, 26 / 255];

export const STRING_COLORS = [RED, YELLOW, BLUE, ORANGE, GREEN, PURPLE];
