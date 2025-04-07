<template>
	<div class="json-form">
		<div v-if="enable_search" class="search-wrapper">
			<v-input
				v-model="searchQuery"
				placeholder="Search fields by key or value..."
				:icon-left="'search'"
			>
				<template #append>
					<v-icon
						v-if="searchQuery"
						name="close"
						clickable
						@click="searchQuery = ''"
					/>
				</template>
			</v-input>
		</div>
		<div class="fields-wrapper">
			<div v-if="!isEmptyObject && allow_create_new_fields && !readonly" class="root-actions">
				<v-button x-small class="success" @click="showAddRootFieldDialog = true" v-tooltip.bottom="'Add field to root object'">
					<v-icon name="add" />
				</v-button>
			</div>
			<template v-if="isEmptyObject && allow_create_new_fields && !readonly">
				<div class="empty-state">
					<v-text>No fields found</v-text>
					<v-button small class="success" @click="showAddRootFieldDialog = true" v-tooltip.bottom="'Add your first field'">
						<v-icon name="add" />
					</v-button>
				</div>
			</template>
			<recursive-field 
				v-else
				v-for="(value, key) in processedValue" 
				:key="key" 
				:field-key="key" 
				:value="value"
				:original-value="originalState[key] ?? value"
				:active-field="activeField" 
				:path="key" 
				:allow-create-new-fields="allow_create_new_fields" 
				:allow-remove-fields="allow_remove_fields"
				:search-query="enable_search ? searchQuery : ''"
				:readonly="readonly"
				:enable-wysiwyg="enable_wysiwyg"
				@update="handleUpdate" 
				@update:active-field="(path) => activeField = path" 
			/>
		</div>
	</div>

	<v-dialog v-model="showAddRootFieldDialog" @esc="showAddRootFieldDialog = false">
		<v-card>
			<v-card-title>Add New Field</v-card-title>
			<v-card-text>
				<div class="field-path">
					<v-input 
						ref="newFieldInput"
						v-model="newRootFieldKey" 
						placeholder="Enter field name" 
						:disabled="isCreatingRootField" 
						@keydown.enter.prevent="createRootField"
					/>
				</div>
				<v-notice v-if="keyValidationError" type="danger">{{ keyValidationError }}</v-notice>
			</v-card-text>
			<v-card-actions>
				<v-button 
					secondary 
					@click="showAddRootFieldDialog = false"
					v-tooltip.bottom="'Cancel adding field'"
				>
					Cancel
				</v-button>
				<v-button 
					:loading="isCreatingRootField" 
					:disabled="!newRootFieldKey || !!keyValidationError" 
					@click="createRootField"
					v-tooltip.bottom="!newRootFieldKey ? 'Enter a field name first' : keyValidationError ? keyValidationError : 'Add this new field'"
				>
					Add Field
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import { ref, watch, computed } from 'vue';
import RecursiveField from './recursive-field.vue';
import { useNestedUpdate } from './composables/useNestedUpdate';

