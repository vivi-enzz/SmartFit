<script setup>
import GarmentArt from './GarmentArt.vue';
import Icon from './Icon.vue';
import { locale } from '../i18n';
defineProps({ post: Object });
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
        >{{ $t('編輯精選') }}</span
      ><span v-else class="post-tag">{{ $t('原創設計') }}</span
      ><span class="post-look-arrow"><Icon name="arrow" :size="17" /></span
    ></RouterLink>
    <div class="post-card-copy">
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
