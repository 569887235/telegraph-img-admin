<script setup>
import { computed, ref } from "vue";
import EdgeNodeView from "./views/EdgeNodeView.vue";
import GalleryView from "./views/GalleryView.vue";
import JobsView from "./views/JobsView.vue";
import StorageAccountView from "./views/StorageAccountView.vue";
import SourceView from "./views/SourceView.vue";

const activeView = ref("sources");
const navItems = [
  { id: "sources", label: "数据源", component: SourceView },
  { id: "storage", label: "电报频道", component: StorageAccountView },
  { id: "jobs", label: "导入任务", component: JobsView },
  { id: "gallery", label: "图库维护", component: GalleryView },
  { id: "edge", label: "访问域名", component: EdgeNodeView }
];

const currentComponent = computed(() => navItems.find(item => item.id === activeView.value)?.component || SourceView);
</script>

<template>
  <div class="shell">
    <aside class="app-nav">
      <h1>telegraph-img</h1>
      <button
        v-for="item in navItems"
        :key="item.id"
        :class="{ active: activeView === item.id }"
        @click="activeView = item.id"
      >
        {{ item.label }}
      </button>
    </aside>
    <main>
      <component :is="currentComponent" />
    </main>
  </div>
</template>
