<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3 v-if="channel">チャンネル「#{{ channel.name }}」を削除</h3>
      <p>この操作は取り消せません。チャンネル内のすべてのメッセージが削除されます。</p>
      <p>削除するには、「<strong style="color: #e53935;">SAKUJYO</strong>」と入力してください。</p>
      <input type="text" v-model="confirmationText" placeholder="SAKUJYO" @keyup.enter="confirmDelete" />
      <div class="modal-actions">
        <button @click="closeModal" class="button-cancel">キャンセル</button>
        <button @click="confirmDelete" class="button-confirm" :disabled="!isConfirmed">
          削除
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'DeleteChannelModal',
  props: {
    show: Boolean,
    channel: Object,
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const confirmationText = ref('');
    const isConfirmed = computed(() => confirmationText.value === 'SAKUJYO');

    const closeModal = () => {
      emit('close');
    };

    const confirmDelete = () => {
      if (isConfirmed.value) {
        emit('confirm');
      }
    };

    watch(() => props.show, (newVal) => {
      if (!newVal) {
        confirmationText.value = '';
      }
    });

    return {
      confirmationText,
      isConfirmed,
      closeModal,
      confirmDelete,
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
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
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
  margin-top: 25px;
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
  background-color: #e53935;
  color: white;
}
.button-confirm:hover {
  background-color: #d32f2f;
}
.button-confirm:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>