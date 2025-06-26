<template>
  <div class="channel-list">
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
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ChannelList',
  setup() {
    const store = useStore()

    const channels = computed(() => store.getters.channels)
    const selectedChannelId = computed(() => store.state.selectedChannelId)

    const selectChannel = (id) => {
      store.dispatch('selectChannel', id)
    }

    return {
      channels,
      selectedChannelId,
      selectChannel
    }
  }
}
</script>

<style scoped>
.channel-list {
  width: 200px;
  background-color: #f2f3f5;
  padding: 10px;
  border-right: 1px solid #ddd;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}
li:hover {
  background-color: #e0e0e0;
}
li.active {
  background-color: #42b983;
  color: white;
}
</style>