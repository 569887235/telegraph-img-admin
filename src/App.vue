<script setup>
import SourceView from "./views/SourceView.vue";
</script>

<template>
  <div class="shell">
    <aside>
      <h1>telegraph-img</h1>
      <button class="active">数据源</button>
    </aside>
    <main>
      <SourceView />
    </main>
  </div>
</template>
