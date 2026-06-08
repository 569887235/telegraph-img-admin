<script setup>
import { ref } from "vue";
import UploadView from "./views/UploadView.vue";
import BatchView from "./views/BatchView.vue";
import GalleryView from "./views/GalleryView.vue";
import SourceView from "./views/SourceView.vue";

const view = ref("sources");
const batchId = ref("");

function openBatch(id) {
  batchId.value = id;
  view.value = "batch";
}
</script>

<template>
  <div class="shell">
    <aside>
      <h1>telegraph-img</h1>
      <button :class="{ active: view === 'sources' }" @click="view = 'sources'">数据源</button>
      <button :class="{ active: view === 'upload' }" @click="view = 'upload'">上传</button>
      <button :class="{ active: view === 'batch' }" @click="view = 'batch'">批次</button>
      <button :class="{ active: view === 'gallery' }" @click="view = 'gallery'">图库</button>
    </aside>
    <main>
      <SourceView v-if="view === 'sources'" />
      <UploadView v-else-if="view === 'upload'" @batch-created="openBatch" />
      <BatchView v-else-if="view === 'batch'" v-model:batch-id="batchId" />
      <GalleryView v-else />
    </main>
  </div>
</template>
