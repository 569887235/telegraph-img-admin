<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getBatch } from "../api/client.js";

const props = defineProps({ batchId: { type: String, default: "" } });
const emit = defineEmits(["update:batchId"]);
const currentId = computed({ get: () => props.batchId, set: value => emit("update:batchId", value) });
const batch = ref(null);
const error = ref("");
let timer = null;

async function load() {
  if (!currentId.value) return;
  try {
    batch.value = await getBatch(currentId.value);
    error.value = "";
  } catch (err) {
    error.value = err.message;
  }
}

function poll() {
  if (timer) clearInterval(timer);
  load();
  timer = setInterval(load, 1500);
}

watch(() => props.batchId, () => props.batchId && poll(), { immediate: true });
onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<template>
  <section>
    <h2>批次进度</h2>
    <div class="toolbar">
      <input v-model="currentId" placeholder="批次 ID" />
      <button @click="poll">查询</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="batch" class="panel">
      <div class="stats">
        <span>总数 {{ batch.total_count }}</span>
        <span>成功 {{ batch.success_count }}</span>
        <span>失败 {{ batch.failed_count }}</span>
        <span>状态 {{ batch.status }}</span>
      </div>
      <table>
        <thead><tr><th>来源</th><th>状态</th><th>错误</th></tr></thead>
        <tbody>
          <tr v-for="item in batch.items" :key="item.id">
            <td>{{ item.original_name || item.source_url }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.error || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
