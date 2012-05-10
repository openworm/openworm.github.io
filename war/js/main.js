/**
 * Main js file - provides bulk of the openworm site functionality
 */

//global variables
var DONATE_URL = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=AG2392TAHLFHQ';

var CYBER_ELEGANS_ID = 'cyber-elegans-sc';
var SIM_ENGINE_ID = 'sim-engine-sc';
var PHYSICS_ID = 'physics-sc';
var CONNECTOME_ID = 'connectome-sc';
var GA_ID = 'ga-sc';
var BROWSER_ID = 'browser-sc';

var ABOUT = 'About';
var NEWS = 'News';
var SHOWCASE = 'Showcase';
var GETTING_STARTED = 'Getting Started';
var PEOPLE = 'People';
var TECH = 'Technology';
var CONTACTS = 'Contact Us';

// these 2 variables need to match
var DEFAULT_TAB = NEWS;
var DEFAULT_TAB_CHOICE = 2;

// an associative array mapping titles of sections to content-ids
var titlesToContentId = {};
titlesToContentId[ABOUT] = "about-content";
titlesToContentId[NEWS] = "news-content";
titlesToContentId[SHOWCASE] = "showcase-content";
titlesToContentId[GETTING_STARTED] = "getting-started-content";
titlesToContentId[PEOPLE] = "people-content";
titlesToContentId[TECH] = "tech-content";
titlesToContentId[CONTACTS] = "contacts-content";

// an associative array mapping url routes to titles
var urlRouteToTitle = {};
urlRouteToTitle["about"] = ABOUT;
urlRouteToTitle["news"] = NEWS;
urlRouteToTitle["showcase"] = SHOWCASE;
urlRouteToTitle["getstarted"] = GETTING_STARTED;
urlRouteToTitle["people"] = PEOPLE;
urlRouteToTitle["tech"] = TECH;
urlRouteToTitle["contacts"] = CONTACTS;

// an associative array mapping url routes to tab choice id
var urlRouteToTabChoice = {};
urlRouteToTabChoice["about"] = 1;
urlRouteToTabChoice["news"] = 2;
urlRouteToTabChoice["showcase"] = 3;
urlRouteToTabChoice["getstarted"] = 4;
urlRouteToTabChoice["tech"] = 5;
urlRouteToTabChoice["people"] = 6;
urlRouteToTabChoice["contacts"] = 7;

function showHideTwitterStream(tabName){
    if (tabName == NEWS) {
        $("#sidePanelsContainer").attr('style', 'display:block;');
        $(".contentPanel").attr('style', 'width:540px;');
    }
    else {
        $("#sidePanelsContainer").attr('style', ' display: none;');
        $(".contentPanel").attr('style', 'width:725px;');
    }
}

function changeBanner(tabName){
    if (tabName == ABOUT) {
        $('.splashPanel').attr('style', 'background: url("../imgs/aboutBanner.png");');
    }
    else 
    if (tabName == NEWS) {
        $('.splashPanel').attr('style', 'background: url("../imgs/feynmanBanner.png");');
    }
    else 
    if (tabName == SHOWCASE) {
        $('.splashPanel').attr('style', 'background: url("../imgs/montaigneBanner.png");');
    }
    else 
    if (tabName == GETTING_STARTED) {
        $('.splashPanel').attr('style', 'background: url("../imgs/sulstonBanner.png");');
    }
    else 
    if (tabName == TECH) {
        $('.splashPanel').attr('style', 'background: url("../imgs/feynmanBanner.png");');
    }
    else 
    if (tabName == PEOPLE) {
        $('.splashPanel').attr('style', 'background: url("../imgs/nietzscheBanner.png");');
    }
    else 
    if (tabName == CONTACTS) {
        $('.splashPanel').attr('style', 'background: url("../imgs/sulstonBanner.png");');
    }
}

var setupShowcase = function(){
	// hide all divs except the default
	$('.showcase-section').hide();
	$('.showcase-default').show();
	
	$('.showcase-trigger').click(function (event){
		// remove selection
		$('.showcase-trigger').removeClass('selected');
		// select the clicked element
		$(this).addClass('selected');
		
		// hide all
		$('.showcase-section').hide();
		var contentId = $(this).attr('target');
		
		// show selected
		$('#' + contentId).show();
	});
} 

