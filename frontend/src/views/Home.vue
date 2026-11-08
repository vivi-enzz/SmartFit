<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';
import Icon from '../components/Icon.vue';
import GarmentArt from '../components/GarmentArt.vue';
const city = ref('Hong Kong'),
  data = ref(null),
  error = ref(''),
  posts = ref([]),
  busy = ref(false);
async function load() {
  busy.value = true;
  error.value = '';
  try {
    data.value = await api('/homepage-recommendations?city=' + city.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
onMounted(async () => {
  await load();
  try {
    posts.value = (await api('/posts')).posts.slice(0, 3);
  } catch (e) {
    error.value = e.message;
  }
});
</script>
<template>
  <div class="home">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow"><span></span> YOUR STYLE, YOUR FIT</div>
        <h1>不必适应衣服，<br />让衣服<span class="serif-accent">懂你。</span></h1>
        <p>从一缕面料，到每一寸合身。<br />为你的身形、喜好与生活，定制独一无二的日常。</p>
        <div class="hero-buttons">
          <RouterLink to="/studio" class="primary"
            >开始我的设计<Icon name="arrow" :size="18" /></RouterLink
          ><RouterLink to="/community" class="underlink">寻找穿搭灵感 <span>↗</span></RouterLink>
        </div>
        <div class="hero-proof">
          <div class="mini-avatars"><span>林</span><span>陈</span><span>周</span></div>
          <div>
            <b>每一种身形，都值得被好好对待</b><small>MADE TO MEASURE · MADE FOR YOU</small>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-arch"></div>
        <span class="visual-tag">THE EVERYDAY COLLECTION / 01</span>
        <div class="hero-art">
          <GarmentArt
            :config="{
              colorHex: '#6f816c',
              fabricId: 'linen',
              sleeve: 'sleeveless',
              collar: 'square',
            }"
            :scene="false"
          />
        </div>
        <div class="floating-fabric">
          <span class="fabric-swatch linen"></span>
          <div><small>一份自然的选择</small><b>100% 天然亚麻</b></div>
          <Icon name="leaf" />
        </div>
        <div class="floating-fit"><Icon name="check" :size="16" />专属于你的合身</div>
        <div class="visual-caption">
          <span>由你定义的日常。</span><small>DESIGNED BY YOU, CRAFTED WITH CARE.</small>
        </div>
        <span class="vertical-text">LESS EXCESS. MORE EXPRESSION.</span>
      </div>
    </section>
    <div class="value-strip">
      <span><Icon name="spark" />个性化定制</span><span><Icon name="user" />为每种身形而作</span
      ><span><Icon name="leaf" />按需生产理念</span
      ><span><Icon name="heart" />有温度的穿搭社区</span>
    </div>
    <section class="section weather-section">
      <div class="weather-icon"><Icon name="sun" :size="42" /></div>
      <div class="weather-copy">
        <div class="eyebrow">DRESSED FOR YOUR DAY</div>
        <h2>好天气，有好搭配。</h2>
        <p v-if="data?.weather">
          {{ data.weather.temperature }}°C · {{ data.weather.condition }} · 湿度
          {{ data.weather.humidity }}%<span>为今天挑选舒适的面料。</span>
        </p>
        <p v-else>{{ data?.message || '正在准备今日灵感…' }}</p>
        <small class="demo-label">演示天气 · 非实时数据</small>
      </div>
      <label class="city-select"
        ><Icon name="pin" :size="17" /><select v-model="city" aria-label="选择城市" @change="load">
          <option value="Hong Kong">香港</option>
          <option value="Shanghai">上海</option>
          <option value="Beijing">北京</option>
          <option value="Shenzhen">深圳</option>
        </select></label
      >
      <div class="weather-fabrics">
        <RouterLink
          v-for="f in data?.fabrics"
          :key="f.id"
          :to="{ path: '/studio', query: { fabric: f.id } }"
          ><span class="fabric-swatch" :style="{ backgroundColor: f.tone }"></span
          ><b>{{ f.name }}</b
          ><small>适合今日 <span>↗</span></small></RouterLink
        >
      </div>
      <p v-if="error" class="error-text" role="alert">
        {{ error }} <button @click="load">重试</button>
      </p>
    </section>
    <section class="section">
      <div class="section-title">
        <div>
          <div class="eyebrow">A LITTLE INSPIRATION</div>
          <h2>从喜欢的样子开始。</h2>
          <p>精选版型，自由表达。下一件心头好，由你创造。</p>
        </div>
        <RouterLink to="/studio" class="underlink"
          >探索定制工作室 <Icon name="arrow" :size="18"
        /></RouterLink>
      </div>
      <div class="collection-grid">
        <RouterLink
          v-for="(item, i) in [
            {
              name: '自在亚麻裙',
              en: 'THE LINEN EDIT',
              color: '#8c9b82',
              fabric: 'linen',
              tag: '轻盈 · 自在',
            },
            {
              name: '通勤新日常',
              en: 'WORK, YOUR WAY',
              color: '#d0afa0',
              fabric: 'silk',
              tag: '简约 · 得体',
            },
            {
              name: '留给特别的你',
              en: 'SOMETHING SPECIAL',
              color: '#756477',
              fabric: 'silk',
              tag: '细腻 · 从容',
            },
          ]"
          :key="item.name"
          :to="{
            path: '/studio',
            query: {
              fabric: item.fabric,
              color: item.color,
              occasion: i === 1 ? 'work' : i === 2 ? 'occasion' : 'daily',
            },
          }"
          class="collection-card"
          ><div :class="['collection-art', 'tone-' + i]">
            <span class="collection-tag">{{ item.tag }}</span
            ><GarmentArt
              :config="{
                colorHex: item.color,
                fabricId: item.fabric,
                garmentType: i === 1 ? 'top' : 'dress',
                length: i === 1 ? 'short' : i === 2 ? 'maxi' : 'midi',
                sleeve: i === 2 ? 'sleeveless' : 'short',
                collar: i === 1 ? 'v-neck' : 'round',
              }"
            /><span class="round-arrow">↗</span>
          </div>
          <small>{{ item.en }}</small>
          <h3>{{ item.name }}</h3>
          <p>以你喜欢的方式，重新定义。</p></RouterLink
        >
      </div>
    </section>
    <section class="story-banner section">
      <div>
        <div class="eyebrow">THOUGHTFULLY MADE</div>
        <h2>少一点将就，<br />多一点<span class="serif-accent">刚刚好。</span></h2>
        <p>每一件定制服装，都从你的选择开始。<br />按需制作，让设计与需求相遇。</p>
        <RouterLink to="/studio" class="underlink"
          >了解我的定制之旅 <Icon name="arrow" :size="17"
        /></RouterLink>
      </div>
      <ol class="journey">
        <li>
          <span>01</span>
          <h3>选择你的风格</h3>
          <p>面料、颜色、廓形，让灵感成形。</p>
        </li>
        <li>
          <span>02</span>
          <h3>找到你的合身</h3>
          <p>输入尺寸，在虚拟试衣间预览。</p>
        </li>
        <li>
          <span>03</span>
          <h3>等待专属的作品</h3>
          <p>从下单到收货，进度始终清晰。</p>
        </li>
      </ol>
    </section>
    <section class="section">
      <div class="section-title">
        <div>
          <div class="eyebrow">REAL STYLE, REAL STORIES</div>
          <h2>穿出自己，也遇见同好。</h2>
        </div>
        <RouterLink to="/community" class="underlink"
          >走进穿搭社区 <Icon name="arrow" :size="18"
        /></RouterLink>
      </div>
      <div class="home-post-grid">
        <RouterLink v-for="p in posts" :key="p.id" :to="'/community/' + p.id" class="home-post"
          ><div class="post-preview"><GarmentArt :config="p.config" /></div>
          <small>{{ p.author }}</small>
          <p>{{ p.caption }}</p>
          <span
            ><Icon name="heart" :size="15" />{{ p.likes }} <span>发现这一套 ↗</span></span
          ></RouterLink
        >
      </div>
    </section>
  </div>
</template>
