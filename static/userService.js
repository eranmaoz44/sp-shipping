shippingApp = angular.module("shippingApp")

shippingApp.factory('userService', userService, ['$http']);


function userService($http) {
    var self = this;

    self.getUserId = function(resolve, reject){
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {

            }
        }


        $http.get('/user/id', config).then(
            function (response) {
                resolve(response.data)

            }, function (error) {
                reject(`Could not retrieve user id because ${scope.ResponseDetails}`)
            }
         );
    }

    self.getUserIdWithPromise = function(){
        return new Promise(function(resolve, reject){
            self.getUserId(resolve,reject)
        })
    }

    return {
        getUserIdWithPromise:  self.getUserIdWithPromise
    }


}