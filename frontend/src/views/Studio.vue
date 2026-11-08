<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { api, money } from '../api';
import {
  defaults,
  options,
  labels,
  fabrics,
  metricRanges,
  metricLabels,
  validMetrics,
  validateConfig,
  estimatePrice,
} from '../../../shared/catalog';
import FittingRoom from '../components/FittingRoom.vue';
import Icon from '../components/Icon.vue';
const store = useStore(),
  route = useRoute(),
  router = useRouter();
const config = reactive({ ...defaults }),
  metrics = reactive({ height: 168, bust: 88, waist: 68, hip: 94 }),
  name = ref('我的自在亚麻裙'),
  consent = ref(false),
  tab = ref('design'),
  busy = ref(false),
  error = ref(''),
  savedId = ref('');
const colors = [
  '#8C9B82',
  '#D8B4A6',
  '#B7C5D3',
  '#73566D',
  '#E9DFC9',
  '#343F3A',
  '#B56851',
  '#FFFFFF',
];
const fieldLabels = {
  garmentType: '服装类型',
  silhouette: '廓形',
  collar: '领型',
  sleeve: '袖型',
  length: '衣长',
  embroidery: '刺绣',
};
const price = computed(() => estimatePrice(config));
const invalid = computed(() => validateConfig(config));
function allowed(k, v) {
  return !validateConfig({ ...config, [k]: v });
}
watch(
  () => config.garmentType,
  (v) => {
    if (v === 'top') config.length = 'short';
    else if (config.length === 'short') config.length = 'midi';
  }
);
watch(
  () => config.fabricId,
  (v) => {
    if (v === 'wool' && config.sleeve === 'sleeveless') config.sleeve = 'short';
  }
);
async function init() {
  error.value = '';
  savedId.value = '';
  Object.assign(config, defaults);
  if (route.query.fabric && fabrics.some((f) => f.id === route.query.fabric))
    config.fabricId = route.query.fabric;
  if (/^#[a-f0-9]{6}$/i.test(route.query.color || '')) config.colorHex = route.query.color;
  if (route.query.occasion === 'work') {
    config.garmentType = 'top';
    config.length = 'short';
    config.collar = 'v-neck';
  }
  if (route.query.occasion === 'occasion') {
    config.length = 'maxi';
    config.sleeve = 'sleeveless';
  }
  if (route.query.look) {
    try {
      const p = await api('/posts/' + route.query.look);
      Object.assign(config, p.config);
      name.value = '来自社区的灵感';
    } catch (e) {
      error.value = e.message;
    }
  }
  if (route.params.id) {
    try {
      const d = await api('/designs/' + route.params.id);
      Object.assign(config, d.config);
      name.value = d.name;
      savedId.value = d.id;
    } catch (e) {
      error.value = e.message;
    }
  }
  if (store.state.user) {
    try {
      const m = await api('/metrics');
      if (m.metrics) {
        Object.assign(metrics, m.metrics);
        consent.value = true;
      }
    } catch (e) {
      error.value = e.message;
    }
  }
}
onMounted(init);
watch(() => route.fullPath, init);
async function save(checkout = false) {
  if (!store.state.user) {
    store.commit('toast', { message: '请先登录，工作室配置将通过浏览器会话暂存。' });
    sessionStorage.setItem(
      'smartfit-draft',
      JSON.stringify({ config: { ...config }, metrics: { ...metrics }, name: name.value })
    );
    return router.push({ path: '/account', query: { next: route.fullPath } });
  }
  if (invalid.value) {
    error.value = invalid.value;
    return;
  }
  if (!name.value.trim()) {
    error.value = '请填写设计名称';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const d = await api(savedId.value ? '/designs/' + savedId.value : '/designs', {
      method: savedId.value ? 'PUT' : 'POST',
      body: { name: name.value, config },
    });
    savedId.value = d.id;
    store.commit('toast', { message: '设计已保存，可在“我的设计”中继续创作。' });
    if (checkout) router.push('/checkout/' + d.id);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function saveMetrics() {
  if (!store.state.user) {
    error.value = '请先登录再保存身体数据。';
    return;
  }
  if (!consent.value || !validMetrics(metrics)) {
    error.value = '请填写有效尺寸，并同意加密保存。';
    return;
  }
  busy.value = true;
  try {
    await api('/metrics', { method: 'PUT', body: { metrics, consent: true } });
    store.commit('toast', { message: '身体尺寸已加密保存。' });
    error.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
onMounted(() => {
  const raw = sessionStorage.getItem('smartfit-draft');
  if (raw && !route.params.id && !route.query.look) {
    try {
      const d = JSON.parse(raw);
      Object.assign(config, d.config);
      Object.assign(metrics, d.metrics);
      name.value = d.name;
    } catch {}
    sessionStorage.removeItem('smartfit-draft');
  }
});
</script>
<template>
  <div class="page studio-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">THE CUSTOM STUDIO</div>
        <h1>{{ $t('把灵感，穿在身上。') }}</h1>
        <p>{{ $t('每一个细节，都由你决定。') }}</p>
      </div>
      <RouterLink to="/designs" class="secondary"
        >{{ $t('我的设计') }}<Icon name="arrow" :size="16"
      /></RouterLink>
    </div>
    <div class="studio-layout">
      <FittingRoom :config="config" :metrics="metrics" />
      <section class="studio-panel">
        <div class="tabs" :aria-label="$t('定制面板')">
          <button :class="{ selected: tab === 'design' }" @click="tab = 'design'">
            {{ $t('01 服装设计') }}</button
          ><button :class="{ selected: tab === 'body' }" @click="tab = 'body'">
            {{ $t('02 我的身形') }}
          </button>
        </div>
        <div v-show="tab === 'design'">
          <label class="field"
            >{{ $t('设计名称')
            }}<input v-model="name" maxlength="60" :placeholder="$t('为这件作品起个名字')"
          /></label>
          <div
            v-for="key in ['garmentType', 'silhouette', 'collar', 'sleeve', 'length']"
            :key="key"
            class="option-field"
          >
            <span>{{ $t(fieldLabels[key]) }}</span>
            <div class="option-buttons">
              <button
                v-for="v in options[key]"
                :key="v"
                :class="{ selected: config[key] === v }"
                :disabled="key !== 'garmentType' && !allowed(key, v)"
                :aria-pressed="config[key] === v"
                @click="config[key] = v"
              >
                {{ $t(key === 'sleeve' && v === 'short' ? '短袖' : labels[v]) }}
              </button>
            </div>
          </div>
          <div class="option-field">
            <span
              >{{ $t('面料') }}<small>{{ $t('触感与纹理的选择') }}</small></span
            >
            <div class="fabric-options">
              <button
                v-for="f in fabrics"
                :key="f.id"
                :class="{ selected: config.fabricId === f.id }"
                @click="config.fabricId = f.id"
              >
                <span class="fabric-swatch" :style="{ backgroundColor: f.tone }"></span
                ><span
                  >{{ $t(f.name)
                  }}<small>{{ $t(f.price ? '+ ' + money(f.price) : '基础面料') }}</small></span
                ><Icon v-if="config.fabricId === f.id" name="check" :size="15" />
              </button>
            </div>
          </div>
          <div class="option-field">
            <span
              >{{ $t('颜色') }}<small>{{ $t(config.colorHex) }}</small></span
            >
            <div class="color-options">
              <button
                v-for="c in colors"
                :key="c"
                :style="{ background: c }"
                :class="{ selected: config.colorHex.toUpperCase() === c }"
                :aria-label="$t('选择颜色 ' + c)"
                :aria-pressed="config.colorHex.toUpperCase() === c"
                @click="config.colorHex = c"
              >
                <Icon
                  v-if="config.colorHex.toUpperCase() === c"
                  name="check"
                  :size="16"
                  :style="{
                    color: ['#343F3A', '#73566D', '#B56851'].includes(c) ? 'white' : '#263d30',
                  }"
                /></button
              ><label class="custom-color" :title="$t('自定义颜色')"
                ><input
                  v-model="config.colorHex"
                  type="color"
                  :aria-label="$t('自定义颜色')" /><Icon name="plus" :size="18"
              /></label>
            </div>
          </div>
          <div class="option-field">
            <span>{{ $t('专属细节') }}</span>
            <div class="option-buttons">
              <button
                v-for="v in options.embroidery"
                :key="v"
                :class="{ selected: config.embroidery === v }"
                @click="config.embroidery = v"
              >
                {{ $t(labels[v]) }}
              </button>
            </div>
          </div>
        </div>
        <div v-show="tab === 'body'" class="body-panel">
          <h3>{{ $t('每一寸，都有自己的答案。') }}</h3>
          <p>
            {{ $t('输入尺寸可调整预览比例。身体数据只有在你同意并点击保存后才会传到服务器。') }}
          </p>
          <label v-for="(range, k) in metricRanges" :key="k" class="field"
            >{{ $t(metricLabels[k]) }} <small>{{ $t(range[0]) }}–{{ $t(range[1]) }} cm</small>
            <div class="metric-input">
              <input
                v-model.number="metrics[k]"
                type="number"
                :min="range[0]"
                :max="range[1]"
                step="1"
              /><span>cm</span>
            </div></label
          ><label class="checkbox"
            ><input v-model="consent" type="checkbox" />{{
              $t('我同意加密保存身体尺寸，用于我的定制体验。')
            }}</label
          ><button
            class="secondary full"
            :disabled="busy || !consent || !validMetrics(metrics)"
            @click="saveMetrics"
          >
            <Icon name="lock" :size="16" />{{ $t('加密保存尺寸') }}
          </button>
          <p class="small-note">
            {{ $t('可在账户页删除或导出数据。当前模型用于造型参考，不提供真实合体预测。') }}
          </p>
        </div>
        <div v-if="invalid || error" class="error-box" role="alert">{{ $t(error || invalid) }}</div>
        <div class="studio-summary">
          <div>
            <small>{{ $t('专属定制报价') }}</small
            ><strong>{{ $t(money(price)) }}</strong
            ><span>{{ $t('含面料与所选细节 · 免运费（演示）') }}</span>
          </div>
          <div class="summary-buttons">
            <button class="secondary" :disabled="busy || !!invalid" @click="save(false)">
              {{ $t('保存设计') }}</button
            ><button class="primary" :disabled="busy || !!invalid" @click="save(true)">
              {{ $t(busy ? '正在保存…' : '定制这一件') }}<Icon name="arrow" :size="17" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
