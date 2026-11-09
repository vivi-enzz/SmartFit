<script setup>
import GarmentArt from './GarmentArt.vue';
import Icon from './Icon.vue';
import { locale } from '../i18n';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
const props = defineProps({ post: Object });
const store = useStore(),
  router = useRouter(),
  route = useRoute();
const saved = computed(() => (store.state.savedLooks || []).includes(props.post.id));
function save() {
  if (!store.state.user) return router.push({ path: '/account', query: { next: route.fullPath } });
  const wasSaved = saved.value;
  store.commit('toggleSaved', props.post.id);
  store.commit('toast', { message: wasSaved ? '已移除收藏' : '已加入我的靈感板' });
}
defineEmits(['like']);
</script>
<template>
  <article class="post-card">
    <RouterLink :to="'/community/' + post.id" class="post-image"
      ><img
        v-if="post.imageUrl"
        :src="post.imageUrl"
        :alt="$t(locale === 'en' && post.captionEn ? post.captionEn : post.caption.slice(0, 80))"
        loading="lazy"
        decoding="async" /><GarmentArt v-else :config="post.config" /><span
        v-if="post.editorial"
        class="post-tag"
        >{{ $t(post.kind === 'idol' ? 'IDOL 穿搭資料' : '編輯精選') }}</span
      ><span v-else class="post-tag">{{ $t('原創設計') }}</span
      ><span class="post-look-arrow"><Icon name="arrow" :size="17" /></span
    ></RouterLink>
    <div class="post-card-copy">
      <div v-if="post.eventDate" class="post-source-date">
        {{ $t('活動資料照') }} · {{ post.eventDate }}
      </div>
      <small v-if="post.kicker" class="post-kicker">{{ $t(post.kicker) }}</small
      ><RouterLink :to="'/community/' + post.id"
        ><h3>
          {{ $t(locale === 'en' && post.captionEn ? post.captionEn : post.caption) }}
        </h3></RouterLink
      >
      <div class="post-card-footer">
        <span
          ><span class="user-dot" :class="{ 'editor-dot': post.editorial }">{{
            $t(post.editorial ? 'SF' : post.author.slice(0, 1))
          }}</span
          >{{ $t(post.editorial ? 'SmartFit Edit' : post.author)
          }}<Icon v-if="post.editorial" name="check" :size="12" /></span
        ><button
          class="save-look-button"
          :class="{ saved }"
          :aria-pressed="saved"
          :aria-label="$t(saved ? '取消收藏' : '收藏靈感')"
          @click="save"
        >
          <Icon name="bookmark" :size="15" /></button
        ><button
          :class="['like-button', { liked: post.liked }]"
          :aria-label="$t(post.liked ? '取消喜歡' : '喜歡這套穿搭')"
          :aria-pressed="post.liked"
          @click="$emit('like', post)"
        >
          <Icon name="heart" :size="17" /><span v-if="post.likes">{{ $t(post.likes) }}</span>
        </button>
      </div>
    </div>
  </article>
</template>
