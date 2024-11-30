<template>
  <div v-if="isVisible" class="field-wrapper">
    <template v-if="isStringValue">
      <div class="field-row">
        <json-field ref="fieldRef" :label="path" :value="value" :is-active="activeField === path"
          :show-delete="!readonly && allowRemoveFields"
          :show-convert-to-object="!readonly && allowCreateNewFields && !value" :readonly="readonly"
          @delete="showDeleteDialog = true" @convert-to-object="convertToNested" @update="emitUpdate" />
      </div>
    </template>
    <div v-else class="nested-group">
      <div class="nested-header">
        <v-text>{{ path }}</v-text>
        <div class="header-actions">
          <v-button v-if="!readonly && allowRemoveFields" x-small icon class="danger" @click="showDeleteDialog = true">
            <v-icon name="delete" />
          </v-button>
          <v-button v-if="!readonly && allowCreateNewFields" x-small icon @click="showAddFieldDialog = true"
            class="success">
            <v-icon name="add" />
          </v-button>
        </div>
      </div>
      <recursive-field v-for="(childValue, childKey) in value" :key="childKey" :field-key="childKey" :value="childValue"
        :active-field="activeField" :path="`${path}.${childKey}`" :allow-create-new-fields="allowCreateNewFields"
        :allow-remove-fields="allowRemoveFields" :search-query="searchQuery" :readonly="readonly"
        @update="(path, newValue) => $emit('update', path, newValue)"
        @update:active-field="(path) => $emit('update:active-field', path)" />
    </div>

    <v-dialog v-model="showDeleteDialog" @esc="showDeleteDialog = false">
      <v-card>
        <v-card-title>Delete Field</v-card-title>
        <v-card-text>
          Are you sure you want to delete the field "{{ path }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-button secondary @click="showDeleteDialog = false">
            Cancel
          </v-button>
          <v-button danger :loading="isDeleting" @click="deleteField">
            Delete
          </v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddFieldDialog" @esc="showAddFieldDialog = false">
      <v-card>
        <v-card-title>Add New Field to {{ path }}</v-card-title>
        <v-card-text>
          <div class="field-path">
            <span class="path-prefix">{{ path }}.</span>
            <v-input v-model="newFieldKey" placeholder="Enter field name" :disabled="isCreatingField" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-button secondary @click="showAddFieldDialog = false">
            Cancel
          </v-button>
          <v-button :loading="isCreatingField" @click="createNewField">
            Add Field
          </v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { computed, ref, nextTick } from 'vue';
import JsonField from './field.vue';

export default {
  name: 'RecursiveField',
  components: {
    JsonField
  },
  props: {
    fieldKey: {
      type: String,
      required: true
    },
    value: {
      type: [String, Object],
      required: true
    },
    activeField: {
      type: String,
      default: null
    },
    path: {
      type: String,
      required: true
    },
    allowCreateNewFields: {
      type: Boolean,
      default: false
    },
    allowRemoveFields: {
      type: Boolean,
      default: false
    },
    searchQuery: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update', 'update:active-field'],
  setup(props, { emit }) {
    const isStringValue = computed(() => typeof props.value === 'string');
    const showAddFieldDialog = ref(false);
    const showDeleteDialog = ref(false);
    const newFieldKey = ref('');
    const isCreatingField = ref(false);
    const isDeleting = ref(false);
    const fieldRef = ref(null);

    function emitUpdate(newValue) {
      emit('update', props.path, newValue);
    }

    function deleteField() {
      isDeleting.value = true;

      try {
        emit('update', props.path, undefined);
      } catch (error) {
        console.error('Error deleting field:', error);
      }

      isDeleting.value = false;
      showDeleteDialog.value = false;
    }

    function createNewField() {
      if (!newFieldKey.value) return;

      isCreatingField.value = true;

      const updatedValue = typeof props.value === 'string' ? {} : { ...props.value };
      updatedValue[newFieldKey.value] = '';

      const newFieldPath = `${props.path}.${newFieldKey.value}`;

      emit('update', props.path, updatedValue);
      emit('update:active-field', newFieldPath);

      nextTick(() => {
        const newField = document.querySelector(`[data-path="${newFieldPath}"]`);
        newField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      isCreatingField.value = false;
      newFieldKey.value = '';
      showAddFieldDialog.value = false;
    }

    function convertToNested() {
      showAddFieldDialog.value = true;
    }

    const isVisible = computed(() => {
      if (!props.searchQuery) return true;

      const query = props.searchQuery.toLowerCase();

      const fullPath = props.path.toLowerCase();
      if (fullPath.includes(query)) {
        return true;
      }

      if (isStringValue.value) {
        return props.value.toLowerCase().includes(query);
      }

      function hasMatchingChild(obj, parentPath) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;

          if (currentPath.toLowerCase().includes(query)) {
            return true;
          }

          if (typeof value === 'string') {
            if (value.toLowerCase().includes(query)) {
              return true;
            }
          } else if (typeof value === 'object' && value !== null) {
            if (hasMatchingChild(value, currentPath)) {
              return true;
            }
          }
        }
        return false;
      }

      return typeof props.value === 'object' && hasMatchingChild(props.value, props.path);
    });

    return {
      isStringValue,
      emitUpdate,
      showAddFieldDialog,
      showDeleteDialog,
      newFieldKey,
      isCreatingField,
      isDeleting,
      createNewField,
      deleteField,
      convertToNested,
      fieldRef,
      isVisible
    };
  }
};
</script>

<style scoped>
.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: calc(var(--content-padding) / 4);
}

.nested-group {
  padding: calc(var(--content-padding) / 2);
  border: 1px solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
  border-radius: var(--v-input-border-radius, var(--theme--border-radius));
  background: rgba(225, 225, 225, 0.1);
  display: flex;
  flex-direction: column;
  gap: calc(var(--content-padding) / 4);
}

.nested-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(var(--content-padding) / 4);
}

.field-path {
  display: flex;
  align-items: center;
  gap: 4px;
}

.path-prefix {
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-actions .v-button {
  opacity: 0.5;
  transition: opacity var(--fast) var(--transition);
}

.header-actions .v-button:hover {
  opacity: 1;
}
</style>