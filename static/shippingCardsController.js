function shippingCardsController($http, $scope){

    var self = this

    self.cards = [
        {
            'orderNumber' : '10876'
        }
    ]

    self.addShippingCard = function(){
        self.cards.push(
            {
                'orderNumber' : '12312'
            }
        )
    }

    self.getShippingCards = function(){
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
            }
        }


        $http.get('/api/shipping', config)
        .success(function (data, status, headers, config) {
            self.cards = data
        })
        .error(function (data, status, header, config) {
            $scope.ResponseDetails = "Data: " + data +
                "<hr />status: " + status +
                "<hr />headers: " + header +
                "<hr />config: " + config;
        });
    }

    self.getShippingCards()
}

angular
    .module('shippingApp')
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope'])