<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../api';
import Icon from '../components/Icon.vue';
import PartnerMap from '../components/PartnerMap.vue';
const city = ref('Hong Kong'),
  partners = ref([]),
  error = ref(''),
  loading = ref(false),
  selected = ref(''),
  located = ref(false),
  partnerOnly = ref(false),
  detail = ref(null),
  userPosition = ref(null);
let loadGeneration = 0;
async function load(query = '') {
  const current = ++loadGeneration;
  loading.value = true;
  error.value = '';
  partners.value = [];
  detail.value = null;
  try {
    const result = await api('/partners?city=' + city.value + query);
    if (current !== loadGeneration) return;
    partners.value = result.partners;
    selected.value = partners.value[0]?.id || '';
  } catch (e) {
    if (current === loadGeneration) error.value = e.message;
  } finally {
    if (current === loadGeneration) loading.value = false;
  }
}
function changeCity() {
  located.value = false;
  userPosition.value = null;
  load();
}
function locate() {
  error.value = '';
  if (!navigator.geolocation) {
    error.value = '当前浏览器不支持定位，请手动选择城市。';
    return;
  }
  loading.value = true;
  navigator.geolocation.getCurrentPosition(
    (p) => {
      located.value = true;
      userPosition.value = [p.coords.latitude, p.coords.longitude];
      load('&lat=' + p.coords.latitude + '&lon=' + p.coords.longitude);
    },
    () => {
      error.value = '未取得位置权限，已保留手动城市选择。';
      loading.value = false;
    },
    { enableHighAccuracy: false, timeout: 8000 }
  );
}
onMounted(() => load());
const list = computed(() => partners.value.filter((p) => !partnerOnly.value || p.partner));
</script>
<template>
  <div class="page partners-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">A HUMAN TOUCH, NEAR YOU</div>
        <h1>{{ $t('好的合身，也可以从见面开始。') }}</h1>
        <p>{{ $t('发现身边的量体与面料服务，让定制多一份安心。') }}</p>
      </div>
    </div>
    <div class="partners-toolbar">
      <label class="city-select"
        ><Icon name="pin" :size="17" /><select
          v-model="city"
          :aria-label="$t('选择服务城市')"
          @change="changeCity"
        >
          <option value="Hong Kong">{{ $t('香港') }}</option>
          <option value="Shanghai">{{ $t('上海') }}</option>
          <option value="Beijing">{{ $t('北京') }}</option>
          <option value="Shenzhen">{{ $t('深圳') }}</option>
        </select></label
      ><button class="secondary small" :disabled="loading" @click="locate">
        <Icon name="pin" :size="16" />{{ $t('使用我的位置') }}</button
      ><label class="checkbox"
        ><input v-model="partnerOnly" type="checkbox" />{{ $t('仅看演示合作商') }}</label
      ><span class="demo-label">{{ $t('全部为虚构示例店铺 · 无真实预约') }}</span>
    </div>
    <p v-if="error" class="error-box" role="alert">{{ $t(error) }}</p>
    <div class="partners-layout">
      <section class="partner-list">
        <h2>
          {{ $t(located ? '附近 5 公里' : '所选城市') }}
          <span>{{ $t(list.length) }}{{ $t('家示例服务') }}</span>
        </h2>
        <p v-if="loading" class="loading-state">{{ $t('正在寻找服务…') }}</p>
        <div v-else-if="!list.length" class="empty-state">
          <h3>{{ $t('这里暂时没有示例店铺。') }}</h3>
          <p>{{ $t('可手动切换至香港体验完整示例。') }}</p>
        </div>
        <article
          v-for="(p, i) in list"
          :key="p.id"
          :class="['partner-card', { selected: selected === p.id }]"
          @click="selected = p.id"
        >
          <div class="partner-top">
            <span class="partner-number">{{ $t(String(i + 1).padStart(2, '0')) }}</span>
            <div>
              <h3>{{ $t(p.name) }}</h3>
              <span :class="['partner-badge', { general: !p.partner }]">{{
                $t(p.partner ? 'SmartFit 演示合作商' : '普通示例店铺')
              }}</span>
            </div>
            <small v-if="p.distance !== undefined">{{ $t(p.distance) }} km</small>
          </div>
          <p><Icon name="pin" :size="14" />{{ $t(p.address) }}</p>
          <div class="service-tags">
            <span v-for="s in p.services" :key="s">{{ $t(s) }}</span>
          </div>
          <div class="partner-bottom">
            <b>{{ $t(p.price) }}</b
            ><button
              class="text-button"
              @click="
                selected = p.id;
                detail = p;
              "
            >
              {{ $t('查看服务信息 ↗') }}
            </button>
          </div>
        </article>
      </section>
      <PartnerMap
        :partners="list"
        :city="city"
        :selected="selected"
        :user-position="userPosition"
        @select="
          (id) => {
            selected = id;
            detail = list.find((p) => p.id === id) || null;
          }
        "
      />
    </div>
    <div v-if="detail" class="panel service-detail">
      <button class="icon-button" :aria-label="$t('关闭服务详情')" @click="detail = null">
        <Icon name="close" />
      </button>
      <div class="eyebrow">PARTNER DETAILS · DEMO</div>
      <h2>{{ $t(detail.name) }}</h2>
      <p>{{ $t(detail.services.join(' · ')) }}</p>
      <p>{{ $t(detail.address) }} · {{ $t(detail.price) }}</p>
      <p class="muted">
        {{ $t(detail.phone)
        }}{{ $t('。此处展示的是线下服务发现流程；店铺信息不代表真实合作关系。') }}
      </p>
    </div>
  </div>
</template>
