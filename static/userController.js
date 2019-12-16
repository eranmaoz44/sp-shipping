function userController($http, $scope, $timeout){

    var self = this

    self.get_user_id = function(){
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {

            }
        }


        $http.get('/user/id', config).then(
            function (response) {
                self.user_id = response.data

            }, function (error) {
                $scope.ResponseDetails = "Data: " + error.data +
                    "<hr />status: " + error.status +
                    "<hr />headers: " + error.headers +
                    "<hr />config: " + error.config;
            }
         );
    }

    $timeout(self.get_user_id, 0);



}

angular
    .module('shippingApp')
    .controller('userController', userController, ['$http', '$scope', '$timeout'])


