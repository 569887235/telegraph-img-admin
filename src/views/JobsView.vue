<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { getImportJob, listImportJobs, listSources } from "../api/client.js";

const filters = reactive({ status: "", source_id: "" });
const jobs = ref([]);
const sources = ref([]);
const selectedJob = ref(null);
const total = ref(0);
const loading = ref(false);
const error = ref("");
let timer = null;

const isSelectedRunning = computed(() => ["queued", "running"].includes(selectedJob.value?.status));
const jobItems = computed(() => selectedJob.value?.items || []);

function statusLabel(status) {
  return {
    queued: "排队",
    running: "运行中",
    finished: "完成",
    failed: "失败"
  }[status] || status || "-";
}

function stopPolling() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function refreshSelected() {
  if (!selectedJob.value?.id) return;
  try {
    selectedJob.value = await getImportJob(selectedJob.value.id);
    if (!isSelectedRunning.value) stopPolling();
  } catch (err) {
    stopPolling();
    error.value = err.message;
  }
}

function startPolling() {
  stopPolling();
  if (!isSelectedRunning.value) return;
  timer = setInterval(refreshSelected, 2000);
}

async function loadJobs() {
  loading.value = true;
  error.value = "";
  try {
    const data = await listImportJobs({ page: 1, limit: 50, ...filters });
    jobs.value = data.items || [];
    total.value = data.total || 0;
    if (!selectedJob.value && jobs.value.length) await selectJob(jobs.value[0]);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function selectJob(job) {
  stopPolling();
  loading.value = true;
  error.value = "";
  try {
    selectedJob.value = await getImportJob(job.id);
    startPolling();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadSources() {
  const data = await listSources();
  sources.value = data.items || [];
}

watch(filters, () => loadJobs());
onMounted(async () => {
  try {
    await loadSources();
    await loadJobs();
  } catch (err) {
    error.value = err.message;
  }
});
onUnmounted(stopPolling);
</script>

<template>
  <section class="task-view">
    <div class="page-heading">
      <div>
        <h2>导入任务</h2>
        <p>共 {{ total }} 个任务</p>
      </div>
      <button :disabled="loading" @click="loadJobs">刷新</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="workbench two-pane">
      <aside class="left-pane task-list-pane">
        <div class="filter-stack">
          <label>
            状态
            <select v-model="filters.status">
              <option value="">全部状态</option>
              <option value="queued">排队</option>
              <option value="running">运行中</option>
              <option value="finished">完成</option>
              <option value="failed">失败</option>
            </select>
          </label>
          <label>
            数据源
            <select v-model="filters.source_id">
              <option value="">全部数据源</option>
              <option v-for="source in sources" :key="source.id" :value="source.id">
                {{ source.name }}
              </option>
            </select>
          </label>
        </div>

        <div class="job-list">
          <button
            v-for="job in jobs"
            :key="job.id"
            class="job-row"
            :class="{ active: selectedJob?.id === job.id }"
            @click="selectJob(job)"
          >
            <strong>{{ job.source_name || job.source_id }}</strong>
            <small>{{ job.target_path || "/" }}</small>
            <span class="row-meta">
              <b :class="['status-pill', job.status]">{{ statusLabel(job.status) }}</b>
              <em>{{ job.success_count || 0 }}/{{ job.total_count || 0 }}</em>
            </span>
          </button>
          <p v-if="!jobs.length" class="empty-state">暂无导入任务</p>
        </div>
      </aside>

      <div class="right-pane">
        <div v-if="selectedJob" class="detail-surface">
          <div class="detail-header">
            <div>
              <h3>{{ selectedJob.source_name || "导入任务" }}</h3>
              <p>{{ selectedJob.target_path || "/" }}</p>
            </div>
            <button :disabled="loading" @click="refreshSelected">刷新明细</button>
          </div>
          <div class="stats task-stats">
            <span>状态 {{ statusLabel(selectedJob.status) }}</span>
            <span>总数 {{ selectedJob.total_count || 0 }}</span>
            <span>成功 {{ selectedJob.success_count || 0 }}</span>
            <span>跳过 {{ selectedJob.skipped_count || 0 }}</span>
            <span>失败 {{ selectedJob.failed_count || 0 }}</span>
          </div>
          <div class="source-meta compact-meta">
            <small>ID：{{ selectedJob.id }}</small>
            <small>开始：{{ selectedJob.started_at || "-" }}</small>
            <small>结束：{{ selectedJob.finished_at || "-" }}</small>
            <small v-if="isSelectedRunning">自动刷新中</small>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>路径</th>
                  <th>主体</th>
                  <th>套图</th>
                  <th>状态</th>
                  <th>结果</th>
                  <th>错误</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in jobItems" :key="item.id">
                  <td class="path-cell">{{ item.local_path }}</td>
                  <td>{{ item.detected_entity_name || "-" }}</td>
                  <td>{{ item.detected_album_title || "-" }}</td>
                  <td>{{ item.status }}</td>
                  <td>{{ item.action_result || "-" }}</td>
                  <td class="error-cell">{{ item.error || "-" }}</td>
                </tr>
                <tr v-if="!jobItems.length">
                  <td colspan="6">暂无任务明细</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="empty-detail">选择左侧任务查看执行明细</div>
      </div>
    </div>
  </section>
</template>
