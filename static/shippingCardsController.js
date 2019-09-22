function shippingCardsController($http, $scope){

    var self = this

    self.idLength = 16

    self.cards = []

    self.findIndex = function(id){
       var res = -1
       array.forEach(function (item, index) {
            if(item['id'] == id)
            res = index
       });

       return index
    }

    self.addShippingCard = function(){
        var cardToAdd = {
                'id' : self.makeID(self.idLength),
                'orderNumber' : ''
        }

        self.updateShippingCard(cardToAdd)

        self.cards.push(
            cardToAdd
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

    self.updateShippingCard = function(card){
        var cardToUpdate = card
        var data = cardToUpdate

        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
            }
        }


        $http.post('/api/shipping', data, config)
        .success(function (data, status, headers, config) {
            $scope.PostDataResponse = data;

        })
        .error(function (data, status, header, config) {
            $scope.ResponseDetails = "Data: " + data +
                "<hr />status: " + status +
                "<hr />headers: " + header +
                "<hr />config: " + config;

        });
    };

    self.makeID = function makeID(length) {
       var result           = '';
       var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
       var charactersLength = characters.length;
       for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       return result;
     }

     self.getShippingCards()
}

angular
    .module('shippingApp')
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope'])