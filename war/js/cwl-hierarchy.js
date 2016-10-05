// **CWL** builds a single level element-block "hierarchy"
//   Special dispensation to ignore OpenWorm since it is the master
//   root.

// **CWL** Used an object for index and delete convenience
var currRoots = {};

// Parent and child relationships are both captured in the event
//   the (manual) specifications are disjoint or incomplete
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
};

var build_hierarchy = function() {
    var key;
    Object.keys(currRoots).forEach(function(key,index) {
	groupLookup[key] = index;
	// create a top-level div for it
	if (index == 0) {
	    $("#content").append('<div class="tab-pane fade in active" id="' + domGroup + index + '"></div>');
	} else {
	    $("#content").append('<div class="tab-pane fade" id="' + domGroup + index + '"></div>');
	}
	// insert the root element into its own group
	$('#' + domElement + elementLookup[key]).appendTo('#' + domGroup + groupLookup[key]);
	});
    // Flatten the tree, place each child into its root's div block
    for (key in parentOf) {
	groupLookup[key] = groupLookup[find_ancestor(key)];
	$('#' + domElement + elementLookup[key]).appendTo('#' + domGroup + groupLookup[key]);
    }
};

var disable_untracked_nav_buttons = function() {
    $('.navBtn').each(function() {
	    var textkey = this.innerHTML;
	    if (elementLookup[textkey] == undefined) {
		$(this).addClass('disabled');
	    }
	});
};