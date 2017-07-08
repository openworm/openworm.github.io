// set ALL links inside pjax-content to try pjax
// this may slow down outside links with pjax request?
$.pjax.defaults.timeout = 1500
$(document).pjax('a', '#pjax-content', {fragment: '#pjax-content'});
// set explicit links in nav bars to use pjax
$(document).pjax('a[data-pjax]', '#pjax-content', {fragment: '#pjax-content'});

$(document).on('pjax:complete', function() {
    console.log('pjax:complete');
    // things to do on pjax link to specific page
    var loc = window.location.pathname;
    if (loc === '/index.html' || loc === '/' || loc === '') {
	reloadSocial();
    } else if (loc === '/donate.html') {
	loadDonationControls();
    }
    setNavigation();
})

$(document).on('pjax:popstate', function() {
    console.log('pjax:popstate');
    // things to do on pjax BACK/FORWARD to specific page
    var loc = window.location.pathname;
    if (loc === '/donate.html') {
	// hack to make donate controls reload _after_ page load on back
	$(document).on('pjax:end', function () {
	    console.log('loadDonationControls');
	    loadDonationControls();
	})
    }	      
    setNavigation();
})


$(window).on('load', function() {
    console.log('window initial load');
    // things to do on initial page load (defined in main.js)
    // for all pages:
    loadGoogleAnalytics();
    setNavigation();
    
    $(".carousel-control").click(function(e) {
        $("#tip").hide();
    })
    
    $('.carousel').carousel({
        interval: 13000
    })

    $('.minilogo').tooltip();

    window.___gcfg = {
	lang: 'en-GB'
    }

    // for specific pages:
    var loc = window.location.pathname;
    if (loc  === '/index.html' || loc === '/' || loc === '') {
	console.log('loc = index');
	loadGooglePlus();
	loadFacebook();
	loadTwitterWidget();
	refreshNews();
	$('.nav li').removeClass('active');
	$('#home').addClass('active');
    } else if (loc === '/donate.html') {
	console.log('loc = donate');
	loadDonationControls();
    }
})

window.___gcfg = {
    lang: 'en-GB'
};

// function definitions (hoisted so order does not matter)

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
    console.log(typeof (FB));
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


// donation

function loadDonationControls() {
    $(".donation").on('click', function() {
    	$(".donation").removeClass("active");
    	$("#otherAmount").removeClass("active");
    	$("#amountSent").attr("value",$(this).html().replace("$",""));
    	$(this).addClass("active");
    })

    $(".other").click(function(){
    	$("#otherAmount").addClass("active");
    	$("#amountSent").attr("value",$(this).val());
    	$("#otherAmount").focus();
    })

    $("#otherAmount").click(function(){
    	$("#otherAmount").addClass("active");
    	$(".donation").removeClass("active");
    	$("#amountSent").attr("value",$(this).val());
    	$(".other").addClass("active");
    })

    $("#otherAmount").on("input",function(){
    	$("#amountSent").attr("value",$(this).val());
    })

    var amount = getUrlParameter('amount');
    if (amount=="" || amount==undefined) {
    	$("#d50").click();
    }
    else if (amount=="5") {
    	$("#d5").click();
    }
    else if (amount=="25") {
    	$("#d25").click();
    }
    else if (amount=="50") {
	$("#d50").click();
    }
    else if (amount=="100") {
	$("#d100").click();
    }
    else {
	$(".other").click();
	$("#otherAmount").val(amount);
	$("#amountSent").attr("value",amount);
    }
}


function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
	sURLVariables = sPageURL.split('&'),
	sParameterName,
	i;

    for (i = 0; i < sURLVariables.length; i++) {
	sParameterName = sURLVariables[i].split('=');

	if (sParameterName[0] === sParam) {
	    return sParameterName[1] === undefined ? true : sParameterName[1];
	}
    }
}
