// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-84289303-1', 'auto');
ga('send', 'pageview');

// Smooth Scroll
$(document).ready(function () {
  $('a.to-about').click(function() {
  $('html, body').animate({
    scrollTop: $("div.about").offset().top
  }, 1000)
}), 
  $('a.to-works').click(function (){
    $('html, body').animate({
      scrollTop: $("div.works").offset().top
    }, 1000)
  }),
  $('a.to-connect').click(function (){
    $('html, body').animate({
      scrollTop: $("div.connect").offset().top
    }, 1000)
  }),
  $('div.to-top').click(function (){
    $('html, body').animate({
      scrollTop: $("div.top").offset().top
    }, 1000)
  })
});

// Back to Top Button
$(window).scroll(function() {    
  var scroll = $(window).scrollTop();
  if (scroll >= 480) {
      $(".to-top").addClass("to-top-reveal");
  } else {
      $(".to-top").removeClass("to-top-reveal");
  }
});

// Figures
$(function(){
  $("#numetric").hover(
    function () {
      $(".figureOne").addClass('figurenu');
    }, 
    function () {
      $(".figureOne").toggleClass('figurenu');
    }
  );
});
$(function(){
  $("#mx").hover(
    function () {
      $(".figureOne").toggleClass('figuremx');
    }, 
    function () {
      $(".figureOne").toggleClass('figuremx');
    }
  );
});
$(function(){
  $("#wereofficial").hover(
    function () {
      $(".figureOne").toggleClass('figurewo');
    }, 
    function () {
      $(".figureOne").toggleClass('figurewo');
    }
  );
});
$(function(){
  $("#dribbble").hover(
    function () {
      $(".figureOne").toggleClass('figuredrib');
    }, 
    function () {
      $(".figureOne").toggleClass('figuredrib');
    }
  );
});

//Fade in Case Study Images
function showImages(el) {
  var windowHeight = jQuery( window ).height();
  $(el).each(function(){
      var thisPos = $(this).offset().top;

      var topOfWindow = $(window).scrollTop();
      if (topOfWindow + windowHeight - 350 > thisPos ) {
          $(this).addClass("fadeIn");
      }
  });
}
// if the image in the window of browser when the page is loaded, show that image
$(document).ready(function(){
  showImages('.example');
});
// if the image in the window of browser when scrolling the page, show that image
$(window).scroll(function() {
  showImages('.example');
});

// Drift Chat
// "use strict";
// !function() {
//   var t = window.driftt = window.drift = window.driftt || [];
//   if (!t.init) {
//     if (t.invoked) return void (window.console && console.error && console.error("Drift snippet included twice."));
//     t.invoked = !0, t.methods = [ "identify", "config", "track", "reset", "debug", "show", "ping", "page", "hide", "off", "on" ], 
//     t.factory = function(e) {
//       return function() {
//         var n = Array.prototype.slice.call(arguments);
//         return n.unshift(e), t.push(n), t;
//       };
//     }, t.methods.forEach(function(e) {
//       t[e] = t.factory(e);
//     }), t.load = function(t) {
//       var e = 3e5, n = Math.ceil(new Date() / e) * e, o = document.createElement("script");
//       o.type = "text/javascript", o.async = !0, o.crossorigin = "anonymous", o.src = "https://js.driftt.com/include/" + n + "/" + t + ".js";
//       var i = document.getElementsByTagName("script")[0];
//       i.parentNode.insertBefore(o, i);
//     };
//   }
// }();
// drift.SNIPPET_VERSION = '0.3.1';
// drift.load('e7gv3i7r79cb');

// Smooth Scroll
// $(document).ready(function(){
//   $("a").on('click', function(event) {
//     if (this.hash !== "") {
//       event.preventDefault();
//       var hash = this.hash;
//       $('html, body').animate({
//         scrollTop: $(hash).offset().top
//       }, 800, function(){
//         window.location.hash = hash;
//       });
//     }
//   });
// });


