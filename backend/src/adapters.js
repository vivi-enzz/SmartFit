import { fabrics } from './catalog.js';
export const providers = [
  { name: 'OpenWeather', purpose: '天气与面料推荐', replacement: '本地城市天气场景' },
  { name: 'Cloudinary', purpose: '图片处理', replacement: '本地校验、压缩和存储' },
  { name: 'Facebook Graph', purpose: '外部分享', replacement: '浏览器分享或复制链接' },
  { name: 'Google Maps Places', purpose: '附近服务', replacement: '虚构店铺与位置示意' },
  { name: 'Stripe', purpose: '支付', replacement: '服务端模拟支付事件' },
  { name: 'AfterShip', purpose: '物流', replacement: '手动推进演示时间线' },
  { name: 'Algolia', purpose: '搜索', replacement: '本地数据库搜索' },
  { name: 'Twilio', purpose: '通知', replacement: '应用内模拟通知' },
  { name: 'OpenAI', purpose: '文案', replacement: '可编辑的本地模板' },
].map((p) => ({ ...p, mode: 'demo' }));
const cities = {
  'Hong Kong': { name: '香港', temperature: 26, condition: '多云 · 潮湿', humidity: 78 },
  Shanghai: { name: '上海', temperature: 19, condition: '晴间多云', humidity: 62 },
  Beijing: { name: '北京', temperature: 12, condition: '晴朗 · 微凉', humidity: 41 },
  Shenzhen: { name: '深圳', temperature: 28, condition: '温暖 · 潮湿', humidity: 76 },
};
const cache = new Map();
export function recommendations(city = 'Hong Kong', failure = false) {
  const name = Object.hasOwn(cities, city) ? city : 'Hong Kong';
  if (!failure && cache.has(name) && cache.get(name).expires > Date.now())
    return cache.get(name).data;
  const weather = { ...cities[name], city: name };
  const sorted = [...fabrics].sort((a, b) =>
    weather.temperature < 18
      ? a.id === 'wool'
        ? -1
        : b.id === 'wool'
          ? 1
          : 0
      : a.id === 'linen'
        ? -1
        : b.id === 'linen'
          ? 1
          : 0
  );
  const data = {
    source: failure ? 'fallback' : 'demo',
    weather: failure ? null : weather,
    city: name,
    fabrics: sorted.slice(0, 3),
    message: failure ? '天气服务不可用，为你展示日常精选面料。' : '演示天气数据，非实时气象信息',
  };
  if (!failure) cache.set(name, { data, expires: Date.now() + 1800000 });
  return data;
}
export function caption(config, failure = false, language = 'zh-Hant') {
  const names =
    language === 'en'
      ? {
          linen: 'natural linen',
          cotton: 'organic cotton',
          silk: 'mulberry silk',
          wool: 'fine wool',
        }
      : { linen: '天然亞麻', cotton: '有機棉', silk: '桑蠶絲', wool: '精紡羊毛' };
  const f = names[config?.fabricId] || (language === 'en' ? 'soft fabric' : '舒適面料');
  return {
    caption:
      language === 'en'
        ? `My style, my rules. Turning ${f} and a favourite colour into an everyday look that feels like me. #SmartFit #OOTD`
        : `今天的靈感，由自己定義。用${f}，把喜歡的顏色穿成日常。每一寸合身，都是專屬於我的風格。 #SmartFit #今日穿搭`,
    source: failure ? 'fallback' : 'demo',
    provider: '本地文案模板',
  };
}
const shops = [
  {
    id: 'p1',
    name: '禾里量体工作室',
    area: '中环',
    city: 'Hong Kong',
    lat: 22.2815,
    lon: 114.1578,
    partner: true,
    services: ['专业量体', '面料体验'],
    address: '中环 · 示例店铺 A',
    phone: '演示店铺，不提供真实预约',
    price: 'HK$ 120 起',
  },
  {
    id: 'p2',
    name: '针与线裁缝坊',
    area: '湾仔',
    city: 'Hong Kong',
    lat: 22.277,
    lon: 114.172,
    partner: true,
    services: ['专业量体', '成衣修改'],
    address: '湾仔 · 示例店铺 B',
    phone: '演示店铺，不提供真实预约',
    price: 'HK$ 100 起',
  },
  {
    id: 'p3',
    name: '布间面料空间',
    area: '尖沙咀',
    city: 'Hong Kong',
    lat: 22.298,
    lon: 114.172,
    partner: false,
    services: ['面料体验'],
    address: '尖沙咀 · 示例店铺 C',
    phone: '演示店铺，不提供真实预约',
    price: '到店咨询',
  },
  ...['Shanghai', 'Beijing', 'Shenzhen'].map((city, i) => ({
    id: 'p' + (i + 4),
    name: ['织间量体空间', '合身裁缝工作室', '一寸服装工作室'][i],
    city,
    area: ['静安', '朝阳', '南山'][i],
    lat: [31.23, 39.92, 22.53][i],
    lon: [121.46, 116.44, 113.93][i],
    partner: true,
    services: ['专业量体', '面料体验'],
    address: '演示区域 · 示例店铺',
    phone: '演示店铺，不提供真实预约',
    price: 'HK$ 120 起',
  })),
];
export function nearby({ city = 'Hong Kong', lat, lon }) {
  let list = shops.filter((p) => p.city === city);
  if (lat !== undefined) {
    const rad = (n) => (n * Math.PI) / 180;
    list = shops
      .map((p) => {
        const a =
          Math.sin(rad(p.lat - lat) / 2) ** 2 +
          Math.cos(rad(lat)) * Math.cos(rad(p.lat)) * Math.sin(rad(p.lon - lon) / 2) ** 2;
        return {
          ...p,
          distance: Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100,
        };
      })
      .filter((p) => p.distance <= 5)
      .sort((a, b) => a.distance - b.distance);
  }
  return { source: 'demo', partners: list };
}
