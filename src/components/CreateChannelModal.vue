<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>新しいチャンネルを作成</h3>
      <p>新しいチャンネルの名前を入力してください。</p>
      <input type="text" v-model.trim="channelName" placeholder="チャンネル名" ref="inputRef" @keyup.enter="handleConfirm" />
      <div class="modal-actions">
        <button @click="closeModal" class="button-cancel">キャンセル</button>
        <button @click="handleConfirm" class="button-confirm" :disabled="!channelName">
          作成
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from "vue";

export default {
  name: "CreateChannelModal",
  props: {
    show: Boolean,
  },
  emits: ["close", "confirm"],
  setup(props, { emit }) {
    const channelName = ref("");
    const inputRef = ref(null);

    const closeModal = () => {
      emit("close");
    };

    const handleConfirm = () => {
      if (channelName.value) {
        emit("confirm", channelName.value);
        channelName.value = ""; // Reset after confirm
      }
    };

    // モーダルが表示された時にテキストをリセットし、入力欄にフォーカスする
    watch(
      () => props.show,
      (newVal) => {
        if (newVal) {
          channelName.value = "";
          nextTick(() => {
            inputRef.value?.focus();
          });
        }
      }
    );

    return {
      channelName,
      inputRef,
      closeModal,
      handleConfirm,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  text-align: center;
}
.modal-content input {
  width: calc(100% - 22px);
  padding: 10px;
  margin: 10px 0 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1.1em;
}
h3 {
  margin-top: 0;
  color: #333;
}
p {
  color: #666;
  margin: 15px 0;
}
.modal-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}
button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.button-cancel {
  background-color: #f0f0f0;
  color: #333;
}
.button-cancel:hover {
  background-color: #e0e0e0;
}
.button-confirm {
  background-color: #42b983;
  color: white;
}
.button-confirm:hover {
  background-color: #36a374;
}
.button-confirm:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>