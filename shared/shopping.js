import { defaults } from './catalog.js';
import credits from '../frontend/public/shopping/credits.json' with { type: 'json' };
const definitions = [
  [
    'weekend-crop',
    '輕鬆短版上衣',
    'Weekend cropped top',
    'top',
    'daily',
    '#D7B9BF',
    'cotton',
    'short',
    'round',
    'classic',
    'none',
  ],
  [
    'city-hoodie',
    '城市連帽衛衣',
    'City everyday hoodie',
    'hoodie',
    'daily',
    '#D6C7AA',
    'cotton',
    'long',
    'round',
    'classic',
    'none',
  ],
  [
    'little-black',
    '日常小黑裙',
    'The everyday black dress',
    'dress',
    'occasion',
    '#252427',
    'cotton',
    'long',
    'v-neck',
    'wrap',
    'none',
  ],
  [
    'white-shirt',
    '純白通勤上衣',
    'The clean white top',
    'top',
    'work',
    '#F4F1EA',
    'linen',
    'long',
    'v-neck',
    'classic',
    'none',
  ],
  [
    'soft-layers',
    '柔調層次套裝',
    'Soft tailored layers',
    'top',
    'work',
    '#C6B9A5',
    'linen',
    'long',
    'round',
    'classic',
    'cropped-jacket',
  ],
  [
    'city-neutral',
    '都會中性色上衣',
    'City neutral top',
    'top',
    'work',
    '#E9E2D5',
    'cotton',
    'short',
    'round',
    'classic',
    'long-vest',
  ],
];
export const styleProducts = definitions.map(
  (
    [
      id,
      name,
      nameEn,
      garmentType,
      category,
      colorHex,
      fabricId,
      sleeve,
      collar,
      construction,
      layer,
    ],
    i
  ) => {
    const photo = credits[i];
    return {
      id,
      name,
      nameEn,
      category,
      imageUrl: '/shopping/' + photo.file,
      colors: [colorHex, '#34363A', '#E9E2D5', '#A1B1A6'],
      config: {
        ...defaults,
        garmentType,
        length: garmentType === 'dress' ? 'midi' : 'short',
        silhouette: garmentType === 'hoodie' ? 'straight' : 'A-line',
        colorHex,
        fabricId,
        sleeve,
        collar,
        construction,
        layer,
        accentColor: '#B7A589',
      },
      credit: {
        source: 'Unsplash',
        sourceUrl: photo.sourcePage,
        author: photo.author,
        license: photo.license,
        asset: photo.file,
      },
    };
  }
);
export function productConfig(id, color) {
  const p = styleProducts.find((p) => p.id === id);
  return p
    ? { ...p.config, ...(/^#[a-f\d]{6}$/i.test(color || '') ? { colorHex: color } : {}) }
    : null;
}
const captions = [
  [
    '短版上衣＋淺色牛仔，週末出門就穿這個比例。',
    'A cropped top with light denim: an easy proportion for the weekend.',
    'OFF DUTY / CITY WALK',
  ],
  [
    '米色外套裡留一點寬鬆，黑褲和球鞋就很好搭。',
    'Room for a relaxed layer. A beige coat, black trousers and everyday sneakers.',
    'LAYER NOTES / UNISEX',
  ],
  [
    '黑色也有很多表情。收腰、長袖，再加一雙喜歡的鞋。',
    'There is more than one way to wear black. A defined waist, long sleeves, your favourite shoes.',
    'DRESS DIARY / BLACK',
  ],
  [
    '白襯衫不用穿得太正式，牛仔和皮帶就能換個心情。',
    'A white shirt does not have to feel formal. Denim and a belt change the mood.',
    'DETAIL STUDY / DENIM',
  ],
  [
    '背影也要有層次：低飽和的米色，讓剪裁說話。',
    'Layers from every angle. Let the tailoring speak in soft beige.',
    'TAILORED / SOFT TONES',
  ],
  [
    '衣櫥裡的中性色，靠腰帶和一點金屬細節就有重點。',
    'Neutrals from your wardrobe, finished with a belt and a little metal detail.',
    'CLOSE UP / CITY DETAILS',
  ],
];
export const dailyEditorial = styleProducts.map((p, i) => ({
  id: 'daily-' + p.id,
  title: p.name,
  caption: captions[i][0],
  captionEn: captions[i][1],
  kicker: captions[i][2],
  category: p.category,
  config: { ...p.config },
  imageUrl: p.imageUrl,
  credit: p.credit,
  editorial: true,
  kind: 'daily',
  curatedAt: '2026-11-09T04:00:00.000Z',
  tags: [p.nameEn, p.category, 'daily', 'everyday', 'editorial', p.config.fabricId],
}));
