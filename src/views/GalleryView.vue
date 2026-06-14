<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  getGalleryAlbum,
  listGalleryAlbumAssets,
  listGalleryAlbums,
  listGalleryEntities,
  setGalleryAlbumCover,
  updateGalleryAlbum
} from "../api/client.js";
import { formatFileSize } from "../utils/format.js";

const filters = reactive({ search: "", visibility: "", media_type: "" });
const entities = ref([]);
const albums = ref([]);
const assets = ref([]);
const selectedEntityId = ref("");
const selectedAlbum = ref(null);
const editForm = reactive({ title: "", summary: "", visibility: "draft", restriction_level: 0 });
const loading = ref(false);
const error = ref("");
const message = ref("");

const albumsByEntity = computed(() => {
  return albums.value.reduce((map, album) => {
    if (!map[album.entity_id]) map[album.entity_id] = [];
    map[album.entity_id].push(album);
    return map;
  }, {});
});

const selectedAssets = computed(() => assets.value || []);

function fillForm(album) {
  editForm.title = album?.title || "";
  editForm.summary = album?.summary || "";
  editForm.visibility = album?.visibility || "draft";
  editForm.restriction_level = album?.restriction_level || 0;
}

function placeholderText(item) {
  return item?.media_type === "video" ? "VIDEO" : "IMG";
}

