var cwlpager_init = function(container) {

  var currMeta;

  Object.keys(currRoots).forEach(function(rootkey,index) {
      if (index == 0) {
	  $('#tabber').append('<li class="active"><a href="#' + navElementLookup[rootkey] + '" class="page_link" data-toggle="tab" id="tab_' + navLookup[rootkey] + '">' + rootkey + '</a></li>');
      } else {
	  $('#tabber').append('<li><a href="#' + navElementLookup[rootkey] + '" class="page_link" data-toggle="tab" id="tab_' + navLookup[rootkey] + '">' + rootkey + '</a></li>');
      }
  });

  $('.navBtn').on("click", function() {
	  var btn_name = this.innerHTML;
	  $('#tab_' + navLookup[btn_name]).trigger('click');
	  if (currMeta != undefined) {
	      $(currMeta).css({"border-style": "none"});
	  }
	  $('#' + navElementLookup[btn_name]).css({"border-color": "red", 
						   "border-width":"1px", 
						   "border-style":"solid"});
      });
}
