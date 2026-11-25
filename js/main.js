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
    } else if (loc === '/events.html') {
	loadEventsFeed();
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
    } else if (loc === '/events.html') {
	loadEventsFeed();
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


// ============================================================
// Tumblr feed client - shared by index.html, news.html, events.html
// ============================================================
//
// Tumblr put its legacy /api/read/json endpoint behind a bot challenge; it
// now answers 403 for ordinary visitors, which is what silently broke the
// news feed. Everything below uses the supported v2 API instead.
//
// TUMBLR_API_KEY is a public, read-only consumer key. It can only read posts
// that are already public on the blog - it cannot post, edit, or delete.

var TUMBLR_BLOG      = 'openworm.tumblr.com';
var TUMBLR_API_KEY   = 'Sr3W9pREVcJrnwiZb57tj8wRuCbP9d1npEynWqotXMoN5DDj9P';
var TUMBLR_CACHE_MIN = 15;

// Posts tagged with any of these show up on the events page. Both spellings
// are in use on the blog already, so accept both rather than silently
// dropping half the history.
var TUMBLR_EVENT_TAGS = ['event', 'events'];

var _tumblrPending = {};

function _tumblrCacheGet(key) {
    try {
        var raw = window.sessionStorage.getItem(key);
        if (!raw) return null;
        var hit = JSON.parse(raw);
        if ((Date.now() - hit.at) > TUMBLR_CACHE_MIN * 60 * 1000) return null;
        return hit.posts;
    } catch (e) { return null; }
}

function _tumblrCacheSet(key, posts) {
    try {
        window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), posts: posts }));
    } catch (e) { /* private browsing / quota - caching is optional */ }
}

// Fetch posts. opts: {tag, limit, done, fail}
//
// At most ONE request per distinct query is in flight at a time. Duplicate
// callers (window load racing pjax:complete, say) attach to the request that
// is already running instead of firing their own and fighting over the DOM.
function tumblrPosts(opts) {
    opts = opts || {};
    var tag   = opts.tag || '';
    var limit = opts.limit || 20;
    var key   = 'tumblr:' + tag + ':' + limit;

    var cached = _tumblrCacheGet(key);
    if (cached) { if (opts.done) opts.done(cached); return; }

    if (_tumblrPending[key]) { _tumblrPending[key].push(opts); return; }
    _tumblrPending[key] = [opts];

    var settle = function(which, arg) {
        var waiting = _tumblrPending[key] || [];
        delete _tumblrPending[key];
        for (var i = 0; i < waiting.length; i++) {
            if (waiting[i][which]) waiting[i][which](arg);
        }
    };

    var params = { api_key: TUMBLR_API_KEY, limit: limit, filter: 'html' };
    if (tag) params.tag = tag;

    $.ajax({
        url: 'https://api.tumblr.com/v2/blog/' + TUMBLR_BLOG + '/posts',
        data: params,
        dataType: 'jsonp',
        timeout: 15000
    }).done(function(data) {
        var posts = (data && data.response && data.response.posts) || [];
        _tumblrCacheSet(key, posts);
        settle('done', posts);
    }).fail(function(xhr, status) {
        console.error('Tumblr fetch failed [' + key + ']:', status);
        settle('fail', status);
    });
}

// Fetch several tags at once and merge, newest first, de-duplicated by id.
function tumblrPostsForTags(tags, limit, done, fail) {
    var collected = [], seen = {}, remaining = tags.length, anyOk = false;

    var finish = function() {
        if (--remaining > 0) return;
        if (!anyOk) { if (fail) fail('all tag queries failed'); return; }
        collected.sort(function(a, b) { return b.timestamp - a.timestamp; });
        done(collected);
    };

    for (var i = 0; i < tags.length; i++) {
        tumblrPosts({
            tag: tags[i],
            limit: limit,
            done: function(posts) {
                anyOk = true;
                for (var j = 0; j < posts.length; j++) {
                    if (!seen[posts[j].id]) { seen[posts[j].id] = true; collected.push(posts[j]); }
                }
                finish();
            },
            fail: finish
        });
    }
}

// ---- post field helpers (v2 shapes) ------------------------------------

function tumblrStripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}

