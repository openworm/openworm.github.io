var $window = $(window)

$("#news-feed").PaRSS("http://openworm.tumblr.com/rss", // url to the feed
		      6, // number of items to retrieve
		      "M jS Y, g:i a", // date format
		      false, // include descriptions
		      function() {
			  /*
			   * optional callback function performed after list is appended to the
			   * page
			   */
		      });

// side bar
$('.bs-docs-sidenav').affix({
    offset: {
        top: function() {
            return $window.width() <= 980 ? 290 : 210
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

$('.nav li').click(function(e) {
    $('.nav li').removeClass('active');

    var $this = $(this);
    if (!$this.hasClass('active')) {
        $this.addClass('active');
    }

});

$('.minilogo').tooltip();

$(".donation").click(function(){
    $(".donation").removeClass("active");
    $("#otherAmount").removeClass("active");
    $("#amountSent").attr("value",$(this).html().replace("$",""));
    $(this).addClass("active");
});

$(".other").click(function(){
    $("#otherAmount").addClass("active");
    $("#amountSent").attr("value",$(this).val());
    $("#otherAmount").focus();
});

$("#otherAmount").click(function(){
    $("#otherAmount").addClass("active");
    $(".donation").removeClass("active");
    $("#amountSent").attr("value",$(this).val());
    $(".other").addClass("active");
});

$("#otherAmount").on("input",function(){
    $("#amountSent").attr("value",$(this).val());
});

var amount = getUrlParameter('amount');
if(amount=="" || amount==undefined){
    $("#d50").click();
}
else if(amount=="5"){
    $("#d5").click();
}
else if(amount=="25"){
    $("#d25").click();
}
else if(amount=="50"){
    $("#d50").click();
}
else if(amount=="100"){
    $("#d100").click();
}
else{
    $(".other").click();
    $("#otherAmount").val(amount);
    $("#amountSent").attr("value",amount);
}



var getUrlParameter = function getUrlParameter(sParam) {
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
};

window.___gcfg = {
    lang: 'en-GB'
};

(function() {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();

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
