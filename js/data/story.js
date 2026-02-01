export const LANG = {
    zh: {
        title: "浪漫主义者的殉道",
        subtitle: "A Romantic Pursuit",
        startScreen: {
            description: "我是一位追求极致光明的艺术家。<br>在这个沉睡的巨大国度中，我正进行一场伟大的远征。<br><br>我的灵魂在三个不同的位面中跳跃：<br>混乱的现实、圣洁的高天、以及致命的深渊。<br><br>注意：<br>如果你切换到的世界在该位置有障碍物，<br>你的肉身将因无法承载空间的重叠而毁灭。",
            button: "开启远征 (START)"
        },
        gameOver: {
            title: "追求者的陨落",
            defaultReason: "你撞上了无法逾越的现实",
            button: "重塑形体 (RETRY)"
        },
        victory: {
            title: "大梦初醒",
            content: `
                <p style="color: #fff; margin-bottom: 20px; font-size: 14px;">> 你义无反顾地冲向了那团“终极圣光”。<br>“滋啦——！！！”<br>剧烈的震动和焦灼感传遍全身，紧接着，整个世界陷入了彻底的黑暗。</p>
                <p style="color: #aaa; font-size: 14px;">> 巨人的咒骂声在上方响起：<br>“搞什么？这破灭蚊灯怎么短路了？竟然被一只飞蛾把灯丝给撞断了……”<br><br>> 你躺在桌面上，虽然翅膀冒着烟，但你感到前所未有的满足：<br>你亲手熄灭了“太阳”，成为了这个黑夜唯一的英雄。</p>
            `,
            button: "在宁静中安眠 (END)"
        },
        dialogs: {
            intro: "追光者：四周如此昏暗……我能感觉到，圣光就在远处。",
            deathOverlap: "空间重叠：你的存在与这个世界的物质发生了冲突。"
        },
        levels: [
            {
                name: "Level 1: 巨人的迷宫",
                items: {
                    '4,4': "追光者：一潭深色的湖泊，散发着甜腻而危险的气息。凡人们称之为“甜蜜的诱惑”。"
                }
            },
            {
                name: "Level 2: 圣洁的阶梯",
                items: {
                    '5,3': "追光者：我感觉到空气在发烫，那是圣光的余温。我正在接近它的外环。"
                }
            },
            {
                name: "Level 3: 终极的洗礼",
                items: {
                    '2,4': "追光者： 这不是天使的羽毛……而是一片被烧焦的翅膀残骸。看来曾有‘先行者’在此陨落。",
                    '5,6': "追光者： 巨大的轰鸣声在耳边炸响……这是神之国的唱诗班在为我加冕。"
                }
            }
        ],
        ui: {
            levelPrefix: "LEVEL ",
            controls: "WASD: 移动 | 1/2/3: 切换位面",
            next: "[继续 / NEXT]",
            loading: "加载中..."
        }
    },
    en: {
        title: "A Romantic Pursuit",
        subtitle: "",
        startScreen: {
            description: "I am an artist pursuing the ultimate light.<br>In this sleeping giant kingdom, I am on a great expedition.<br><br>My soul jumps between three different planes:<br>Chaotic Reality, Holy High Heaven, and Deadly Abyss.<br><br>Note:<br>If you switch to a world where an obstacle exists,<br>your physical form will be destroyed by spatial overlap.",
            button: "Start Expedition"
        },
        gameOver: {
            title: "The Fall of a Seeker",
            defaultReason: "You crashed into an insurmountable reality",
            button: "Reshape Form (Retry)"
        },
        victory: {
            title: "Awakening",
            content: `
                <p style="color: #fff; margin-bottom: 20px">> You rushed towards the "Ultimate Light" without hesitation.<br>"Zzzzt——!!!"<br>Violent tremors and burning sensations spread through your body, and then, the whole world plunged into complete darkness.</p>
                <p style="color: #aaa;">> A giant's curse rang out from above:<br>"What the hell? This broken bug zapper shorted out? A moth actually broke the filament..."<br><br>> You lie on the table, wings smoking, but feeling unprecedented satisfaction:<br>You extinguished the "Sun" with your own hands and became the only hero of this night.</p>
            `,
            button: "Sleep in Peace (End)"
        },
        dialogs: {
            intro: "Seeker: It's so dark around here... I can feel the Holy Light in the distance.",
            deathOverlap: "Spatial Overlap: Your existence conflicted with the matter of this world."
        },
        levels: [
            {
                name: "Level 1: Giant's Labyrinth",
                items: {
                    '4,4': "Seeker: A dark lake exuding a sweet and dangerous scent. Mortals call it 'Sweet Temptation'."
                }
            },
            {
                name: "Level 2: Holy Stairs",
                items: {
                    '5,3': "Seeker: I feel the air heating up, it's the residual warmth of the Holy Light. I am approaching its outer ring."
                }
            },
            {
                name: "Level 3: Ultimate Baptism",
                items: {
                    '2,4': "Seeker: This is not an angel's feather... but the wreckage of a burnt wing. It seems a 'forerunner' fell here.",
                    '5,6': "Seeker: A huge roar explodes in my ears... This is the choir of the Kingdom of God crowning me."
                }
            }
        ],
        ui: {
            levelPrefix: "LEVEL ",
            controls: "WASD: Move | 1/2/3: Switch Reality",
            next: "[NEXT]",
            loading: "LOADING..."
        }
    }
};