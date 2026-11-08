<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, money } from '../api';
import { fabrics, labels } from '../../../shared/catalog';
import GarmentArt from '../components/GarmentArt.vue';
import Icon from '../components/Icon.vue';
import { useRouteResource } from '../routeResource';
const route = useRoute(),
  router = useRouter(),
  busy = ref(false),
  consent = ref(false),
  address = reactive({ name: '', phone: '', line: '' });
const { data: design, error } = useRouteResource(
  () => route.params.id,
  async (id) => {
    const [d, m] = await Promise.all([api('/designs/' + id), api('/metrics')]);
    return { ...d, hasMetrics: !!m.metrics };
  }
);
const hasMetrics = computed(() => !!design.value?.hasMetrics);
watch(
  () => route.params.id,
  () => {
    consent.value = false;
  }
);
function checkoutKey(id) {
  const key = 'smartfit-checkout-' + id;
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
  }
  return value;
}
async function checkout() {
  busy.value = true;
  error.value = '';
  try {
    const o = await api('/orders', {
      method: 'POST',
      body: { designId: design.value.id, address, idempotencyKey: checkoutKey(design.value.id) },
    });
    sessionStorage.removeItem('smartfit-checkout-' + route.params.id);
    router.replace('/orders/' + o.id + '?pay=1');
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="page checkout-page">
    <RouterLink to="/designs" class="back-link">← 返回我的设计</RouterLink>
    <div class="page-heading">
      <div>
        <div class="eyebrow">A PIECE, JUST FOR YOU</div>
        <h1>离专属作品，更近一步。</h1>
        <p>确认你的选择，接下来的故事交给我们。</p>
      </div>
      <span class="pill"><Icon name="lock" :size="14" />演示结算</span>
    </div>
    <p v-if="error" class="error-box" role="alert">{{ error }}</p>
    <div v-if="design" class="checkout-layout">
      <form class="panel" @submit.prevent="checkout">
        <h2>收货信息</h2>
        <p class="small-note">此为本地演示，请使用虚构姓名、电话和地址。</p>
        <label class="field"
          >收件人<input
            v-model="address.name"
            required
            maxlength="60"
            placeholder="例如：林女士"
            autocomplete="off" /></label
        ><label class="field"
          >联系电话<input
            v-model="address.phone"
            required
            type="tel"
            minlength="6"
            maxlength="30"
            placeholder="例如：91234567"
            autocomplete="off" /></label
        ><label class="field"
          >详细地址<textarea
            v-model="address.line"
            required
            minlength="5"
            maxlength="250"
            rows="3"
            placeholder="例如：香港中环示例街 10 号"
            autocomplete="off"
          ></textarea>
        </label>
        <div class="measurement-note">
          <Icon name="user" :size="20" />
          <div>
            <b>{{ hasMetrics ? '已保存身体尺寸' : '使用标准参考尺寸' }}</b>
            <p>
              {{
                hasMetrics
                  ? '订单将注明使用已同意保存的量体档案。'
                  : '你尚未保存身体尺寸，可返回工作室完善。'
              }}本次为流程演示，不会提交制造请求。
            </p>
            <RouterLink to="/studio" class="text-button">前往工作室编辑身形 ↗</RouterLink>
          </div>
        </div>
        <label class="checkbox"
          ><input
            v-model="consent"
            required
            type="checkbox"
          />我了解本次为演示订单，后续支付不会产生真实扣款。</label
        ><button class="primary full" :disabled="busy || !consent">
          {{ busy ? '正在创建订单…' : '确认订单，前往模拟支付' }}<Icon name="arrow" :size="17" />
        </button>
      </form>
      <aside class="order-summary panel">
        <div class="checkout-art"><GarmentArt :config="design.config" /></div>
        <small>你的专属定制</small>
        <h2>{{ design.name }}</h2>
        <dl>
          <div>
            <dt>面料</dt>
            <dd>{{ fabrics.find((f) => f.id === design.config.fabricId)?.name }}</dd>
          </div>
          <div>
            <dt>版型</dt>
            <dd>{{ labels[design.config.silhouette] }}</dd>
          </div>
          <div>
            <dt>颜色</dt>
            <dd>
              <span class="tiny-color" :style="{ background: design.config.colorHex }"></span
              >{{ design.config.colorHex }}
            </dd>
          </div>
          <div>
            <dt>运费</dt>
            <dd>免费（演示）</dd>
          </div>
        </dl>
        <div class="total-line">
          <span>订单总额</span><strong>{{ money(design.price) }}</strong>
        </div>
        <p class="small-note">
          服务端会重新核对价格并保存不可变的订单配置。原设计后续的修改不会影响已创建的订单。
        </p>
      </aside>
    </div>
    <div v-else-if="!error" class="loading-state">正在核对设计…</div>
  </div>
</template>
