describe("collect", function(){

});

describe("html functions", function(){
    describe("ruleHTML", function(){
        var selectorObj;
        beforeEach(function(){
            selectorObj = {
                name: 'link',
                selector: 'a',
                capture: 'attr-href',
                index: false
            };
        });
        it("sets savedSelector class when complete", function(){
            var html = '<span data-selector="a" data-name="link" data-capture="attr-href" data-index="false" class="collectGroup noSelect">' + 
                '<span class="savedSelector noSelect">link</span><span class="deltog noSelect">×</span></span>';
            expect(ruleHTML(selectorObj).outerHTML).toEqual(html);
        });
    });

    describe("cleanElement", function(){
        var ele;
        beforeEach(function(){
            ele = document.createElement("div");
        });
        it("removes query string from src", function(){
            ele.setAttribute("src", "http://www.example.com/?remove=this")
            ele = cleanElement(ele);
            expect(ele.getAttribute("src")).toEqual("http://www.example.com/");
        });
        it("removes unwanted classes", function(){
            ele.classList.add("queryCheck", "keeper", "collectHighlight");
            ele = cleanElement(ele);
            expect(ele.className).toEqual("keeper");
        });
        it("replaces innerHTML with textContent", function(){
            ele.innerHTML = "<i>italic content</i>";
            ele = cleanElement(ele);
            expect(ele.innerHTML).toEqual("italic content");
        })
        it("concatenates long innerHTML", function(){
            ele.innerHTML = "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";
            ele = cleanElement(ele);
            expect(ele.innerHTML).toEqual("0123456789012345678901234...5678901234567890123456789")
        });
        it("strips whitespace from textContent", function(){
            ele.innerHTML = "this           shouldn't be so\nspread out";
            ele = cleanElement(ele);
            expect(ele.innerHTML).toEqual("this shouldn't be so spread out");
        })
    });

    describe("attributeText", function(){
        it("returns proper string representation", function(){
            var ele = document.createElement("div"),
                attrText = "class=\"foo bar\"";
            ele.setAttribute("class", "foo bar");
            expect(attributeText(ele.attributes[0])).toEqual(attrText);
        });
        it("returns empty string for blank attribute values", function(){

        });
    });

    describe("wrapTextHTML", function(){
        it("returns proper string representation", function(){
            var  html = '<span class="capture no_select" title="click to capture text property" ' + 
                'data-capture="text">this is a text</span>';
            expect(wrapTextHTML("this is a text", "text")).toEqual(html);
        });
        it("ignores empty attributes", function(){
            expect(wrapTextHTML("class=\"\"")).toEqual("");
        });
    });
});

describe("utility functions", function(){
    describe("hasClass", function(){
        var ele;
        beforeEach(function(){
            ele = document.createElement("div");
        });

        it("does have class", function(){
            ele.classList.add("foo");
            expect(hasClass(ele, "foo")).toBe(true);
        });
        it("does not have class", function(){
            expect(hasClass(ele, "foo")).toBe(false);
        });
    });

    describe("clearClass", function(){
        it("removes class from all elements with it", function(){
            var holder = document.createElement("div"),
                ele;
            for ( var i=0; i<20; i++ ){
                ele = document.createElement("div");
                ele.classList.add("foo");
                holder.appendChild(ele);
            }
            document.body.appendChild(holder);
            expect(document.getElementsByClassName("foo").length).toEqual(20);
            clearClass("foo");
            expect(document.getElementsByClassName("foo").length).toEqual(0);
            document.body.removeChild(holder);
        });
    });

    describe("addNoSelect", function(){
        it("adds .noSelect class to all elements in eles", function(){
            var holder = document.createElement("div"),
                holderEles;
            for ( var i=0; i<20; i++ ){
                holder.appendChild(document.createElement("div"));
            }
            document.body.appendChild(holder);
            holderEles = holder.getElementsByTagName("div");
            addNoSelect(holderEles);
            expect(holder.getElementsByClassName("noSelect").length).toEqual(20);
            document.body.removeChild(holder);
        });
    });

    describe("selectorIsComplete", function(){
        var obj;
        beforeEach(function(){
            obj = {
                name: 'link',
                selector: 'a',
                capture: 'attr-href',
                index: ''
            };
        })
        it("does nothing for complete objects", function(){
            obj = selectorIsComplete(obj);
            expect(obj.incomplete).toBeUndefined();
        });
        it("sets obj.incomplete name is missing", function(){
            obj.name = '';
            obj = selectorIsComplete(obj);
            expect(obj.incomplete).toBe(true); 
        });
        it("sets obj.incomplete selector is missing", function(){
            obj.selector = '';
            obj = selectorIsComplete(obj);
            expect(obj.incomplete).toBe(true); 
        });
        it("sets obj.incomplete capture is missing", function(){
            obj.capture = '';
            obj = selectorIsComplete(obj);
            expect(obj.incomplete).toBe(true); 
        });
        it("doesn't care about obj.index", function(){
            delete obj.index;
            obj = selectorIsComplete(obj);
            expect(obj.incomplete).toBeUndefined(); 
        })
    });
});

describe("event helpers", function(){
    describe("captureFunction", function(){
        it("captures text", function(){
            var ele = document.createElement("div"),
                fn = captureFunction("text");
            ele.textContent = "this is a text";
            expect(fn(ele)).toEqual("this is a text");
        });
        it("captures an attribute", function(){
            var ele = document.createElement("a"),
                fn = captureFunction("attr-href");
            ele.setAttribute("href", "#");
            expect(fn(ele)).toEqual("#");
        });
    });
});
