export const fabrics = [
  {
    id: 'linen',
    name: '天然亚麻',
    description: '轻盈透气，适合温暖潮湿的日常',
    price: 10000,
    tone: '#c6b6a0',
    season: 'summer',
  },
  {
    id: 'cotton',
    name: '有机棉',
    description: '柔软亲肤，四季都自在',
    price: 0,
    tone: '#eee8d9',
    season: 'all',
  },
  {
    id: 'silk',
    name: '桑蚕丝',
    description: '细腻光泽，为特别时刻而作',
    price: 22000,
    tone: '#d6bac0',
    season: 'summer',
  },
  {
    id: 'wool',
    name: '精纺羊毛',
    description: '温暖垂顺，适合凉爽天气',
    price: 18000,
    tone: '#a69b8c',
    season: 'winter',
  },
];
export const options = {
  garmentType: ['dress', 'top'],
  silhouette: ['A-line', 'straight', 'fitted'],
  collar: ['round', 'v-neck', 'square'],
  sleeve: ['sleeveless', 'short', 'long'],
  length: ['short', 'midi', 'maxi'],
  embroidery: ['none', 'floral', 'initials'],
};
export const labels = {
  dress: '连衣裙',
  top: '上装',
  'A-line': 'A 字廓形',
  straight: '直筒',
  fitted: '修身',
  round: '圆领',
  'v-neck': 'V 领',
  square: '方领',
  sleeveless: '无袖',
  short: '短款',
  long: '长袖',
  midi: '中长款',
  maxi: '长款',
  none: '无刺绣',
  floral: '花卉刺绣',
  initials: '字母刺绣',
};
export const defaults = {
  garmentType: 'dress',
  silhouette: 'A-line',
  collar: 'round',
  sleeve: 'short',
  length: 'midi',
  fabricId: 'linen',
  colorHex: '#8C9B82',
  embroidery: 'none',
};
export const metricRanges = {
  height: [140, 200],
  bust: [65, 140],
  waist: [50, 130],
  hip: [70, 150],
};
export const metricLabels = { height: '身高', bust: '胸围', waist: '腰围', hip: '臀围' };
export function validMetrics(m) {
  return (
    !!m &&
    Object.entries(metricRanges).every(
      ([k, [min, max]]) =>
        typeof m[k] === 'number' && Number.isFinite(m[k]) && m[k] >= min && m[k] <= max
    )
  );
}
export function validateConfig(c) {
  if (!c || typeof c !== 'object') return '请选择服装参数';
  for (const [k, list] of Object.entries(options))
    if (!list.includes(c[k])) return `不支持的${k}选项`;
  if (!fabrics.some((f) => f.id === c.fabricId)) return '请选择有效面料';
  if (!/^#[0-9a-f]{6}$/i.test(c.colorHex || '')) return '颜色应为六位十六进制色值';
  if (c.garmentType === 'top' && c.length !== 'short') return '上装仅支持短款衣长';
  if (c.fabricId === 'wool' && c.sleeve === 'sleeveless') return '羊毛面料暂不支持无袖款式';
  return null;
}
export function estimatePrice(c) {
  return (
    (c.garmentType === 'top' ? 49800 : 79800) +
    (fabrics.find((f) => f.id === c.fabricId)?.price || 0) +
    (c.embroidery && c.embroidery !== 'none' ? 8000 : 0) +
    (c.length === 'maxi' ? 6000 : 0)
  );
}
export const statusLabels = {
  pending_payment: '待付款',
  paid: '已付款',
  in_production: '制作中',
  shipped: '已发货',
  delivered: '已签收',
  cancelled: '已取消',
};
export const statusLabel = (s) => statusLabels[s] || s;
