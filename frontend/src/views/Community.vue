<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { locale } from '../i18n';
import PostCard from '../components/PostCard.vue';
import GarmentArt from '../components/GarmentArt.vue';
import Icon from '../components/Icon.vue';
import IdolSpotlight from '../components/IdolSpotlight.vue';
import { defaults } from '../../../shared/catalog';
const store = useStore(),
  route = useRoute(),
  router = useRouter(),
  posts = ref([]),
  category = ref(
    ['daily', 'work', 'occasion'].includes(route.query.category) ? route.query.category : 'all'
  ),
  q = ref(route.query.q || ''),
  loading = ref(true),
  error = ref(''),
  compose = ref(false),
  busy = ref(false),
  designs = ref([]),
  uploading = ref(false),
  aiBusy = ref(false),
  savedOnly = ref(route.query.saved === '1'),
  contentType = ref('all');
const visiblePosts = computed(() =>
  posts.value.filter(
    (p) =>
      (!savedOnly.value || (store.state.savedLooks || []).includes(p.id)) &&
      (contentType.value === 'all' ||
        (contentType.value === 'users' ? !p.editorial : p.kind === contentType.value))
  )
);
const draft = reactive({ designId: '', caption: '', category: 'daily', imageUrl: '' });
const draftConfig = ref({ ...defaults });
async function load() {
  loading.value = true;
  try {
    posts.value = (
      await api('/posts?category=' + category.value + '&q=' + encodeURIComponent(q.value))
    ).posts;
    error.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
async function openCompose() {
  if (!store.state.user) {
    router.push({ path: '/account', query: { next: '/community?compose=new' } });
    return;
  }
  try {
    designs.value = (await api('/designs')).designs;
    if (route.query.compose && route.query.compose !== 'new')
      draft.designId = String(route.query.compose);
    compose.value = true;
    error.value = '';
  } catch (e) {
    error.value = e.message;
  }
}
onMounted(async () => {
  await load();
  if (route.query.compose) openCompose();
});
watch(category, load);
watch(
  () => route.query.saved,
  (value) => {
    savedOnly.value = value === '1';
  }
);
watch(
  () => route.query.category,
  (v) => {
    category.value = ['daily', 'work', 'occasion'].includes(v) ? v : 'all';
  }
);
watch(
  () => route.query.q,
  (v) => {
    q.value = v || '';
    load();
  }
);
watch(
  () => draft.designId,
  (id) => {
    draftConfig.value = designs.value.find((d) => d.id === id)?.config || { ...defaults };
  }
);
async function like(post) {
  if (!store.state.user) return router.push({ path: '/account', query: { next: '/community' } });
  try {
    Object.assign(post, await api('/posts/' + post.id + '/like', { method: 'POST' }));
  } catch (e) {
    error.value = e.message;
  }
}
async function generate() {
  aiBusy.value = true;
  try {
    const r = await api('/captions', {
      method: 'POST',
      body: { config: draftConfig.value, locale: locale.value },
    });
    draft.caption = r.caption;
    store.commit('toast', { message: '演示文案已生成，可自由编辑后发布。' });
  } catch (e) {
    error.value = e.message;
  } finally {
    aiBusy.value = false;
  }
}
async function upload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片不能超过 5 MB';
    return;
  }
  uploading.value = true;
  const form = new FormData();
  form.append('image', file);
  try {
    draft.imageUrl = (await api('/uploads', { method: 'POST', body: form })).url;
    error.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    uploading.value = false;
  }
}
async function publish() {
  busy.value = true;
  try {
    await api('/posts', {
      method: 'POST',
      body: { ...draft, designId: draft.designId || undefined, config: draftConfig.value },
    });
    compose.value = false;
    draft.caption = '';
    draft.imageUrl = '';
    category.value = 'all';
    q.value = '';
    await load();
    store.commit('toast', { message: '你的穿搭灵感已发布。' });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
function close() {
  compose.value = false;
  if (route.query.compose) router.replace('/community');
}
</script>
<template>
  <div class="page community-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">THE STYLE COMMUNITY</div>
        <h1>{{ $t('風格不同，一樣出眾。') }}</h1>
        <p>{{ $t('穿搭、靈感、個性。這裡，每個人都是風格的主角。') }}</p>
      </div>
      <button class="primary" @click="openCompose">
        <Icon name="plus" :size="18" />{{ $t('發佈穿搭') }}
      </button>
    </div>
    <div class="community-editor-band">
      <span>THE DAILY EDIT</span>
      <p>{{ $t('真實街頭，真實風格。今日靈感已上線。') }}</p>
      <RouterLink to="/studio">{{ $t('從靈感開始訂製 ↗') }}</RouterLink>
    </div>
    <div class="community-discovery-row">
      <button
        v-for="item in [
          { id: 'all', title: '為你推薦', image: '/shopping/look-1.webp' },
          { id: 'daily', title: '日常穿搭', image: '/shopping/look-4.webp' },
          { id: 'idol', title: 'IDOL 靈感', image: '/editorial/idols/idol-jennie.webp' },
          { id: 'users', title: '社群分享', image: '/shopping/look-5.webp' },
        ]"
        :key="item.id"
        :class="{ selected: contentType === item.id }"
        @click="contentType = item.id"
        :aria-pressed="contentType === item.id"
      >
        <span><img :src="item.image" alt="" loading="lazy" /></span><b>{{ $t(item.title) }}</b>
      </button>
      <RouterLink to="/studio?product=city-hoodie" class="community-studio-drop"
        ><span>THE STUDIO DROP / 01</span><b>{{ $t('你的下一件日常。') }}</b
        ><small>{{ $t('連帽衛衣，自由配色。') }} ↗</small></RouterLink
      >
    </div>
    <div class="community-topic-strip">
      <RouterLink :to="{ path: '/community', query: { q: 'Karina' } }"># K-STYLE LAYERS</RouterLink
      ><RouterLink :to="{ path: '/community', query: { q: 'Jennie' } }"># IDOL STYLE</RouterLink
      ><RouterLink :to="{ path: '/community', query: { q: 'linen' } }"># LINEN DAYS</RouterLink
      ><RouterLink :to="{ path: '/community', query: { q: 'city' } }"># CITY UNIFORM</RouterLink>
    </div>
    <div class="community-toolbar">
      <div class="filter-tabs">
        <button
          v-for="(label, id) in {
            all: '全部灵感',
            daily: '日常穿搭',
            work: '通勤日记',
            occasion: '特别时刻',
          }"
          :key="id"
          :class="{ selected: category === id }"
          @click="category = id"
        >
          {{ $t(label) }}
        </button>
      </div>
      <button class="saved-filter" :class="{ selected: savedOnly }" @click="savedOnly = !savedOnly">
        <Icon name="bookmark" :size="14" />{{ $t('我的靈感板') }}
        <span>{{ (store.state.savedLooks || []).length }}</span>
      </button>
      <form class="inline-search" @submit.prevent="load">
        <Icon name="search" :size="17" /><input
          v-model="q"
          :aria-label="$t('搜索社区')"
          :placeholder="$t('寻找你的下一份灵感')"
        /><button class="text-button">{{ $t('搜索') }}</button>
      </form>
    </div>
    <div v-if="error && !compose" class="error-box" role="alert">{{ $t(error) }}</div>
    <div v-if="loading" class="loading-state">{{ $t('灵感正在到来…') }}</div>
    <div v-else-if="!visiblePosts.length" class="empty-state">
      <h2>{{ $t('还没有找到这份灵感。') }}</h2>
      <p>{{ $t('换个关键词，或者成为第一个分享的人。') }}</p>
      <button
        class="secondary"
        @click="
          q = '';
          category = 'all';
          contentType = 'all';
          savedOnly = false;
          load();
        "
      >
        {{ $t('查看全部') }}
      </button>
    </div>
    <div v-else class="post-grid">
      <PostCard v-for="p in visiblePosts" :key="p.id" :post="p" @like="like" />
      <article
        v-if="!savedOnly && !q && category === 'all' && contentType === 'all'"
        class="community-publish-card"
      >
        <div class="publish-grid-mark"><Icon name="camera" :size="30" /></div>
        <span>YOUR STYLE GOES HERE</span>
        <h3>{{ $t('下一份靈感，來自你。') }}</h3>
        <p>{{ $t('分享今天的穿搭，或把收藏變成自己的訂製設計。') }}</p>
        <button class="primary small" @click="openCompose">
          {{ $t('發佈我的穿搭') }}<Icon name="plus" :size="15" />
        </button>
      </article>
    </div>
    <details v-if="!savedOnly && !q" class="community-idol-archive">
      <summary>
        <span>IDOL STYLE ARCHIVE</span><b>{{ $t('明星穿搭與來源選集') }}</b
        ><Icon name="plus" :size="18" />
      </summary>
      <IdolSpotlight />
    </details>
    <Teleport to="body"
      ><div v-if="compose" class="modal-backdrop" @click.self="close" @keydown.esc="close">
        <section
          class="compose-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-title"
        >
          <div class="modal-heading">
            <div>
              <div class="eyebrow">SHARE YOUR EVERYDAY</div>
              <h2 id="compose-title">{{ $t('把灵感，分享出去。') }}</h2>
            </div>
            <button class="icon-button" :aria-label="$t('关闭发布窗口')" @click="close">
              <Icon name="close" />
            </button>
          </div>
          <form @submit.prevent="publish">
            <div class="compose-layout">
              <div class="compose-preview">
                <img
                  v-if="draft.imageUrl"
                  :src="draft.imageUrl"
                  :alt="$t('待发布的穿搭照片')"
                /><GarmentArt v-else :config="draftConfig" /><label class="secondary upload-label"
                  ><Icon name="plus" :size="16" />{{ $t(uploading ? '正在上传…' : '上传穿搭照片')
                  }}<input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="uploading"
                    @change="upload"
                /></label>
              </div>
              <div>
                <label class="field"
                  >{{ $t('关联我的设计')
                  }}<select v-model="draft.designId">
                    <option value="">{{ $t('使用基础亚麻裙设计') }}</option>
                    <option v-for="d in designs" :key="d.id" :value="d.id">{{ $t(d.name) }}</option>
                  </select></label
                ><label class="field"
                  >{{ $t('穿搭分类')
                  }}<select v-model="draft.category">
                    <option value="daily">{{ $t('日常穿搭') }}</option>
                    <option value="work">{{ $t('通勤日记') }}</option>
                    <option value="occasion">{{ $t('特别时刻') }}</option>
                  </select></label
                ><label class="field"
                  >{{ $t('此刻的灵感')
                  }}<textarea
                    v-model="draft.caption"
                    required
                    maxlength="1000"
                    rows="6"
                    :placeholder="$t('这件衣服背后，有怎样的故事？')"
                  ></textarea></label
                ><button
                  type="button"
                  class="text-button ai-button"
                  :disabled="aiBusy"
                  @click="generate"
                >
                  <Icon name="spark" :size="16" />{{
                    $t(aiBusy ? '正在寻找灵感…' : '帮我写一段文案')
                  }}<span class="pill">{{ $t('本地模板演示') }}</span>
                </button>
              </div>
            </div>
            <p class="small-note">
              {{
                $t(
                  '图片需为 JPEG / PNG / WebP，最多 5 MB。上传即表示你同意在此演示社区展示图片；请只分享你有权发布的内容。'
                )
              }}
            </p>
            <p v-if="error" class="error-box" role="alert">{{ $t(error) }}</p>
            <div class="modal-footer">
              <button type="button" class="secondary" @click="close">{{ $t('稍后再说') }}</button
              ><button class="primary" :disabled="busy || uploading || !draft.caption.trim()">
                {{ $t(busy ? '发布中…' : '发布我的穿搭') }}<Icon name="arrow" :size="17" />
              </button>
            </div>
          </form>
        </section></div
    ></Teleport>
  </div>
</template>
