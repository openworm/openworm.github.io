
$(function()
{
	$("#news-feed").PaRSS("http://openworm.tumblr.com/rss", // url to the feed
	4, // number of items to retrieve
	"M jS Y, g:i a", // date format
	true, // include descriptions
	function()
	{/* optional callback function performed after list is appended to the page */
	});

});
