// list of repo metadata
var urls = [
    "https://cdn.rawgit.com/openworm/PyOpenWorm/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/tracker-commons/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/open-worm-analysis-toolbox/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/org.geppetto/master/.openworm.yml"
];

var repoNavList = [];

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
            	inner.append('<p><b>Parent:</b> ' + nativeObject.parent[0] + '</p>');
            }

            if (nativeObject.inputs != undefined) {
            	inner.append('<p><b>Outputs:</b></p>');
                for (var i = 0; i < nativeObject.inputs.length; i++) {
                	inner.append('<p><div>' + nativeObject.inputs[i] + '</div></p>');
                }
            }
            
            if (nativeObject.outputs != undefined) {
            	inner.append('<p><b>Outputs:</b></p>');
                for (var i = 0; i < nativeObject.outputs.length; i++) {
                	inner.append('<p><div>' + nativeObject.outputs[i] + '</div></p>');
                }
            }

            if (nativeObject.children != undefined) {
            	inner.append('<p><b>Children:</b></p>');
                for (var i = 0; i < nativeObject.children.length; i++) {
                	inner.append('<p><div>' + nativeObject.children[i] + '</div></p>');
                }
            }

            if(index < urls.length - 1){
            	inner.append('<hr style="height: 1px; border-color: black;">');
            }

            // fetch next
            if (urls.length - 1 > index) {
                fetch(container, urls, index + 1);
            } else {
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