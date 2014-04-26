/*
functions to show/hide tabs and their related groups
requires structure:
    <ele class="tabs">
        <ele class="tab toggle" data-for="examples">Examples</ele>
        ...
    </ele>
    <ele class="groups">
        <ele class="group examples">Example content</ele>
        ...
    </ele>
toggle class required to show/hide a related group
*/
function tabs(parent){
    var active = false,
        activeTab,
        activeGroup,
        groups = parent.getElementsByClassName("groups")[0],
        fn = {
            // show a tabs related group
            show: function(ele){
                // if one is already shown, hide that first
                this.hide();
                var groupID = ele.dataset.for,
                    group = groups.getElementsByClassName(groupID)[0];
                group.classList.add("show");
                ele.classList.add("active");
                active = true;
                activeTab = ele;
                activeGroup = group;
            },
            // hide a tabs related groupo
            hide: function(){
                if ( active ) {
                    activeGroup.classList.remove("show");
                    activeTab.classList.remove("active");
                }
                active = false;
                activeTab = undefined;
                activeGroup = undefined;
            },
            toggleEvent: function(event){
                event.preventDefault();
                event.stopPropagation();
                if ( this.classList.contains("active") ){
                    fn.hide();
                } else {
                    fn.show(this);
                }
            }
        },
        // event listener for each .toggle.tab
        eles = Array.prototype.slice.call(parent.getElementsByClassName("toggle"));

    for ( var i=0, len=eles.length; i<len; i++ ) {
        eles[i].addEventListener("click", fn.toggleEvent, false);
    }

    return fn;   
}
