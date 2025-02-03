import { Ref, ref } from 'vue';

type SourceCodeButton = {
	icon: string;
	tooltip: string;
	onAction: () => void;
};

type UsableSourceCode = {
	codeDrawerOpen: Ref<boolean>;
	code: Ref<string | undefined>;
	closeCodeDrawer: () => void;
	saveCode: () => void;
	sourceCodeButton: SourceCodeButton;
};

export default function useSourceCode(editorRef: Ref<HTMLDivElement | null>): UsableSourceCode {
	const codeDrawerOpen = ref(false);
	const code = ref('');

	const sourceCodeButton = {
		icon: 'sourcecode',
		tooltip: 'Source Code',
		onAction: () => {
			codeDrawerOpen.value = true;
			code.value = editorRef.value?.innerHTML;
		},
	};

	return {
		codeDrawerOpen,
		code,
		closeCodeDrawer,
		saveCode,
		sourceCodeButton,
	};

	function closeCodeDrawer() {
		codeDrawerOpen.value = false;
	}

	function saveCode() {
		if (editorRef.value && code.value) {
			editorRef.value.innerHTML = code.value;
			closeCodeDrawer();
			
			// Trigger an input event to update the model
			editorRef.value.dispatchEvent(new Event('input'));
		}
	}
}
