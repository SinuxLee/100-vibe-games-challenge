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

  // Character select
  select_char: '选择角色',
  char_warrior: '战士',
  char_ranger: '游侠',
  char_mage: '法师',
  char_warrior_desc: '均衡全能，血量充足',
  char_ranger_desc: '快速灵巧，连弩急射',
  char_mage_desc: '奥术法师，双弹穿透',
  char_hp: '生命: {n}',
  char_speed: '速度: {n}',
  char_weapon: '武器: {n}',
  weapon_basic_gun: '基础手枪',
  weapon_crossbow: '连弩',
  weapon_magic_bolt: '魔法弹',
  weapon_shotgun: '霰弹枪',
  weapon_sniper: '狙击枪',
  weapon_flame_cannon: '火炮',
  back: '返回',

  // HUD
  lv: '等级 {n}',
  wave: '波次 {n}',
  kills: '击杀: {n}',
  muted: '静音',
  sound: '音效',
  paused: '暂停',
  pause_hint: '按 ESC 继续',

  // Stage
  stage: '第{n}章',
  stage_1_name: '初始之地',
  stage_2_name: '危险升级',
  stage_3_name: '深入敌境',
  stage_4_name: '末日前线',
  stage_5_name: '终极试炼',
  stage_enter: '— 第{n}章: {name} —',

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
  upg_shield: '钢铁意志',
  upg_crit_chance: '致命瞄准',
  upg_multi_cast: '奥术爆发',
  upg_magnet: '磁力光环',
  upg_armor: '铁皮肤',

  // Upgrade descriptions
  upg_pierce_desc: '每颗子弹额外穿透 +1 个敌人',
  upg_bullet_speed_desc: '子弹速度 +20%',
  upg_bullet_count_desc: '每次射击 +1 颗子弹',
  upg_damage_up_desc: '子弹伤害 +25%',
  upg_fire_rate_up_desc: '射击冷却 -15%',
  upg_speed_up_desc: '移动速度 +12%',
  upg_max_hp_desc: '最大生命值 +25 并回复',
  upg_shield_desc: '最大生命值 +30（战士专属）',
  upg_crit_chance_desc: '子弹伤害 +30%（游侠专属）',
  upg_multi_cast_desc: '每次射击 +1 颗子弹（法师专属）',
  upg_magnet_desc: '拾取范围 +20',
  upg_armor_desc: '无敌时间 +200毫秒',

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

  // Character select
  select_char: 'SELECT CHARACTER',
  char_warrior: 'Warrior',
  char_ranger: 'Ranger',
  char_mage: 'Mage',
  char_warrior_desc: 'Balanced all-rounder with high HP',
  char_ranger_desc: 'Fast scout with rapid-fire crossbow',
  char_mage_desc: 'Arcane caster with twin bolts',
  char_hp: 'HP: {n}',
  char_speed: 'SPD: {n}',
  char_weapon: 'Weapon: {n}',
  weapon_basic_gun: 'Pistol',
  weapon_crossbow: 'Crossbow',
  weapon_magic_bolt: 'Magic Bolt',
  weapon_shotgun: 'Shotgun',
  weapon_sniper: 'Sniper',
  weapon_flame_cannon: 'Flame Cannon',
  back: 'BACK',

  // HUD
  lv: 'Lv.{n}',
  wave: 'Wave {n}',
  kills: 'Kills: {n}',
  muted: 'MUTED',
  sound: 'SOUND',
  paused: 'PAUSED',
  pause_hint: 'Press ESC to resume',

  // Stage
  stage: 'Stage {n}',
  stage_1_name: 'The Beginning',
  stage_2_name: 'Rising Danger',
  stage_3_name: 'Deep Enemy Lines',
  stage_4_name: 'Doomsday Front',
  stage_5_name: 'Ultimate Trial',
  stage_enter: '— Stage {n}: {name} —',

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
  upg_shield: 'Iron Will',
  upg_crit_chance: 'Deadly Aim',
  upg_multi_cast: 'Arcane Burst',
  upg_magnet: 'Magnetic Aura',
  upg_armor: 'Tough Skin',

  // Upgrade descriptions
  upg_pierce_desc: '+1 enemy pierced per bullet',
  upg_bullet_speed_desc: '+20% bullet speed',
  upg_bullet_count_desc: '+1 bullet per shot',
  upg_damage_up_desc: '+25% bullet damage',
  upg_fire_rate_up_desc: '-15% fire cooldown',
  upg_speed_up_desc: '+12% movement speed',
  upg_max_hp_desc: '+25 max HP and heal',
  upg_shield_desc: '+30 max HP (Warrior only)',
  upg_crit_chance_desc: '+30% bullet damage (Ranger only)',
  upg_multi_cast_desc: '+1 bullet per shot (Mage only)',
  upg_magnet_desc: '+20 pickup range',
  upg_armor_desc: '+200ms invincibility',

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
