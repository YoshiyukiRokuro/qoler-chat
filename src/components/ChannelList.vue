<template>
  <div class="channel-list">
    <div class="user-section">
      <div v-if="currentUser" class="current-user">
        <span class="username">{{ currentUser.username }}</span>
        <button @click="handleLogout" class="logout-button">ログアウト</button>
      </div>
    </div>

    <div class="channels-section">
      <div class="channels-header">
        <h2>チャンネル</h2>
        <button @click="showCreateModal = true" class="add-channel-button" title="新しいチャンネルを作成">+</button>
      </div>
      <ul>
        <li v-for="channel in publicChannels" :key="channel.id" @click="selectChannel(channel.id)" :class="{ active: channel.id === selectedChannelId }">
          <span class="channel-name"># {{ channel.name }}</span>
          <div class="channel-actions">
            <span v-if="unreadCounts[channel.id] > 0" class="unread-badge">
              {{ unreadCounts[channel.id] }}
            </span>
            <button v-if="channel.is_deletable" @click.stop="promptDeleteChannel(channel)" class="delete-channel-button" title="チャンネルを削除">
              ×
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div class="channels-section">
      <div class="channels-header">
        <h2>グループ</h2>
        <button @click="promptCreateGroup" class="add-channel-button" title="新しいグループを作成">+</button>
      </div>
      <ul>
        <li v-for="channel in groupChannels" :key="channel.id" @click="selectChannel(channel.id)" :class="{ active: channel.id === selectedChannelId }">
          <span class="channel-name"># {{ channel.name }}</span>
          <div class="channel-actions">
            <span v-if="unreadCounts[channel.id] > 0" class="unread-badge">
              {{ unreadCounts[channel.id] }}
            </span>
            <button @click.stop="promptDeleteChannel(channel)" class="delete-channel-button" title="グループを削除">
              ×
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div class="online-users-section">
      <h2>接続者：{{ onlineUsers.length }}人</h2>
      <ul>
        <li v-for="user in onlineUsers" :key="user" class="online-user">
          <span class="online-indicator">●&nbsp;&nbsp;<span style="color:dimgray">{{ user }}</span></span>
        </li>
      </ul>
    </div>

    <CreateChannelModal :show="showCreateModal" @close="showCreateModal = false" @confirm="handleCreateChannel" />

    <DeleteChannelModal :show="showDeleteModal" :channel="channelToDelete" @close="showDeleteModal = false" @confirm="handleDeleteChannel" />

    <CreateGroupModal :show="showCreateGroupModal" @close="showCreateGroupModal = false" @confirm="handleCreateGroup" />
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import DeleteChannelModal from "./DeleteChannelModal.vue";
import CreateChannelModal from "./CreateChannelModal.vue";
import CreateGroupModal from "./CreateGroupModal.vue";

export default {
  name: "ChannelList",
  components: {
    DeleteChannelModal,
    CreateChannelModal,
    CreateGroupModal,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const toast = useToast();

    const publicChannels = computed(() => store.getters.publicChannels);
    const groupChannels = computed(() => store.getters.groupChannels);
    const selectedChannelId = computed(() => store.state.selectedChannelId);
    const currentUser = computed(() => store.getters.currentUser);
    const onlineUsers = computed(() => store.getters.onlineUsers);
    const unreadCounts = computed(() => store.getters.unreadCounts);

    const showCreateModal = ref(false);
    const showDeleteModal = ref(false);
    const channelToDelete = ref(null);
    const showCreateGroupModal = ref(false);

    const selectChannel = (id) => {
      store.dispatch("selectChannel", id);
    };

    const handleLogout = () => {
      store.dispatch("logout");
      router.push("/login");
    };

    const handleCreateChannel = async (channelName) => {
      if (channelName && channelName.trim()) {
        try {
          await store.dispatch("createChannel", channelName.trim());
          showCreateModal.value = false;
          toast.success(`チャンネル "${channelName.trim()}" を作成しました。`);
        } catch (error) {
          toast.error(
            error.response?.data?.error || "チャンネルの作成に失敗しました。"
          );
        }
      }
    };

    const promptDeleteChannel = (channel) => {
      channelToDelete.value = channel;
      showDeleteModal.value = true;
    };

    const handleDeleteChannel = async () => {
      if (channelToDelete.value) {
        try {
          await store.dispatch("deleteChannel", channelToDelete.value.id);
          showDeleteModal.value = false;
          toast.success(
            `チャンネル "${channelToDelete.value.name}" を削除しました。`
          );
        } catch (error) {
          toast.error(
            error.response?.data?.error || "チャンネルの削除に失敗しました。"
          );
        }
      }
    };

    // グループ作成モーダルを開く前の処理
    const promptCreateGroup = async () => {
      try {
        await store.dispatch("fetchAllUsers"); // 最新のユーザーリストを取得
        showCreateGroupModal.value = true; // モーダルを表示
      } catch (error) {
        toast.error("ユーザーリストの取得に失敗しました。");
      }
    };

    const handleCreateGroup = async ({ name, memberIds }) => {
      if (name && memberIds.length > 0) {
        try {
          await store.dispatch("createGroupChannel", { name, memberIds });
          showCreateGroupModal.value = false;
          toast.success(`グループ "${name}" を作成しました。`);
        } catch (error) {
          toast.error(
            error.response?.data?.error || "グループの作成に失敗しました。"
          );
        }
      }
    };

    onMounted(() => {
      if (store.getters.isAuthenticated) {
        store.dispatch("fetchChannels");
        store.dispatch("fetchUnreadCounts");
      }
    });

    return {
      publicChannels,
      groupChannels,
      selectedChannelId,
      currentUser,
      onlineUsers,
      unreadCounts,
      selectChannel,
      handleLogout,
      showCreateModal,
      handleCreateChannel,
      showDeleteModal,
      channelToDelete,
      promptDeleteChannel,
      handleDeleteChannel,
      showCreateGroupModal,
      promptCreateGroup,
      handleCreateGroup,
    };
  },
};
</script>

<style scoped>
.channel-list {
  width: 240px;
  background-color: #f2f3f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.user-section {
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #e8e9eb;
}
.current-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.username {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-button {
  padding: 4px 8px;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
}
.channels-section {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}
.channels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
h2 {
  padding-left: 10px;
  font-size: 1em;
  color: #666;
  margin: 0;
}
.add-channel-button {
  background: none;
  border: none;
  font-size: 1.6em;
  font-weight: bold;
  cursor: pointer;
  color: #666;
  padding: 0 5px;
  line-height: 1;
}
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
li {
  padding: 8px 15px;
  cursor: pointer;
  border-radius: 5px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
li:hover {
  background-color: #e0e0e0;
}
li.active {
  background-color: #42b983;
  color: white;
}
.channel-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.channel-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding-left: 10px;
}
.delete-channel-button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.4em;
  line-height: 1;
  padding: 0 0 0 5px;
  opacity: 0.5;
  visibility: hidden;
}
li:hover .delete-channel-button {
  visibility: visible;
}
.unread-badge {
  background-color: #f04747;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.75em;
  font-weight: bold;
  margin-left: 5px;
}
.online-users-section {
  padding: 10px;
  flex-grow: 1;
  overflow-y: auto;
}
.online-user {
  padding: 5px 15px;
}
.online-indicator {
  color: #42b983;
}

</style>