What follows is a more ambitious alternative to [this proposal](https://github.com/w3c/webcomponents/issues/782).  The goals of this proposal are larger, and less focused on registering custom elements.

The extra flexibility this new primitive would provide could be quite useful to things other than custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) in userland.

We basically combine an easy-to-use mutation observer with the dynamic import:

```JavaScript
const observer = conditionalImport({
   match: 'my-element',
   rootNode: myRootNode,
   import: async () => (await import('./my-element.js')),
   callback: (import, match) => customElements.define(import.MyElement, match),
   doCallbackIf: (import, match) => customElements.get(match) === undefined,
})
```

This proposal would also include support for CSS, JSON, HTML module imports.

"match" is a css query, and could include multiple matches using the comma separator, i.e. no limitation on CSS expressions.

The "observer" constant above would be an EventTarget, which can be subscribed to.

The callback option is optional.  doCallbackIf is also optional, and only applicable if the callback option is specified.

As matches are found (for example, right away if matching elements are immediately found), the imports object would maintain a read-only array of weak references, , along with the imported module:

```TypeScript
interface ModuleMatches extends EventTarget {
    matches:  readonly WeakRef<Element>[];
    module: any;
}
```

This allows code that comes into being after the matching elements were found, to "get caught up" on all the matches.  

##  Extra lazy loading

By default, the matches would be reported as soon as an element matching the criterion is found or added into the DOM, inside the node specified by rootNode.

However, we could make the loading even more lazy by specifying intersection options:

```JavaScript
const observer = conditionalImport({
   match: 'my-element',
   intersectionObserverInit: {
      rootMargin: "0px",
      threshold: 1.0,
   },
   rootNode: myRootNode,
   import: async () => (await import('./my-element.js'))
})
```

## Media / container queries

Unlike traditional CSS @import, CSS Modules don't support specifying different imports based on media queries.  That can be another condition we can attach (and why not throw in container queries, based on the rootNode?):

```JavaScript
const observer = conditionalImport({
   match: 'my-element',
   mediaMatches: '(max-width: 1250px)',
   containerQuery: '(min-width: 700px)',
   rootNode: myRootNode,
   import: async () => (await import('./my-element-small.css', {type: 'css'}))
})
```

## Subscribing

Subscribing can be done via:

```JavaScript
observer.addEventListener('import', e => {
  console.log({matchingElement: e.matchingElement, module: e.module});
});
```

## Preemptive downloading

There are two significant steps to imports, each of which imposes a cost:  

1.  Downloading the resource.
2.  Loading the resource into memory.

What if we want to download the resource ahead of time, but only load into memory when needed?

The link rel=modulepreload option provides an already existing platform support for this, but the browser complains when no use of the resource is used within a short time span of page load.  That doesn't really fit the bill for lazy loading custom elements and other resources.

So for this we add option:

```JavaScript
const observer = conditionalImport({
   match: 'my-element',
   loading: 'eager',
   import: async () => (await import('./my-element.js')),
   callback: (module, match) => customElements.define(import.MyElement)
})
```

The value of "loading" is 'lazy' by default.

## Bundling and subresource integrity

I've raised this issue to a fellow declarative web component colleague, who doesn't seem to think there's an issue here, when it comes to bundling.  "Import maps handles that" with a grand hand waving gesture.  Maybe that's right, but I have my doubts.  Those doubts increased when I saw [this slide](https://docs.google.com/presentation/d/1nBxZI4X6hVFct5t4VFCJqc4_j92nZtAxWqXDCottUus/edit#slide=id.g21eae6777da_0_63).

So I'm going to walk though, very slowly, and methodically, why I think the platform needs to provide a bit of a helping hand to bundlers, that import maps isn't enough. For my own benefit. My problem is I have not followed at all the approaches solutions like vite.js follow, so maybe they've found a way to overcome this issue (they don't seem to have raised a peep about it, so that increases my doubts that there's an issue).