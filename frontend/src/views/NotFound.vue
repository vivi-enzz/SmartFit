<template>
  <div class="page empty-state">
    <div class="eyebrow">404 · A DIFFERENT PATH</div>
    <h1>{{ $t('这份灵感，似乎走远了。') }}</h1>
    <p>{{ $t('回到首页，继续发现你的风格。') }}</p>
    <RouterLink to="/" class="primary">{{ $t('回到首页 →') }}</RouterLink>
  </div>
</template>
