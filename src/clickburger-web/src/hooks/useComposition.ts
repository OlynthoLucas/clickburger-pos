export function useComposition() {
    return {
        isComposing: false,
        onCompositionStart: () => { },
        onCompositionEnd: () => { }
    };
}