###CollectJS

A Chrome extension that allows you to get information necessary to crawl a page.

Originally project was at https://github.com/psherman/collectjs, but transitioning over to an extension from a bookmarklet for ease of use.

Still a work in progress, but most of the project is at a usable level.

To pack extension and use:
1) In Chrome open up the extensions page (Settings > Tools > Extensions)
2) Click the "Pack extension..." button and navigate to the extension folder
2b) If you've previously packed the extension, make sure to include the extension.pem so that packing creates an updated extension instead of a new one.
3) Open the folder where the packed extension (a .crx file) is located (that should be one folder above the extension folder)
4) Drag the .crx file to the Chrome extensions page
5) Accept the extension's permissions

Rules format:

    sites: {
        example.com: {
            groups: {
                name: {
                    name: name,
                    indices: [...],
                    rules: {
                        name: {
                            capture: ...,
                            index: ...,
                            name: ...,
                            selector: ...,
                            parent: ...,
                            range: ...        
                        }
                    }
                },
                ...
            }
        },
        ...
    }

