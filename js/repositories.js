// list of repo metadata
var urls = [
    "https://cdn.rawgit.com/openworm/OpenWorm/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/hodgkin_huxley_tutorial/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/openworm_docs/master/.openworm.yml",
    // "https://cdn.rawgit.com/openworm/simple-C-elegans/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/wormbrowser/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/sibernetic/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/openwormbrowser-ios/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/CElegansNeuroML/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/org.openworm.website/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/ChannelWorm/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/muscle_model/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/neuronal-analysis/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/org.geppetto/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/PyOpenWorm/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/tracker-commons/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/open-worm-analysis-toolbox/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/sibernetic_config_gen/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/sibernetic_NEURON/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/skeletonExtraction/master/.openworm.yml",
    //"https://cdn.rawgit.com/openworm/WormWorx/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/Blender2NeuroML/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/CyberElegans/master/.openworm.yml"
];

// Hardcoded github root url
var repo_url = "https://github.com/";

// Construction of javascript array for jsGrid data
var metadata_info = [];

// Global names for DOM ids used
var domElement = "domElement";
var domGroup = "domGroup";
var tabGroup = "tabGroup";

// Establishes relationship between repo keys and indices.
// Indices are used as part of DOM ids.
var groupLookup = {};
var elementLookup = {};

var fetch = function(container, urls, index) {
    $.ajax({
        type: 'GET',
        dataType: 'text',
        url: urls[index],
        success: function(responseData, textStatus, jqXHR) {
            var nativeObject = YAML.parse(responseData);

            var hasParent = false;
            var inner;
            inner = $('<div id="' + domElement + index + '" ></div>');

	    var jsGridRow = {};

            // Establish a string->meta lookuptable.
            elementLookup[nativeObject.repo] = index;

            container.append(inner);

            inner.append('<p><b>Repo:</b> ' + nativeObject.repo + '</p>');
	    jsGridRow["Repo"] = nativeObject.repo;

            inner.append('<p><b>Short Description:</b> ' + nativeObject.shortDescription + '</p>');
	    jsGridRow["Description"] = nativeObject.shortDescription;

            if (nativeObject.documentation != undefined) {
                inner.append('<p><b>Documentation:</b> <a href=\"' + nativeObject.documentation + '\" target=\"blank\">' + nativeObject.documentation + '</a></p>');
		jsGridRow["Documentation"] = nativeObject.documentation;
            } else {
                inner.append('<p><b>Documentation:</b> None</p>');
		jsGridRow["Documentation"] = "None";
            }

            inner.append('<p><b>Coordinator:</b> ' +
                nativeObject.coordinator + '</p>');
	    jsGridRow["Coordinator"] = nativeObject.coordinator;

            if (nativeObject.parent != undefined) {
                inner.append('<p><b>Parent:</b> <a class="btn btn-link" href="' + repo_url + nativeObject.parent[0] + '">Visit Repo</a> <a class="btn btn-primary btn-xs navBtn" href="#">' + nativeObject.parent[0] + '</a></p>');
                add_to_hierarchy(nativeObject.repo, nativeObject.parent);
                hasParent = true;
            }

            if (nativeObject.inputs != undefined) {
                inner.append('<p><b>Inputs:</b></p>');
                for (var i = 0; i < nativeObject.inputs.length; i++) {
                    inner.append('<p><a class="btn btn-link" href="' + repo_url + nativeObject.inputs[i] + '">Visit Repo</a> <a class="btn btn-primary btn-xs navBtn" href="#">' + nativeObject.inputs[i] + '</a></p>');
                }
            }

            if (nativeObject.outputs != undefined) {
                inner.append('<p><b>Outputs:</b></p>');
                for (var i = 0; i < nativeObject.outputs.length; i++) {
                    inner.append('<p><a class="btn btn-link" href="' + repo_url + nativeObject.outputs[i] + '">Visit Repo</a> <a class="btn btn-primary btn-xs navBtn" href="#">' + nativeObject.outputs[i] + '</a></p>');
                }
            }

            if (nativeObject.children != undefined) {
                inner.append('<p><b>Children:</b></p>');
                for (var i = 0; i < nativeObject.children.length; i++) {
                    inner.append('<p><a class="btn btn-link" href="' + repo_url + nativeObject.children[i] + '">Visit Repo</a> <a class="btn btn-primary btn-xs navBtn" href="#">' + nativeObject.children[i] + '</a></p>');
                    add_to_hierarchy(nativeObject.children[i],nativeObject.repo);
                }
            }

            if (!hasParent) {
                add_to_root(nativeObject.repo);
            }

            inner.append('<hr style="height: 1px; border-color: black;">');
	    metadata_info[index] = jsGridRow;

            // fetch next
            if (urls.length - 1 > index) {
                fetch(container, urls, index + 1);
            } else {
                build_hierarchy();
                disable_untracked_nav_buttons();
                // **CWL** Generate tabs from newly acquired data
                // handle asynchrony issues by making sure all elements
                // are populated.
                cwlpager_init(container);

		            constructJsGrid();
                
                // hide spinner
                $('#spinner-container').hide();
                // show content
                $('#content').show();
            }
        },
        error: function(responseData, textStatus, errorThrown) {
            alert('GET failed.');
        }
    });
};

var activateGrid = function() {
    $("#grid-view-master").show();
    $("#tab-view-master").hide();
};

var activateTab = function() {
    $("#grid-view-master").hide();
    $("#tab-view-master").show();
};

var constructJsGrid = function() {
    $("#jsGrid").jsGrid({
	    width: "100%",
		height: "auto",
		
		inserting: false,
		editing: false,
		sorting: true,
		paging: true,
		pageSize: 10,
		
		data: metadata_info,
		
		fields: [
			 { name: "Repo", type: "text", width: "auto", validate: "required" },
			 { name: "Documentation", type: "text", width: "auto" },
			 { name: "Description", type: "text", width: "auto" },
			 { name: "Coordinator", type: "text", width: "auto" }
			 //			 { type: "control" }
			 ]
		});
};

$(function() {
    var container = $('#content');
    $('#content').hide();
    $("#tab-view-master").hide();
     
    fetch(container, urls, 0);
});