export default {
	components: {
		RecursiveField
	},
	props: {
		value: {
			type: Object,
			default: () => ({}),
		},
		allow_create_new_fields: {
			type: Boolean,
			default: false
		},
		allow_remove_fields: {
			type: Boolean,
			default: false
		},
		enable_search: {
			type: Boolean,
			default: true
		},
		readonly: {
			type: Boolean,
			default: false
		},
		enable_wysiwyg: {
			type: Boolean,
			default: false
		}
	},
	emits: ['input'],
	setup(props, { emit }) {
		const activeField = ref(null);
		const searchQuery = ref('');
		const { updateNestedValue } = useNestedUpdate();
		const originalState = ref({});
		const showAddRootFieldDialog = ref(false);
		const newRootFieldKey = ref('');
		const isCreatingRootField = ref(false);
		const keyValidationError = computed(() => {
			if (!newRootFieldKey.value) return null;
			
			const keyExists = props.value && 
				typeof props.value === 'object' && 
				Object.prototype.hasOwnProperty.call(props.value, newRootFieldKey.value);
				
			if (keyExists) {
				return `Field "${newRootFieldKey.value}" already exists`;
			}
			
			return null;
		});

		const processedValue = computed(() => {
			return props.value && typeof props.value === 'object' ? props.value : {};
		});

		const isEmptyObject = computed(() => {
			return !props.value || typeof props.value !== 'object' || Object.keys(props.value).length === 0;
		});

		const newFieldInput = ref(null);

		watch(() => props.value, 
			(newValue) => {
				if (newValue && typeof newValue === 'object' && Object.keys(originalState.value).length === 0) {
					originalState.value = JSON.parse(JSON.stringify(newValue));
				}
				
				if (newValue === null || typeof newValue !== 'object') {
					console.log('Initializing null/invalid value to empty object');
					emit('input', {});
				}
			},
			{ immediate: true }
		);

		function handleUpdate(path, newValue) {
			if (props.readonly) return;
			
			activeField.value = path;
			const updatedValue = JSON.parse(JSON.stringify(props.value)) || {};
			updateNestedValue(updatedValue, path, newValue);
			
			function cleanupEmptyObjects(obj) {
				for (const key in obj) {
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						cleanupEmptyObjects(obj[key]);
						if (Object.keys(obj[key]).length === 0) {
							delete obj[key];
						}
					}
				}
			}
			cleanupEmptyObjects(updatedValue);
			emit('input', updatedValue);
		}

		function createRootField() {
			if (!newRootFieldKey.value || keyValidationError.value) return;

			isCreatingRootField.value = true;
			console.log('Creating new field:', newRootFieldKey.value);

			try {
				const updatedValue = props.value && typeof props.value === 'object' 
					? JSON.parse(JSON.stringify(props.value)) 
					: {};
					
				console.log('Current value before update:', JSON.stringify(updatedValue));
				
				updatedValue[newRootFieldKey.value] = '';
				
				console.log('New value after update:', JSON.stringify(updatedValue));
				
				emit('input', updatedValue);
				activeField.value = newRootFieldKey.value;
				
				console.log('Field created successfully');
			} catch (error) {
				console.error('Error creating field:', error);
			} finally {
				isCreatingRootField.value = false;
				newRootFieldKey.value = '';
				showAddRootFieldDialog.value = false;
			}
		}

		watch(showAddRootFieldDialog, (isOpen) => {
			if (isOpen) {
				setTimeout(() => {
					newFieldInput.value?.$el?.querySelector('input')?.focus();
				}, 50);
			} else {
				newRootFieldKey.value = '';
			}
		});

		return {
			activeField,
			handleUpdate,
			searchQuery,
			originalState,
			isEmptyObject,
			showAddRootFieldDialog,
			newRootFieldKey,
			isCreatingRootField,
			createRootField,
			processedValue,
			keyValidationError,
			newFieldInput
		};
	},
};
</script>

<style scoped>
.json-form {
	display: flex;
	flex-direction: column;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	overflow: hidden;
}

.search-wrapper {
	padding: 8px 8px 0;
	background-color: var(--theme--background);
	border-bottom: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
}

.search-wrapper :deep(.v-input) {
	--v-input-font-family: var(--theme--font-family-sans-serif);
	--v-input-background-color: var(--theme--background-subdued);
	--v-input-padding: 4px 8px;
	--v-input-min-height: 32px;
	font-size: 0.9em;
}

.search-wrapper :deep(.v-icon) {
	width: 16px;
	height: 16px;
}

.fields-wrapper {
	padding: 8px;
	display: flex;
	flex-direction: column;
	gap: calc(var(--content-padding) / 2);
	background-color: var(--theme--background);
	min-height: 60px;
}

.search-wrapper:has(input:placeholder-shown) {
	border-bottom: none;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 16px;
	color: var(--theme--foreground-subdued);
	height: 100%;
}

.root-actions {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 4px;
	gap: 4px;
}
</style>
