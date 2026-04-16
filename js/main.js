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
    } else if (loc === '/news.html') {
	loadFullNewsFeed();
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
	    // Twitter/X feed widget
	    $('#fb-root').html('');
	    $('#tweeter').html('<div style="text-align: center; padding: 40px;"><i class="fa fa-spinner fa-spin fa-2x"></i><p class="muted">Loading tweets...</p></div>');
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
	loadTwitterFeed();
	refreshNews();
	$('.nav li').removeClass('active');
	$('#home').addClass('active');
    } else if (loc === '/donate.html') {
	//console.log('loc = donate');
	loadDonationControls();
    } else if (loc === '/news.html') {
	loadFullNewsFeed();
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


function getTumblrPostTitle(post) {
    if (post['regular-title']) return post['regular-title'];
    if (post['link-text']) return post['link-text'];
    if (post['quote-text']) return post['quote-text'].substring(0, 100);
    if (post['photo-caption']) {
        var tmp = document.createElement('div');
        tmp.innerHTML = post['photo-caption'];
        return (tmp.textContent || tmp.innerText || '').substring(0, 100);
    }
    if (post['regular-body']) {
        var tmp = document.createElement('div');
        tmp.innerHTML = post['regular-body'];
        return (tmp.textContent || tmp.innerText || '').substring(0, 100);
    }
    return 'Untitled post';
}

function refreshNews() {
    // Use Tumblr v1 JSONP API (no CORS needed)
    $.ajax({
        url: 'https://openworm.tumblr.com/api/read/json',
        data: { num: 6 },
        dataType: 'jsonp',
        timeout: 30000,
        success: function(data) {
            var posts = data.posts || [];
            var html = '';

            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                var title = getTumblrPostTitle(post);
                var link = post['url-with-slug'] || post['url'];
                var pubDate = new Date(post['unix-timestamp'] * 1000);
                var dateStr = pubDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                html += '<li>';
                html += '<a href="' + link + '" target="_blank">' + title + '</a>';
                html += ' <span class="muted">(' + dateStr + ')</span>';
                html += '</li>';
            }
            $("#news-feed").html(html);
        },
        error: function(err) {
            console.error('Error loading news feed:', err);
            $("#news-feed").html('<li class="muted">Unable to load news feed.</li>');
        }
    });
}

function getTumblrPostBody(post) {
    if (post['regular-body']) return post['regular-body'];
    if (post['photo-caption']) return post['photo-caption'];
    if (post['link-description']) return post['link-description'];
    if (post['quote-text']) return '<blockquote>' + post['quote-text'] + '</blockquote>' + (post['quote-source'] || '');
    return '';
}

function loadFullNewsFeed() {
    // Load full news feed with sidebar navigation for news.html page
    console.log('Loading full news feed with sidebar...');

    $.ajax({
        url: 'https://openworm.tumblr.com/api/read/json',
        data: { num: 25 },
        dataType: 'jsonp',
        timeout: 30000,
        success: function(data) {
            console.log('Feed loaded via JSONP');

            var posts = data.posts || [];
            console.log('Found ' + posts.length + ' posts');

            var mainHtml = '';
            var navHtml = '<li class="nav-header">News Archive</li>';

            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                var title = getTumblrPostTitle(post);
                var link = post['url-with-slug'] || post['url'];
                var pubDate = new Date(post['unix-timestamp'] * 1000);
                var dateStr = pubDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                var description = getTumblrPostBody(post);

                // Create anchor ID from index
                var anchorId = 'news-' + i;

                // Add to sidebar nav (if nav element exists)
                navHtml += '<li><a href="#' + anchorId + '"><i class="fa fa-chevron-right"></i>' + dateStr + '</a></li>';

                // Add to main content
                var borderStyle = (i < posts.length - 1) ? 'border-bottom: 1px solid #eee;' : '';
                mainHtml += '<li id="' + anchorId + '" style="margin-bottom: 30px; padding-bottom: 20px; ' + borderStyle + '">';
                mainHtml += '<h3 style="margin-top: 0;"><a href="' + link + '" target="_blank">' + title + '</a></h3>';
                mainHtml += '<p class="muted" style="font-size: 14px; margin-bottom: 10px;">' + dateStr + '</p>';
                mainHtml += '<div style="line-height: 1.6;">' + description + '</div>';
                mainHtml += '</li>';
            }

            $("#news-feed-full").html(mainHtml);
            
            // Update sidebar nav if it exists
            if ($("#news-nav").length) {
                $("#news-nav").html(navHtml);
            }
            
            console.log('Rendered ' + posts.length + ' items');

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
            } else {
                errorMsg += 'Error: ' + status;
            }

            $("#news-feed-full").html('<li class="muted" style="text-align: center; padding: 40px;">' + errorMsg + ' <a href="https://openworm.tumblr.com" target="_blank">View blog directly &raquo;</a></li>');
            
            // Update sidebar nav with fallback if it exists
            if ($("#news-nav").length) {
                $("#news-nav").html('<li class="nav-header">News Archive</li><li><a href="https://openworm.tumblr.com" target="_blank"><i class="fa fa-external-link"></i> View on Tumblr</a></li>');
            }
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
    
    // Twitter/X feed (custom widget using Nitter RSS)
    loadTwitterFeed();

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
