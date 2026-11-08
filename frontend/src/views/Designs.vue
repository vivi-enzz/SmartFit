<script setup>
import { ref, onMounted } from 'vue';
import { api, money, date } from '../api';
import GarmentArt from '../components/GarmentArt.vue';
import Icon from '../components/Icon.vue';
const designs = ref([]),
  loading = ref(true),
  error = ref(''),
  deleting = ref(''),
  busy = ref(false);
async function load() {
  try {
    designs.value = (await api('/designs')).designs;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
async function remove(id) {
  busy.value = true;
  try {
    await api('/designs/' + id, { method: 'DELETE' });
    designs.value = designs.value.filter((d) => d.id !== id);
    deleting.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">YOUR PERSONAL COLLECTION</div>
        <h1>{{ $t('我的设计') }}</h1>
        <p>{{ $t('每一个被保存的灵感，都值得成为一件衣服。') }}</p>
      </div>
      <RouterLink to="/studio" class="primary"
        ><Icon name="plus" :size="17" />{{ $t('新建设计') }}</RouterLink
      >
    </div>
    <div v-if="error" class="error-box" role="alert">
      {{ $t(error) }} <button @click="load">{{ $t('重试') }}</button>
    </div>
    <div v-if="loading" class="loading-state">{{ $t('正在打开你的灵感衣橱…') }}</div>
    <div v-else-if="!designs.length" class="empty-state">
      <Icon name="spark" :size="38" />
      <h2>{{ $t('第一件作品，从这里开始。') }}</h2>
      <p>{{ $t('挑选面料与颜色，设计只属于你的那一件。') }}</p>
      <RouterLink to="/studio" class="primary"
        >{{ $t('进入定制工作室') }}<Icon name="arrow" :size="17"
      /></RouterLink>
    </div>
    <div v-else class="design-grid">
      <article v-for="d in designs" :key="d.id" class="design-card">
        <RouterLink :to="'/studio/' + d.id" class="design-preview"
          ><GarmentArt :config="d.config" /><span class="pill"
            >{{ $t('草稿 · v') }}{{ $t(d.version) }}</span
          ></RouterLink
        >
        <div class="design-info">
          <small>{{ $t(date(d.created)) }}</small>
          <h3>{{ $t(d.name) }}</h3>
          <strong>{{ $t(money(d.price)) }}</strong>
          <div class="design-actions">
            <RouterLink :to="'/studio/' + d.id" class="secondary small">{{
              $t('继续设计')
            }}</RouterLink
            ><RouterLink :to="'/checkout/' + d.id" class="primary small">{{
              $t('定制下单')
            }}</RouterLink>
          </div>
          <div class="design-bottom">
            <RouterLink :to="{ path: '/community', query: { compose: d.id } }">{{
              $t('分享设计 ↗')
            }}</RouterLink
            ><button class="text-button danger" @click="deleting = d.id">{{ $t('删除') }}</button>
          </div>
          <div v-if="deleting === d.id" class="confirm-box">
            <p>{{ $t('删除设计？已下单的配置仍会保留。') }}</p>
            <button class="secondary small" @click="deleting = ''">{{ $t('保留') }}</button>
            <button class="primary small" :disabled="busy" @click="remove(d.id)">
              {{ $t('确认删除') }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
