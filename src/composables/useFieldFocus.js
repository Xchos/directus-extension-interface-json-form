import { ref, onMounted, watch } from 'vue';

export function useFieldFocus(isActive) {
  const isFocused = ref(false);
  const fieldRef = ref(null);

  const setFieldRef = (el) => {
    fieldRef.value = el;
    if (isActive && el) {
      el.focus();
    }
  };

  const onFocus = () => {
    isFocused.value = true;
  };

  const onBlur = () => {
    isFocused.value = false;
  };

  const focusField = () => {
    if (fieldRef.value) {
      fieldRef.value.focus();
    }
  };

  // Watch for isActive changes
  watch(() => isActive, (newValue) => {
    if (newValue && fieldRef.value) {
      fieldRef.value.focus();
    }
  });

  return {
    isFocused,
    setFieldRef,
    onFocus,
    onBlur,
    focusField
  };
} 