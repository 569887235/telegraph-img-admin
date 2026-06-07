<script setup>
import { onMounted, reactive, ref } from "vue";
import { listImages } from "../api/client.js";

const params = reactive({ page: 1, limit: 24, search: "" });
const images = ref([]);
const total = ref(0);
const error = ref("");

async function load(page = params.page) {
  try {
    const data = await listImages({ ...params, page });
    images.value = data.items;
    total.value = data.total;
    params.page = data.page;
    error.value = "";
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(() => load());
</script>

<template>
  <section>
    <h2>图库</h2>
    <div class="toolbar">
      <input v-model="params.search" placeholder="搜索文件名或 ID" @keyup.enter="load(1)" />
      <button @click="load(1)">搜索</button>
      <span>共 {{ total }} 条</span>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="gallery">
      <article v-for="image in images" :key="image.id" class="card">
        <img v-if="image.mime_type?.startsWith('image/')" :src="image.public_url" :alt="image.original_name" />
        <div v-else class="file">{{ image.file_ext }}</div>
        <strong>{{ image.original_name || image.public_id }}</strong>
        <small>{{ image.public_id }}</small>
      </article>
    </div>
  </section>
</template>
