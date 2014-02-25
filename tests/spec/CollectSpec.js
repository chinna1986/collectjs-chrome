describe("collect", function(){

});

describe("Selector", function(){
    describe("constructor", function(){
        var ele;
        beforeEach(function(){
            ele = document.createElement("div");
        });
        it("sets tag name", function(){
            var s = new Selector(ele);
            expect(s.tag).toEqual("div");
            
        });
        it("sets id", function(){
            ele.setAttribute("id", "foobar");
            var s = new Selector(ele);
            expect(s.id).toEqual("#foobar");
        });
        it("sets classes", function(){
            ele.classList.add("one", "two", "three");
            var s = new Selector(ele);
            expect(s.classes).toEqual([".one", ".two", ".three"]); 
        });
        it("ignores collect_highlight and query_check classes", function(){
            ele.classList.add("one", "collect_highlight", "query_check");
            var s = new Selector(ele);
            expect(s.classes).toEqual([".one"]); 
        });
        it("removeCommon removes classes", function(){
            ele.classList.add("one", "clearfix");
            var s = new Selector(ele);
            expect(s.classes).toEqual([".one"]); 
        });
    });

    describe("toHTML", function(){
        var ele;
        beforeEach(function(){
            ele = document.createElement("div");
        });

        it("returns expected html for off", function(){
            var s = new Selector(ele),
                html = "<span class='selector_group no_select'>" +
                "<span class='toggleable realselector no_select off'>div</span>" +
                "<span class='nthtype no_select' title='add the nth-of-type pseudo selector'>+t</span>" + 
                "<span class='onlychild no_select' title='next selector must be direct child (&gt; in css)'>&gt;</span>" + 
                "<span class='deltog no_select'>x</span></span>";
            expect(s.toHTML()).toEqual(html);
        });

        it("returns expected html for off", function(){
            var s = new Selector(ele),
                html = "<span class='selector_group no_select'>" +
                "<span class='toggleable realselector no_select'>div</span>" +
                "<span class='nthtype no_select' title='add the nth-of-type pseudo selector'>+t</span>" + 
                "<span class='deltog no_select'>x</span></span>";
            expect(s.toHTML(true)).toEqual(html);
        });
    });
});

describe("html functions", function(){
    describe("wrapToggleableHTML", function(){
        it("works for on=true", function(){
            var html = "<span class='toggleable realselector no_select'>test</span>";
            expect(wrapToggleableHTML("test", true)).toEqual(html);
        });
        it("works for on=false", function(){
            var html = "<span class='toggleable realselector no_select off'>test</span>";
            expect(wrapToggleableHTML("test", false)).toEqual(html);
        });
        it("works for on=undefined", function(){
            var html = "<span class='toggleable realselector no_select off'>test</span>";
            expect(wrapToggleableHTML("test")).toEqual(html);
        });
    });

    describe("pseudoHTML", function(){
        it("sets correct selector", function(){
            var typeHTML = "<span class='pseudo toggleable no_select'>:nth-of-type(<span class='child_toggle no_select' title='options: an+b " + 
                    "(a & b are integers), a positive integer (1,2,3...), odd, even'" + 
                    "contenteditable='true'>1</span>)</span>",
                childHTML = "<span class='pseudo toggleable no_select'>:nth-child(<span class='child_toggle no_select' title='options: an+b " + 
                    "(a & b are integers), a positive integer (1,2,3...), odd, even'" + 
                    "contenteditable='true'>1</span>)</span>";
            expect(pseudoHTML('nth-of-type')).toEqual(typeHTML);
            expect(pseudoHTML('nth-child')).toEqual(childHTML);
        });
        it("sets val if provided", function(){
            var typeHTML = "<span class='pseudo toggleable no_select'>:nth-of-type(<span class='child_toggle no_select' title='options: an+b " + 
                    "(a & b are integers), a positive integer (1,2,3...), odd, even'" + 
                    "contenteditable='true'>even</span>)</span>";
            expect(pseudoHTML('nth-of-type', 'even')).toEqual(typeHTML);
        });
        
    });

    describe("selectorHTML", function(){
        var selectorObj;
        beforeEach(function(){
            selectorObj = {
                name: 'link',
                selector: 'a',
                capture: 'attr-href',
                index: ''
            };
        });
        it("sets saved_selector class when complete", function(){
            var html = '<span class="collect_group no_select">' + 
                '<span class="saved_selector no_select" data-selector="a" data-capture="attr-href"' +
                ' data-index=""">link</span><span class="deltog no_select">x</span></span>';
            expect(selectorHTML(selectorObj)).toEqual(html);
        });
        it("sets incomplete_selector class when incomplete", function(){
           selectorObj.selector = '';
           var html = '<span class="collect_group no_select">' + 
                '<span class="incomplete_selector no_select" data-selector="" data-capture="attr-href"' +
                ' data-index=""">link</span><span class="deltog no_select">x</span></span>';
            expect(selectorHTML(selectorObj)).toEqual(html);
        });
    });

    describe("selectorTextHTML", function(){

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
            ele.classList.add("query_check", "keeper", "collect_highlight");
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
        it("adds .no_select class to all elements in eles", function(){
            var holder = document.createElement("div"),
                holderEles;
            for ( var i=0; i<20; i++ ){
                holder.appendChild(document.createElement("div"));
            }
            document.body.appendChild(holder);
            holderEles = holder.getElementsByTagName("div");
            addNoSelect(holderEles);
            expect(holder.getElementsByClassName("no_select").length).toEqual(20);
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
    describe("parseSelector", function(){
        it("identifies the tag", function(){
            var parsed = parseSelector("a.link");
            expect(parsed.tag).toEqual("a");
        });
        it("identifies an id", function(){
            var parsed = parseSelector("#identifier");
            expect(parsed.id).toEqual("#identifier");
        });
        it("identifies classes", function(){
            var parsed = parseSelector("a.link.important");
            expect(parsed.classes).toEqual([".link", ".important"]);
        });
        it("identifies a pseudo-selector", function(){
            var parsed = parseSelector("a:nth-of-type(1)");
            expect(parsed.pseudo).toEqual(":nth-of-type(1)");
        })
    });

    describe("matchSelector", function(){
        it("matches tag", function(){
            var ele = document.createElement("div");
            expect(matchSelector(ele, "div")).toBe(true);
        });
        it("matches id", function(){
            var ele = document.createElement("div");
            ele.setAttribute("id", "foobar");
            expect(matchSelector(ele, "#foobar")).toBe(true); 
        });
        it("matches classes", function(){
            var ele = document.createElement("div");
            ele.classList.add("one", "two");
            expect(matchSelector(ele, ".one")).toBe(true);
            expect(matchSelector(ele, ".two.one")).toBe(true);
        });
    });

    describe("captureFunction", function(){
        it("captures text", function(){
            var ele = document.createElement("div"),
                fn = captureFunction({capture: "text"});
            ele.textContent = "this is a text";
            expect(fn(ele)).toEqual("this is a text");
        });
        it("captures an attribute", function(){
            var ele = document.createElement("a"),
                fn = captureFunction({capture: "attr-href"});
            ele.setAttribute("href", "#");
            expect(fn(ele)).toEqual("#");
        });
    });
});