var setupTabs = function(tabChoice){
    // setup tabs
    var $appHeaderTabs = $.ninja().tabs({
        choices: [{
            html: ABOUT
        }, {
            html: NEWS
        }, {
            html: SHOWCASE
        }, {
            html: GETTING_STARTED
        }, {
            html: TECH
        }, {
            html: PEOPLE,
            select: function(){ /*console.log('Yeah baby - the worm team owns the world!');*/
            }
        }, {
            html: CONTACTS
        }],
        choice: tabChoice,
        radius: '0.5em'
    }).select(function(event){
        // this runs every time the user *changes* tab
        
        showHideTwitterStream(event.html);
        // 1.change image
        changeBanner(event.html);
        
        // 2.hide all content
        $("div.content").hide();
        
        // 3.show appropriate content
        $('#' + titlesToContentId[event.html]).show();
        
        // 4. set url
        var route, title;
        for (route in urlRouteToTitle) {
            title = urlRouteToTitle[route];
            if (title == event.html) {
                // found it, break out of loop
                break;
            }
        }
        
        window.location.replace('#/' + route)
        
        // test code
        /*console.log('Tab selected: ' + event.html);
         console.log('Route: ' + route);*/
    });
    
    $('#appHeaderTabs').append($appHeaderTabs);
}

$(document).ready(function(){
    // initial tab choice
    var tabChoice;
    
    // hide all content
    $("div.content").hide();
    
    // setup showcase
    setupShowcase();
    
    // routing on page load
    $.routes({
        '/': function(){
            /*console.log('default section selected');*/
            
            // set default tab choice
            tabChoice = DEFAULT_TAB_CHOICE;
            
            setupTabs(tabChoice);
            
            // set header to default for the 1st time the page loads
            $('#contentTitle').html(DEFAULT_TAB);
            // preparation routines
            showHideTwitterStream(DEFAULT_TAB);
            changeBanner(DEFAULT_TAB);
            // show content for default tab
            $('#' + titlesToContentId[DEFAULT_TAB]).show();
        },
        '/:section': 'SectionView',
        '/:section': function(params){
            /*console.log(params.section + ' section selected');
             console.log(urlRouteToTabChoice[params.section] + ' tab choice');*/
            // set tab choice
            tabChoice = urlRouteToTabChoice[params.section];
            
            setupTabs(tabChoice);
            
            // show appropriate content
            // 1.set title
            $('#contentTitle').html(urlRouteToTitle[params.section]);
            
            // 2.hide all content
            $("div.content").hide();
            
            // 3.show appropriate content
            showHideTwitterStream(urlRouteToTitle[params.section]);
            changeBanner(urlRouteToTitle[params.section]);
               
            $('#' + titlesToContentId[urlRouteToTitle[params.section]]).show();
        }
    });
    
    // setup twitter stream stuff
    $("#twitterStreamPanel").tweet({
        avatar_size: 25,
        count: 5,
        username: ["openworm"],
        loading_text: "fetching tweets...",
        refresh_interval: 120
    });
    
    // setup news-feed stuff
    $("#news-feed").PaRSS("http://openworm.tumblr.com/rss", // url to the feed
						  3, // number of items to retrieve
						  "M jS Y, g:i a", // date format
						  true, // include descriptions
						  function(){/* optional callback function performed after list is appended to the page */
    });
    
    var wormMsg = 'Yeah baby - the worm singularity is near!';
    /*console.log(wormMsg);*/
    var easterEgg = 'worm';
    var eggLength = easterEgg.length;
    var keyHistory = '';
    var match;
    $(document).keypress(function(e){
        keyHistory += String.fromCharCode(e.which)
        match = keyHistory.match(easterEgg);
        if (match) {
            alert(wormMsg);
            keyHistory = match = '';
            window.location = "http://browser.openworm.org/";
        }
        else 
            if (keyHistory.length > 30) {
                keyHistory = keyHistory.substr((keyHistory.length - eggLength - 1));
            }
    });
});

//sharethis code
var switchTo5x=true;
stLight.options({publisher:'78af7988-037a-4c1b-8b09-7bc453bcd5c5'});
