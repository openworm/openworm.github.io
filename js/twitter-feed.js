/**
 * Custom Twitter/X Feed Widget
 * Since X/Twitter's API now requires $100/month just to read timelines,
 * this creates a simple embedded widget with direct link to the timeline
 */

function loadTwitterFeed() {
    var container = $("#tweeter");
    var username = 'OpenWorm';

    // Create styled widget that mimics a feed but links directly to X
    var html = '<div style="border: 1px solid #e1e8ed; border-radius: 8px; background: linear-gradient(to bottom, #f5f8fa 0%, #ffffff 100%); overflow: hidden;">';

    // Header
    html += '<div style="padding: 15px; border-bottom: 2px solid #1da1f2; background: #fff;">';
    html += '<div style="display: flex; align-items: center; gap: 10px;">';
    html += '<svg viewBox="0 0 24 24" aria-hidden="true" style="width: 24px; height: 24px; fill: #1da1f2;"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>';
    html += '<h3 style="margin: 0; font-size: 16px; font-weight: bold;">@' + username + '</h3>';
    html += '</div>';
    html += '</div>';

    // Content area
    html += '<div style="padding: 20px; text-align: center;">';
    html += '<p style="color: #536471; margin: 0 0 20px 0; font-size: 14px;">Follow us for updates on computational neuroscience, <i>C. elegans</i> research, and open science!</p>';

    html += '<a href="https://twitter.com/' + username + '" target="_blank" class="btn btn-primary" style="background: #1da1f2; border-color: #1da1f2; padding: 10px 20px; font-size: 14px; font-weight: bold;">';
    html += '<i class="icon-twitter icon-white"></i> View @' + username + ' on X';
    html += '</a>';

    html += '<p style="margin: 20px 0 0 0; font-size: 12px; color: #8899a6;">';
    html += 'Latest posts • Updates • News';
    html += '</p>';
    html += '</div>';

    html += '</div>';

    container.html(html);
    console.log('Twitter widget loaded (direct link mode)');
}
