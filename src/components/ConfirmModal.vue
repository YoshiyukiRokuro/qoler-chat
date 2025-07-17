<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button @click="$emit('cancel')" class="button-cancel">キャンセル</button>
        <button @click="$emit('confirm')" class="button-confirm">削除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '確認',
    },
    message: {
      type: String,
      default: 'この操作を実行してもよろしいですか？',
    },
  },
  emits: ['confirm', 'cancel'],
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
</style>