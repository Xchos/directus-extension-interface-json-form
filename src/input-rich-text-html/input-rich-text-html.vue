<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import useSourceCode from './useSourceCode';

const props = withDefaults(
	defineProps<{
		modelValue: string | null;
		field?: string;
		disabled?: boolean;
		softLength?: number;
		isDirty?: boolean;
	}>(),
	{
		modelValue: null,
		isDirty: false,
	}
);

const emit = defineEmits(['update:modelValue']);
const editorRef = ref<HTMLDivElement | null>(null);
const count = ref(0);

const internalValue = computed({
	get() {
		return props.modelValue || '';
	},
	set(value) {
		if (props.modelValue !== value) {
			emit('update:modelValue', value);
			updateCount();
		}
	},
});

const activeStates = ref({
	bold: false,
	italic: false,
	underline: false,
	code: false,
});

const { codeDrawerOpen, code, closeCodeDrawer, saveCode } = useSourceCode(editorRef);

function getSelectionOffsets(element: HTMLElement) {
	const selection = window.getSelection();
	if (!selection || !selection.rangeCount) return null;

	const range = selection.getRangeAt(0);
	const preSelectionRange = range.cloneRange();
	preSelectionRange.selectNodeContents(element);
	preSelectionRange.setEnd(range.startContainer, range.startOffset);
	const start = preSelectionRange.toString().length;

	return {
		start,
		end: start + range.toString().length,
	};
}

function setSelectionOffsets(element: HTMLElement, offsets: { start: number; end: number }) {
	const selection = window.getSelection();
	if (!selection) return;

	let charIndex = 0;
	let range = document.createRange();
	range.setStart(element, 0);
	range.collapse(true);

	function nodeWalk(node: Node) {
		if (node.nodeType === 3) {
			const nextCharIndex = charIndex + (node as Text).length;
			if (offsets.start >= charIndex && offsets.start <= nextCharIndex) {
				range.setStart(node, offsets.start - charIndex);
			}
			if (offsets.end >= charIndex && offsets.end <= nextCharIndex) {
				range.setEnd(node, offsets.end - charIndex);
				return true;
			}
			charIndex = nextCharIndex;
		} else {
			for (let i = 0; i < node.childNodes.length; i++) {
				if (nodeWalk(node.childNodes[i])) {
					return true;
				}
			}
		}
		return false;
	}

	nodeWalk(element);
	selection.removeAllRanges();
	selection.addRange(range);
}

function execCommand(command: string) {
	if (!editorRef.value) return;
	
	const offsets = getSelectionOffsets(editorRef.value);
	if (!offsets) return;
	
	const selection = window.getSelection();
	if (!selection || !selection.rangeCount) return;
	
	const range = selection.getRangeAt(0);
	
	switch (command) {
		case 'bold': {
			const isInBold = !!range.commonAncestorContainer.parentElement?.closest('strong');
			
			if (isInBold) {
				const strongElement = range.commonAncestorContainer.parentElement?.closest('strong');
				if (strongElement) {
					const parent = strongElement.parentNode;
					if (parent) {
						const fragment = document.createDocumentFragment();
						while (strongElement.firstChild) {
							fragment.appendChild(strongElement.firstChild);
						}
						parent.insertBefore(fragment, strongElement);
						parent.removeChild(strongElement);
					}
				}
			} else {
				const strongElement = document.createElement('strong');
				try {
					range.surroundContents(strongElement);
				} catch (e) {
					const fragment = range.extractContents();
					strongElement.appendChild(fragment);
					range.insertNode(strongElement);
				}
			}
			break;
		}
		case 'italic': {
			const isInItalic = !!range.commonAncestorContainer.parentElement?.closest('em');
			
			if (isInItalic) {
				const emElement = range.commonAncestorContainer.parentElement?.closest('em');
				if (emElement) {
					const parent = emElement.parentNode;
					if (parent) {
						const fragment = document.createDocumentFragment();
						while (emElement.firstChild) {
							fragment.appendChild(emElement.firstChild);
						}
						parent.insertBefore(fragment, emElement);
						parent.removeChild(emElement);
					}
				}
			} else {
				const emElement = document.createElement('em');
				try {
					range.surroundContents(emElement);
				} catch (e) {
					const fragment = range.extractContents();
					emElement.appendChild(fragment);
					range.insertNode(emElement);
				}
			}
			break;
		}
		case 'underline': {
			const isInUnderline = !!range.commonAncestorContainer.parentElement?.closest('u');
			
			if (isInUnderline) {
				const uElement = range.commonAncestorContainer.parentElement?.closest('u');
				if (uElement) {
					const parent = uElement.parentNode;
					if (parent) {
						const fragment = document.createDocumentFragment();
						while (uElement.firstChild) {
							fragment.appendChild(uElement.firstChild);
						}
						parent.insertBefore(fragment, uElement);
						parent.removeChild(uElement);
					}
				}
			} else {
				const uElement = document.createElement('u');
				try {
					range.surroundContents(uElement);
				} catch (e) {
					const fragment = range.extractContents();
					uElement.appendChild(fragment);
					range.insertNode(uElement);
				}
			}
			break;
		}
	}
	
	updateContent();
	updateActiveStates();
	
	if (editorRef.value) {
		setSelectionOffsets(editorRef.value, offsets);
	}
}

