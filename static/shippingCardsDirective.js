;(function(window) {

	'use strict';

	angular.module("shippingApp")
.directive('shippingCardsDirective', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
	    state: '@'
	},
    templateUrl: '/static/shippingcards.html',
    bindToController: true,
    controllerAs: 'scc',
    controller: shippingCardsController
  }
})

})(window);