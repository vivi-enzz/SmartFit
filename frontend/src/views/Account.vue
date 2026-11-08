<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { api, date } from '../api';
import Icon from '../components/Icon.vue';
const store = useStore(),
  route = useRoute(),
  router = useRouter(),
  mode = ref('login'),
  busy = ref(false),
  error = ref(''),
  confirmDelete = ref(false),
  notices = ref([]),
  hasMetrics = ref(false);
const form = reactive({ email: '', password: '', name: '' });
function target() {
  const n = route.query.next;
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/designs';
}
async function loadPrivate() {
  if (!store.state.user) return;
  try {
    hasMetrics.value = !!(await api('/metrics')).metrics;
    notices.value = (await api('/notifications')).notifications;
  } catch (e) {
    error.value = e.message;
  }
}
onMounted(loadPrivate);
async function submit(demo = false) {
  busy.value = true;
  error.value = '';
  try {
    if (demo) await store.dispatch('demo');
    else {
      const r = await api('/auth/' + (mode.value === 'login' ? 'login' : 'register'), {
        method: 'POST',
        body: form,
      });
      store.commit('user', r.user);
    }
    store.commit('toast', {
      message: demo ? '已开启独立的演示账户。' : '欢迎回来，开始创造你的风格吧。',
    });
    router.replace(target());
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function logout() {
  busy.value = true;
  try {
    await store.dispatch('logout');
    router.replace('/');
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function removeMetrics() {
  busy.value = true;
  try {
    await api('/metrics', { method: 'DELETE' });
    hasMetrics.value = false;
    confirmDelete.value = false;
    store.commit('toast', { message: '已删除保存的身体尺寸。' });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function exportData() {
  try {
    const data = await api('/account/export');
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartfit-personal-data.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    error.value = e.message;
  }
}
</script>
<template>
  <div v-if="!store.state.user" class="page auth-page">
    <aside class="auth-story">
      <div class="eyebrow">A SPACE FOR YOUR STYLE</div>
      <h1>风格的起点，<br />是你自己。</h1>
      <p>保存每一次灵感，让每一件衣服<br />都成为你的表达。</p>
      <div class="auth-lines"><span></span><span></span><span></span></div>
      <small>SMARTFIT · MADE FOR YOU</small>
    </aside>
    <section class="auth-form">
      <div class="eyebrow">WELCOME TO SMARTFIT</div>
      <h2>{{ mode === 'login' ? '很高兴遇见你。' : '开始你的定制之旅。' }}</h2>
      <p>登录后保存设计、分享灵感与查看订单。</p>
      <div class="tabs">
        <button
          :class="{ selected: mode === 'login' }"
          @click="
            mode = 'login';
            error = '';
          "
        >
          登录</button
        ><button
          :class="{ selected: mode === 'register' }"
          @click="
            mode = 'register';
            error = '';
          "
        >
          注册账户
        </button>
      </div>
      <form @submit.prevent="submit(false)">
        <label v-if="mode === 'register'" class="field"
          >你的名字<input
            v-model="form.name"
            required
            maxlength="40"
            autocomplete="name"
            placeholder="希望我们如何称呼你" /></label
        ><label class="field"
          >邮箱<input
            v-model="form.email"
            type="email"
            required
            maxlength="254"
            autocomplete="email"
            placeholder="you@example.com" /></label
        ><label class="field"
          >密码<input
            v-model="form.password"
            type="password"
            :minlength="mode === 'register' ? 10 : 1"
            maxlength="72"
            required
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
            placeholder="注册时至少 10 个字符"
        /></label>
        <p v-if="error" class="error-box" role="alert">{{ error }}</p>
        <button class="primary full" :disabled="busy">
          {{ busy ? '请稍候…' : mode === 'login' ? '登录 SmartFit' : '创建账户'
          }}<Icon name="arrow" :size="17" />
        </button>
      </form>
      <div class="or-divider">或先体验一下</div>
      <button class="secondary full" :disabled="busy" @click="submit(true)">
        <Icon name="spark" :size="17" />一键体验完整演示
      </button>
      <p class="small-note">
        每次体验都会创建独立账户。无需填写真实个人信息。演示账户请在退出前导出需要的数据。
      </p>
    </section>
  </div>
  <div v-else class="page account-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">YOUR SMARTFIT SPACE</div>
        <h1>你好，{{ store.state.user.name }}。</h1>
        <p>{{ store.state.user.demo ? '这是你的独立演示空间。' : '欢迎回到你的风格空间。' }}</p>
      </div>
      <button class="secondary" :disabled="busy" @click="logout">退出登录</button>
    </div>
    <div class="account-grid">
      <section class="panel">
        <h2>我的创作与订单</h2>
        <RouterLink to="/designs" class="account-link"
          ><Icon name="spark" />我的设计<Icon name="arrow" :size="17" /></RouterLink
        ><RouterLink to="/orders" class="account-link"
          ><Icon name="box" />我的订单<Icon name="arrow" :size="17" /></RouterLink
        ><RouterLink to="/studio" class="account-link"
          ><Icon name="user" />编辑我的身形<Icon name="arrow" :size="17"
        /></RouterLink>
      </section>
      <section class="panel">
        <h2>数据由你掌握</h2>
        <p class="muted">
          {{
            hasMetrics ? '你已加密保存身体尺寸，可随时删除。' : '尚未保存身体尺寸。'
          }}导出包含你的设计、订单及社区互动。
        </p>
        <div class="stack">
          <button class="secondary" @click="exportData">导出我的数据</button
          ><button v-if="hasMetrics" class="text-button danger" @click="confirmDelete = true">
            删除身体尺寸
          </button>
        </div>
        <div v-if="confirmDelete" class="confirm-box">
          <p>确认删除已保存的身体尺寸？此操作无法撤销。</p>
          <button class="secondary small" @click="confirmDelete = false">保留</button>
          <button class="primary small" :disabled="busy" @click="removeMetrics">确认删除</button>
        </div>
      </section>
      <section class="panel notifications">
        <h2>订单动态 <span class="pill">模拟通知</span></h2>
        <div v-for="n in notices" :key="n.id" class="notice-item">
          <Icon name="mail" />
          <div>
            <RouterLink :to="'/orders/' + n.order_id">{{ n.text }}</RouterLink
            ><small>{{ date(n.created) }}</small>
          </div>
        </div>
        <p v-if="!notices.length" class="muted">下单后，制作和物流动态会出现在这里。</p>
      </section>
    </div>
    <p v-if="error" class="error-box" role="alert">{{ error }}</p>
  </div>
</template>
