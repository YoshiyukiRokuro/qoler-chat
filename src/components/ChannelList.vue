<template>
  <div class="channel-list">
    <div class="channels-section">
      <h2>Channels</h2>
      <ul>
        <li
          v-for="channel in channels"
          :key="channel.id"
          @click="selectChannel(channel.id)"
          :class="{ active: channel.id === selectedChannelId }"
        >
          # {{ channel.name }}
          <span v-if="unreadCounts[channel.id] > 0" class="unread-badge">
            {{ unreadCounts[channel.id] }}
          </span>
        </li>
      </ul>
    </div>

    <div class="online-users-section">
      <h2>Online - {{ onlineUsers.length }}</h2>
      <ul>
        <li v-for="user in onlineUsers" :key="user" class="online-user">
          <span class="online-indicator">●</span> {{ user }}
        </li>
      </ul>
    </div>

    <div class="user-section">
      <div v-if="currentUser" class="current-user">
        <span class="username">{{ currentUser.username }}</span>
        <button @click="handleLogout" class="logout-button">ログアウト</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'ChannelList',
  setup() {
    const store = useStore();
    const router = useRouter();

    const channels = computed(() => store.getters.channels);
    const selectedChannelId = computed(() => store.state.selectedChannelId);
    const currentUser = computed(() => store.getters.currentUser);
    const onlineUsers = computed(() => store.getters.onlineUsers);
    const unreadCounts = computed(() => store.getters.unreadCounts);

    const selectChannel = (id) => {
      store.dispatch('selectChannel', id);
    };

    const handleLogout = () => {
      store.dispatch('logout');
      router.push('/login');
    };

    onMounted(() => {
      store.dispatch('fetchUnreadCounts');
    });

    return {
      channels,
      selectedChannelId,
      currentUser,
      onlineUsers,
      unreadCounts,
      selectChannel,
      handleLogout
    };
  }
};
</script>

<style scoped>
.channel-list {
  width: 220px;
  background-color: #f2f3f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.channels-section {
  padding: 10px;
}
h2 {
  padding-left: 10px;
  font-size: 1em;
  color: #666;
}
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
li {
  padding: 10px 20px;
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

/* オンラインユーザーセクションのスタイル */
.online-users-section {
  padding: 10px;
  flex-grow: 1; /* 空いたスペースを埋める */
  overflow-y: auto;
}
.online-user {
  padding: 5px 20px;
  color: #333;
  font-weight: normal;
  font-size: 0.9em;
  display: flex;
  align-items: center;
}
.online-indicator {
  color: #42b983; /* オンラインを示す緑色 */
  margin-right: 8px;
  font-size: 0.8em;
}


.user-section {
  padding: 15px;
  border-top: 1px solid #ddd;
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
.logout-button:hover {
  background-color: #f0f0f0;
}

.unread-badge {
  background-color: #f04747;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.75em;
  font-weight: bold;
  margin-left: 10px;
}
</style>