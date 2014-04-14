(function () {

    var d = document, w = window, listener = {}, minFlashVersion = "10.1", ready = false, queue = [];

    if (!window.jQuery) {
        d.write('<s'
            + 'cript type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.1/jquery.min.js"></s'
            + 'cript>');
    }

    if ("undefined" == typeof swfobject) {
        d
            .write('<s'
                + 'cript type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js"></s'
                + 'cript>');
    }

    var utils = {
        // Note: no actual guide
        // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        guidGenerator: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16)
                    .substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-"
                + S4() + S4() + S4());
        },

        idGenerator: function (prefix) {
            return prefix + Math.round(Math.random() * 100000000);
        },

        toArray: function (obj) {
            if (!obj) {
                return [];
            }
            if (obj.toArray) {
                return obj.toArray();
            }
            try {
                return Array.prototype.slice.call(obj, 0);
            } catch (e) {
                return [obj];
            }
        },

        addEventListener: function (elem, event, fn) {
            if (elem.addEventListener) {
                elem.addEventListener(event, fn, false);
            } else {
                elem.attachEvent("on" + event, fn);
            }
        },

        removeEventListener: function (elem, event, fn) {
            if (elem.removeEventListener) {
                elem.removeEventListener(event, fn, false);
            } else {
                elem.detachEvent("on" + event, fn);
            }
        },

        trim: function (str) {
            return (str || "").replace(/^\s+|\s+$/g, "");
        },

        keys: function (obj) {
            var keys = [];
            if (null != obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
            }
            return keys;
        },

        merge: function (defaults, options) {
            var result = {}, keys = this.keys(defaults);

            if (null != options) {
                for (var i = 0, optKeys = this.keys(options), len = optKeys.length; i < len; ++i) {
                    if (!defaults.hasOwnProperty(optKeys[i])) {
                        keys.push(optKeys[i]);
                    }
                }
            }

            for (var i = 0, len = keys.length; i < len; ++i) {
                result[keys[i]] = (null != options && typeof options[keys[i]] != "undefined") ? options[keys[i]]
                    : defaults[keys[i]];
            }

            return result;
        },

        toQueryString: function (params) {
            var result = "";

            for (var i = 0, keys = this.keys(params), len = keys.length; i < len; ++i) {
                result += "&" + encodeURIComponent(keys[i]) + "="
                    + encodeURIComponent(params[keys[i]]);
            }

            return result.substr(1);
        },

        toUrl: function (url, options) {
            options._ = utils.guidGenerator();
            return this.trim(url) + "?" + this.toQueryString(options);
        },

        halfPixelTimer: null,
        halfPixelElem: null,
        handlerPointer: null,

        handleHalfPixels: function (elem) {
            this.unbindHalfPixelHandler();
            this.halfPixelElem = elem;
            this.handlerPointer = function () {
                utils.fixHalfPixels();
            };
            this.addEventListener(w, "resize", this.handlerPointer);
            this.fixHalfPixels();
        },

        fixHalfPixels: function (e) {
            w.clearTimeout(this.halfPixelTimer);
            this.halfPixelTimer = w.setTimeout(function () {
                utils.fixHalfPixelsFn();
            }, 500)
        },

        fixHalfPixelsFn: function () {
            var container = this.halfPixelElem, box;

            if (container.getBoundingClientRect) {
                container.style.marginLeft = container.style.marginTop = "";
                try {
                    box = container.getBoundingClientRect();
                } catch (e) {
                    return;
                }
                checkOffset(box.left, "marginLeft");
                checkOffset(box.top, "marginTop");
            }

            function checkOffset(offset, style) {
                offset = Math.round(offset * 10) / 10;
                var gap = offset % Math.floor(offset);
                if (gap > 0) {
                    container.style[style] = -gap + "px";
                }
            }
        },

        unbindHalfPixelHandler: function () {
            if (null != this.handlerPointer) {
                this.removeEventListener(w, "resize", this.handlerPointer);
            }
        },

        isLinux: function () {
            return this.getPlatform().indexOf("linux") > -1;
        },

        isMac: function () {
            return this.getPlatform().indexOf("mac") > -1;
        },

        isWindows: function () {
            return this.getPlatform().indexOf("win") > -1;
        },


        getPlatform: function () {
            if (navigator && null != navigator.platform) {
                return navigator.platform.toLowerCase();
            }
            return "";
        },

        isChrome: function () {
            return jQuery.browser.webkit && !!window.chrome
        },

        isFirefox: function () {
            return jQuery.browser.mozilla
        },

        isSafari: function () {
            return jQuery.browser.safari && !window.chrome;
        },

        isInternetExplorer: function () {
            return jQuery.browser.msie
        },

        getBrowser: function () {
            if (utils.isInternetExplorer()) {
                return "internet_explorer";
            }
            else if (utils.isChrome())
                return "chrome";
            else if (utils.isFirefox())
                return "firefox";
            else if (utils.isSafari())
                return "safari";
            else
                return "undefined";
        },

        getOS: function () {
            if (utils.isWindows())
                return "win";
            else if (utils.isMac())
                return "mac";
            else if (utils.isLinux())
                return "linux";
            else
                return "undefined";
        },

        getOSVersion: function () {
            var version = "undefined";

            if (utils.isWindows()) {
                var windowsOperatingSystem = {
                    '3.11': 'Win16',
                    '95': '(Windows 95)|(Win95)|(Windows_95)',
                    '98': '(Windows 98)|(Win98)',
                    '2000': '(Windows NT 5.0)|(Windows 2000)',
                    'XP': '(Windows NT 5.1)|(Windows XP)',
                    '2003': '(Windows NT 5.2)',
                    'Vista': '(Windows NT 6.0)',
                    '7': '(Windows NT 6.1)',
                    '8': '(Windows NT 6.2)',
                    '4.0': '(Windows NT 4.0)|(WinNT4.0)|(WinNT)|(Windows NT)',
                    'ME': 'Windows ME'
                };

                jQuery.each(windowsOperatingSystem, function (key, value) {
                    if (navigator.userAgent.match(value)) {
                        version = key;
                        return false;
                    }
                });
            } else if (utils.isMac()) {
                var match = navigator.userAgent.match(/Mac OS X (\d{2}[_.]\d{1,2}([_.]\d)?)/);

                if (undefined != match) {
                    version = match[1].replace(/_/g, '.');
                }
            }

            return version;
        },

        createIframe: function (parent, params) {
            var keys = this.keys(params), ifr = d.createElement("IFRAME");
            ifr.frameBorder = 0;
            if (parent.id != undefined) {
                ifr.id = parent.id + "-iframe";
            }
            for (var i = 0, l = keys.length; i < l; ++i) {
                ifr[keys[i]] = params[keys[i]];
            }
            parent.appendChild(ifr);
            return ifr;
        },

        loaded: function () {
            ready = true;
            utils.handleQueue();
        },

        onload: function (fn, context) {
            if (ready) {
                fn.apply(context || null);
            } else {
                queue.push(function () {
                    fn.apply(context || null);
                });
            }
        },

        handleQueue: function () {
            for (var i = 0, len = queue.length; i < len; ++i) {
                queue.shift()();
            }
        },

        isFalse: function (input) {
            return false === input || "false" == input;
        },

        isTrue: function (input) {
            return true === input || "true" == input;
        }
    };

    if (d.addEventListener) {
        utils.addEventListener(d, "DOMContentLoaded", utils.loaded);
    }
    utils.addEventListener(w, "load", utils.loaded);

    //Constructor
    function Client() {
        this.container = null;
        this.validator = null;
        this.options = null;
    }

    ;

    Client.prototype = {

        defaults: {
            locale: "en",
            flashId: "JumioStartClient"
        },

        status: {
            INCOMPATIBLE_BROWSER: "incompatiblebrowser",
            NO_FLASH: "noflash",
            MINOR_FLASH: "minorflash",
            NO_CAMERA: "nocam",
            OK: "ok"
        },

        events: {
            LOADED: "loaded",
            TOKEN_EXPIRED: "token-expired",
            CAM_INFO: "webcam-access-info",
            CAM_DIALOG: "webcam-access-dialog",
            CAM_NOT_FOUND: "webcam-not-found",
            CAM_DENIED: "webcam-denied",
            CAM_IN_USE: "webcam-in-use",
            START: "detector-start",
            //FIRST_DETECTION: "detector-found-logo",
            FOUND: "detector-found-all",
            CVV: "cvv",
            UPLOAD: "progress",
            UPLOAD_FAILED: "upload-failed",
            COMPLETE: "complete",
            ALL: "all"
        },

        statusEvents: {
            FLASH_STATUS: "flash-status",
            CAM_STATUS: "cam-status",
            BROWSER_STATUS: "browser-status"
        },

        //// VALIDATOR

        flashCapabilities: null,

        getFlashCapabilities: function () {
            if (null == this.flashCapabilities) {
                this.flashCapabilities = {
                    installed: swfobject.hasFlashPlayerVersion("1"),
                    express: swfobject.hasFlashPlayerVersion("8"),
                    version: null,
                    isOutdated: false
                };

                if (this.flashCapabilities.installed) {
                    var flashVersion = swfobject.getFlashPlayerVersion();
                    this.flashCapabilities.version = flashVersion.major + '.' + flashVersion.minor + '.' + flashVersion.release;
                }

                // min flash version
                if (!swfobject.hasFlashPlayerVersion(minFlashVersion)) {
                    this.flashCapabilities.isOutdated = true;
                }

                if (utils.isMac()) {
                    // gtalk plugin issue; no webcam access
                    if (!utils.isChrome() && !swfobject.hasFlashPlayerVersion("10.2")) {
                        var list = (navigator || {}).plugins;
                        if (list) {
                            for (var i = 0, len = list.length; i < len; ++i) {
                                var name = (list[i].name || "").toLowerCase();
                                if (name.indexOf("google") > -1
                                    && name.indexOf("talk") > -1) {
                                    this.flashCapabilities.isOutdated = true;
                                    break;
                                }
                            }
                        }
                    }

                    // lion access dialog issue; see
                    // http://kb2.adobe.com/cps/905/cpsid_90508.html#main_Flash_Player
                    if (utils.getBrowser().indexOf("10_7") > -1
                        && !swfobject.hasFlashPlayerVersion("10.3.183")) {
                        this.flashCapabilities.isOutdated = true;
                        this.flashCapabilities.express = false;
                    }
                }
            }

            return this.flashCapabilities;
        },


        browserCapabilities: null,

        getBrowserCapabilitites: function () {
            if (null == this.browserCapabilities) {
                this.browserCapabilitites = {
                    incompatibleBrowser: false,
                    html5: false,
                    version: jQuery.browser.version,
                    vendor: utils.getBrowser(),
                    supportsCss3Animation: this.supportsCss3Animation()
                };
            }

            // If chrome and support for chrome is disabled
            // mark browser as incompatible
            if (utils.isChrome()) {

                // chrome versions < 17 might lead to crashes in the flash client
                var browserVersion = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

                if (browserVersion == null || (browserVersion != null && browserVersion[2] < 17))
                    this.browserCapabilitites.incompatibleBrowser = true;
            }

            return this.browserCapabilitites;
        },

        getOperatingSystemCapabilities: function () {
            return {
                isMac: utils.isMac(),
                isLinux: utils.isLinux(),
                isWindows: utils.isWindows(),
                version: utils.getOSVersion(),
                vendor: utils.getOS()
            }
        },


        validate: function (callback) {
            this.bind(this.statusEvents.FLASH_STATUS, callback);
            this.bind(this.statusEvents.CAM_STATUS, callback);
            this.bind(this.statusEvents.BROWSER_STATUS, callback);

            var browser = this.getBrowserCapabilitites();

            if (browser.incompatibleBrowser) {
                this.fire(this.statusEvents.BROWSER_STATUS,
                    this.status.INCOMPATIBLE_BROWSER);
                return;
            }

            var flash = this.getFlashCapabilities();

            if (!flash.installed) {
                this.fire(this.statusEvents.FLASH_STATUS, this.status.NO_FLASH);
                return;
            } else if (flash.isOutdated) {
                this.fire(this.statusEvents.FLASH_STATUS,
                    this.status.MINOR_FLASH, flash.express);
                return;
            } else if (flash.gTalkConflict) {
                this.fire(this.statusEvents.FLASH_STATUS,
                    this.status.GOOGLE_PLUGIN_CONFLICT);
                return;
            }

            var id = utils.idGenerator("jumioValidator"), styles = {
                "position": "absolute",
                "left": -1,
                "top": 0,
                "height": 1,
                "width": 1,
                "visibility": "hidden"
            }, parent = d.createElement("DIV"), child = d.createElement("DIV");

            for (var i = 0, keys = utils.keys(styles), len = keys.length; i < len; ++i) {
                parent.style[keys[i]] = styles[keys[i]];
            }

            this.validator = child.id = id;
            parent.appendChild(child);

            function embed() {
                d.getElementsByTagName("BODY")[0].appendChild(parent);
                this.embedSwf({
                    swf: utils.trim("https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/camera_validator-ver-1395227490000.swf"),
                    id: id,
                    width: 1,
                    height: 1,
                    params: {
                        allowscriptaccess: "always"
                    }
                });
            };

            utils.onload(embed, this);
        },

        initCamera: function (exists, w, h) {
            this.fire(this.statusEvents.CAM_STATUS, exists ? this.status.OK
                : this.status.NO_CAMERA, w, h);

            try {
                if (exists) {
                    var swf = d.getElementById(this.validator);
                    if (null != swf) {
                        var parent = swf.parentNode;
                        this.removeSWF(this.validator);
                        if (null != parent) {
                            d.getElementsByTagName("BODY")[0]
                                .removeChild(parent);
                        }
                    }
                }
            } catch (e) {
            }
        },

        //// EVENT PROXY

        bind: function (type, fn, scope) {
            if (typeof fn != "function") {
                return this;
            }

            if (!listener[type]) {
                listener[type] = [];
            }

            listener[type].push({
                handler: fn,
                context: (scope || null)
            });

            return this;
        },

        fire: function (type) {
            var args = utils.toArray(arguments);
            setTimeout(function () {
                window.JumioClient.executeTrigger(type, args);
            }, 0);
        },

        executeTrigger: function (type, args) {
            var l = utils.toArray(listener[type]).concat(
                utils.toArray(listener[this.events.ALL]));
            for (var i = 0, len = l.length; i < len; ++i) {
                l[i].handler.apply(l[i].context, args);
            }
        },

        unbind: function (type, handler) {
            var l = listener[type];

            if (handler) {

                if (l) {
                    for (var i = 0, len = l.length; i < len; ++i) {
                        if (l[i].handler === handler) {
                            l.splice(i, 1);
                            return this;
                        }
                    }
                }

            } else {
                delete l;
            }

            return this;
        },

        //// swfobject proxy

        embedSwf: function (options) {
            // proxy to swfobject framework
            var props = utils.merge({
                swf: "",
                id: "",
                minFlash: minFlashVersion,
                flashVars: {},
                params: {},
                attr: {},
                onReady: null
            }, options);
            swfobject.embedSWF(props.swf, props.id, props.width, props.height,
                props.minFlash, null, props.flashVars || {}, props.params
                    || {}, props.attr || {}, props.onReady);
        },


        disconnectSWF: function (callback) {
            //Check Parameter and set default-value if null
            var id = JumioClient.options.flashId;
            var callback = typeof callback !== 'undefined' ? callback : true;

            //call disconnect on the flashClient to shutdown all open streams & camera access
            try {
                var swf = swfobject.getObjectById(id);
                if (null != swf)
                    swf.disconnect(callback);
            } catch (e) {
            }

            //Let the flash client handle the removal only in chrome or safari
            //otherwise this will crash the browser / plugin
            if (!utils.isChrome() && !utils.isSafari()) {
                JumioClient.removeFlashClientAndCloseOverlay();
            }
        },

        disconnectSWFWithoutCallback: function () {
            JumioClient.disconnectSWF(false);
        },

        closeOverlay: function () {
            //close overlay if available
            var overlay = $('div.visuraloverlaycontent:visible');
            if (overlay.length > 0) {
                overlay.hide();
                $('div.visuraloverlay').hide();
            }
        },

        removeFlashClientAndCloseOverlay: function () {
            JumioClient.removeSWF(JumioClient.options.flashId);
            JumioClient.closeOverlay();
        },

        removeSWF: function (id) {
            //safely remove swf from dom-tree and null all references
            swfobject.removeSWF(id);
        },

        //// HELPER FUNCTIONS

        // simulates similar behavior as an HTTP redirect
        redirect: function (url) {
            window.location.replace(url);
        },

        redirectFromFallback: function (args) {

            var that = this;
            var location = window.location.href;
            var redirectFromFallbackParameter = {"jumioIdScanReference":"jumioIdScanReference","redirectFromFallback":"redirectFromFallback","verifyCountry":"verifyCountry","verifyIdType":"verifyIdType"};

            jQuery.each(redirectFromFallbackParameter, function (i, value) {
                if (undefined != args[i] && args[i].length > 0 && args[i] != "null") {
                    location = that.replaceQueryString(location, value, args[i]);
                }
            });

            window.location.href = location;
        },

        replaceQueryString: function (url, param, value) {
            //Remove HashTag
            url = url.indexOf('#') > 0 ? url.substring(0, url.indexOf('#')) : url;

            //Replace param value or append param and value
            var re = new RegExp("([?|&])" + param + "=.*?(&|$)", "i");
            if (url.match(re))
                return url.replace(re, '$1' + param + "=" + value + '$2');
            else
                return url + (url.indexOf('?') == -1 ? '?' : '&') + param + "=" + value;
        },

        // simulates similar behavior as an HTTP redirect
        // redirects the parent of the current windows, e.g. you want to
        // redirect whole page from an iframe
        redirectTop: function (url) {
            window.top.location.replace(url);
        },

        // simulates similar behavior as clicking on a link
        linkRedirect: function (url) {
            window.location.href = url;
        },

        // simulates similar behavior as clicking on a link
        // redirects the parent of the current windows, e.g. you want to
        // redirect whole page from an iframe
        linkRedirectTop: function (url) {
            window.top.location.href = url;
        },

        //// JUMIO CLIENT/START/SCAN

        setVars: function (options) {
            this.options = utils.merge(this.defaults, options);
            return this;
        },

        //// SCAN CLIENT

        initScan: function (container) {
            this.container = container;
            utils.onload(this.loadScan, this);
            return this;
        },

        loadScan: function () {
            this.ensureLocale();

            //Inject default flash parameters
            this.options.clientUrl = utils.trim("https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/netswipe_scanning-ver-1395227432000.swf");
            this.options.width = this.options.width || 380;
            this.options.height = this.options.height || 300;

            //Set redirect target
            this.options.redirectTarget = this.options.redirectTarget || "top";

            return this.loadClient();
        },

        initNetswipeClient: function (container) {
            this.options.clientUrl = utils.trim("https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/netswipe-ver-1395227456000.swf");
            this.initClient(container);
        },

        initNetverifyClient: function (container) {
            this.options.clientUrl = utils.trim("https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/netverify_upload-ver-1395227478000.swf");
            this.initClient(container);
        },

        initNetverifyUploadClient: function (container) {
            this.options.clientUrl = utils.trim("https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/preloader-ver-1395227498000.swf");
            this.options.bgColor = "FCFCFC";
            this.initClient(container);
        },

        initClient: function (container) {
            this.container = container;

            //Avoid duplicated events being fired by removing event first
            utils.removeEventListener(w, "beforeunload", this.disconnectSWFWithoutCallback);
            utils.addEventListener(w, "beforeunload", this.disconnectSWFWithoutCallback);

            utils.onload(this.loadClient, this);
            return this;
        },

        loadClient: function () {
            this.ensureContainer();

            if ("" == this.container.id) {
                this.container.id = utils.idGenerator("netswipe-");
            }

            if (!this.ensureBrowserCapabilities() || !this.ensureFlashCapabilities())
                return this;

            var params = {
                wmode: "window",
                bgcolor: this.options.bgColor || "FFFFFF",
                allowscriptaccess: "always"
            };

            var opt = this.options, flashDiv = d.createElement("DIV");
            flashDiv.id = opt.flashId;
            this.container.appendChild(flashDiv);

            opt.streamLocatorUrl = utils.trim(opt.streamLocatorUrl || "rtmps://streaming.jumio.com/redirect");
            opt.loadBalancerUrl = utils.trim(opt.loadBalancerUrl || "https://streaming.jumio.com/loadbalancer");

            this.embedSwf({
                swf: utils.trim(opt.clientUrl),
                id: opt.flashId,
                width: opt.width,
                height: opt.height,
                flashVars: opt,
                params: params
            });

            utils.handleHalfPixels(this.container);

            return this;
        },

        reload: function () {
            this.removeSWF(this.options.flashId);
            this.loadClient();
        },

        pageview: function (page) {
            page = (page || "").replace("/", "").toLowerCase();
            this.fire(page);
        },

        //// JUMIO START

        initStart: function (container) {
            this.container = container;
            utils.onload(this.loadStart, this);
            return this;
        },

        startUrl: function () {
            this.ensureLocale();
            this.options.referer = w.location.href;
            return utils.toUrl("https://pay.jumio.com/widget/jumio-start/1.0/iframe", this.options);
        },

        loadStart: function () {
            this.ensureContainer();
            this.options.clientUrl = utils.trim("https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/netswipe-ver-1395227456000.swf");

            if (null != this.container) {
                var url = this.startUrl();
                var ifr = utils.createIframe(this.container, {
                    width: this.options.width || 460,
                    height: this.options.height || 450,
                    src: url
                });

                utils.handleHalfPixels(ifr);
            }

            return this;
        },

        initForm: function (container) {
            this.container = container;
            utils.onload(this.loadForm, this);
            return this;
        },

        formUrl: function () {
            this.ensureLocale();
            this.options.referer = w.location.href;
            return utils.toUrl("https://pay.jumio.com/widget/jumio-form/1.0/form", this.options);
        },

        loadForm: function () {
            this.ensureContainer();

            if (null != this.container) {
                var url = this.formUrl();
                var ifr = utils.createIframe(this.container, {
                    width: this.options.width || 800,
                    height: this.options.height || 700,
                    src: url
                });

                utils.handleHalfPixels(ifr);
            }

            return this;
        },

        initVerify: function (container) {
            this.container = container;
            utils.onload(this.loadVerify, this);
            return this;
        },

        verifyUrl: function () {
            return this.buildIframeUrl("https://netverify.com/widget/jumio-verify/2.0/form");
        },

        loadVerify: function () {
            this.ensureContainer();

            if (null != this.container) {
                var url = this.verifyUrl();
                var ifr = utils.createIframe(this.container, {
                    width: this.options.width || (utils.isFalse(this.options.showIntroductionText) ? 430 : 800),
                    height: this.options.height || (utils.isFalse(this.options.showIntroductionText) ? 455 : 570),
                    src: url
                });

                utils.handleHalfPixels(ifr);
            }

            return this;
        },

        initMDM: function (container) {
            this.container = container;
            utils.onload(this.loadMDM, this);
            return this;
        },

        verifyMDM: function () {
            return this.buildIframeUrl("https://netverify.com/widget/jumio-verify/2.0/mdm");
        },

        loadMDM: function () {
            this.ensureContainer();

            if (null != this.container) {
                var url = this.verifyMDM();
                var ifr = utils.createIframe(this.container, {
                    width: this.options.width || 800,
                    height: this.options.height || 570,
                    src: url
                });

                utils.handleHalfPixels(ifr);
            }

            return this;
        },

        buildIframeUrl: function (baseUrl) {
            this.ensureLocale();
            this.options.referer = w.location.href;

            if (this.options.clientRedirectUrl) {
                var clientRedirctUrl = this.options.clientRedirectUrl;
                iframeurl = clientRedirctUrl.split("?", 1)[0];
                var params = clientRedirctUrl.substr(iframeurl.length + 1, clientRedirctUrl.length).split("&");
                var len = params.length;

                for (var i = 0; i < len; i++) {
                    var value = params[i].split("=");
                    this.options[value[0]] = value[1];
                }

                this.options.clientRedirectUrl = undefined;
            }

            return utils.toUrl(baseUrl, this.options);
        },

        /**
         * Ensures that this.container exists in the documents dom tree
         * @return this
         */
        ensureContainer: function () {
            if ("string" == typeof this.container) {
                this.container = d.getElementById(this.container);
            }

            if (null == this.container) {
                this.error("container not found");
                return false;
            }

            return this;
        },

        /**
         * Ensures that this.option.locale is not null
         * @return this
         */
        ensureLocale: function () {
            if (0 == (this.options.locale || "").length) {
                this.options.locale = "en";
            }
            return this;
        },

        /**
         * Make sure that all flash requirements are met
         * in case of failure error messages are displayed
         *
         * @param String externalContainer
         * @return boolean
         */
        ensureFlashCapabilities: function (externalContainer) {
            var that = this;

            // Check if externalContainer is available, if not use this.container as fallback
            var errorContainer = ("string" == typeof externalContainer) ? d.getElementById(externalContainer) : this.container;
            if (null == errorContainer) {
                this.error("container not found");
            }

            // Retrieve flash capabilites via swfobject
            var flash = this.getFlashCapabilities();
            if (!flash.installed) {
                this.error('You need Adobe Flash to use Netswipe.<br /><br />'
                    + '<a href="http://www.adobe.com/go/getflashplayer" target="_blank">'
                    + '<img src="//www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Get Adobe Flash player" />'
                    + '</a>', errorContainer);
                return false;
            } else if (flash.isOutdated) {
                if (flash.express) {
                    swfobject.showExpressInstall({
                            data: "https://static.netverify.com/wicket/resource/com.jumio.wicket.resources.swf.ResourcesSwfScope/client/expressInstall-ver-1336732086000.swf",
                            width: "343",
                            height: "200"
                        }, {}, errorContainer.id, function (result) {
                            if (!result.success) {
                                that.error('Flash upgrade cancelled', d.getElementById(result.id));
                            }
                        }
                    );
                } else {
                    this.error('Your Adobe Flash Player is outdated. Please upgrade '
                        + 'to the latest version.<br /><br /><a href="http://www.adobe.com/go/getflashplayer" target="_blank">'
                        + '<img src="//www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Get Adobe Flash player" />'
                        + '</a>', errorContainer);
                }
                return false;
            }

            return true;
        },

        /**
         * Make sure that all browser requirements are met
         * in case of failure error messages are displayed
         *
         * @param String externalContainer
         * @return boolean
         */
        ensureBrowserCapabilities: function (externalContainer) {
            // Check if externalContainer is available, if not use this.container as fallback
            var errorContainer = ("string" == typeof externalContainer) ? d.getElementById(externalContainer) : this.container;
            if (null == errorContainer) {
                this.error("container not found");
            }

            var browser = this.getBrowserCapabilitites();
            if (browser.incompatibleBrowser) {
                this.error('Your Browser is currently not supported by Netswipe. Please use Mozilla Firefox,'
                    + 'Microsoft Internet Explorer or Apple Safari', errorContainer);

                return false;
            }

            return true;
        },

        /**
         * Notifies the User about an error
         *
         * @param msg
         * @param errorContainer (optional) HTML generated error message will be placed inside
         */
        error: function (msg, errorContainer) {
            if ("undefined" == typeof(errorContainer)) {
                alert("Jumio Netswipe couldn't be loaded.\n\nError:   " + msg);
            } else {
                var targetContainer = "string" == typeof(errorContainer) ? d.getElementById(errorContainer) : errorContainer;
                var alertIcon = '<img src="/images/form/alert-icon.jpg "class="left informationIcon" alt="information" />';
                targetContainer.innerHTML = '<div class="informationBox">' + alertIcon + msg + '</div>';
            }
        },

        /**
         * Notification to show an info to the user.
         *
         * @param infoCode the code for the info
         */
        infoText: function (infoCode) {
            // trigger an event on the container and let listeners handle displaying the information
            $(this.container).trigger('infoText', infoCode);
        },
        supportsCss3Animation: function () {
            var div = document.createElement('div');
            var vendors = 'Khtml Ms O Moz Webkit'.split(' ');
            var iterator = vendors.length;
            var propertyToCheck = 'animation';

            if (propertyToCheck in div.style) return true;

            //prepare property for camelcase
            propertyToCheck = propertyToCheck.replace(/^[a-z]/, function (val) {
                return val.toUpperCase();
            });

            for (iterator; iterator > 0; iterator = iterator - 1) {
                if (vendors[iterator] + propertyToCheck in div.style) {
                    return true;
                }
            }
            return false;
        }

    };


    w.JumioClient = new Client();
})();
