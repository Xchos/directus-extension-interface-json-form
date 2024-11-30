export function useNestedUpdate() {
  function updateNestedValue(obj, path, value) {
    const parts = path.split('.');
    const key = parts.pop();
    const parent = parts.reduce((obj, key) => obj[key] = obj[key] || {}, obj);
    if (value === undefined) {
      delete parent[key];
    } else {
      parent[key] = value;
    }
  }

  return {
    updateNestedValue
  };
} 