async function loadTree() {
  loading.value = true;
  error.value = "";
  try {
    const [entityData, albumData] = await Promise.all([
      listGalleryEntities({ ...filters }),
      listGalleryAlbums({ page: 1, limit: 200, ...filters })
    ]);
    entities.value = entityData.items || [];
    albums.value = albumData.items || [];

    if (!selectedEntityId.value && entities.value.length) selectedEntityId.value = entities.value[0].id;
    const stillVisible = selectedAlbum.value && albums.value.some(album => album.id === selectedAlbum.value.id);
    if (!stillVisible) {
      const firstAlbum = albumsByEntity.value[selectedEntityId.value]?.[0] || albums.value[0];
      if (firstAlbum) await selectAlbum(firstAlbum);
      else {
        selectedAlbum.value = null;
        assets.value = [];
      }
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function selectEntity(entityId) {
  selectedEntityId.value = entityId;
  const firstAlbum = albumsByEntity.value[entityId]?.[0];
  if (firstAlbum) await selectAlbum(firstAlbum);
}

async function selectAlbum(album) {
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    const [detail, assetData] = await Promise.all([
      getGalleryAlbum(album.id),
      listGalleryAlbumAssets(album.id, { media_type: filters.media_type })
    ]);
    selectedAlbum.value = detail;
    fillForm(detail);
    assets.value = assetData.items || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function saveAlbum() {
  if (!selectedAlbum.value) return;
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    const updated = await updateGalleryAlbum(selectedAlbum.value.id, { ...editForm });
    selectedAlbum.value = updated;
    fillForm(updated);
    message.value = "套图信息已保存";
    await loadTree();
    selectedAlbum.value = await getGalleryAlbum(updated.id);
    fillForm(selectedAlbum.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function chooseCover(asset) {
  if (!selectedAlbum.value || asset.media_type !== "image") return;
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    selectedAlbum.value = await setGalleryAlbumCover(selectedAlbum.value.id, asset.id);
    fillForm(selectedAlbum.value);
    const assetData = await listGalleryAlbumAssets(selectedAlbum.value.id, { media_type: filters.media_type });
    assets.value = assetData.items || [];
    message.value = "封面已更新";
    await loadTree();
    selectedAlbum.value = await getGalleryAlbum(selectedAlbum.value.id);
    fillForm(selectedAlbum.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(() => ({ ...filters }), () => loadTree());
onMounted(loadTree);
</script>

<template>
  <section class="gallery-workbench-view">
    <div class="page-heading">
      <div>
        <h2>图库维护</h2>
        <p>按主体和套图维护导入后的图库内容</p>
      </div>
      <button :disabled="loading" @click="loadTree">刷新</button>
    </div>
    <p v-if="message" class="notice">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="workbench gallery-maintenance">
      <aside class="left-pane gallery-tree-pane">
        <div class="filter-stack">
          <label>
            搜索
            <input v-model="filters.search" placeholder="主体或套图" />
          </label>
          <label>
            可见性
            <select v-model="filters.visibility">
              <option value="">全部</option>
              <option value="draft">草稿</option>
              <option value="listed">公开列表</option>
              <option value="unlisted">不列出</option>
              <option value="hidden">隐藏</option>
            </select>
          </label>
          <label>
            媒体
            <select v-model="filters.media_type">
              <option value="">全部媒体</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
            </select>
          </label>
        </div>

        <div class="entity-tree">
          <section v-for="entity in entities" :key="entity.id" class="entity-group">
            <button
              class="entity-row"
              :class="{ active: selectedEntityId === entity.id }"
              @click="selectEntity(entity.id)"
            >
              <span>{{ entity.name }}</span>
              <small>{{ entity.album_count }} 套 · {{ entity.image_count }} 图 · {{ entity.video_count }} 视频</small>
            </button>
            <div v-if="selectedEntityId === entity.id" class="album-menu">
              <button
                v-for="album in albumsByEntity[entity.id] || []"
                :key="album.id"
                class="album-menu-row"
                :class="{ active: selectedAlbum?.id === album.id }"
                @click="selectAlbum(album)"
              >
                <img v-if="album.cover_url" :src="album.cover_url" :alt="album.title" />
                <span v-else class="thumb-placeholder">IMG</span>
                <span class="album-menu-copy">
                  <strong>{{ album.title }}</strong>
                  <small>{{ album.image_count }} 图 · {{ album.video_count }} 视频 · {{ album.visibility }}</small>
                </span>
              </button>
              <p v-if="!(albumsByEntity[entity.id] || []).length" class="empty-state">暂无套图</p>
            </div>
          </section>
          <p v-if="!entities.length" class="empty-state">暂无主体</p>
        </div>
      </aside>

      <div class="right-pane gallery-detail-pane">
        <div v-if="selectedAlbum" class="detail-surface">
          <div class="album-detail-head">
            <div>
              <h3>{{ selectedAlbum.title }}</h3>
              <p>{{ selectedAlbum.entity_name }} · {{ selectedAlbum.image_count }} 图 · {{ selectedAlbum.video_count }} 视频</p>
            </div>
            <b class="status-pill">{{ selectedAlbum.visibility }}</b>
          </div>

          <form class="album-edit-grid" @submit.prevent="saveAlbum">
            <label>
              标题
              <input v-model="editForm.title" required />
            </label>
            <label>
              可见性
              <select v-model="editForm.visibility">
                <option value="draft">草稿</option>
                <option value="listed">公开列表</option>
                <option value="unlisted">不列出</option>
                <option value="hidden">隐藏</option>
              </select>
            </label>
            <label>
              限制等级
              <input v-model.number="editForm.restriction_level" type="number" min="0" />
            </label>
            <label class="summary-field">
              简介
              <textarea v-model="editForm.summary" rows="3"></textarea>
            </label>
            <div class="form-actions">
              <button :disabled="loading">保存套图</button>
            </div>
          </form>

          <div class="asset-toolbar">
            <h3>全部媒体</h3>
            <small>{{ selectedAssets.length }} 个资产</small>
          </div>
          <div class="asset-grid">
            <article v-for="asset in selectedAssets" :key="asset.id" class="asset-tile" :class="{ cover: asset.is_cover }">
              <img v-if="asset.media_type === 'image' && asset.url" :src="asset.url" :alt="asset.original_name" />
              <div v-else class="asset-placeholder">{{ placeholderText(asset) }}</div>
              <div class="asset-copy">
                <strong>{{ asset.original_name || asset.media_file_id }}</strong>
                <small>{{ asset.media_type }} · {{ formatFileSize(asset.file_size) }}</small>
              </div>
              <button
                v-if="asset.media_type === 'image'"
                :disabled="loading || asset.is_cover"
                @click="chooseCover(asset)"
              >
                {{ asset.is_cover ? "当前封面" : "设为封面" }}
              </button>
              <a v-else-if="asset.media_type === 'video' && asset.hls_url" class="asset-action" :href="asset.hls_url" target="_blank" rel="noreferrer">
                打开 HLS
              </a>
            </article>
            <p v-if="!selectedAssets.length" class="empty-state">当前套图暂无资产</p>
          </div>
        </div>
        <div v-else class="empty-detail">选择左侧套图查看全部媒体</div>
      </div>
    </div>
  </section>
</template>