// Tumblr returns post titles as plain text, so the italics that the rest of
// the site applies to species names are lost. Restore them at render time -
// the repo has explicit commits ("Italicise C. elegans") establishing this as
// house style, and the hand-written archive entries already follow it.
function italiciseSpecies(s) {
    if (!s || s.indexOf('<i>') !== -1 || s.indexOf('<em>') !== -1) return s;
    return s.replace(/\b(C\. elegans|Caenorhabditis elegans|Drosophila)\b/g, '<i>$1</i>');
}

// Photo and quote posts have no title, so one has to be derived from the
// caption. Cut at the first real sentence end rather than at a fixed width,
// otherwise the "title" is a mid-sentence slice of the body and the two read
// as duplicates. Abbreviations matter here: a naive split on ". " would cut
// "C. elegans" in half on a C. elegans blog.
function tumblrDeriveTitle(text) {
    var line = (text || '').split('\n')[0].trim();
    if (line.length <= 60) return line;
    var m = /[^\s]{2,}[.!?](\s|$)/.exec(line);
    if (m && m.index + m[0].length >= 20 && m.index + m[0].length <= 130) {
        return line.substring(0, m.index + m[0].trimEnd().length);
    }
    return line.substring(0, 120);
}

function tumblrPostTitle(post) {
    if (post.title) return post.title;
    if (post.summary) return tumblrDeriveTitle(post.summary);
    var text = tumblrStripHtml(post.body || post.caption || post.description || post.text);
    if (!text) return 'Untitled post';
    return text.indexOf(':') !== -1 && text.indexOf(':') < 80
        ? text.substring(0, text.indexOf(':'))
        : text.substring(0, 120);
}

function tumblrPostBody(post) {
    var html = '';
    if (post.type === 'photo' && post.photos && post.photos.length) {
        var src = post.photos[0].original_size && post.photos[0].original_size.url;
        if (src) html += '<img src="' + src + '" alt="">';
    }
    html += post.body || post.caption || post.description || '';
    if (!html && post.text) {
        html = '<blockquote>' + post.text + '</blockquote>' + (post.source || '');
    }
    return html;
}

// NPF posts carry their title as a heading block inside the body, so a naive
// render prints the title twice - once as the item heading, once at the top of
// the text. Drop the leading copy when it duplicates the heading we already
// rendered.
function stripLeadingTitle(html, title) {
    if (!html || !title) return html;
    var plain = tumblrStripHtml(title);
    if (!plain) return html;

    var el = document.createElement('div');
    el.innerHTML = html;

    // Compare decoded text, not raw HTML: a title containing "&" appears as
    // "&amp;" in the markup, so string matching on the source silently fails.
    // Skip leading media (photo posts open with an <img>) to reach the caption.
    for (var i = 0; i < el.children.length; i++) {
        var node = el.children[i];
        var txt = tumblrStripHtml(node.innerHTML);
        if (!txt) continue;                       // img, spacer, empty node
        if (txt === plain) {
            node.parentNode.removeChild(node);
            return el.innerHTML;
        }
        if (txt.indexOf(plain) === 0) {           // title runs on into the body
            var rest = txt.slice(plain.length).replace(/^[\s.,:;!?-]+/, '');
            node.textContent = rest;
            return el.innerHTML;
        }
        break;                                    // first real text isn't the title
    }
    return el.innerHTML;
}

function tumblrFormatDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---- event date convention ---------------------------------------------
//
// A post's publication date is when the event was ANNOUNCED, which is not
// the same thing as when the event happens - and for anything upcoming they
// point in opposite directions. So an event post may carry a date tag:
//
//     date:2026-09-15                 single day
//     date:2026-01-29..2026-01-30     a range, rendered "29-30"
//
// With no date tag we fall back to the post's own date, which is the right
// answer for the historical posts that predate this convention.
function tumblrEventDate(post) {
    // Date.UTC silently rolls impossible values over - Date.UTC(2026, 12, 99)
    // is April 2027, not an error - so a typo in a tag would quietly produce a
    // confidently wrong date. Build the date, then check it reads back the way
    // it was written; anything that does not is treated as not a date tag.
    var toUTC = function(y, mo, d) {
        var dt = new Date(Date.UTC(y, mo - 1, d));
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
        return dt;
    };

    var tags = post.tags || [];
    var re = /^(?:date:)?(\d{4})-(\d{2})-(\d{2})(?:\.\.(\d{4})-(\d{2})-(\d{2}))?$/;
    for (var i = 0; i < tags.length; i++) {
        var m = re.exec($.trim(tags[i]));
        if (!m) continue;
        var start = toUTC(+m[1], +m[2], +m[3]);
        if (!start) continue;
        var end = start;
        if (m[4]) {
            end = toUTC(+m[4], +m[5], +m[6]);
            if (!end || end < start) end = start;
        }
        return { start: start, end: end, explicit: true };
    }
    var posted = new Date(post.timestamp * 1000);
    return { start: posted, end: posted, explicit: false };
}

