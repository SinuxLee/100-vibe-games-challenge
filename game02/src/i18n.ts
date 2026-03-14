export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'survivor_lang';

let currentLang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang) || 'zh';

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

type Dict = Record<string, string>;

const zh: Dict = {
  // Boot
  loading: '加载中...',

  // Menu
  title: '幸存者',
  subtitle: '抵御怪物潮',
  new_game: '新游戏',
  continue_game: '继续游戏',
  lang_toggle: '中文 / EN',

  // HUD
  lv: '等级 {n}',
  wave: '波次 {n}',
  kills: '击杀: {n}',
  muted: '静音',
  sound: '音效',
  paused: '暂停',
  pause_hint: '按 ESC 继续',

  // Tutorial
  tut_move_title: '移动',
  tut_move_body: '使用 WASD 键或在屏幕\n左侧拖动来移动。',
  tut_attack_title: '自动攻击',
  tut_attack_body: '你的武器会自动\n攻击最近的敌人。',
  tut_xp_title: '收集经验',
  tut_xp_body: '敌人掉落经验球，\n靠近即可拾取。',
  tut_levelup_title: '升级',
  tut_levelup_body: '升级时从 3 个强化\n中选择 1 个。',
  tut_survive_title: '生存',
  tut_survive_body: '波次会越来越难。\n每 5 波会出现 Boss！',
  tut_tap_start: '点击开始！',
  tut_tap_continue: '点击继续  ({n}/{total})',
  tut_skip: '跳过 >',

  // Level Up
  level_up: '升级！',
  auto_pick: '自动选择',

  // Upgrade names
  upg_pierce: '穿透弹',
  upg_bullet_speed: '高速弹',
  upg_bullet_count: '多重射击',
  upg_damage_up: '强力射击',
  upg_fire_rate_up: '急速射击',
  upg_speed_up: '疾风步',
  upg_max_hp: '生命力',

  // Upgrade descriptions
  upg_pierce_desc: '每颗子弹额外穿透 +1 个敌人',
  upg_bullet_speed_desc: '子弹速度 +20%',
  upg_bullet_count_desc: '每次射击 +1 颗子弹',
  upg_damage_up_desc: '子弹伤害 +25%',
  upg_fire_rate_up_desc: '射击冷却 -15%',
  upg_speed_up_desc: '移动速度 +12%',
  upg_max_hp_desc: '最大生命值 +25 并回复',

  // Game Over
  game_over: '游戏结束',
  stat_kills: '击杀: {n}',
  stat_time: '时间: {n}',
  stat_wave: '波次: {n}',
  stat_level: '等级: {n}',
  best_score: '最佳: {kills} 击杀 / {time}',
  restart: '重新开始',
  menu: '主菜单',
};

const en: Dict = {
  // Boot
  loading: 'Loading...',

  // Menu
  title: 'SURVIVOR',
  subtitle: 'Survive the Horde',
  new_game: 'NEW GAME',
  continue_game: 'CONTINUE',
  lang_toggle: '中文 / EN',

  // HUD
  lv: 'Lv.{n}',
  wave: 'Wave {n}',
  kills: 'Kills: {n}',
  muted: 'MUTED',
  sound: 'SOUND',
  paused: 'PAUSED',
  pause_hint: 'Press ESC to resume',

  // Tutorial
  tut_move_title: 'Move',
  tut_move_body: 'Use WASD keys or drag the\nleft side of screen to move.',
  tut_attack_title: 'Auto-Attack',
  tut_attack_body: 'Your weapon fires automatically\nat the nearest enemy.',
  tut_xp_title: 'Collect XP',
  tut_xp_body: 'Enemies drop XP orbs.\nWalk near them to pick up.',
  tut_levelup_title: 'Level Up',
  tut_levelup_body: 'Choose 1 of 3 upgrades\nwhen you level up.',
  tut_survive_title: 'Survive',
  tut_survive_body: 'Waves get harder over time.\nBoss appears every 5 waves!',
  tut_tap_start: 'Tap to Start!',
  tut_tap_continue: 'Tap to continue  ({n}/{total})',
  tut_skip: 'SKIP >',

  // Level Up
  level_up: 'LEVEL UP!',
  auto_pick: 'AUTO-PICK',

  // Upgrade names
  upg_pierce: 'Piercing Rounds',
  upg_bullet_speed: 'Velocity Rounds',
  upg_bullet_count: 'Multi Shot',
  upg_damage_up: 'Power Shot',
  upg_fire_rate_up: 'Rapid Fire',
  upg_speed_up: 'Swift Feet',
  upg_max_hp: 'Vitality',

  // Upgrade descriptions
  upg_pierce_desc: '+1 enemy pierced per bullet',
  upg_bullet_speed_desc: '+20% bullet speed',
  upg_bullet_count_desc: '+1 bullet per shot',
  upg_damage_up_desc: '+25% bullet damage',
  upg_fire_rate_up_desc: '-15% fire cooldown',
  upg_speed_up_desc: '+12% movement speed',
  upg_max_hp_desc: '+25 max HP and heal',

  // Game Over
  game_over: 'GAME OVER',
  stat_kills: 'Kills: {n}',
  stat_time: 'Time: {n}',
  stat_wave: 'Wave: {n}',
  stat_level: 'Level: {n}',
  best_score: 'Best: {kills} kills / {time}',
  restart: 'RESTART',
  menu: 'MENU',
};

const dicts: Record<Lang, Dict> = { zh, en };

/**
 * Translate a key with optional interpolation.
 * Usage: t('kills', { n: 10 })  →  "击杀: 10"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = dicts[currentLang][key] ?? dicts['en'][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function tUpgradeName(id: string): string {
  return t(`upg_${id}`);
}

export function tUpgradeDesc(id: string): string {
  return t(`upg_${id}_desc`);
}
