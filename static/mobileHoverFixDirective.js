angular.module('shippingApp')
.directive('mobileHoverFixDirective', function(){
      function link(scope, element, attrs) {

        element.on("touchstart", function(){
            $(this).removeClass("mobileHoverFix");
        });
        element.on("touchend", function(){
            $(this).addClass("mobileHoverFix");
        });
     }
       return {
            link: link
        };
});