;(function(window) {

	'use strict';

	angular.module('shippingApp', ['ngFileUpload'])
		.config(['$locationProvider', function($locationProvider){
            $locationProvider.html5Mode({
              enabled: true,
              requireBase: false
              })
            }])


})(window);