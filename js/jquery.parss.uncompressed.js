/**
 * File: jquery.parss.js
 * Author: Brad Westness
 * Date: 02/07/2011
 * Purpose: Append the contents of an RSS feed
 * to a set of list elements.
 */
(function(jQuery){ 
  jQuery.fn.PaRSS = function(feed_url, item_count, date_format, show_descriptions, callback_function) {
    var ul_set = this,
    data = {
      feed_url: feed_url,
      item_count: item_count,
      date_format: date_format,
      show_descriptions: show_descriptions,
      callback_function: callback_function
    };
    
    /**
     * Initialize the Google Feed object and
     * load the actual feed
     */
    function initializeFeed() {
      var feed = new google.feeds.Feed(feed_url,{api_key: "48vs0nz6zbuajmtn184fytqilpes0t4cj0r3n2ev"});
      if(data.item_count) {
        feed.setNumEntries(data.item_count);
      }
      feed.load(function(result) {
        if(!result.error){
          getItems(result.feed.entries);              
        }
      });
    }
    
    /**
     * Pull the content from the feed
     * items and add it to the ul
     */
    function getItems(entries){
      var list = "";
      jQuery.each(entries, function(i, entry) {
        var list_item = "<span class='parss-title'><a href='" + entry.link + "'>" + entry.title + "</a></span>";
        
        if(data.date_format && data.date_format.length > 0) {
          list_item += "<span class='parss-date'>" + getFormattedDate(entry.publishedDate, data.date_format) + "</span>";
        }
        
        switch (data.show_descriptions) {
          case "image":
            var img = getImageFromContent(entry.content);
            if(img) {
              list_item += "<span class='parss-image'>" + img + "</span>";
            }
            list_item += "<span class='parss-description'>" + entry.contentSnippet + "</span>";
            break;
          case "content":
            list_item += "<span class='parss-description'>" + entry.content + "</span>";
            break;
          case true: case "true":
            list_item += "<span class='parss-description'>" + entry.contentSnippet + "</span>";
            break;
          default:
            break;
        }
        
        //
        // Add the item to the list
        list += "<li>" + list_item + "</li>";         
      });
      
      //
      // Add the list to the page
      jQuery(ul_set).empty().append(list);     
      
      //
      // Perform callback function (if any)      
      if (typeof callback_function == 'function') {
        callback_function.call(this);
      }
    }
    
    /**
     * Format a date according to a supplied
     * format string using PHP date format
     * http://php.net/manual/en/function.date.php
     */
    function getFormattedDate(date, format) {
      var months = ["January","February","March","April","May","June","July","August","September","October","November","December"],
      days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      date = new Date(Date.parse(date)),
      formatted_date = "";
      
      for (var i = 0; i < format.length; i += 1) {
        switch(format.charAt(i)) {
          case 'd':
            // Day of the month, 2 digits with leading zeros
            formatted_date += prependZeros(date.getDate());
            break;
          case 'D':
            // A textual representatino of a day, three letters
            formatted_date += days[date.getDay()].substring(0,3);
            break;
          case 'j':
            // Day of the month without leading zeros
            formatted_date += date.getDate();          
            break;
          case 'l':
            // A full textual representation of the day of the week
            formatted_date += days[date.getDay()];
            break;
          case 'N':
            // Numeric representation of the day of the week (1 - 7)
            formatted_date += date.getDay() + 1;
            break;
          case 'S':
            // English ordian suffix for the day of the month, 2 characters (st, nd, rd)
            formatted_date += getDateSuffix(date.getDate());
            break;
          case 'w':
            // Numeric representation of the day of the week (0 - 6)
            formatted_date += date.getDay();
            break;
          case 'z':
            // The day of the year (starting from 0)
            // not implemented
            break;
          case 'W':
            // Week number of year, weeks starting on Monday
            // not implemented
            break;
          case 'F':
            // A full textural representation of a month, such as 'January' or 'March'
            formatted_date += months[date.getMonth()];
            break;
          case 'm':
            // Numeric representation of a month, with leading zeroes (01 - 12)
            formatted_date += prependZeros(date.getMonth() + 1);
            break;
          case 'M':
            // A short textural representation of a month, three letters ('Jan' - 'Dec')
            formatted_date += months[date.getMonth()].substring(0,3);
            break;
          case 'n':
            // Numeric representation of a month, without leading zeros (1 - 12)
            formatted_date += date.getMonth() + 1;
            break;
          case 't':
            // Number of days in the given month
            // Not implemented
            break;
          case 'L':
            // Whether it's a leap year
            // Not implemented
            break;
          case 'o':
          case 'Y':
            // A full numeric representation of a year, 4 digits
            formatted_date += date.getFullYear();
            break;
          case 'y':
            // A two-digit representation of a year
            formatted_date += date.getFullYear().toString().substring(-2);
            break;
          case 'a':
            // Lowercase Ante meridiem and Post meridiem
            formatted_date += (date.getHours() < 12) ? "am" : "pm";
            break;
          case 'A':
            // Uppercase Ante meridiem and Post meridiem
            formatted_date += (date.getHours() < 12) ? "AM" : "PM";
            break;
          case 'B':
            // Swatch internet time
            // not implemented
            break;
          case 'g':
            // 12-hour format of an hour without leading zeros (1 - 12)
            formatted_date += (date.getHours() > 12) ? date.getHours() - 12 : date.getHours();
            break;
          case 'G':
            // 24-hour format of an hour without leading zeros (1 - 24)
            formatted_date += date.getHours();
            break;
          case 'h':
            // 12-hour format of an hour with leading zeros (01 - 12)
            formatted_date += prependZeros((date.getHours() > 12) ? date.getHours() - 12 : date.getHours());
            break;
          case 'H':
            // 24-hour format of an hour with leading zeros (01 - 24)
            formatted_date += prependZeros(date.getHours());
            break;
          case 'i':
            // Minutes, with leading zeros (00 - 59)
            formatted_date += prependZeros(date.getMinutes());
            break;
          case 's':
            // Seconds, with leading zeros (00 - 59)
            formatted_date += prependZeros(date.getDate());
            break;
          case 'u':
            // Microseconds (654321)
            formatted_date += date.getMilliseconds();
            break;
          case 'e':
            // Timezone identifier ('UTC', 'GMT')
            // not implemented
            break;
          case 'O':
          case 'P':
            // Difference to Greenwich time (GMT) in hours (+0200)
            formatted_date += date.getTimezoneOffset();
            break;
          case 'T':
            // Timezone abbreviation ('EST', 'MDT')
            // not implemented
            break;
          case 'Z':
            // Timezone offset in seconds
            // not implemented
            break;
          case 'c':
            // Full UTC date
            formatted_date += date.toUTCString();
            break;
          case 'r':
            // Full date string
            formatted_date += date.toDateString();
            break;
          case 'U':
            // Seconds since the epoch
            formatted_date += date.valueOf();
            break;
          default:
            // Non-meaningful character, just append it
            formatted_date += format.charAt(i);
            break;
        }
      }
      
      return formatted_date;
    }
    
    /**
     * Determine the correct suffix
     * for a date of the month
     */
    function getDateSuffix(date) {
      var day = parseInt(date.toString().substring(date.toString().length-1));
      switch (day) {
        case 1:
          return "st";
          break;
        case 2:
          return "nd";
          break;
        case 3:
          return "rd";
          break;
        default:
          return "th";
          break;
      }
    }
     
    
    /**
     * Add a leading zero to single-digit numbers
     */
    function prependZeros(input) {
      var str = input.toString();
      if(str.length < 2) {
        str = "0" + str;
      }
      return str;
    }

    /**
     * Pull the first image from an feed item's content 
     * and return it as an HTML <img /> element
     */
    function getImageFromContent(content) {
      var img = content.match(/<img[^>+]*>/i);
      if(img) {
        var source = img[0].match(/src="[^"+]*"/i),
        alt = img[0].match(/alt="[^"+]*"/i);
        return "<img " + source + " " + alt + " />";
      }
      return false;
    }
    
    /**
     * Load the Google Feed API
     * and load the feed
     */
    jQuery.getScript("https://rss2json.com/gfapi.js", function() {
      google.load("feeds", "1", {"callback": initializeFeed});      
    });    
  }
})(jQuery, this);
