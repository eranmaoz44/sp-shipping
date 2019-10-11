function shippingCardsController($http, $scope, awsFileService,$mdDialog){

    var self = this

    self.idLength = 16

    self.shippingCards = []

    self.defaultImageAwsPath = "orderImages/default.png"

    self.findIndex = function(cards, card_to_find){
       var res = -1
       cards.forEach(function (card, index) {
            if(card.id == card_to_find.id)
            res = index
       });

       return res
    }

    self.addShippingCard = function(){
        var cardToAdd = {
                'id' : self.makeID(self.idLength),
                'orderNumber' : '',
                'orderImageAwsPath' : self.defaultImageAwsPath
        }

        self.updateCardTempOrderImageUrl(cardToAdd)

        self.updateShippingCard(cardToAdd)

        self.shippingCards.push(
            cardToAdd
        )


    }

    self.updateCardsTempOrderImages = function(cards){
        cards.forEach(function(card) {
          self.updateCardTempOrderImageUrl(card)
        });
    }

    self.getShippingCards = function(){
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
            }
        }


        $http.get('/api/shipping', config).then(
            function (response) {
                var oldCards = self.shippingCards
                var newAndOldCards = response.data
                var cardsToUpdateTempImageUrl = []
                newAndOldCards.forEach(function(newOrOldCard){
                    var indexInOldCards = self.findIndex(oldCards, newOrOldCard)
                    if(indexInOldCards > -1){
                       var oldCard = oldCards[indexInOldCards]
                       oldCard.id = newOrOldCard.id
                       oldCard.orderNumber = newOrOldCard.orderNumber
                       if(oldCard.orderImageAwsPath != newOrOldCard.orderImageAwsPath){
                            cardsToUpdateTempImageUrl.push(oldCard)
                       }
                       oldCard.orderImageAwsPath = newOrOldCard.orderImageAwsPath
                    }
                    else {
                        oldCards.push(newOrOldCard)
                        cardsToUpdateTempImageUrl.push(newOrOldCard)
                    }
                });

                oldCards.forEach(function(card){
                    var indexInNewAndOld = self.findIndex(newAndOldCards, card)
                    if (indexInNewAndOld == -1){
                        self.deleteFromArray(oldCards, card)
                    }
                });



                self.updateCardsTempOrderImages(cardsToUpdateTempImageUrl)

            }, function (error) {
                $scope.ResponseDetails = "Data: " + error.data +
                    "<hr />status: " + error.status +
                    "<hr />headers: " + error.headers +
                    "<hr />config: " + error.config;
            }
         );

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
            .then(
                function (response) {
                    $scope.PostDataResponse = response.data;
                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                 }
           );
    };

    self.deleteFromArray = function(cards, card_to_delete){
        index_to_delete = self.findIndex(cards, card_to_delete)
        cards.splice(index_to_delete, 1)
    }

    self.deleteShippingCard = function(card){

        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                shippingCard: card
            }
        }


        $http.delete('/api/shipping', config)
            .then(
                function (response) {
                    $scope.PostDataResponse = response.data;
                    self.deleteFromArray(self.shippingCards, card)
                    if(card.orderImageAwsPath != self.defaultImageAwsPath){
                        awsFileService.deleteFile(card.orderImageAwsPath)
                    }

                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                 }
           );
    };

    self.uploadFileToAws = function(card, file){
        if(file == null){
            console.log('File not selected, exiting upload to aws function')
            return
         }
        var destination_file_name = `orderImages/${card.id}/${file.name}`
        awsFileService.postFile(file, destination_file_name).then(function(value){
            var oldOrderImageAwsPath = card.orderImageAwsPath
            card.orderImageAwsPath = destination_file_name
            self.updateShippingCard(card)
            self.updateCardTempOrderImageUrl(card)
            if(oldOrderImageAwsPath != card.orderImageAwsPath && oldOrderImageAwsPath != self.defaultImageAwsPath){
                awsFileService.deleteFile(oldOrderImageAwsPath)
            }
        }).catch(
        // Log the rejection reason
       (reason) => {
            console.log(`Failed to upload file to aws because: ${reason}`);
        })
    }

    self.updateCardTempOrderImageUrl = function(card){
        awsFileService.getPresignedFileUrl(card.orderImageAwsPath).then(function(value){
            $scope.$apply(function () {
                card['tempOrderImageUrl'] = value
             });
            }).catch(
                (reason) => {
                    console.log(`Failed to get file url because: ${reason}`)
                }
        )
    }

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
             setInterval(function(){
          self.getShippingCards();
        }, 30000)
}

angular
    .module('shippingApp')
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope', 'awsFileService', '$mdDialog'])
    .config(function($mdThemingProvider) {
      $mdThemingProvider.theme('light-blue').backgroundPalette('light-blue');
    });