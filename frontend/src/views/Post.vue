<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { api, money, date } from '../api';
import { fabrics, estimatePrice } from '../../../shared/catalog';
import GarmentArt from '../components/GarmentArt.vue';
import Icon from '../components/Icon.vue';
import { locale } from '../i18n';
import { useRouteResource } from '../routeResource';
const route = useRoute(),
  router = useRouter(),
  store = useStore(),
  comment = ref(''),
  busy = ref(false),
  shareUrl = ref('');
const {
  data: post,
  error,
  reload: load,
} = useRouteResource(
  () => route.params.id,
  (id) => api('/posts/' + id)
);
watch(
  () => route.params.id,
  () => {
    comment.value = '';
    shareUrl.value = '';
  }
);
function auth() {
  if (store.state.user) return true;
  router.push({ path: '/account', query: { next: route.fullPath } });
  return false;
}
async function like() {
  if (!auth()) return;
  try {
    Object.assign(post.value, await api('/posts/' + post.value.id + '/like', { method: 'POST' }));
  } catch (e) {
    error.value = e.message;
  }
}
async function send() {
  if (!auth()) return;
  busy.value = true;
  try {
    await api('/posts/' + post.value.id + '/comments', {
      method: 'POST',
      body: { content: comment.value },
    });
    comment.value = '';
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function share() {
  const data = { title: 'SmartFit 穿搭灵感', text: post.value.caption, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(data.url);
      store.commit('toast', { message: '链接已复制，可分享给朋友。' });
    } else shareUrl.value = data.url;
  } catch (e) {
    if (e.name !== 'AbortError') {
      shareUrl.value = data.url;
    }
  }
}
</script>
<template>
  <div class="page">
    <RouterLink to="/community" class="back-link">{{ $t('← 返回穿搭社区') }}</RouterLink>
    <p v-if="error" class="error-box" role="alert">{{ $t(error) }}</p>
    <div v-if="post" class="post-detail">
      <div class="post-detail-art">
        <img
          v-if="post.imageUrl"
          :src="post.imageUrl"
          :alt="$t(post.caption.slice(0, 60))"
        /><GarmentArt v-else :config="post.config" />
      </div>
      <article>
        <div class="author-line">
          <span class="avatar">{{ $t(post.author.slice(0, 1)) }}</span>
          <div>
            <b>{{ $t(post.author) }}</b
            ><small>{{ $t(date(post.created)) }}</small>
          </div>
        </div>
        <div v-if="post.editorial" class="editorial-badge">
          {{ $t('SMARTFIT EDIT · 編輯精選') }}
        </div>
        <h1 class="post-caption">
          {{ $t(locale === 'en' && post.captionEn ? post.captionEn : post.caption) }}
        </h1>
        <p v-if="post.editorial" class="editorial-photo-note">
          {{
            $t(
              '攝影來源：Unsplash。此為編輯靈感選集，非照片人物投稿或購買見證。訂製配置為風格延伸，非照片服裝的精確複製。'
            )
          }}<RouterLink to="/credits">{{ $t('查看來源 ↗') }}</RouterLink>
        </p>
        <div class="post-interactions">
          <button
            :class="['secondary', { liked: post.liked }]"
            :aria-pressed="post.liked"
            @click="like"
          >
            <Icon name="heart" :size="18" />{{ $t(post.likes) }}{{ $t('人喜欢') }}</button
          ><button class="secondary" @click="share">
            <Icon name="share" :size="17" />{{ $t('分享灵感') }}
          </button>
        </div>
        <label v-if="shareUrl" class="field"
          >{{ $t('复制这个链接分享')
          }}<input :value="shareUrl" readonly @focus="$event.target.select()"
        /></label>
        <section class="buy-look">
          <div>
            <small>{{ $t('灵感同款 · 可自由定制') }}</small>
            <h3>
              {{ $t(fabrics.find((f) => f.id === post.config.fabricId)?.name)
              }}{{ $t('· 专属设计') }}
            </h3>
            <strong>{{ $t(money(estimatePrice(post.config))) }}</strong>
          </div>
          <RouterLink :to="{ path: '/studio', query: { look: post.id } }" class="primary small"
            >{{ $t('定制这一套') }}<Icon name="arrow" :size="17"
          /></RouterLink>
        </section>
        <section class="comments">
          <h2>
            {{ $t('聊聊这份灵感') }}<span>{{ $t(post.comments.length) }}</span>
          </h2>
          <form @submit.prevent="send">
            <label class="sr-only" for="comment">{{ $t('评论') }}</label
            ><input
              id="comment"
              v-model="comment"
              maxlength="500"
              required
              :placeholder="$t('说说你的搭配想法…')"
            /><button class="primary small" :disabled="busy || !comment.trim()">
              {{ $t('发送') }}
            </button>
          </form>
          <div v-for="c in post.comments" :key="c.id" class="comment">
            <span class="user-dot">{{ $t(c.author.slice(0, 1)) }}</span>
            <div>
              <b>{{ $t(c.author) }}</b>
              <p>{{ $t(c.content) }}</p>
              <small>{{ $t(date(c.created)) }}</small>
            </div>
          </div>
          <p v-if="!post.comments.length" class="muted">
            {{ $t('还没有评论，来分享第一个想法吧。') }}
          </p>
        </section>
      </article>
    </div>
    <div v-else-if="!error" class="loading-state">{{ $t('正在打开这份灵感…') }}</div>
  </div>
</template>
