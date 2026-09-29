export const TILE = 48;
export const MAP_W = 44;
export const MAP_H = 34;
export const VIEW_W = 960;
export const VIEW_H = 720;
export const WORLD_W = MAP_W * TILE;
export const WORLD_H = MAP_H * TILE;
export const TICK_MS = 170;
export const FOV_R = 9;
export const MAX_FLOOR = 10;
export const BEST_KEY = 'snakeRogueBest.v1';

export const WALL_TILES = [4, 5, 14, 15, 28, 40, 57, 58, 59];
export const FLOOR_TILES = [48, 49, 50, 51, 52, 53, 30];
export const T = {
  TORCH: 29,
  STAIRS: 75,
  WEB: 41,
  SKULL: 121,
  BLADE: 103,
  CHEST: 90,
  CHEST_OPEN: 91,
  POT_RED: 115,
  POT_BLUE: 116,
  POT_GREEN: 114,
  POT_WHITE: 113,
};

export const COLORS = {
  bg: '#07070c',
  fog: 'rgba(5,6,14,0.66)',
  uiPanel: 'rgba(10,11,20,0.78)',
  uiLine: '#2a2d44',
  text: '#c9cde0',
  textDim: '#7f8499',
  accent: '#e8c15a',
  heart: '#e04848',
  heartEmpty: '#3a2430',
  hungerHigh: '#7fc46a',
  hungerMid: '#d8b34a',
  hungerLow: '#d4564a',
  venom: '#7ad67a',
  venomEmpty: '#26341f',
  snake: '#4fbf63',
  snakeDark: '#2e8a45',
  snakeHead: '#63d878',
  snakeOutline: '#123a1e',
};

export const SCORE = {
  apple: 10,
  gold: 25,
  chest: 15,
  killBonus: 0,
  floor: 100,
  amulet: 500,
};
