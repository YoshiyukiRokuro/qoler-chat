<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>新しいグループを作成</h3>
      <input
        type="text"
        v-model.trim="groupName"
        placeholder="グループ名"
        ref="inputRef"
      />
      <h4>メンバーを選択</h4>
      <div class="user-list">
        <div v-for="user in users" :key="user.id" class="user-item">
          <label>
            <input type="checkbox" :value="user.id" v-model="selectedMemberIds" />
            {{ user.username }}
          </label>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="closeModal" class="button-cancel">キャンセル</button>
        <button @click="handleConfirm" class="button-confirm" :disabled="!isFormValid">
          作成
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'CreateGroupModal',
  props: {
    show: Boolean,
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const store = useStore();
    const groupName = ref('');
    const selectedMemberIds = ref([]);
    const inputRef = ref(null);

    const currentUser = computed(() => store.getters.currentUser);
    const users = computed(() => store.getters.allUsers.filter(u => u.id !== currentUser.value?.id));
    const isFormValid = computed(() => groupName.value && selectedMemberIds.value.length > 0);
    
    const closeModal = () => {
      emit('close');
    };

    const handleConfirm = () => {
      if (isFormValid.value) {
        emit('confirm', { name: groupName.value, memberIds: selectedMemberIds.value });
      }
    };

    watch(() => props.show, (newVal) => {
      if (newVal) {
        groupName.value = '';
        selectedMemberIds.value = [];
        nextTick(() => {
          inputRef.value?.focus();
        });
      }
    });

    return {
      groupName,
      users,
      selectedMemberIds,
      inputRef,
      isFormValid,
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
input[type="text"] {
  width: calc(100% - 22px);
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.user-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
  text-align: left;
}
.user-item {
  margin-bottom: 5px;
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
.button-confirm {
  background-color: #42b983;
  color: white;
}
.button-confirm:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>