function updateContent() {
	if (!editorRef.value) return;
	internalValue.value = editorRef.value.innerHTML;
}

function updateCount() {
	if (!editorRef.value) return;
	count.value = editorRef.value.textContent?.replace('\n', '')?.length ?? 0;
}

function updateActiveStates() {
	const selection = window.getSelection();
	if (!selection || !selection.rangeCount) {
		activeStates.value = {
			bold: false,
			italic: false,
			underline: false,
			code: false,
		};
		return;
	}

	const range = selection.getRangeAt(0);
	activeStates.value = {
		bold: !!range.commonAncestorContainer.parentElement?.closest('strong'),
		italic: !!range.commonAncestorContainer.parentElement?.closest('em'),
		underline: !!range.commonAncestorContainer.parentElement?.closest('u'),
		code: !!range.commonAncestorContainer.parentElement?.closest('code'),
	};
}

function handlePaste(e: ClipboardEvent) {
	e.preventDefault();
	const text = e.clipboardData?.getData('text/plain');
	if (text) {
		document.execCommand('insertText', false, text);
	}
}

function handleSelectionChange() {
	const selection = window.getSelection();
	if (!selection || !selection.rangeCount || !editorRef.value) return;
	
	const range = selection.getRangeAt(0);
	if (!editorRef.value.contains(range.commonAncestorContainer)) {
		return;
	}
	
	updateActiveStates();
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.metaKey || e.ctrlKey) {
		switch (e.key.toLowerCase()) {
			case 'b': {
				e.preventDefault();
				execCommand('bold');
				break;
			}
			case 'i': {
				e.preventDefault();
				execCommand('italic');
				break;
			}
			case 'u': {
				e.preventDefault();
				execCommand('underline');
				break;
			}
		}
	}
}

onMounted(() => {
	if (editorRef.value) {
		editorRef.value.innerHTML = internalValue.value;
		editorRef.value.addEventListener('selectstart', handleSelectionChange);
		editorRef.value.addEventListener('keyup', handleSelectionChange);
		editorRef.value.addEventListener('mouseup', handleSelectionChange);
	}
});

onBeforeUnmount(() => {
	if (editorRef.value) {
		editorRef.value.removeEventListener('selectstart', handleSelectionChange);
		editorRef.value.removeEventListener('keyup', handleSelectionChange);
		editorRef.value.removeEventListener('mouseup', handleSelectionChange);
	}
});

const percentage = (value: number, total: number | undefined) => (value / (total ?? 1)) * 100;
const percRemaining = computed(() => percentage(count.value, props.softLength) ?? 100);

function openSourceCode() {
	if (editorRef.value) {
		code.value = editorRef.value.innerHTML;
		codeDrawerOpen.value = true;
	}
}

const t = (key: string) => key;
</script>

