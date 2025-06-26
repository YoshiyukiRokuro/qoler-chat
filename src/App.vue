<template>
  <div id="chat-container">
    <ChannelList />
    <div class="chat-area">
      <MessageList />
      <MessageForm />
    </div>
  </div>
</template>

<script>
import ChannelList from './components/ChannelList.vue'
import MessageList from './components/MessageList.vue'
import MessageForm from './components/MessageForm.vue'

export default {
  name: 'App',
  components: {
    ChannelList,
    MessageList,
    MessageForm
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  margin: 0;
}

#chat-container {
  display: flex;
  height: 100%;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>