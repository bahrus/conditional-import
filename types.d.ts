export interface ModuleMatches extends EventTarget {
    matches:  readonly WeakRef<Element>[];
    module: any;
}

export type CSSSelector = string;



export interface ModuleMatchInit{
    match: CSSSelector,
    intersectionObserverInit?: IntersectionObserverInit,
    rootNode: DocumentFragment,
    import: () => Promise<any>,
    mediaMatches?: string,
    containerQuery?: string,
    loading?: 'lazy' | 'eager';
    doCallbackIf?: (module: any, matchingElement: Element) => boolean,
    callBack?: (module: any, matchingElement: Element) => void;
    linkID?: string;
}