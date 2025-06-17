import { useEffect, useRef } from "react";

// Deep equality function to replace lodash.isEqual
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle RegExp objects
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }
  
  // Handle objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const useDeepMemo = <T>(
  value: T,
  equalityFn?: (a: T, b: T | undefined) => boolean
) => {
  equalityFn = equalityFn ?? deepEqual;
  const ref = useRef<T | undefined>(undefined);
  const prev = usePrevious(value);
  if (!equalityFn(value, prev)) {
    ref.current = value;
  }
  return ref.current as T;
};

export function useTraceUpdate(name: string, props: any) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        (ps as any)[k] = {
          prev: prev.current[k],
          current: v,
          //   diff: prev.current[k] != null ? difference(prev.current[k], v) : v,
        };
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      console.log("Changed props:", name, changedProps);
    }
    prev.current = props;
  });
}
