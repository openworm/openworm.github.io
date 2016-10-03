// list of repo metadata
var urls = [
    "https://cdn.rawgit.com/openworm/PyOpenWorm/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/tracker-commons/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/open-worm-analysis-toolbox/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/org.geppetto/master/.openworm.yml"
];

// *CWL* Hardcoded github root url
var repo_url = "https://github.com/"

var repoNavList = [];
var navLookup = {};

var fetch = function(container, urls, index) {

    $.ajax({
        type: 'GET',
        dataType: 'text',
        url: urls[index],
        success: function(responseData, textStatus, jqXHR) {
            var nativeObject = YAML.parse(responseData);

	    // *CWL* Prior to this, I had a *profound* lack of understanding
	    //   for how hierarchy was handled.
	    //
	    // Also there is no longer any need to worry about navigation
	    //   issues with basic tabs. The question now is how we can
	    //   use buttons to work as if a tab had been clicked.
	    var inner;
	    if (index == 0) {
		inner = $('<div class="tab-pane fade in active" id="meta' + index + '" ></div>');
	    } else {
		inner = $('<div class="tab-pane fade" id="meta' + index + '" ></div>');
	    }
	    
	    // **CWL** Kind of a hack for now. Establish a string->meta lookuptable.
	    navLookup[nativeObject.repo] = "meta" + index;

	    // **CWL** and this is the solution for hiding everything at first.
	    //   Initially I had tried to hide the container before going into this
	    //   loop but that didn't work out very well.
	    //
	    // On discovering how native Bootstrap tab navigation works, all the
	    //   shaneniggans with manually messing with hidden properties go away! 
	    //	    inner.hide();
	    container.append(inner);

	    repoNavList.push(nativeObject.repo);
            inner.append('<p><b>Repo:</b> ' + nativeObject.repo + '</p>');
            inner.append('<p><b>Short Description:</b> ' + nativeObject.shortDescription + '</p>');
	    if (nativeObject.documentation != undefined) {
		inner.append('<p><b>Documentation:</b> <a href=\"' + 
				 nativeObject.documentation +
				 '\" target=\"blank\">' +
				 nativeObject.documentation +
				 '</a></p>');
	    } else {
		inner.append('<p><b>Documentation:</b> None</p>');
	    }


            inner.append('<p><b>Coordinator:</b> ' + nativeObject.coordinator + '</p>');

            if (nativeObject.parent != undefined) {
            	inner.append('<p><b>Parent:</b> <a class="btn btn-link" href="' + repo_url + nativeObject.parent[0] + '">Visit Repo</a> <a class="btn btn-primary btn-xs navBtn" href="#">' + nativeObject.parent[0] + '</a></p>');
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
                }
            }


            if(index < urls.length - 1){
            	inner.append('<hr style="height: 1px; border-color: black;">');
            }

            // fetch next
            if (urls.length - 1 > index) {
                fetch(container, urls, index + 1);
            } else {
		// **CWL** Insert post-processing function here:
		//    1. build tree
		//    2. establish navigation links
		//

		// **CWL** Generate tabs from newly acquired data
		// handle asynchrony issues by making sure all elements are populated.
		cwlpager_init(container,repoNavList);
	    }
        },
        error: function(responseData, textStatus, errorThrown) {
            alert('GET failed.');
        }
    });
}

$(function() {
    var container = $('#content');
    fetch(container, urls, 0);
});