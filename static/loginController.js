function loginController($http, $scope, $window){

    var self = this

    self.is_attempting_login = false
    self.bad_credentials = false
    self.remember_me = true

    self.login= function(){

        self.bad_credentials = false
        self.is_attempting_login = true
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
            }
        }

        if (self.remember_me == null){
            self.remember_me = false
        }

        var data = {
            id: self.id,
            password: self.password,
            remember_me: self.remember_me
        }

        $http.post('/login', data, config)
            .then(
                function (response) {
                    self.is_attempting_login = false
                    self.bad_credentials = false
                    $scope.PostDataResponse = response.data;
                    console.log(response.data)
                    $window.location.href = response.data
                 },
                function (error) {
                    self.is_attempting_login = false
                    self.bad_credentials = true
                    console.log(error.data)
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                 }
           );
    };

    self.updateShippingCardWithPresign = function(card){
        return new Promise(function(resolve, reject) {
            self.updateShippingCard(card, resolve, reject)
        })
    }


}

angular
    .module('shippingApp')
    .controller('loginController', loginController, ['$http', '$scope', '$window'])


