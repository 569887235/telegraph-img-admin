<script setup>
import { ref } from "vue";
import { importUrls, uploadFiles } from "../api/client.js";

const emit = defineEmits(["batch-created"]);
const files = ref([]);
const urlsText = ref("");
const loading = ref(false);
const error = ref("");

function pick(event) {
  files.value = Array.from(event.target.files || []);
}

async function submitFiles() {
  loading.value = true;
  error.value = "";
  try {
    const batch = await uploadFiles(files.value);
    emit("batch-created", batch.id);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function submitUrls() {
  const urls = urlsText.value.split("\n").map(item => item.trim()).filter(Boolean);
  loading.value = true;
  error.value = "";
  try {
    const batch = await importUrls(urls);
    emit("batch-created", batch.id);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section>
    <h2>上传任务</h2>
    <div class="grid">
      <div class="panel">
        <h3>本地文件</h3>
        <input type="file" multiple @change="pick" />
        <p>已选择 {{ files.length }} 个文件</p>
        <button :disabled="!files.length || loading" @click="submitFiles">创建批次</button>
      </div>
      <div class="panel">
        <h3>远程 URL</h3>
        <textarea v-model="urlsText" rows="10" placeholder="每行一个 URL"></textarea>
        <button :disabled="!urlsText.trim() || loading" @click="submitUrls">导入 URL</button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>
