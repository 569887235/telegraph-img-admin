<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { createEdgeNode, listEdgeNodes, listStorageAccounts, updateEdgeNode } from "../api/client.js";

const storageAccounts = ref([]);
const edgeNodes = ref([]);
const selectedStorageId = ref("");
const editingId = ref("");
const loading = ref(false);
const error = ref("");
const message = ref("");
const form = reactive({
  name: "",
  base_url: "",
  weight: 1,
  priority: 100,
  status: "active"
});

const selectedStorage = computed(() => storageAccounts.value.find(item => item.id === selectedStorageId.value));
const visibleNodes = computed(() => edgeNodes.value.filter(item => item.storage_account_id === selectedStorageId.value));

function resetForm() {
  editingId.value = "";
  form.name = "";
  form.base_url = "";
  form.weight = 1;
  form.priority = 100;
  form.status = "active";
}

function editNode(node) {
  editingId.value = node.id;
  form.name = node.name || "";
  form.base_url = node.base_url || "";
  form.weight = node.weight || 1;
  form.priority = node.priority || 100;
  form.status = node.status || "active";
}

async function loadAll() {
  loading.value = true;
  error.value = "";
  try {
    const [storageData, edgeData] = await Promise.all([
      listStorageAccounts(),
      listEdgeNodes()
    ]);
    storageAccounts.value = storageData.items || [];
    edgeNodes.value = edgeData.items || [];
    if (!selectedStorageId.value && storageAccounts.value.length) selectedStorageId.value = storageAccounts.value[0].id;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function saveNode() {
  if (!selectedStorageId.value) return;
  loading.value = true;
  error.value = "";
  message.value = "";
  const payload = {
    ...form,
    storage_account_id: selectedStorageId.value,
    weight: Number(form.weight || 1),
    priority: Number(form.priority || 100)
  };
  try {
    if (editingId.value) {
      await updateEdgeNode(editingId.value, payload);
      message.value = "访问域名已更新";
    } else {
      await createEdgeNode(payload);
      message.value = "访问域名已新增";
    }
    resetForm();
    await loadAll();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function toggleNode(node) {
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    await updateEdgeNode(node.id, { status: node.status === "active" ? "inactive" : "active" });
    message.value = node.status === "active" ? "访问域名已停用" : "访问域名已启用";
    await loadAll();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <section class="edge-node-view">
    <div class="page-heading">
      <div>
        <h2>访问域名</h2>
        <p>按 Telegram 频道/机器人配置 Cloudflare 图片访问域名</p>
      </div>
      <button :disabled="loading" @click="loadAll">刷新</button>
    </div>
    <p v-if="message" class="notice">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="workbench two-pane edge-node-layout">
      <aside class="left-pane">
        <div class="filter-stack">
          <label>
            存储账号
            <select v-model="selectedStorageId" @change="resetForm">
              <option value="" disabled>选择 Telegram 频道/机器人</option>
              <option v-for="account in storageAccounts" :key="account.id" :value="account.id">
                {{ account.name }} · {{ account.provider }}
              </option>
            </select>
          </label>
        </div>
        <div v-if="selectedStorage" class="storage-summary">
          <strong>{{ selectedStorage.name }}</strong>
          <small>{{ selectedStorage.id }}</small>
          <small>Chat ID：{{ selectedStorage.chat_id || "-" }}</small>
          <small>{{ selectedStorage.status }}</small>
        </div>
        <p v-if="!storageAccounts.length" class="empty-state">暂无存储账号</p>
      </aside>

      <div class="right-pane">
        <div class="detail-surface">
          <div class="detail-header">
            <div>
              <h3>{{ editingId ? "编辑访问域名" : "新增访问域名" }}</h3>
              <p>{{ selectedStorage?.name || "先选择存储账号" }}</p>
            </div>
            <button v-if="editingId" type="button" @click="resetForm">取消编辑</button>
          </div>

          <form class="edge-form" @submit.prevent="saveNode">
            <label>
              名称
              <input v-model="form.name" required placeholder="例如：CF 主域名" />
            </label>
            <label>
              Cloudflare 域名
              <input v-model="form.base_url" required placeholder="https://img-a.example.com" />
            </label>
            <label>
              权重
              <input v-model.number="form.weight" type="number" min="1" />
            </label>
            <label>
              优先级
              <input v-model.number="form.priority" type="number" min="0" />
            </label>
            <label>
              状态
              <select v-model="form.status">
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </label>
            <div class="form-actions">
              <button :disabled="loading || !selectedStorageId">{{ editingId ? "保存修改" : "新增域名" }}</button>
            </div>
          </form>
        </div>

        <div class="detail-surface edge-list-surface">
          <div class="asset-toolbar">
            <h3>当前频道域名</h3>
            <small>{{ visibleNodes.length }} 个节点</small>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>域名</th>
                  <th>权重</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="node in visibleNodes" :key="node.id">
                  <td>{{ node.name }}</td>
                  <td class="path-cell">{{ node.base_url }}</td>
                  <td>{{ node.weight }}</td>
                  <td>{{ node.priority }}</td>
                  <td><b :class="['status-pill', node.status]">{{ node.status }}</b></td>
                  <td class="row-actions">
                    <button @click="editNode(node)">编辑</button>
                    <button @click="toggleNode(node)">{{ node.status === "active" ? "停用" : "启用" }}</button>
                  </td>
                </tr>
                <tr v-if="!visibleNodes.length">
                  <td colspan="6">当前存储账号暂无访问域名</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
