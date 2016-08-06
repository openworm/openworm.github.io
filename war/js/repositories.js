// list of repo metadata
var urls = [
    "https://cdn.rawgit.com/openworm/PyOpenWorm/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/tracker-commons/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/open-worm-analysis-toolbox/master/.openworm.yml",
    "https://cdn.rawgit.com/openworm/org.geppetto/master/.openworm.yml"
];

var fetch = function(container, urls, index) {

    $.ajax({
        type: 'GET',
        dataType: 'text',
        url: urls[index],
        success: function(responseData, textStatus, jqXHR) {
            var nativeObject = YAML.parse(responseData);

            container.append('<p><b>Repo:</b> ' + nativeObject.repo + '</p>');
            container.append('<p><b>Short Description:</b> ' + nativeObject.shortDescription + '</p>');
            container.append('<p><b>Coordinator:</b> ' + nativeObject.coordinator + '</p>');

            if (nativeObject.parent != undefined) {
            	container.append('<p><b>Parent:</b> ' + nativeObject.parent[0] + '</p>');
            }

            if (nativeObject.inputs != undefined) {
            	container.append('<p><b>Outputs:</b></p>');
                for (var i = 0; i < nativeObject.inputs.length; i++) {
                	container.append('<p><div>' + nativeObject.inputs[i] + '</div></p>');
                }
            }
            
            if (nativeObject.outputs != undefined) {
            	container.append('<p><b>Outputs:</b></p>');
                for (var i = 0; i < nativeObject.outputs.length; i++) {
                	container.append('<p><div>' + nativeObject.outputs[i] + '</div></p>');
                }
            }

            if (nativeObject.children != undefined) {
            	container.append('<p><b>Children:</b></p>');
                for (var i = 0; i < nativeObject.children.length; i++) {
                	container.append('<p><div>' + nativeObject.children[i] + '</div></p>');
                }
            }

            if(index < urls.length - 1){
            	container.append('<hr style="height: 1px; border-color: black;">');
            }

            // fetch next
            if (urls.length - 1 > index) {
                fetch(container, urls, index + 1);
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