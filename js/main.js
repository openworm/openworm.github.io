// set pjax timeout - after timeout, regular html request is sent. 1500ms is arbitrary
$.pjax.defaults.timeout = 1500

// fragment extracts div id='pjax content' from full HTML
// server could alternatively be configured to send only the needed fragment

// set ALL links inside pjax-content to try pjax
// this may slow down outside links but is easier than labelling each link data-pjax
$(document).pjax('a', '#pjax-content', {fragment: '#pjax-content'});
// set explicit links in nav bars to use pjax
$(document).pjax('a[data-pjax]', '#pjax-content', {fragment: '#pjax-content'});

// things to do on pjax _link_ to page
$(document).on('pjax:complete', function() {
    console.log('pjax:complete');
    var loc = window.location.pathname;
    if (loc === '/index.html' || loc === '/' || loc === '') {
        loadDonationControls();
	    reloadSocial();
    } else if (loc === '/donate.html') {
	loadDonationControls();
    } else if (loc === '/people.html') {
	$.getScript("https://cdnjs.cloudflare.com/ajax/libs/mustache.js/2.2.0/mustache.min.js",
		    function() {
			loadContributors();
		    })
    }
    setNavigation();
})

// things to do on pjax BACK/FORWARD to specific page
$(document).on('pjax:popstate', function() {
    console.log('pjax:popstate');
    $(document).on('pjax:end', function () {
	var loc = window.location.pathname;
	if (loc === '/donate.html') {
	    // hack to make donate controls reload _after_ page load on back
	    loadDonationControls();
	}
	else if (loc === '/index.html' || loc === '/' || loc === '') {
	    // Twitter widget
	    $('#fb-root').html('');
	    $('#tweeter').html('<a class="twitter-timeline" href="https://twitter.com/OpenWorm" data-height="600" data-theme="light" data-chrome="noheader nofooter noborders">Tweets by @OpenWorm</a>');
	    //$.pjax.reload('#pjax-content', {fragment:'#pjax-content'});
	    reloadSocial();
	    // setNavigation();
	}
	console.log(loc);
	$(function () {
	    setNavigation();
	    //deselect old link 
	    document.activeElement.blur();
	})
    })
})


// things to do on initial page load
$(window).on('load', function() {
    console.log('window initial load');
    // for all pages:
    setNavigation();
    loadGoogleAnalytics();
    
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
	//console.log('loc = index');
	loadGooglePlus();
	loadFacebook();
	loadTwitterWidget();
	refreshNews();
	$('.nav li').removeClass('active');
	$('#home').addClass('active');
    } else if (loc === '/donate.html') {
	//console.log('loc = donate');
	loadDonationControls();
    } else if (loc === '/people.html') {
	$.getScript("https://cdnjs.cloudflare.com/ajax/libs/mustache.js/2.2.0/mustache.min.js",
		    function() {
			loadContributors();
		    })
    }
})


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

// general function definitions

function setNavigation() {
    $(".nav li").removeClass('active');
    var path = window.location.pathname;

    $(".nav a").each(function() {
        var href = $(this).attr('href');
	// href is returned as ./index.hml, so add . to path
	// this is most likely error moving from local to online site?
        if ('.' + path === href) {
            $(this).closest('li').addClass('active');
	    return;
        }
    })
}


function refreshNews() {
    // Use allOrigins CORS proxy to fetch Tumblr RSS
    $.ajax({
        url: 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://openworm.tumblr.com/rss'),
        method: 'GET',
        dataType: 'json',
        timeout: 30000,
        success: function(data) {
            var parser = new DOMParser();
            var xml = parser.parseFromString(data.contents, 'text/xml');
            var items = xml.querySelectorAll('item');

            var html = '';
            var count = 0;
            items.forEach(function(item) {
                if (count >= 6) return;

                var title = item.querySelector('title').textContent;
                var link = item.querySelector('link').textContent;
                var pubDate = new Date(item.querySelector('pubDate').textContent);
                var dateStr = pubDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                html += '<li>';
                html += '<a href="' + link + '" target="_blank">' + title + '</a>';
                html += ' <span class="muted">(' + dateStr + ')</span>';
                html += '</li>';
                count++;
            });
            $("#news-feed").html(html);
        },
        error: function(err) {
            console.error('Error loading news feed:', err);
            $("#news-feed").html('<li class="muted">Unable to load news feed.</li>');
        }
    });
}

function loadFullNewsFeed() {
    // Load full news feed with descriptions for news.html page
    console.log('Loading full news feed...');

    $.ajax({
        url: 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://openworm.tumblr.com/rss'),
        method: 'GET',
        dataType: 'json',
        timeout: 30000,
        success: function(data) {
            console.log('Feed loaded, parsing...');

            var parser = new DOMParser();
            var xml = parser.parseFromString(data.contents, 'text/xml');
            var items = xml.querySelectorAll('item');

            console.log('Found ' + items.length + ' items');

            var html = '';
            var count = 0;

            for (var i = 0; i < items.length && count < 25; i++) {
                var item = items[i];

                var title = item.querySelector('title').textContent;
                var link = item.querySelector('link').textContent;
                var pubDate = new Date(item.querySelector('pubDate').textContent);
                var dateStr = pubDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });

                var descNode = item.querySelector('description');
                var description = descNode ? descNode.textContent : '';

                var borderStyle = (count < 24) ? 'border-bottom: 1px solid #eee;' : '';

                html += '<li style="margin-bottom: 30px; padding-bottom: 20px; ' + borderStyle + '">';
                html += '<h3 style="margin-top: 0;"><a href="' + link + '" target="_blank">' + title + '</a></h3>';
                html += '<p class="muted" style="font-size: 14px; margin-bottom: 10px;">' + dateStr + '</p>';
                html += '<div style="line-height: 1.6;">' + description + '</div>';
                html += '</li>';
                count++;
            }

            $("#news-feed-full").html(html);
            console.log('Rendered ' + count + ' items');

            // Make images responsive
            $("#news-feed-full img").css({
                "max-width": "100%",
                "height": "auto",
                "margin": "15px 0",
                "display": "block"
            });
        },
        error: function(xhr, status, err) {
            console.error('Error loading full feed - Status:', status, 'Error:', err);

            var errorMsg = 'Unable to load news feed. ';
            if (status === 'timeout') {
                errorMsg += 'Request timed out.';
            } else if (xhr.status === 0) {
                errorMsg += 'Network or CORS error.';
            } else {
                errorMsg += 'Error: ' + status;
            }

            $("#news-feed-full").html('<li class="muted" style="text-align: center; padding: 40px;">' + errorMsg + ' <a href="https://openworm.tumblr.com" target="_blank">View blog directly &raquo;</a></li>');
        }
    });
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
    js.id = "twitter-wjs";
    js.src = "//platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    t._e = [];
    t.ready = function(f) {
	t._e.push(f);
    };

    return t;
}

// sets language for google+ widget
window.___gcfg = {
    lang: 'en-GB'
};

function loadGooglePlus() {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
}


function reloadSocial() {
    // partially stolen from: http://www.blackfishweb.com/blog/asynchronously-loading-twitter-google-facebook-and-linkedin-buttons-and-widgets-ajax-bonus
    
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
	$.getScript("https://connect.facebook.net/en_US/all.js#xfbml=1", function () {
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


// donation controls

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
