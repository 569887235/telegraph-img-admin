<script setup>
import { onMounted, reactive, ref } from "vue";
import { createStorageAccount, listStorageAccounts, testStorageAccount, updateStorageAccount } from "../api/client.js";

const accounts = ref([]);
const editingId = ref("");
const loading = ref(false);
const error = ref("");
const message = ref("");
const form = reactive({
  name: "",
  bot_token: "",
  chat_id: "",
  status: "active"
});

function resetForm() {
  editingId.value = "";
  form.name = "";
  form.bot_token = "";
  form.chat_id = "";
  form.status = "active";
}

function editAccount(account) {
  editingId.value = account.id;
  form.name = account.name || "";
  form.bot_token = account.bot_token || "";
  form.chat_id = account.chat_id || "";
  form.status = account.status || "active";
}

async function loadAccounts() {
  loading.value = true;
  error.value = "";
  try {
    const data = await listStorageAccounts();
    accounts.value = data.items || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function saveAccount() {
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    const payload = { ...form };
    if (editingId.value) {
      await updateStorageAccount(editingId.value, payload);
      message.value = "电报频道已更新";
    } else {
      await createStorageAccount(payload);
      message.value = "电报频道已新增";
    }
    resetForm();
    await loadAccounts();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function runTest(account) {
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    const result = await testStorageAccount(account.id);
    const botName = result.bot?.username || "bot";
    const chatName = result.chat?.title || result.chat?.id || "chat";
    message.value = "连接成功：" + botName + " -> " + chatName;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(account) {
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    await updateStorageAccount(account.id, { status: account.status === "active" ? "inactive" : "active" });
    message.value = account.status === "active" ? "电报频道已停用" : "电报频道已启用";
    await loadAccounts();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadAccounts);
</script>

<template>
  <section class="storage-account-view">
    <div class="page-heading">
      <div>
        <h2>电报频道</h2>
        <p>在线配置上传用的 Telegram 机器人和频道</p>
      </div>
      <button :disabled="loading" @click="loadAccounts">刷新</button>
    </div>
    <p v-if="message" class="notice">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="detail-surface">
      <div class="detail-header">
        <div>
          <h3>{{ editingId ? "编辑电报频道" : "新增电报频道" }}</h3>
          <p>bot token 明文保存，可查看并在编辑时回写</p>
        </div>
        <button v-if="editingId" type="button" @click="resetForm">取消编辑</button>
      </div>
      <form class="storage-form" @submit.prevent="saveAccount">
        <label>
          名称
          <input v-model="form.name" required placeholder="例如：主频道" />
        </label>
        <label>
          Bot Token
          <input v-model="form.bot_token" required type="text" autocomplete="off" placeholder="123456:ABC..." />
        </label>
        <label>
          Chat ID
          <input v-model="form.chat_id" required placeholder="-100xxxxxxxxxx" />
        </label>
        <label>
          状态
          <select v-model="form.status">
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </label>
        <div class="form-actions">
          <button :disabled="loading">{{ editingId ? "保存修改" : "新增频道" }}</button>
        </div>
      </form>
    </div>

    <div class="detail-surface edge-list-surface">
      <div class="asset-toolbar">
        <h3>已配置频道</h3>
        <small>{{ accounts.length }} 个频道</small>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>Chat ID</th>
              <th>Token</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td class="path-cell">{{ account.chat_id || "-" }}</td>
              <td class="path-cell">{{ account.bot_token || "-" }}</td>
              <td><b :class="['status-pill', account.status]">{{ account.status }}</b></td>
              <td class="row-actions">
                <button @click="editAccount(account)">编辑</button>
                <button @click="runTest(account)">测试</button>
                <button @click="toggleStatus(account)">{{ account.status === "active" ? "停用" : "启用" }}</button>
              </td>
            </tr>
            <tr v-if="!accounts.length">
              <td colspan="5">暂无电报频道</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
