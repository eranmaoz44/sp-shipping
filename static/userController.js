function userController($timeout, userService){

    var self = this

    $timeout(function(){
        userService.getUserIdWithPromise().then(function (value){
            self.user_id = value
        }, function(error){
            console.log(error)
        })
    }, 0);



}

angular
    .module('shippingApp')
    .controller('userController', userController, ['$timeout', 'userService'])
