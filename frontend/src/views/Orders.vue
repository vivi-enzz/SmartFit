<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { api, money, date } from '../api';
import { statusLabel } from '../model';
import GarmentArt from '../components/GarmentArt.vue';
import Icon from '../components/Icon.vue';
const route = useRoute(),
  router = useRouter(),
  store = useStore(),
  orders = ref([]),
  order = ref(null),
  error = ref(''),
  loading = ref(true),
  busy = ref(false),
  payOpen = ref(false),
  cancelOpen = ref(false),
  filter = ref('all');
const steps = ['pending_payment', 'paid', 'in_production', 'shipped', 'delivered'];
async function load() {
  loading.value = true;
  error.value = '';
  order.value = null;
  try {
    if (route.params.id) {
      order.value = await api('/orders/' + route.params.id);
      payOpen.value = route.query.pay === '1' && order.value.status === 'pending_payment';
    } else {
      orders.value = (await api('/orders')).orders;
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(() => route.fullPath, load);
async function act(action, body) {
  busy.value = true;
  error.value = '';
  try {
    order.value = await api('/orders/' + order.value.id + '/' + action, {
      method: 'POST',
      body: body || {},
    });
    if (action === 'pay') {
      if (body.outcome === 'success') {
        payOpen.value = false;
        store.commit('toast', { message: '模拟支付成功，未产生真实扣款。' });
      } else
        store.commit('toast', { message: '已模拟支付失败，订单仍待付款，可重试。', error: true });
    }
    if (action === 'cancel') cancelOpen.value = false;
    if (action === 'advance')
      store.commit('toast', { message: '已推进演示进度：' + statusLabel(order.value.status) });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
function payment(outcome) {
  act('pay', { outcome, eventId: crypto.randomUUID() });
}
</script>
<template>
  <div class="page orders-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">FROM OUR STUDIO TO YOU</div>
        <h1>{{ route.params.id ? '每一步，都看得见。' : '我的订单' }}</h1>
        <p>
          {{
            route.params.id
              ? '你的专属作品，正在走向你的日常。'
              : '从一份灵感，到一件属于你的作品。'
          }}
        </p>
      </div>
      <RouterLink :to="route.params.id ? '/orders' : '/studio'" class="secondary"
        >{{ route.params.id ? '全部订单' : '继续定制' }}<Icon name="arrow" :size="17"
      /></RouterLink>
    </div>
    <p v-if="error" class="error-box" role="alert">{{ error }}</p>
    <div v-if="loading" class="loading-state">正在查看定制进度…</div>
    <template v-else-if="order"
      ><div class="order-detail-top">
        <div>
          <span :class="['status-pill', order.status]">{{ statusLabel(order.status) }}</span
          ><span class="order-id">#{{ order.id.slice(0, 8).toUpperCase() }}</span
          ><small>{{ date(order.created) }}</small>
        </div>
        <strong>{{ money(order.amount) }}</strong>
      </div>
      <div class="order-progress" v-if="order.status !== 'cancelled'">
        <div
          v-for="(step, i) in steps"
          :key="step"
          :class="{ done: steps.indexOf(order.status) >= i }"
        >
          <span>{{ steps.indexOf(order.status) > i ? '✓' : String(i + 1).padStart(2, '0') }}</span
          ><b>{{ statusLabel(step) }}</b>
        </div>
      </div>
      <div class="order-detail-grid">
        <section class="panel">
          <h2>你的定制作品</h2>
          <div class="order-garment">
            <GarmentArt :config="order.snapshot.config" />
            <div>
              <h3>{{ order.snapshot.name }}</h3>
              <p>定制配置已锁定 · v{{ order.snapshot.version }}</p>
              <p>颜色 {{ order.snapshot.config.colorHex }}</p>
              <p>
                面料
                {{
                  { linen: '天然亚麻', cotton: '有机棉', silk: '桑蚕丝', wool: '精纺羊毛' }[
                    order.snapshot.config.fabricId
                  ]
                }}
              </p>
              <strong>{{ money(order.amount) }}</strong>
            </div>
          </div>
          <h3>收货信息</h3>
          <p>{{ order.address.name }} · {{ order.address.phone }}</p>
          <p class="muted">{{ order.address.line }}</p>
          <div class="demo-control">
            <span class="pill">演示控制台</span>
            <p>用于展示完整流程；不会扣款、通知工厂或发送短信。</p>
            <div class="button-row">
              <button
                v-if="order.status === 'pending_payment'"
                class="primary"
                :disabled="busy"
                @click="payOpen = true"
              >
                开始模拟支付</button
              ><button
                v-if="order.status === 'pending_payment'"
                class="secondary"
                @click="cancelOpen = true"
              >
                取消订单</button
              ><button
                v-if="['paid', 'in_production', 'shipped'].includes(order.status)"
                class="primary"
                :disabled="busy"
                @click="act('advance')"
              >
                {{
                  busy
                    ? '处理中…'
                    : {
                        paid: '模拟：开始制作',
                        in_production: '模拟：工坊发货',
                        shipped: '模拟：确认签收',
                      }[order.status]
                }}<Icon name="arrow" :size="17" />
              </button>
              <p v-if="order.status === 'delivered'">这段定制之旅已完成，期待你的下一份灵感。</p>
            </div>
            <div v-if="cancelOpen" class="confirm-box">
              <p>确定取消这笔待付款订单？</p>
              <button class="secondary small" @click="cancelOpen = false">继续保留</button>
              <button class="primary small" :disabled="busy" @click="act('cancel')">
                确认取消
              </button>
            </div>
          </div>
        </section>
        <section class="panel timeline-panel">
          <h2>制作与物流动态</h2>
          <ol class="timeline">
            <li v-for="(h, i) in [...order.history].reverse()" :key="i">
              <span></span>
              <div>
                <b>{{ statusLabel(h.status) }}</b>
                <p>{{ h.note }}</p>
                <small>{{ date(h.created) }}</small>
              </div>
            </li>
          </ol>
          <div class="tracking-box">
            <h3><Icon name="box" :size="18" />物流信息 <span class="pill">模拟 AfterShip</span></h3>
            <p v-if="!order.tracking.length" class="muted">作品发货后，将显示演示物流轨迹。</p>
            <div v-for="(t, i) in [...order.tracking].reverse()" :key="i" class="tracking-event">
              <b>{{ t.status }}</b>
              <p>{{ t.location }} · {{ date(t.created) }}</p>
            </div>
          </div>
        </section>
      </div></template
    ><template v-else-if="!route.params.id"
      ><div class="filter-tabs order-filters">
        <button
          v-for="(label, id) in {
            all: '全部订单',
            pending_payment: '待付款',
            active: '制作与配送中',
            delivered: '已签收',
          }"
          :key="id"
          :class="{ selected: filter === id }"
          @click="filter = id"
        >
          {{ label }}
        </button>
      </div>
      <div
        v-if="
          !orders.filter(
            (o) =>
              filter === 'all' ||
              (filter === 'active' && ['paid', 'in_production', 'shipped'].includes(o.status)) ||
              o.status === filter
          ).length
        "
        class="empty-state"
      >
        <Icon name="box" :size="38" />
        <h2>这里，留给你的下一件作品。</h2>
        <p>开始定制，让灵感成为日常。</p>
        <RouterLink to="/studio" class="primary">去设计一件</RouterLink>
      </div>
      <RouterLink
        v-for="o in orders.filter(
          (o) =>
            filter === 'all' ||
            (filter === 'active' && ['paid', 'in_production', 'shipped'].includes(o.status)) ||
            o.status === filter
        )"
        :key="o.id"
        :to="'/orders/' + o.id"
        class="order-list-item"
        ><div class="order-thumb"><GarmentArt :config="o.snapshot.config" /></div>
        <div class="order-list-copy">
          <small>#{{ o.id.slice(0, 8).toUpperCase() }} · {{ date(o.created) }}</small>
          <h3>{{ o.snapshot.name }}</h3>
          <span :class="['status-pill', o.status]">{{ statusLabel(o.status) }}</span>
        </div>
        <strong>{{ money(o.amount) }}</strong
        ><Icon name="arrow" :size="20" /></RouterLink
    ></template>
    <Teleport to="body"
      ><div
        v-if="payOpen && order"
        class="modal-backdrop"
        @click.self="payOpen = false"
        @keydown.esc="payOpen = false"
      >
        <section class="payment-modal" role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <button
            class="icon-button modal-close"
            aria-label="关闭支付窗口"
            @click="payOpen = false"
          >
            <Icon name="close" />
          </button>
          <div class="pay-icon"><Icon name="lock" :size="28" /></div>
          <span class="pill">TEST MODE · 模拟支付</span>
          <h2 id="pay-title">准备好，迎接你的专属设计。</h2>
          <strong class="pay-total">{{ money(order.amount) }}</strong>
          <p>不需要银行卡，不会发生真实扣款。<br />由服务端记录演示付款事件后更新订单。</p>
          <p v-if="error" class="error-box" role="alert">{{ error }}</p>
          <button class="primary full" :disabled="busy" @click="payment('success')">
            {{ busy ? '处理中…' : '模拟支付成功' }}<Icon name="check" :size="18" /></button
          ><button class="text-button" :disabled="busy" @click="payment('failed')">
            测试支付失败情形
          </button>
        </section>
      </div></Teleport
    >
  </div>
</template>
