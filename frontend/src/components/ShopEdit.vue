<script setup>
import { ref, computed } from 'vue';
import { styleProducts } from '../../../shared/shopping';
import { estimatePrice } from '../../../shared/catalog';
import { money } from '../api';
import { locale } from '../i18n';
import Icon from './Icon.vue';
const category = ref('all'),
  selectedColors = ref({});
const products = computed(() =>
  styleProducts.filter((p) => category.value === 'all' || p.config.garmentType === category.value)
);
const colorFor = (p) => selectedColors.value[p.id] || p.config.colorHex;
</script>
<template>
  <section class="section shop-edit" id="shop-edit">
    <div class="section-title">
      <div>
        <div class="eyebrow">THE EVERYDAY WARDROBE</div>
        <h2>{{ $t('喜歡的風格，穿成你的日常。') }}</h2>
        <p>{{ $t('從模特穿搭找靈感，選一款開始自己的訂製。') }}</p>
      </div>
      <RouterLink to="/studio" class="underlink"
        >{{ $t('探索所有設計') }}<Icon name="arrow" :size="17"
      /></RouterLink>
    </div>
    <div class="shop-category-tabs">
      <button
        v-for="[id, title] in [
          ['all', '為你精選'],
          ['top', '上裝與層次'],
          ['dress', '連衣裙'],
          ['hoodie', '連帽衛衣'],
        ]"
        :key="id"
        :class="{ selected: category === id }"
        @click="category = id"
        :aria-pressed="category === id"
      >
        {{ $t(title) }}</button
      ><span>SMARTFIT / STYLE TO SHOP</span>
    </div>
    <div class="shop-product-grid">
      <article v-for="(p, i) in products" :key="p.id" class="shop-product-card">
        <RouterLink
          :to="{ path: '/studio', query: { product: p.id, color: colorFor(p) } }"
          class="shop-product-photo"
          ><img :src="p.imageUrl" :alt="locale === 'en' ? p.nameEn : p.name" loading="lazy" /><span
            class="shop-product-badge"
            >{{ String(i + 1).padStart(2, '0') }} / STYLE EDIT</span
          ><span class="shop-photo-action"
            ><Icon name="plus" :size="18" />{{ $t('試穿與設計') }}</span
          ></RouterLink
        >
        <div class="shop-product-copy">
          <small>SMARTFIT MADE FOR YOU</small
          ><RouterLink :to="{ path: '/studio', query: { product: p.id, color: colorFor(p) } }"
            ><h3>{{ locale === 'en' ? p.nameEn : p.name }}</h3></RouterLink
          >
          <p class="shop-product-price">
            {{ money(estimatePrice(p.config)) }}<span>{{ $t('訂製起') }}</span>
          </p>
          <div class="shop-swatches">
            <button
              v-for="color in p.colors"
              :key="color"
              :style="{ background: color }"
              :class="{ selected: colorFor(p) === color }"
              :aria-label="$t('选择颜色 ' + color)"
              :aria-pressed="colorFor(p) === color"
              @click="selectedColors[p.id] = color"
            ></button
            ><span>+ {{ p.colors.length }} {{ $t('配色') }}</span
            ><RouterLink
              :to="{ path: '/studio', query: { product: p.id, color: colorFor(p) } }"
              :aria-label="$t('試穿與設計')"
              ><Icon name="arrow" :size="17"
            /></RouterLink>
          </div>
        </div>
      </article>
    </div>
    <p class="shop-image-note">
      <Icon name="camera" :size="13" />{{
        $t('模特攝影為風格參考；報價對應可編輯的訂製方案，非照片服裝的精確同款。')
      }}<RouterLink to="/credits">{{ $t('查看來源 ↗') }}</RouterLink>
    </p>
  </section>
</template>
