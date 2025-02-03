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
			<recursive-field 
				v-for="(value, key) in value" 
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
</template>

<script>
import { ref, watch } from 'vue';
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

		watch(() => props.value, 
			(newValue) => {
				if (newValue && Object.keys(originalState.value).length === 0) {
					originalState.value = JSON.parse(JSON.stringify(newValue));
				}
			},
			{ immediate: true }
		);

		function handleUpdate(path, newValue) {
			if (props.readonly) return;
			
			activeField.value = path;
			const updatedValue = JSON.parse(JSON.stringify(props.value));
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
		return {
			activeField,
			handleUpdate,
			searchQuery,
			originalState
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
}

.search-wrapper:has(input:placeholder-shown) {
	border-bottom: none;
}
</style>
