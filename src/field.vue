<template>
  <div class="field" :data-path="label">
    <div class="label-row">
      <div class="label type-label">{{ label }}</div>
      <v-chip v-if="isDirty" x-small class="modified-chip">Modified</v-chip>
      <div class="field-actions">
        <v-button v-if="showDelete" x-small icon class="delete-button danger" @click="$emit('delete')">
          <v-icon name="delete" small />
        </v-button>
        <v-button v-if="showConvertToObject" class="success" x-small icon @click="$emit('convert-to-object')">
          <v-icon name="add" />
        </v-button>
      </div>
    </div>
    <v-input 
      ref="inputRef" 
      :model-value="value" 
      @update:model-value="handleInput" 
      :class="{ 
        active: isActive,
        dirty: isDirty 
      }"
      :disabled="readonly" 
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue';

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
    originalValue: {
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

    const isDirty = computed(() => {
      return props.value !== props.originalValue;
    });

    function handleInput(value) {
      if (props.readonly) return;
      emit('update', value ?? '');
    }

    return {
      handleInput,
      inputRef,
      isDirty
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

.field :deep(.v-input.dirty) {
  --v-input-border-color: var(--theme--primary) !important;
  --v-input-background-color: var(--theme--primary-background) !important;
}

.field :deep(.v-input.dirty:hover) {
  --v-input-border-color: var(--theme--primary-150) !important;
}

.field :deep(.v-input.dirty:focus) {
  --v-input-border-color: var(--theme--primary) !important;
  --v-input-background-color: var(--theme--primary-background) !important;
}
</style>