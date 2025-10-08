<template>
  <div v-if="isVisible" class="field-wrapper">
    <template v-if="isStringValue">
      <div class="field-row">
        <json-field
          ref="fieldRef"
          :label="path"
          :value="value"
          :original-value="originalValue"
          :is-active="activeField === path"
          :show-delete="!readonly && allowRemoveFields"
          :show-convert-to-object="!readonly && allowCreateNewFields && !value"
          :readonly="readonly"
          :enable-wysiwyg="enableWysiwyg"
          @delete="() => { currentDeletePath = path; showDeleteDialog = true }"
          @convert-to-object="convertToNested"
          @update="emitUpdate"
        />
      </div>
    </template>
    <div v-else class="nested-group">
      <div class="nested-header">
        <v-text>{{ path }}</v-text>
        <div class="header-actions">
          <v-button
            v-if="!readonly && allowRemoveFields"
            x-small
            icon
            class="danger"
            @click="() => { currentDeletePath = path; showDeleteDialog = true }"
            v-tooltip.left="'Delete this object and all its fields'"
          >
            <v-icon name="delete" />
          </v-button>
          <v-button
            v-if="!readonly && allowCreateNewFields"
            x-small
            icon
            @click="() => { currentAddPath = path; showAddFieldDialog = true }"
            class="success"
            v-tooltip.left="'Add field to this object'"
          >
            <v-icon name="add" />
          </v-button>
        </div>
      </div>
      <div
        v-for="entry in flatFields"
        :key="entry.path"
        :style="{ paddingLeft: `${entry.depth * 16}px` }"
      >
        <div v-if="entry.isObject" class="nested-group">
          <div class="nested-header">
            <v-text>{{ entry.path }}</v-text>
            <div class="header-actions">
              <v-button
                v-if="!readonly && allowRemoveFields"
                x-small
                icon
                class="danger"
                @click="() => { currentDeletePath = entry.path; showDeleteDialog = true }"
                v-tooltip.left="'Delete this object and all its fields'"
              >
                <v-icon name="delete" />
              </v-button>
              <v-button
                v-if="!readonly && allowCreateNewFields"
                x-small
                icon
                @click="() => { currentAddPath = entry.path; showAddFieldDialog = true }"
                class="success"
                v-tooltip.left="'Add field to this object'"
              >
                <v-icon name="add" />
              </v-button>
            </div>
          </div>
        </div>
        <div v-else class="field-row">
          <json-field
            :label="entry.path"
            :value="entry.value"
            :original-value="entry.originalValue"
            :is-active="activeField === entry.path"
            :show-delete="!readonly && allowRemoveFields"
            :show-convert-to-object="!readonly && allowCreateNewFields && !entry.value"
            :readonly="readonly"
            :enable-wysiwyg="enableWysiwyg"
            @delete="() => { currentDeletePath = entry.path; showDeleteDialog = true }"
            @convert-to-object="() => { currentAddPath = entry.path; showAddFieldDialog = true }"
            @update="(newValue) => emitUpdate(entry.path, newValue)"
          />
        </div>
      </div>
    </div>

    <v-dialog v-model="showDeleteDialog" @esc="showDeleteDialog = false">
      <v-card>
        <v-card-title>Delete Field</v-card-title>
        <v-card-text>
          Are you sure you want to delete the field "{{ currentDeletePath }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-button secondary @click="showDeleteDialog = false" v-tooltip.bottom="'Cancel deletion'">
            Cancel
          </v-button>
          <v-button danger :loading="isDeleting" @click="deleteField" v-tooltip.bottom="'Permanently delete this field'">
            Delete
          </v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddFieldDialog" @esc="showAddFieldDialog = false">
      <v-card>
        <v-card-title>Add New Field to {{ currentAddPath }}</v-card-title>
        <v-card-text>
          <div class="field-path">
            <span class="path-prefix">{{ currentAddPath }}.</span>
            <v-input
              v-model="newFieldKey"
              placeholder="Enter field name"
              :disabled="isCreatingField"
              @keydown.enter.prevent="createNewField"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-button secondary @click="showAddFieldDialog = false" v-tooltip.bottom="'Cancel adding field'">
            Cancel
          </v-button>
          <v-button
            :loading="isCreatingField"
            @click="createNewField"
            :disabled="!newFieldKey"
            v-tooltip.bottom="!newFieldKey ? 'Enter a field name first' : 'Add this new field'"
          >
            <v-icon name="add" />
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
    originalValue: {
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
    },
    enableWysiwyg: {
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
    const currentAddPath = ref('');
    const currentDeletePath = ref('');

    function getNestedValue(obj, path) {
      if (!path || path === props.path) return obj;
      const relativePath = path.substring(props.path.length + 1);
      return relativePath.split('.').reduce((current, key) => current && current[key], obj);
    }

    function emitUpdate(path, newValue) {
      emit('update', path, newValue);
    }

    function deleteField() {
      isDeleting.value = true;
      try {
        emitUpdate(currentDeletePath.value, undefined);
      } catch (error) {
        console.error('Error deleting field:', error);
      }
      isDeleting.value = false;
      showDeleteDialog.value = false;
    }

    function createNewField() {
      if (!newFieldKey.value) return;
      isCreatingField.value = true;

      const parentPath = currentAddPath.value;
      const currentValue = getNestedValue(props.value, parentPath);

      let updatedValue;
      if (typeof currentValue !== 'object' || currentValue === null) {
        updatedValue = { [newFieldKey.value]: '' };
      } else {
        updatedValue = { ...currentValue, [newFieldKey.value]: '' };
      }

      emitUpdate(parentPath, updatedValue);

      const newFieldPath = `${parentPath}.${newFieldKey.value}`;
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
      currentAddPath.value = props.path;
      showAddFieldDialog.value = true;
    }

    const query = computed(() => props.searchQuery.toLowerCase());

    const isVisible = computed(() => {
      if (!props.searchQuery) return true;

      const q = query.value;
      const fullPath = props.path.toLowerCase();

      if (fullPath.includes(q)) return true;

      if (isStringValue.value) {
        const v = props.value?.toLowerCase() || '';
        const ov = (typeof props.originalValue === 'string' ? props.originalValue : '').toLowerCase();
        return v.includes(q) || ov.includes(q);
      }

      const stack = Object.entries(props.value || {}).map(([key, val]) => ({
        obj: val,
        path: `${props.path}.${key}`,
        original: (props.originalValue || {})[key] || val
      })).reverse();

      while (stack.length) {
        const { obj, path, original } = stack.pop();

        if (path.toLowerCase().includes(q)) return true;

        if (typeof obj === 'string') {
          const v = obj.toLowerCase();
          const ov = (typeof original === 'string' ? original : '').toLowerCase();
          if (v.includes(q) || ov.includes(q)) return true;
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, val] of Object.entries(obj).reverse()) {
            const childPath = `${path}.${key}`;
            const origVal = original ? original[key] : val;
            stack.push({ obj: val, path: childPath, original: origVal });
          }
        }
      }

      return false;
    });

    const flatFields = computed(() => {
      if (isStringValue.value || !props.value) return [];

      const flat = [];
      const stack = Object.entries(props.value).map(([key, val]) => ({
        obj: val,
        path: `${props.path}.${key}`,
        depth: 1,
        original: (props.originalValue || {})[key] || val
      })).reverse();

      while (stack.length) {
        const { obj, path, depth, original } = stack.pop();
        const isObject = typeof obj === 'object' && obj !== null;

        flat.push({
          path,
          value: obj,
          originalValue: original,
          depth,
          isObject
        });

        if (isObject) {
          for (const [key, val] of Object.entries(obj).reverse()) {
            const childPath = `${path}.${key}`;
            const origVal = original ? original[key] : val;
            stack.push({
              obj: val,
              path: childPath,
              depth: depth + 1,
              original: origVal
            });
          }
        }
      }

      if (!props.searchQuery) return flat;

      const visible = new Set();
      const matchStack = Object.entries(props.value).map(([key, val]) => ({
        obj: val,
        path: `${props.path}.${key}`,
        original: (props.originalValue || {})[key] || val
      })).reverse();

      const q = query.value;

      while (matchStack.length) {
        const { obj, path, original } = matchStack.pop();
        const currPath = path.toLowerCase();
        let matched = false;

        if (currPath.includes(q)) {
          matched = true;
        } else if (typeof obj === 'string') {
          const v = obj.toLowerCase();
          const ov = (typeof original === 'string' ? original : '').toLowerCase();
          if (v.includes(q) || ov.includes(q)) matched = true;
        }

        if (matched) {
          let prefix = '';
          for (const part of path.split('.')) {
            prefix = prefix ? `${prefix}.${part}` : part;
            visible.add(prefix);
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, val] of Object.entries(obj).reverse()) {
            const childPath = `${path}.${key}`;
            const origVal = original ? original[key] : val;
            matchStack.push({ obj: val, path: childPath, original: origVal });
          }
        }
      }

      return flat.filter(entry => visible.has(entry.path));
    });

    return {
      isStringValue,
      isVisible,
      flatFields,
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
      currentAddPath,
      currentDeletePath
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
