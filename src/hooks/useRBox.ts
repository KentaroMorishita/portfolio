import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { RBox } from "f-box-core";

export function useRBox<T>(
    source: T | RBox<T> | (() => T | RBox<T> | (() => void)),
    deps: React.DependencyList = []
): [T, RBox<T>] {
    const box = useMemo<RBox<T>>(() => {
        const value =
            typeof source === "function" ? (source as () => T | RBox<T>)() : source;
        return RBox.isRBox(value) ? (value as RBox<T>) : RBox.pack(value as T);
    }, deps);

    let cleanup: (() => void) | undefined;

    const value = useSyncExternalStore(
        (onStoreChange) => {
            const key = box.subscribe(onStoreChange);

            if (typeof source === "function") {
                const result = (source as () => T | RBox<T> | (() => void))();
                if (typeof result === "function" && result.length === 0) {
                    cleanup = result as () => void; // 型を明示的に指定
                }
            }

            return () => {
                box.unsubscribe(key); // RBox購読解除
                cleanup?.(); // 外部クリーンアップ
            };
        },
        () => box.getValue()
    );

    return [value, box];
}
