//
// jQuery Routes v1.1
// http://routesjs.com/
// 
// Copyright (c) 2011 Syntacticx
// http://syntacticx.com/
// 
// Dual licensed under the MIT or GPL Version 2 licenses.
//
// jQuery Address Plugin v1.3.1
// http://www.asual.com/jquery/address/
// 
// Copyright (c) 2009-2010 Rostislav Hristov
// Dual licensed under the MIT or GPL Version 2 licenses.
// http://jquery.org/license

/* 
 * jQuery Routes
 * =============
 * **Download:** [Development](https://github.com/syntacticx/routesjs/zipball/master) | [Production (6KB)](https://github.com/syntacticx/routesjs/raw/master/jquery.routes.min.js)  
 * **See Also:** [jQuery View](http://viewjs.com/)
 * 
 */ 
;(function($,context){
  
  if(Number($.fn.jquery.replace(/\./g)) < 143){
    throw 'jQuery Routes requires jQuery 1.4.3 or later.';
  }
  
  /* Rails style routing for jQuery. Enables back button support, deep linking and allows
   * methods to be called by normal links in your application without adding an event handler.
   * Methods that have been specified in your routes will automatically set the URL of the page
   * when called.
   * 
   *     $.routes({
   *       "/": "PageView#home",
   *       "/article/:id": "ArticlesView#article",
   *       "/about/(:page_name)": function(params){}
   *     });
   * 
   *     Clicking: <a href="#/article/5"></a>
   *     Will call: ArticlesView.instance().article({id:5})
   *     
   *     Calling: ArticlesView.instance().article({id:6})
   *     Will set URL: "#/article/6"
   * 
   * jQuery Routes depends on the [jQuery Address](http://www.asual.com/jquery/address/)
   * plugin which is included in the production build.
   * 
   * Alternatively, you can use jQuery Routes to emulate the **hashchange** event
   * 
   *     $.routes(function(new_hash){
   *       //do stuff
   *     });
   * 
   * To unregister the handler above:
   * 
   *     $.routes(false);
   * 
   * Setup
   * -------
   * 
   * **$.routes**(Object routes \[,Boolean lazy_loading = false\]) -> null  
   * 
   * Calling routes will start routes in your appliction, dispatching the current
   * address present in the url bar of the browser. If no address is present on
   * the page **$.routes("set","/")** will automatically be called.
   * 
   * Setting **lazy_loading** to true will prevent your callbacks from being setup for
   * to automatically set the path and will prevent **instance** from being called
   * on each specified object. This is useful in large applications where you do
   * not want all views with routes initialized when $.routes starts. You can
   * manually setup each callback using **$.routes("setup",callback)** An example call
   * to $.routes:
   * 
   *     $.routes({
   *       "/": "PageView#home",
   *       "/article/:id": "ArticlesView#article",
   *       "/about/(:page_name)": "PageView#page",
   *       "/wiki/*": "WikiView#page",
   *       "/class_method": "Object.method",
   *       "/callback": function(){}
   *     });
   * 
   * Supported types of paths:
   * 
   * - "/" - A plain path with no parameters.
   * - "/article/:id" - A path with a required named parameter.
   * - "/about/(:page_name)" - A path with an optional named paramter.
   * - "/wiki/\*" - A path with an asterix / wildcard.
   * 
   * Supported types of callbacks:
   * 
   * - "PageView#home" - Will call PageView.instance().home()
   * - function(){} - Will call the specified function.
   * 
   * Singletons
   * ----------
   * jQuery Routes assumes that all classes specified in routes implement the
   * [Singleton pattern](http://en.wikipedia.org/wiki/Singleton_pattern) and
   * will attempt to get an instance of the class via a method named **instance**.
   * For example the route "PageView#home" will attempt to call:
   * 
   *     PageView.instance().home()
   * 
   * To implement the singleton pattern in your code:
   * 
   *     MyClass = function(){};
   *     
   *     MyClass._instance = false;
   *     
   *     MyClass.instance = function(){
   *       if(!MyClass._instance){
   *         MyClass._instance = new MyClass();
   *       }
   *       return MyClass._instance;
   *     };
   * 
   * [jQuery View](http://viewjs.com/) classes implement the singleton pattern. Routing
   * to classes is not a requirement, anonymous functions can always be used instead.
   *
   * Methods
   * -------
   * 
   */
  $.routes = function(_routes,lazy_loading){
    if(typeof($.address) == 'undefined'){
      throw 'jQuery Address (http://www.asual.com/jquery/address/) is required to run jQuery View Routes';
    }
    if(typeof(_routes) == 'function'){
      $.address.bind('externalChange',function(){
        routes(window.location.href.match('#') ? window.location.href.split('#').pop() : '');
      });
    }else if(_routes === false){
      $($.address).unbind('externalChange');
    }else if(typeof(_routes) == 'string'){
      var method_name = _routes;
      if(method_name == 'start'){
        return start();
      }
      if(method_name == 'stop'){
        return stop();
      }
      if(method_name == 'match'){
        return match(arguments[1]);
      }
      if(method_name == 'set'){
        return set(arguments[1]);
      }
      if(method_name == 'get'){
        return get();
      }
      if(method_name == 'url'){
        return url(arguments[1],arguments[2]);
      }
      if(method_name == 'setup'){
        return url(arguments[1]);
      }
      if(method_name == 'add'){
        return url(arguments[1],arguments[2]);
      }
      throw method_name + ' is not a supported method.';
    }else{
      for(var key in _routes){
        if(typeof(_routes[key]) === 'string' && !_routes[key].match(/(\#|\.)/)){
          _routes[key] += '#set';
        }
      }
      set_routes(_routes);
      if(!lazy_loading){
        for(var i = 0; i < routes.length; ++i){
          setup(routes[i][1],i);
        }
      }
    }
  };
  
  /* ### $.routes("url"*, String callback \[,Object params\]*) *-> String*
   * Generates a url for a route.
   * 
   *     var url = $.routes("url","ArticlesView#article",{id:5});
   *     url == "/article/5"
   */
  function url(class_and_method,params){
    for(var i = 0; i < routes.length; ++i){
      if(routes[i][1] == class_and_method){
        return generate_url(routes[i][0],params);
      }
    }
    return false;
  };
  
  /* ### $.routes("get") *-> String*
   * Returns the current address / path.
   */
  function get(){
    var path_bits = window.location.href.split('#');
    return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
  };
  
  /* ### $.routes("set") *-> null*
   * Sets the current address / path, calling the matched route if a match is found.
   * 
   *     $.routes("set","/article/5");
   */
  function set(path,force){
    var matched_path = match(path);
    var should_dispatch = path != current_route;
    if(!should_dispatch && force == true){
      should_dispatch = true;
    }
    if(enabled && should_dispatch && matched_path){
      matched_path[0] = setup(matched_path[0],matched_path[2]);
      if(!('callOriginal' in matched_path[0])){
        set_address(path);
      }
      $.routes.history.push([path,matched_path[0],matched_path[1]]);
      $.routes.dispatcher(matched_path[0],matched_path[1],path);
      return true;
    }else{
      return false;
    }
  };
  
  /* ### $.routes("add"*, String path, String callback*) *-> null*
   * Add a new route.
   * 
   *     $.routes("add","/article/:id","ArticlesView#article");
   */
  function add(path,callback){
    routes.push([path,callback]);
    route_patterns.push(route_matcher_regex_from_path(path));
  };
  
  /* ### $.routes("match"*, String path*) *-> Array \[Function callback, Object params\]*
   *     var match = $.routes("match","/article/5");
   *     match[0](match[1]);
   */
  function match(path){
    for(var i = 0; i < routes.length; ++i){
      if(routes[i][0] == path){
        return [setup(routes[i][1],i),{},i];
      }
    }
    for(var i = 0; i < route_patterns.length; ++i){
      var matches = route_patterns[i][0].exec(path);
      if(matches){
        var params = {};
        for(var ii = 0; ii < route_patterns[i][1].length; ++ii){
          params[route_patterns[i][1][ii]] = matches[((ii + 1) * 3) - 1];
        }
        return [setup(routes[i][1],i),params,i];
      }
    }
    return false;
  };
  
  /* ### $.routes("setup"*, String callback*) *-> null*
   * If lazy loading is enabled each callback will need to be setup to enable
   * the automatic call to $.routes("set",path) when the callback is invoked.
   * 
   *     $.routes("setup","ArticlesView#article");
   *     ArticlesView.instance().article({id:5});
   *     $.routes("get") == "/article/5"
   */
  function setup(callback,index_of_route){
    if(typeof(callback) == 'string' && typeof(index_of_route) == 'undefined'){
      for(var i = 0; i < routes.length; ++i){
        if(routes[i][1] == callback){
          index_of_route = i;
          break; 
        }
      }
      throw 'Method ' + callback + ' not found in specified routes.';
    }
    //context var comes from outer plugin wrapper and usually refers to window
    if(typeof(callback) == 'function'){
      return callback;
    }
    var path = routes[index_of_route][0];
    var method_name = callback.match(/\#(.+)$/);
    if(!method_name){
      method_name = 'set';
    }else{
      method_name = method_name[1];
    }
    var object_name_bits = callback.replace(/\#.+$/,'').split('.');
    //context was set by the outer function wrapper and usually refers to window
    var object = context[object_name_bits[0]];
    for(var i = 1; i < object_name_bits.length; ++i){
      object = object[object_name_bits[i]];
    }
    if(typeof(object) === 'undefined'){
      throw 'Could not find the object "' + object_name_bits.join('.') + '"';
    }
    object = object.instance();
    if(typeof(object[method_name]) === 'undefined'){
      throw 'The method "' + method_name + '" does not exist for the route "' + path + '"';
    }
    if('callOriginal' in object[method_name]){
      return object[method_name];
    }
    var original_method = object[method_name];
    object[method_name] = function routing_wrapper(params){
      set_address(generate_url(path,params));
      original_method.apply(object,arguments);
    };
    object[method_name].callOriginal = function original_method_callback(){
      return original_method.apply(object,arguments);
    };
    return object[method_name];
  };
  
  /* ### $.routes("stop") *-> null*
   * Stops the routing plugin from handling changes in the page address.
   */
  function stop(){
    enabled = false;
  };
  
  /* ### $.routes("start") *-> null*
   * Called implicitly when you specify your routes. Only necessary if **stop** has been called.
   */
  function start(){
    if(!start_observer && !ready){
      start_observer = $(document).ready(function document_ready_observer(){
        $.address.bind('externalChange',external_change_handler);
        ready = true;
        enabled = true;
        if(!set(get(),true)){
          set('/');
        }
      });
    }else{
      ready = true;
      enabled = true;
    }
  };
  
  /* Properties
   * ----------
   * ### $.routes.dispatcher *-> Function*
   * The **dispatcher** property is a function invoked each time the route / path changes.
   * It is called with Function callback, Object params, String path. The default dispatcher
   * calls the callback with the params.
   * 
   *     $.routes.dispatcher = function(callback,params,path){
   *       callback(params);
   *     };
   */ 
  $.routes.dispatcher = function dispatcher(callback,params,path){
    callback(params);
  };
  
  /*
   * ### $.routes.history *-> Array*
   * The history array contains a list of dispatched routes since $.routes was initialized.
   * Each item in the array is an array containing \[String path,Function callback,Object params\] 
   */
  $.routes.history = [];
  
  //private attributes
  var start_observer = false;
  var ready = false;
  var routes = []; //array of [path,method]
  var route_patterns = []; //array of [regexp,param_name_array]
  var current_route = false;
  var enabled = false;
  
  //private methods
  function set_routes(routes){
    for(var path in routes){
      add(path,routes[path]);
    }
    start();
  };
  
  function route_matcher_regex_from_path(path){
    var params = [];
    var reg_exp_pattern = String(path);
    reg_exp_pattern = reg_exp_pattern.replace(/\((\:?[\w]+)\)/g,function(){
      return '' + arguments[1] + '?'; //regex for optional params "/:one/:two/(:three)"
    });
    reg_exp_pattern = reg_exp_pattern.replace(/\:([\w]+)(\/?)/g,function(){
      params.push(arguments[1]);
      return '(([\\w]+)(/|$))';
    });
    reg_exp_pattern = reg_exp_pattern.replace(/\)\?\/\(/g,')?('); //cleanup for optional params 
    if(reg_exp_pattern.match(/\*/)){
      params.push('path');
      reg_exp_pattern = reg_exp_pattern.replace(/\*/g,'((.+$))?');
    }
    return [new RegExp('^' + reg_exp_pattern + '$'),params];
  };
  
  function generate_url(url,params){
    params = params || {};
    if(typeof(params) == 'string' && url.match(/\*/)){
      url = url.replace(/\*/,params).replace(/\/\//g,'/');
    }else{
      if(params.path){
        url = url.replace(/\*/,params.path.replace(/^\//,''));
      }
      var param_matcher = new RegExp('(\\()?\\:([\\w]+)(\\))?(/|$)','g');
      for(var param_name in params){
        if(param_name != 'path'){
          url = url.replace(param_matcher,function(){
            return arguments[2] == param_name
              ? params[param_name] + arguments[4]
              : (arguments[1] || '') + ':' + arguments[2] + (arguments[3] || '') + arguments[4]
            ;
          });
        }
      }
    }
    url = url.replace(/\([^\)]+\)/g,'');
    return url;
  };
  
  function set_address(path){
    if(enabled){
      if(current_route != path){
        $.address.value(path);
        current_route = path;
      }
    }
  };
  
  function external_change_handler(){
    if(enabled){
      var current_path = get();
      if(ready){
        if(current_path != current_route){
          set(current_path);
        }
      }
    }
  };
  
})(jQuery,this);

/*
 * Examples
 * --------
 * - [PhotoFolder](http://photofolder.org/)
 * - [Simple Example](http://routesjs.com/examples/simple.html)
 * 
 * Change Log
 * ----------
 * **1.1** - *Jan 9, 2011*  
 * Added hashchange event emulation.
 * 
 * **1.0.0** - *Jan 2, 2011*  
 * Initial release.
 * 
 * ---
 * 
 * Copyright 2011 [Syntacticx](http://syntacticx.com/). Released under the [MIT or GPL License](http://jquery.org/license)  
 * Style inspired by [Backbone.js](http://documentcloud.github.com/backbone/)
 */ 