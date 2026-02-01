import { STORY } from './story.js';

// --- Game Maps ---
// 0: Path, 1: Wall, 2: Item

// Helper: Generates a map with default fill, ensuring specific spots are always 0 (safe)
function generateMap(defaultVal, safeCoords, customPattern = null) {
    const map = [];
    for (let y = 0; y < 10; y++) {
        const row = [];
        for (let x = 0; x < 10; x++) {
            // Apply custom pattern if provided, otherwise default val
            let val = defaultVal;
            if (customPattern && customPattern[y] && customPattern[y][x] !== undefined) {
                val = customPattern[y][x];
            }
            row.push(val);
        }
        map.push(row);
    }
    
    // Enforce safety at key coordinates
    safeCoords.forEach(([x, y]) => {
        if (map[y] && map[y][x] !== undefined) {
            map[y][x] = 0;
        }
    });
    
    return map;
}

// Key Coordinates [x, y]
const L1_SAFE = [[0,0], [9,9], [4,4]];
const L2_SAFE = [[0,0], [9,9], [5,3]];
const L3_SAFE = [[0,0], [9,9], [2,4], [5,6]];

// --- Level 1: The Giant's Labyrinth ---
// Concept: A simple but winding maze to teach movement.
const L1_PATTERN = [
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
    [0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 1], // Item at 4,4 (Handled by safeCoords)
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 1, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0]  // End at 9,9
];

const LV1_HUMAN = generateMap(0, L1_SAFE, L1_PATTERN);
const LV1_WALLS = generateMap(1, L1_SAFE); // All walls except key points

// --- Level 2: The Holy Stairs ---
// Concept: "Phase shifting". Human has walls where Heaven has paths, and vice versa.
// Requires zig-zagging between dimensions.

const L2_HUMAN_PATTERN = [
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1], // Start area
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 1], // Blocked paths
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Barrier
    [1, 1, 1, 0, 0, 0, 1, 1, 1, 1], // Item area (5,3 is safe)
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
];

const L2_HEAVEN_PATTERN = [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 1, 0], // Inverse-ish
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Open barrier
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0], // Item area
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const LV2_HUMAN = generateMap(0, L2_SAFE, L2_HUMAN_PATTERN);
const LV2_HEAVEN = generateMap(0, L2_SAFE, L2_HEAVEN_PATTERN);
const LV2_WALLS = generateMap(1, L2_SAFE);

// --- Level 3: The Ultimate Baptism ---
// Concept: 3 Zones.
// Zone 1 (Top-Left): Human is Safe. Hell/Heaven blocked.
// Zone 2 (Middle-Diagonal): Hell is Safe. Human/Heaven blocked.
// Zone 3 (Bottom-Right): Heaven is Safe. Human/Hell blocked.

const L3_HUMAN_PATTERN = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 1, 1, 1, 1, 1, 1], // Reach 2,4
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Blocked from here
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const L3_HELL_PATTERN = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 0, 1, 1, 1], // Pickup from 2,4 (Safe)
    [1, 1, 1, 0, 0, 1, 0, 1, 1, 1],
    [1, 1, 0, 0, 1, 0, 0, 1, 1, 1], // Path to center
    [1, 1, 0, 1, 0, 0, 0, 1, 1, 1], // Reach 5,6
    [1, 1, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const L3_HEAVEN_PATTERN = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // Pickup from 5,6 (Safe)
    [1, 1, 1, 1, 1, 1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]  // End 9,9
];

const LV3_HUMAN = generateMap(0, L3_SAFE, L3_HUMAN_PATTERN);
const LV3_HELL = generateMap(0, L3_SAFE, L3_HELL_PATTERN);
const LV3_HEAVEN = generateMap(0, L3_SAFE, L3_HEAVEN_PATTERN);

export const LEVELS = [
    {
        name: STORY.levels[0].name,
        lockedDimensions: [false, true, true],
        start: {x: 0, y: 0},
        end: {x: 9, y: 9},
        maps: [LV1_HUMAN, LV1_WALLS, LV1_WALLS],
        items: { '4,4': { ...STORY.levels[0].items['4,4'], collected: false } }
    },
    {
        name: STORY.levels[1].name,
        lockedDimensions: [false, false, true],
        start: {x: 0, y: 0},
        end: {x: 9, y: 9},
        maps: [LV2_HUMAN, LV2_HEAVEN, LV2_WALLS],
        items: { '5,3': { ...STORY.levels[1].items['5,3'], collected: false } }
    },
    {
        name: STORY.levels[2].name,
        lockedDimensions: [false, false, false],
        start: {x: 0, y: 0},
        end: {x: 9, y: 9},
        maps: [LV3_HUMAN, LV3_HEAVEN, LV3_HELL], // Map order: Human, Heaven, Hell (Index 0, 1, 2)
        items: {
            '2,4': { ...STORY.levels[2].items['2,4'], collected: false },
            '5,6': { ...STORY.levels[2].items['5,6'], collected: false }
        }
    }
];
