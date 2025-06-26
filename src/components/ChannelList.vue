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
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router' // useRouterをインポート

export default {
  name: 'ChannelList',
  setup() {
    const store = useStore()
    const router = useRouter() // routerインスタンスを取得

    const channels = computed(() => store.getters.channels)
    const selectedChannelId = computed(() => store.state.selectedChannelId)
    const currentUser = computed(() => store.getters.currentUser) // ログイン中のユーザー情報を取得

    const selectChannel = (id) => {
      store.dispatch('selectChannel', id)
    }

    // ログアウト処理
    const handleLogout = () => {
      store.dispatch('logout') // logoutアクションを呼び出す
      router.push('/login') // ログイン画面にリダイレクト
    }

    return {
      channels,
      selectedChannelId,
      currentUser,
      selectChannel,
      handleLogout
    }
  }
}
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
}
li:hover {
  background-color: #e0e0e0;
}
li.active {
  background-color: #42b983;
  color: white;
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
</style>