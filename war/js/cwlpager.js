var cwlpager_init = function(container,repoNavList) {

  var numItems = container.find(".tab-pane").size();
  var curr = 0;
  var currMeta;

  while (numItems > curr) {
    if (curr == 0) {
	$('#tabber').append('<li class="active"><a href="#meta' + curr + '" class="page_link" data-toggle="tab">'+repoNavList[curr]+'</a></li>');
	//	$(".metaElement").filter("#meta" + curr).show();
    } else {
	$('#tabber').append('<li><a href="#meta' + curr + '" class="page_link" data-toggle="tab">'+repoNavList[curr]+'</a></li>');
    }
    curr++;
  }
}
