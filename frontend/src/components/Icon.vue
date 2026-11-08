<script setup>
defineProps({ name: String, size: { type: Number, default: 20 } });
const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  leaf: 'M20 3C10 2 3 6 4 14s16 7 16-11ZM4 21 15 10',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  bag: 'M5 7h14l2 14H3L5 7ZM8 8V6a4 4 0 0 1 8 0v2',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  share:
    'M18 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM6 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM18 22a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM8.6 10.5l6.8-4M8.6 13.5l6.8 4',
  chat: 'M21 11a8.5 8.5 0 0 1-9 8 10 10 0 0 1-4-.8L3 21l1.7-5A8 8 0 0 1 3 11a9 9 0 0 1 18 0Z',
  rotate: 'M3 10a9 9 0 1 1 1.5 8M3 3v7h7',
  plus: 'M12 5v14M5 12h14',
  box: 'm3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10',
  mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
  lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4',
};
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.spark" />
  </svg>
</template>
