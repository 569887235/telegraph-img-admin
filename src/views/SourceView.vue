<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { browseSource, createImportJob, createSource, getImportJob, listSources, testSource } from "../api/client.js";

const sources = ref([]);
const selectedSourceId = ref("");
const browsePath = ref("/");
const entries = ref([]);
const loading = ref(false);
const message = ref("");
const error = ref("");
const lastJob = ref(null);
let jobTimer = null;
const form = reactive({
  name: "",
  base_url: "",
  username: "",
  password: "",
  root_path: "/",
  max_concurrency: 1,
  max_requests_per_second: 1,
  max_download_bytes_per_second: "",
  timeout_seconds: 60,
  verify_ssl: true
});

const selectedSource = computed(() => sources.value.find(item => item.id === selectedSourceId.value));
const jobItems = computed(() => lastJob.value?.items || []);
const isJobRunning = computed(() => ["queued", "running"].includes(lastJob.value?.status));

function setStatus(nextMessage = "", nextError = "") {
  message.value = nextMessage;
  error.value = nextError;
}

function stopJobPolling() {
  if (jobTimer) clearInterval(jobTimer);
  jobTimer = null;
}

async function refreshJob() {
  if (!lastJob.value?.id) return;
  try {
    lastJob.value = await getImportJob(lastJob.value.id);
    if (!isJobRunning.value) stopJobPolling();
  } catch (err) {
    stopJobPolling();
    setStatus("", err.message);
  }
}

function startJobPolling() {
  stopJobPolling();
  jobTimer = setInterval(refreshJob, 2000);
  refreshJob();
}

async function loadSources() {
  const data = await listSources();
  sources.value = data.items || [];
  if (!selectedSourceId.value && sources.value.length) selectedSourceId.value = sources.value[0].id;
}

async function submitSource() {
  loading.value = true;
  setStatus();
  try {
    const source = await createSource({ source_type: "webdav", ...form });
    await loadSources();
    selectedSourceId.value = source.id;
    browsePath.value = "/";
    entries.value = [];
    setStatus("数据源已保存");
  } catch (err) {
    setStatus("", err.message);
  } finally {
    loading.value = false;
  }
}

async function runTest(sourceId = selectedSourceId.value) {
  if (!sourceId) return;
  loading.value = true;
  setStatus();
  try {
    const result = await testSource(sourceId);
    setStatus(`连接成功，根目录样本 ${result.sample_count} 项`);
  } catch (err) {
    setStatus("", err.message);
  } finally {
    loading.value = false;
  }
}

async function browse(path = browsePath.value) {
  if (!selectedSourceId.value) return;
  loading.value = true;
  setStatus();
  try {
    const data = await browseSource(selectedSourceId.value, path || "/");
    browsePath.value = data.path || "/";
    entries.value = data.items || [];
  } catch (err) {
    setStatus("", err.message);
  } finally {
    loading.value = false;
  }
}

function parentPath(path) {
  const clean = (path || "/").replace(/\/+$/g, "");
  const index = clean.lastIndexOf("/");
  return index <= 0 ? "/" : clean.slice(0, index);
}

async function startClean(path = browsePath.value) {
  if (!selectedSourceId.value) return;
  loading.value = true;
  setStatus();
  try {
    lastJob.value = await createImportJob({
      source_id: selectedSourceId.value,
      target_path: path || "/",
      recursive: true
    });
    setStatus(`导入任务已创建：${lastJob.value.id}`);
    startJobPolling();
  } catch (err) {
    setStatus("", err.message);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await loadSources();
  } catch (err) {
    setStatus("", err.message);
  }
});

onUnmounted(stopJobPolling);
</script>

