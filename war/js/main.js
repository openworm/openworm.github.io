// set all links inside pjax-content to try pjax:
$(document).pjax('a', '#pjax-content', {fragment: '#pjax-content'});

// set explicit links in nav bars to use pjax
$(document).pjax('a[data-pjax]', '#pjax-content', {fragment: '#pjax-content'});

$(document).on('pjax:complete', function() {
    // things to do on page change back to index.html
    if (window.location.pathname === '/index.html') {
	reloadSocial();
    }
    setNavigation();
})

$(window).on('load', function() {
    // things to do on initial page load (defined in main.js)
    loadGoogleAnalytics();
    setNavigation();
    var loc = window.location.pathname;
    if (loc  === '/index.html' || loc === '/' || loc === '') {
	loadGooglePlus();
	loadFacebook();
	loadTwitterWidget();
	refreshNews();
	$('.nav li').removeClass('active');
	$('#home').addClass('active');
    } 
})

$(function() {
    // it's not clear to me what this does?
    // side bar
    $('.bs-docs-sidenav').affix({
        offset: {
            top: function() {
                return $(window).width() <= 980 ? 290 : 210
            },
            bottom: 270
        }
    })

    $(".carousel-control").click(function(e) {
        $("#tip").hide();
    });

    $('.carousel').carousel({
        interval: 13000
    });

    $('.minilogo').tooltip();


window.___gcfg = {
    lang: 'en-GB'
};

// function definitions (hoisted so order does not matter)

function donate(){
    var amount = $(".donation.active");
    if(amount.hasClass("other")){
    	amount=$("#otherAmount").val();
    }
    else{
    	amount=amount.html().replace("$","");
    }
    window.location="\donate.html?amount="+amount;
}

function detectmob() {
    if (window.innerWidth <= 800 && window.innerHeight <= 600) {
        return true;
    } else {
        return false;
    }
}

function setNavigation() {
    $(".nav li").removeClass('active');
    var path = window.location.pathname;

    $(".nav a").each(function() {
        var href = $(this).attr('href');
	// href is returned as ./index.hml, so add . to path
        if ('.' + path === href) {
            $(this).closest('li').addClass('active');
	    return;
        }
    });
}

function refreshNews() {
    $("#news-feed").PaRSS("http://openworm.tumblr.com/rss", // url to the feed
			  6, // number of items to retrieve
			  "M jS Y, g:i a", // date format
			  false, // include descriptions
			  function() {
			      /*
			       * optional callback function performed after list is appended to the
			       * page
			       */
			  })
}


// connections to outside resources (social + GA)

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-29668455-1']);
_gaq.push(['_trackPageview']);


function loadGoogleAnalytics() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.id = 'googleWidget';
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') +
	     '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
}

function loadFacebook() {
    var js, fjs = document.getElementsByTagName('script')[0];
    if (document.getElementById('facebook-jssdk')) return;
    js = document.createElement('script');
    //js.async = true;
    js.id = 'facebook-jssdk';
    js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
    fjs.parentNode.insertBefore(js, fjs);
}

function loadTwitterWidget () {
    var js, fjs = document.getElementsByTagName("script")[0],
	t = window.twtter || {};
    if (document.getElementById("twitter-wjs")) return t;
    js = document.createElement("script");
    js.async = true;
    js.id = "twitter-wjs";
    js.src = "//platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    t._e = [];
    t.ready = function(f) {
	t._e.push(f);
    };

    return t;
}


function loadGooglePlus() {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
}


function reloadSocial() {
    // http://www.blackfishweb.com/blog/asynchronously-loading-twitter-google-facebook-and-linkedin-buttons-and-widgets-ajax-bonus
    
    // Twitter widget
    if (typeof (twttr) != 'undefined') {
	twttr.widgets.load();
    } else {
	loadTwitterWidget();
    }

    // news feed
    refreshNews();
    
    // Facebook
    if (typeof (FB) != 'undefined') {
	delete FB;
	$('#facebook-jssdk').remove();
	$.getScript("http://connect.facebook.net/en_US/all.js#xfbml=1", function () {
            FB.init({ status: true, cookie: true, xfbml: true });
	})
    } else {
	loadFacebook();
    }

    // Google+; Note that google button will not show if page is opened from disk
    if (typeof (gapi) != 'undefined') {
	delete gapi;
        $.getScript('//apis.google.com/js/plusone.js');
    } else {
	loadGooglePlus();
    }
}
