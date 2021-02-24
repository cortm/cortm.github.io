// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-84289303-1', 'auto');
ga('send', 'pageview');

// Smooth Scroll ----------------------------
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

$(document).ready(function () {
  $('a.to-invention').click(function (){
    $('html, body').animate({
      scrollTop: $("div.invention").offset().top
    }, 1000)
  })
});

// Back to Top Button ----------------------------
$(window).scroll(function() {    
  var scroll = $(window).scrollTop();
  if (scroll >= 480) {
      $(".to-top").addClass("to-top-reveal");
  } else {
      $(".to-top").removeClass("to-top-reveal");
  }
});

// Figures ----------------------------
// $(function(){
//   $("#about").hover(
//     function () {
//       $(".figureOne").addClass('figureabout');
//     }, 
//     function () {
//       $(".figureOne").toggleClass('figureabout');
//     }
//   );
// });
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
  $("#logos").hover(
    function () {
      $(".figureOne").toggleClass('figurelogos');
    }, 
    function () {
      $(".figureOne").toggleClass('figurelogos');
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

//Fade in Case Study Images ----------------------------
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

// Before and After Slider ----------------------------
// Call & init
$(document).ready(function(){
  $('.ba-slider').each(function(){
    var cur = $(this);
    // Adjust the slider
    var width = cur.width()+'px';
    cur.find('.resize img').css('width', width);
    // Bind dragging events
    drags(cur.find('.handle'), cur.find('.resize'), cur);
  });
});

// Update sliders on resize. 
// Because we all do this: i.imgur.com/YkbaV.gif
$(window).resize(function(){
  $('.ba-slider').each(function(){
    var cur = $(this);
    var width = cur.width()+'px';
    cur.find('.resize img').css('width', width);
  });
});

function drags(dragElement, resizeElement, container) {
  
  // Initialize the dragging event on mousedown.
  dragElement.on('mousedown touchstart', function(e) {
    
    dragElement.addClass('draggable');
    resizeElement.addClass('resizable');
    
    // Check if it's a mouse or touch event and pass along the correct value
    var startX = (e.pageX) ? e.pageX : e.originalEvent.touches[0].pageX;
    
    // Get the initial position
    var dragWidth = dragElement.outerWidth(),
        posX = dragElement.offset().left + dragWidth - startX,
        containerOffset = container.offset().left,
        containerWidth = container.outerWidth();
 
    // Set limits
    minLeft = containerOffset + 6;
    maxLeft = containerOffset + containerWidth - dragWidth - 6;
    
    // Calculate the dragging distance on mousemove.
    dragElement.parents().on("mousemove touchmove", function(e) {
      
      // Check if it's a mouse or touch event and pass along the correct value
      var moveX = (e.pageX) ? e.pageX : e.originalEvent.touches[0].pageX;
      
      leftValue = moveX + posX - dragWidth;
      
      // Prevent going off limits
      if ( leftValue < minLeft) {
        leftValue = minLeft;
      } else if (leftValue > maxLeft) {
        leftValue = maxLeft;
      }
      
      // Translate the handle's left value to masked divs width.
      widthValue = (leftValue + dragWidth/2 - containerOffset)*100/containerWidth+'%';
      
      // Set the new values for the slider and the handle. 
      // Bind mouseup events to stop dragging.
      $('.draggable').css('left', widthValue).on('mouseup touchend touchcancel', function () {
        $(this).removeClass('draggable');
        resizeElement.removeClass('resizable');
      });
      $('.resizable').css('width', widthValue);
    }).on('mouseup touchend touchcancel', function(){
      dragElement.removeClass('draggable');
      resizeElement.removeClass('resizable');
    });
    e.preventDefault();
  }).on('mouseup touchend touchcancel', function(e){
    dragElement.removeClass('draggable');
    resizeElement.removeClass('resizable');
  });
}

// Drift Chat ----------------------------
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


