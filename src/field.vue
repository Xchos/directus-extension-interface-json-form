<template>
  <div class="field" :data-path="label">
    <div class="label-row">
      <div class="label type-label">{{ label }}</div>
      <div class="field-actions">
        <v-button v-if="showDelete" x-small icon class="delete-button danger" @click="$emit('delete')">
          <v-icon name="delete" small />
        </v-button>
        <v-button v-if="showConvertToObject" class="success" x-small icon @click="$emit('convert-to-object')">
          <v-icon name="add" />
        </v-button>
      </div>
    </div>
    <v-input ref="inputRef" :model-value="value" @update:model-value="handleInput" :class="{ active: isActive }"
      :disabled="readonly" />
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    showDelete: {
      type: Boolean,
      default: false
    },
    showConvertToObject: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update', 'delete', 'convert-to-object'],
  setup(props, { emit }) {
    const inputRef = ref(null);

    function handleInput(value) {
      if (props.readonly) return;
      emit('update', value ?? '');
    }

    return {
      handleInput,
      inputRef
    };
  }
};
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.field-actions .v-button {
  opacity: 0.5;
  transition: opacity var(--fast) var(--transition);
}

.field-actions .v-button:hover {
  opacity: 1;
}

.field :deep(.v-input.disabled) {
  --v-input-color: var(--theme--foreground-subdued);
  cursor: not-allowed;
  background-color: var(--theme--background-subdued);
}
</style>