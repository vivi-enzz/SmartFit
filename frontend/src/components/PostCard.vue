<script setup>
import GarmentArt from './GarmentArt.vue';
import Icon from './Icon.vue';
defineProps({ post: Object });
defineEmits(['like']);
</script>
<template>
  <article class="post-card">
    <RouterLink :to="'/community/' + post.id" class="post-image"
      ><img
        v-if="post.imageUrl"
        :src="post.imageUrl"
        :alt="post.caption.slice(0, 50)"
        loading="lazy"
      /><GarmentArt v-else :config="post.config" /><span class="post-tag">{{
        { daily: '日常灵感', work: '通勤穿搭', occasion: '特别时刻' }[post.category]
      }}</span></RouterLink
    >
    <div class="post-card-copy">
      <RouterLink :to="'/community/' + post.id"
        ><h3>{{ post.caption }}</h3></RouterLink
      >
      <div class="post-card-footer">
        <span
          ><span class="user-dot">{{ post.author.slice(0, 1) }}</span
          >{{ post.author }}</span
        ><button
          :class="['like-button', { liked: post.liked }]"
          :aria-label="post.liked ? '取消点赞' : '点赞'"
          :aria-pressed="post.liked"
          @click="$emit('like', post)"
        >
          <Icon name="heart" :size="17" />{{ post.likes }}
        </button>
      </div>
    </div>
  </article>
</template>