<template>
  <section>
    <h2>数据源</h2>
    <p v-if="message" class="notice">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="grid source-grid">
      <form class="panel form-grid" @submit.prevent="submitSource">
        <h3>添加 WebDAV</h3>
        <label>
          名称
          <input v-model="form.name" required placeholder="例如：主网盘" />
        </label>
        <label>
          WebDAV 地址
          <input v-model="form.base_url" required placeholder="https://dav.example.com/dav" />
        </label>
        <label>
          用户名
          <input v-model="form.username" autocomplete="username" />
        </label>
        <label>
          密码
          <input v-model="form.password" type="password" autocomplete="current-password" />
        </label>
        <label>
          根路径
          <input v-model="form.root_path" placeholder="/" />
        </label>
        <div class="inline-fields">
          <label>
            并发
            <input v-model.number="form.max_concurrency" type="number" min="1" max="10" />
          </label>
          <label>
            请求/秒
            <input v-model.number="form.max_requests_per_second" type="number" min="0.1" step="0.1" />
          </label>
        </div>
        <div class="inline-fields">
          <label>
            下载限速 B/s
            <input v-model="form.max_download_bytes_per_second" type="number" min="0" placeholder="暂可为空" />
          </label>
          <label>
            超时秒数
            <input v-model.number="form.timeout_seconds" type="number" min="5" />
          </label>
        </div>
        <label class="check-row">
          <input v-model="form.verify_ssl" type="checkbox" />
          校验证书
        </label>
        <button :disabled="loading">保存数据源</button>
      </form>

      <div class="panel">
        <h3>已配置数据源</h3>
        <div class="toolbar stack-toolbar">
          <select v-model="selectedSourceId">
            <option value="" disabled>选择数据源</option>
            <option v-for="source in sources" :key="source.id" :value="source.id">
              {{ source.name }} · {{ source.source_type }}
            </option>
          </select>
          <button :disabled="!selectedSourceId || loading" @click="runTest()">测试连接</button>
        </div>
        <div v-if="selectedSource" class="source-meta">
          <strong>{{ selectedSource.name }}</strong>
          <small>{{ selectedSource.webdav?.base_url }}</small>
          <small>根路径：{{ selectedSource.webdav?.root_path || selectedSource.root_path }}</small>
        </div>
      </div>
    </div>

    <div class="panel browser-panel">
      <div class="toolbar browser-toolbar">
        <input v-model="browsePath" placeholder="/" @keyup.enter="browse()" />
        <button :disabled="!selectedSourceId || loading" @click="browse()">浏览</button>
        <button :disabled="!selectedSourceId || loading" @click="browse(parentPath(browsePath))">上级</button>
        <button :disabled="!selectedSourceId || loading" @click="startClean(browsePath)">导入当前路径</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>类型</th>
            <th>大小</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.path">
            <td>{{ entry.name }}</td>
            <td>{{ entry.type }}</td>
            <td>{{ entry.size || "-" }}</td>
            <td>
              <button v-if="entry.type === 'directory'" :disabled="loading" @click="browse(entry.path)">打开</button>
              <button v-if="entry.type === 'directory'" :disabled="loading" @click="startClean(entry.path)">清洗</button>
            </td>
          </tr>
          <tr v-if="!entries.length">
            <td colspan="4">暂无目录数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lastJob" class="panel browser-panel">
      <div class="toolbar browser-toolbar">
        <h3>导入进度</h3>
        <button :disabled="loading" @click="refreshJob">刷新</button>
      </div>
      <div class="stats">
        <span>状态 {{ lastJob.status }}</span>
        <span>总数 {{ lastJob.total_count || 0 }}</span>
        <span>成功 {{ lastJob.success_count || 0 }}</span>
        <span>跳过 {{ lastJob.skipped_count || 0 }}</span>
        <span>失败 {{ lastJob.failed_count || 0 }}</span>
      </div>
      <div class="source-meta">
        <small>任务 ID：{{ lastJob.id }}</small>
        <small>路径：{{ lastJob.target_path || "/" }}</small>
        <small v-if="isJobRunning">自动刷新中</small>
      </div>
      <table>
        <thead>
          <tr>
            <th>路径</th>
            <th>主体</th>
            <th>套图</th>
            <th>状态</th>
            <th>结果</th>
            <th>SHA256</th>
            <th>媒体</th>
            <th>套图 ID</th>
            <th>错误</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in jobItems" :key="item.id">
            <td>{{ item.local_path }}</td>
            <td>{{ item.detected_entity_name || "-" }}</td>
            <td>{{ item.detected_album_title || "-" }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.action_result || "-" }}</td>
            <td>{{ item.sha256 || "-" }}</td>
            <td>{{ item.media_file_id || "-" }}</td>
            <td>{{ item.album_id || "-" }}</td>
            <td>{{ item.error || "-" }}</td>
          </tr>
          <tr v-if="!jobItems.length">
            <td colspan="9">暂无导入明细</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
