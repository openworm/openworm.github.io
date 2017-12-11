var cwlpager_init = function(container) {

  var currElement;
  var currHighlightedDom;
  var currGroup;
  
  var isBtnTransition = false;

  var highlight_element = function(key) {
      // remove previous highlight if applicable
      if (currHighlightedDom != undefined) {
	  currHighlightedDom.css({"border-style": "none"});
      }

      currElement = elementLookup[key];
      currHighlightedDom = $('#' + domElement + currElement);
      currHighlightedDom.css({});
  };
  

  Object.keys(currRoots).forEach(function(rootkey,index) {
      if (index == 0) {
	  $('#tabber').append('<li class="active"><a href="#' + domGroup + groupLookup[rootkey] + '" class="page_link" data-toggle="tab" id="' + tabGroup + groupLookup[rootkey] + '">' + rootkey + '</a></li>');
	  currGroup = groupLookup[rootkey];
	  highlight_element(rootkey);
      } else {
	  $('#tabber').append('<li><a href="#' + domGroup + groupLookup[rootkey] + '" class="page_link" data-toggle="tab" id="' + tabGroup + groupLookup[rootkey] + '">' + rootkey + '</a></li>');
      }
  });


  $('.navBtn').on("click", function() {
	  if ($(this).is(":disabled")) {
	      return;
	  }
	  var btn_name = this.innerHTML;

	  var desiredGroup = groupLookup[btn_name];
	  highlight_element(btn_name);
	  if (desiredGroup != currGroup) {
	      isBtnTransition = true;
	      $('#' + tabGroup + desiredGroup).trigger('click');
	  }
      });


  $('a[data-toggle="tab"]').on('click', function (e) {
      var targetkey = $(e.target).text(); // activated tab
      currGroup = groupLookup[targetkey];
      if (!isBtnTransition) {
	  // highlight the root element if user clicked on tab explicitly
	  highlight_element(targetkey);
      } else {
	  // reset flag if transition was the result of a button click
	  isBtnTransition = false;
      }
      });
};