// ---- home page: short news list ----------------------------------------

function refreshNews() {
    tumblrPosts({
        limit: 6,
        done: function(posts) {
            var html = '';
            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                html += '<li>';
                html += '<a href="' + post.post_url + '" target="_blank">' + italiciseSpecies(tumblrPostTitle(post)) + '</a>';
                html += ' <span class="muted">(' + tumblrFormatDate(new Date(post.timestamp * 1000)) + ')</span>';
                html += '</li>';
            }
            $('#news-feed').html(html);
        },
        fail: function() {
            $('#news-feed').html('<li class="muted">Unable to load the news feed right now. ' +
                '<a href="https://openworm.tumblr.com" target="_blank">Read it on Tumblr &raquo;</a></li>');
        }
    });
}

// ---- news.html: full feed with sidebar ---------------------------------

function loadFullNewsFeed() {
    tumblrPosts({
        limit: 25,
        done: function(posts) {
            var mainHtml = '';
            var navHtml  = '<li class="nav-header">News Archive</li>';

            for (var i = 0; i < posts.length; i++) {
                var post    = posts[i];
                var dateStr = tumblrFormatDate(new Date(post.timestamp * 1000));
                var anchor  = 'news-' + i;

                navHtml += '<li><a href="#' + anchor + '"><i class="fa fa-chevron-right"></i>' + dateStr + '</a></li>';

                var border = (i < posts.length - 1) ? 'border-bottom: 1px solid #eee;' : '';
                mainHtml += '<li id="' + anchor + '" style="margin-bottom: 30px; padding-bottom: 20px; ' + border + '">';
                mainHtml += '<h3 style="margin-top: 0;"><a href="' + post.post_url + '" target="_blank">' + italiciseSpecies(tumblrPostTitle(post)) + '</a></h3>';
                mainHtml += '<p class="muted" style="font-size: 14px; margin-bottom: 10px;">' + dateStr + '</p>';
                mainHtml += '<div style="line-height: 1.6;">' + stripLeadingTitle(tumblrPostBody(post), tumblrPostTitle(post)) + '</div>';
                mainHtml += '</li>';
            }

            $('#news-feed-full').html(mainHtml);
            if ($('#news-nav').length) $('#news-nav').html(navHtml);

            $('#news-feed-full img').css({
                'max-width': '100%', 'height': 'auto', 'margin': '15px 0', 'display': 'block'
            });
        },
        fail: function(status) {
            var msg = (status === 'timeout') ? 'The request timed out.' : 'The feed could not be reached.';
            $('#news-feed-full').html('<li class="muted" style="text-align: center; padding: 40px;">' +
                msg + ' <a href="https://openworm.tumblr.com" target="_blank">Read the blog directly &raquo;</a></li>');
            if ($('#news-nav').length) {
                $('#news-nav').html('<li class="nav-header">News Archive</li>' +
                    '<li><a href="https://openworm.tumblr.com" target="_blank"><i class="fa fa-external-link"></i> View on Tumblr</a></li>');
            }
        }
    });
}

// ---- events.html: events drawn from tagged blog posts -------------------

var MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Jun 22, 2021" for a single day, "Jan 29-30, 2018" for a range - matching
// how the hand-written archive entries below the feed are written.
function tumblrFormatEventDate(when) {
    var s = when.start, e = when.end;
    var out = MONTH_ABBR[s.getUTCMonth()] + ' ' + s.getUTCDate();
    if (e.getTime() !== s.getTime()) {
        out += (e.getUTCMonth() === s.getUTCMonth())
            ? '\u2013' + e.getUTCDate()
            : '\u2013' + MONTH_ABBR[e.getUTCMonth()] + ' ' + e.getUTCDate();
    }
    return out + ', ' + s.getUTCFullYear();
}

// Render one post in the same shape as a news item and as the archived
// events below it, so the whole page reads as one list.
function renderEventItem(post, anchor, isLast) {
    var dateStr = tumblrFormatEventDate(tumblrEventDate(post));
    var border  = isLast ? '' : 'border-bottom: 1px solid #eee;';

    var html = '<li id="' + anchor + '" style="margin-bottom: 30px; padding-bottom: 20px; ' + border + '">';
    html += '<h3 style="margin-top: 0;"><a href="' + post.post_url + '" target="_blank">' + italiciseSpecies(tumblrPostTitle(post)) + '</a></h3>';
    html += '<p class="muted" style="font-size: 14px; margin-bottom: 10px;">' + dateStr + '</p>';

    var body = tumblrStripHtml(stripLeadingTitle(tumblrPostBody(post), tumblrPostTitle(post)));
    if (body.length > 320) body = body.substring(0, 317).replace(/\s+\S*$/, '') + '...';
    if (body) html += '<div style="line-height: 1.6;">' + body + '</div>';

    html += '<p style="margin-top: 8px;"><a href="' + post.post_url + '" target="_blank">' +
            '<i class="fa fa-globe"></i> Read the post</a></p>';
    html += '</li>';
    return html;
}

function _eventSectionHeading(text) {
    return '<li style="margin: 0 0 15px;"><h4 class="muted" style="margin: 0; ' +
           'text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">' + text + '</h4></li>';
}

function loadEventsFeed() {
    var $feed = $('#events-feed');
    if (!$feed.length) return;

    tumblrPostsForTags(TUMBLR_EVENT_TAGS, 50, function(posts) {
        // "Today" at UTC midnight, so an event happening today still counts
        // as upcoming rather than dropping into the past the morning of.
        var now = new Date();
        var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

        var upcoming = [], past = [];
        for (var i = 0; i < posts.length; i++) {
            (tumblrEventDate(posts[i]).end.getTime() >= today ? upcoming : past).push(posts[i]);
        }
        // Soonest first for what is ahead; most recent first for what is behind.
        upcoming.sort(function(a, b) { return tumblrEventDate(a).start - tumblrEventDate(b).start; });
        past.sort(function(a, b) { return tumblrEventDate(b).start - tumblrEventDate(a).start; });

        var html = '', navHtml = '', n = 0;
        var addGroup = function(label, list) {
            if (!list.length) return;
            html += _eventSectionHeading(label);
            for (var j = 0; j < list.length; j++) {
                var anchor = 'event-' + (n++);
                var last = (list === past) && (j === list.length - 1);
                html += renderEventItem(list[j], anchor, last);
                navHtml += '<li><a href="#' + anchor + '"><i class="fa fa-chevron-right"></i>' +
                           tumblrFormatEventDate(tumblrEventDate(list[j])) + '</a></li>';
            }
        };
        addGroup('Coming up', upcoming);
        addGroup('Recently', past);

        if (!html) {
            html = '<li class="muted">No events posted to the blog yet &mdash; earlier events are listed below.</li>';
        }
        $feed.html(html);
        $('#events-nav-loading').replaceWith(navHtml ||
            '<li><a href="https://openworm.tumblr.com/tagged/event" target="_blank">' +
            '<i class="fa fa-external-link"></i> On Tumblr</a></li>');
    }, function() {
        $feed.html('<li class="muted" style="text-align: center; padding: 40px;">' +
            'Could not reach the blog just now. ' +
            '<a href="https://openworm.tumblr.com/tagged/event" target="_blank">See events on Tumblr &raquo;</a><br>' +
            'Earlier events are listed below.</li>');
        $('#events-nav-loading').replaceWith(
            '<li><a href="https://openworm.tumblr.com/tagged/event" target="_blank">' +
            '<i class="fa fa-external-link"></i> On Tumblr</a></li>');
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
