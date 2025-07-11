<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" v-if="channel">
      <h3>グループ設定: #{{ channel.name }}</h3>

      <div class="form-section">
        <h4>グループ名変更</h4>
        <div class="input-group">
          <input type="text" v-model="newGroupName" />
          <button @click="updateName" :disabled="!newGroupName || newGroupName === channel.name">変更</button>
        </div>
      </div>

      <div class="form-section">
        <h4>メンバー管理 ({{ currentMembers.length }}人)</h4>
        <div class="member-list">
          <div v-for="member in currentMembers" :key="member.id" class="member-item">
            <span>{{ member.username }}</span>
            <button @click="removeMember(member.id)" class="remove-button" title="削除">×</button>
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h4>メンバー追加</h4>
        <div class="input-group">
            <select v-model="selectedUserToAdd">
                <option disabled value="">追加するユーザーを選択</option>
                <option v-for="user in addableUsers" :key="user.id" :value="user.id">
                    {{ user.username }}
                </option>
            </select>
            <button @click="addMember" :disabled="!selectedUserToAdd">追加</button>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')" class="button-cancel">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'ManageGroupModal',
  props: {
    show: Boolean,
    channelId: Number, // ★★★【修正】★★★ channelオブジェクトからchannelIdに変更
  },
  emits: ['close'],
  setup(props, { emit }) {
    const store = useStore();
    const toast = useToast();
    const newGroupName = ref('');
    const selectedUserToAdd = ref('');

    // ★★★【修正】★★★ channelId propから最新のチャンネル情報を取得
    const channel = computed(() => store.state.channels.find(c => c.id === props.channelId));
    
    const allUsers = computed(() => store.getters.allUsers);
    const currentMembers = computed(() => store.state.channelMembers[props.channelId] || []);
    const currentUser = computed(() => store.getters.currentUser);

    const addableUsers = computed(() => {
      const memberIds = new Set(currentMembers.value.map(m => m.id));
      return allUsers.value.filter(u => !memberIds.has(u.id));
    });

    watch(() => props.show, (newVal) => {
      if (newVal && channel.value) {
        newGroupName.value = channel.value.name;
        store.dispatch('fetchChannelMembers', props.channelId);
      }
    });

    const updateName = async () => {
        try {
            await store.dispatch('updateChannelName', { channelId: props.channelId, name: newGroupName.value });
            toast.success('グループ名を変更しました。');
            emit('close');
        } catch(error) {
            toast.error(error.response?.data?.error ||'名前の変更に失敗しました。');
        }
    };
    
    const addMember = async () => {
        if (!selectedUserToAdd.value) return;
        try {
            await store.dispatch('addMembersToChannel', { channelId: props.channelId, userIds: [selectedUserToAdd.value] });
            toast.success('メンバーを追加しました。');
            selectedUserToAdd.value = '';
            await store.dispatch('fetchChannelMembers', props.channelId);
        } catch(error) {
            toast.error(error.response?.data?.error || 'メンバーの追加に失敗しました。');
        }
    };

    const removeMember = async (userId) => {
        if(userId === currentUser.value.id) {
            toast.error('自分自身をグループから削除することはできません。');
            return;
        }
        if (currentMembers.value.length <= 1) {
            toast.error('グループには最低1人のメンバーが必要です。');
            return;
        }
        try {
            await store.dispatch('removeMembersFromChannel', { channelId: props.channelId, userIds: [userId] });
            toast.success('メンバーを削除しました。');
            await store.dispatch('fetchChannelMembers', props.channelId);
        } catch(error) {
            toast.error(error.response?.data?.error || 'メンバーの削除に失敗しました。');
        }
    };

    return { channel, newGroupName, currentMembers, addableUsers, selectedUserToAdd, updateName, addMember, removeMember };
  },
};
</script>

<style scoped>
/* スタイルは変更なし */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background-color: white; padding: 20px 30px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); width: 90%; max-width: 450px; }
.form-section { margin-bottom: 20px; }
h3, h4 { text-align: center; margin-top: 0; margin-bottom: 10px; }
.input-group { display: flex; }
.input-group input, .input-group select { flex: 1; margin-right: 10px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;}
.member-list { max-height: 120px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
.member-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.remove-button { background-color: #fdd; color: #f00; border: 1px solid #f00; border-radius: 50%; width: 20px; height: 20px; line-height: 1; padding: 0; cursor: pointer; }
.modal-actions { margin-top: 25px; display: flex; justify-content: flex-end; gap: 15px; }
button { padding: 8px 12px; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; }
.button-cancel { background-color: #f0f0f0; }
</style>