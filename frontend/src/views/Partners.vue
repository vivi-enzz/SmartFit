<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../api';
import Icon from '../components/Icon.vue';
const city = ref('Hong Kong'),
  partners = ref([]),
  error = ref(''),
  loading = ref(false),
  selected = ref(''),
  located = ref(false),
  partnerOnly = ref(false),
  detail = ref(null);
async function load(query = '') {
  loading.value = true;
  error.value = '';
  try {
    partners.value = (await api('/partners?city=' + city.value + query)).partners;
    selected.value = partners.value[0]?.id || '';
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
function changeCity() {
  located.value = false;
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
          @mouseenter="selected = p.id"
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
      <div class="partner-map">
        <div class="map-grid"></div>
        <div class="map-river"></div>
        <div class="map-road road-a"></div>
        <div class="map-road road-b"></div>
        <span class="map-area area-a">{{
          $t(
            city === 'Hong Kong'
              ? '中环'
              : city === 'Shanghai'
                ? '静安'
                : city === 'Beijing'
                  ? '朝阳'
                  : '南山'
          )
        }}</span
        ><span class="map-area area-b">{{ $t(city === 'Hong Kong' ? '湾仔' : '城市中心') }}</span
        ><span class="map-water">{{
          $t(city === 'Hong Kong' ? 'VICTORIA HARBOUR' : 'SMARTFIT LOCAL')
        }}</span
        ><button
          v-for="(p, i) in list"
          :key="p.id"
          :class="['map-marker', { selected: selected === p.id }]"
          :style="{ left: ((25 + i * 19) % 70) + 10 + '%', top: ((28 + i * 17) % 65) + 10 + '%' }"
          :aria-label="$t('查看' + p.name)"
          @click="
            selected = p.id;
            detail = p;
          "
        >
          <Icon name="pin" :size="25" /><span>{{ $t(i + 1) }}</span>
        </button>
        <div class="map-disclaimer">
          <Icon name="pin" :size="16" />
          <div>
            <b>{{ $t('服务位置示意图') }}</b>
            <p>{{ $t('非真实地图，不提供导航或实际距离比例。') }}</p>
          </div>
        </div>
      </div>
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
