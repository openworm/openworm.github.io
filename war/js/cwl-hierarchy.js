// **CWL** builds a single level element-block "hierarchy"
//   Special dispensation to ignore OpenWorm since it is the master
//   root.

var currRootId = 0;

// **CWL** Used an object for index and delete convenience
var currRoots = {};

// Parent and child relationships are both captured in the event
//   the (manual) specifications are disjoint or incomplete
var childOf = {};
var parentOf = {};

var add_to_hierarchy = function(child, parent) {
    // Special check for OpenWorm as parent.
    //   This takes care of the case when OpenWorm claims 
    //     children (it shouldn't) or if someone claims
    //     OpenWorm as a parent.
    if (parent == "openworm/OpenWorm") {
	currRoots[child] = "foo";
    } else {
	// Remove any existing children as roots
	delete currRoots[child];
	childOf[parent] = child;
	parentOf[child] = parent;
    }
};

var add_to_root = function(element) {
    // Add to collection of root elements if no one
    //   else claims it to be their child.
    if (parentOf[element] == undefined)  {
	currRoots[element] = "foo";
    }
};

var find_ancestor = function(element) {
    // I am my ancestor
    if (currRoots[element] != undefined) {
	return element;
    } else {
	return find_ancestor(parentOf[element]);
    }
}

var build_hierarchy = function(container) {
    var key;
    //    for (key in currRoots) {
    Object.keys(currRoots).forEach(function(key,index) {
	    navLookup[key] = "metaroot" + currRootId++;
	});
    // Time to flatten the tree
    for (key in parentOf) {
	navLookup[key] = navLookup[find_ancestor(key)];
    }
};