<template>
	<div class="custom-editor" :class="{ disabled, dirty: isDirty }">
		<div class="toolbar">
			<button 
				type="button" 
				@mousedown.prevent
				@click="execCommand('bold')" 
				:disabled="disabled"
				:class="{ active: activeStates.bold }"
				class="toolbar-button"
			>
				<v-icon name="format_bold" />
			</button>
			<button 
				type="button" 
				@mousedown.prevent
				@click.prevent="execCommand('italic')" 
				:disabled="disabled"
				:class="{ active: activeStates.italic }"
				class="toolbar-button"
			>
				<v-icon name="format_italic" />
			</button>
			<button 
				type="button" 
				@mousedown.prevent
				@click.prevent="execCommand('underline')" 
				:disabled="disabled"
				:class="{ active: activeStates.underline }"
				class="toolbar-button"
			>
				<v-icon name="format_underlined" />
			</button>
			<button 
				type="button" 
				@mousedown.prevent
				@click.prevent="openSourceCode" 
				:disabled="disabled"
				class="toolbar-button"
			>
				<v-icon name="code" />
			</button>
		</div>

		<div
			ref="editorRef"
			class="editor-content"
			:contenteditable="!disabled"
			@input="updateContent"
			@paste="handlePaste"
			@keydown="handleKeyDown"
		/>

		<template v-if="softLength">
			<span
				class="remaining"
				:class="{
					warning: percRemaining < 10,
					danger: percRemaining < 5,
				}"
			>
				{{ softLength - count }}
			</span>
		</template>

		<v-drawer 
			v-model="codeDrawerOpen" 
			:title="t('wysiwyg_options.source_code')" 
			icon="code" 
			@cancel="closeCodeDrawer"
		>
			<div class="content">
				<interface-input-code
					:value="code"
					language="htmlmixed"
					line-wrapping
					@input="code = $event"
				></interface-input-code>
			</div>

			<template #actions>
				<v-button icon rounded @click="saveCode">
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>
	</div>
</template>

<style scoped>
.custom-editor {
	border-radius: var(--theme--border-radius);
	overflow: hidden;
	position: relative;
	transition: all var(--fast) var(--transition);
}

.custom-editor:hover {
	border-color: var(--theme--form--field--input--border-color-hover);
}

.custom-editor.disabled {
	background-color: var(--theme--form--field--input--background-color-disabled);
	cursor: not-allowed;
}

.custom-editor.disabled .editor-content {
	cursor: not-allowed;
	user-select: none;
}

.custom-editor.dirty .editor-content {
	background-color: var(--theme--primary-background) !important;
}

.custom-editor.dirty:hover {
	border-color: var(--theme--primary-150) !important;
}

.custom-editor.dirty:focus-within {
	border-color: var(--theme--primary) !important;
}

.toolbar {
	display: flex;
	gap: 2px;
	padding: 4px;
	background-color: var(--theme--background);
	border-bottom: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border: none;
	background: none;
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	color: var(--theme--form--field--input--foreground);
	padding: 0;
	transition: all var(--fast) var(--transition);
}

.toolbar-button:hover {
	background-color: var(--theme--background-accent);
	transform: translateY(-1px);
}

.toolbar-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
}

.toolbar-button.active {
	background-color: var(--theme--primary);
	color: var(--theme--background);
}

.toolbar-button :deep(.v-icon) {
	width: 16px;
	height: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0;
}

.toolbar-button:last-child {
	margin-left: auto;
	position: relative;
}

.toolbar-button:last-child::before {
	content: '';
	position: absolute;
	left: -4px;
	top: 4px;
	bottom: 4px;
	width: 1px;
	background-color: var(--theme--form--field--input--border-color);
}

.editor-content {
	min-height: 20px;
	padding: 12px;
	outline: none;
	background-color: var(--theme--form--field--input--background);
	color: var(--theme--form--field--input--foreground);
	transition: background-color var(--fast) var(--transition);
}

.editor-content[contenteditable="true"]:empty:before {
	content: attr(placeholder);
	color: var(--theme--form--field--input--foreground-subdued);
	pointer-events: none;
}

.editor-content :deep(strong) {
	font-weight: 600;
}

.editor-content :deep(em) {
	font-style: italic;
}

.editor-content :deep(u) {
	text-decoration: underline;
}

.editor-content :deep(code) {
	background-color: var(--theme--background-accent);
	padding: 2px 4px;
	border-radius: 4px;
	font-family: var(--theme--font-family-monospace);
	font-size: 0.9em;
}

.remaining {
	position: absolute;
	right: 10px;
	bottom: 5px;
	color: var(--theme--form--field--input--foreground-subdued);
	font-weight: 600;
	text-align: right;
	vertical-align: middle;
	font-feature-settings: 'tnum';
}

.warning {
	color: var(--theme--warning);
}

.danger {
	color: var(--theme--danger);
}
</style>
