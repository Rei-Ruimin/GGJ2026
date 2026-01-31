import { STORY } from './story.js';

// --- Game Maps ---
// 0: Path, 1: Wall, 2: Item

// Helper: Create a map full of walls, BUT ensure (0,0) is always safe (0)
const ALL_WALLS = Array.from({length: 10}, (_, y) => 
    Array.from({length: 10}, (_, x) => (x === 0 && y === 0) ? 0 : 1)
);

// --- Level 1 ---
const LV1_HUMAN = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Start(0,0) Safe
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
];

// --- Level 2 (FIXED) ---
const LV2_HUMAN = [
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1], // Start(0,0) Safe
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 0, 1, 1, 1], // Landing (4,2).
    [1, 1, 1, 1, 0, 2, 0, 1, 1, 1], // Item (5,3).
    [1, 1, 1, 1, 0, 0, 0, 1, 1, 1], // (6,4) is safe switch spot
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Wall at (6,5), forcing switch
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]  // End (9,9)
];

const LV2_HEAVEN = [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // Start(0,0) Safe
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Blocked at (4,3), forcing switch
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1], // (6,4) is safe switch spot
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 1], // Path continues from (6,5)
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1], 
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]  // Reach End (9,9)
];

// --- Level 3 (REPAIRED & OPENED) ---
// Path logic: Start -> Hell(Left) -> Item 1 -> Human(Middle) -> Item 2 -> Human(Right) -> End

const LV3_HUMAN = [
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Start(0,0) Safe
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 1], // (4,5) Entrance from Hell
    [1, 1, 1, 1, 0, 2, 0, 0, 0, 1], // Item(5,6). FIXED: (6,6) and (7,6) are now 0 (PATH)
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 1], // Path down at x=7,8
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 1], // Wide path
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0]  // End (9,9)
];

const LV3_HEAVEN = [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // Start(0,0) Safe
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const LV3_HELL = [
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Start(0,0) Safe
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 2, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]  // End (9,9)
];

export const LEVELS = [
    {
        name: STORY.levels[0].name,
        lockedDimensions: [false, true, true],
        start: {x: 0, y: 0},
        end: {x: 9, y: 9},
        maps: [LV1_HUMAN, ALL_WALLS, ALL_WALLS],
        items: { '4,4': { text: STORY.levels[0].items['4,4'], collected: false } }
    },
    {
        name: STORY.levels[1].name,
        lockedDimensions: [false, false, true],
        start: {x: 0, y: 0},
        end: {x: 9, y: 9},
        maps: [LV2_HUMAN, LV2_HEAVEN, ALL_WALLS],
        items: { '5,3': { text: STORY.levels[1].items['5,3'], collected: false } }
    },
    {
        name: STORY.levels[2].name,
        lockedDimensions: [false, false, false],
        start: {x: 0, y: 0},
        end: {x: 9, y: 9},
        maps: [LV3_HUMAN, LV3_HEAVEN, LV3_HELL],
        items: {
            '2,4': { text: STORY.levels[2].items['2,4'], collected: false },
            '5,6': { text: STORY.levels[2].items['5,6'], collected: false }
        }
    }
];