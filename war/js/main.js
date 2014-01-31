$(function()
{
	var $window = $(window)

	$("#news-feed").PaRSS("http://openworm.tumblr.com/rss", // url to the feed
	4, // number of items to retrieve
	"M jS Y, g:i a", // date format
	true, // include descriptions
	function()
	{/* optional callback function performed after list is appended to the page */
	});

	// side bar
	$('.bs-docs-sidenav').affix(
	{
		offset :
		{
			top : function()
			{
				return $window.width() <= 980 ? 290 : 210
			},
			bottom : 270
		}
	})


	$(".carousel-control").click(function(e)
	{
		$("#tip").hide();
	});

	$('.carousel').carousel({
      interval: 13000
    });

	$('.nav li').click(function(e)
	{
		$('.nav li').removeClass('active');
		
		var $this = $(this);
		if (!$this.hasClass('active'))
		{
			$this.addClass('active');
		}
		
	});
	
	$('.minilogo').tooltip();
});

window.___gcfg = {lang: 'en-GB'};

(function() {
  var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
  po.src = 'https://apis.google.com/js/plusone.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
})();

// countdown time to kickstarter
function showRemainingDays(end) {
	var _second = 1000;
	var _minute = _second * 60;
	var _hour = _minute * 60;
	var _day = _hour * 24;
	
    var now = new Date();
    var distance = end - now;
    if (distance < 0) {
        document.getElementById('countdown').innerHTML = 'EXPIRED!';
        return;
    }
    var days = Math.floor(distance / _day);
    var hours = Math.floor((distance % _day) / _hour);
    var minutes = Math.floor((distance % _hour) / _minute);
    var seconds = Math.floor((distance % _minute) / _second);

    document.getElementById('countdown').innerHTML = days + ' days';
}