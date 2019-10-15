function shippingCardsController($http, $scope, $location,$window, awsFileService,shippingCardService, commonUtilsService){

    var self = this

    self.idLength = 16

    self.shippingCards = []

    self.defaultImageAwsPath = "orderImages/default.png"


    self.addShippingCard = function(){
        var cardToAdd = {
                'id' : commonUtilsService.makeID(self.idLength),
                'orderNumber' : '',
                'orderImageAwsPath' : self.defaultImageAwsPath
        }

        shippingCardService.updateCardTempOrderImageUrl($scope, cardToAdd)

        self.updateShippingCard(cardToAdd)

        self.shippingCards.push(
            cardToAdd
        )


    }

    self.updateCardsTempOrderImages = function(cards){
        cards.forEach(function(card) {
          shippingCardService.updateCardTempOrderImageUrl($scope, card)
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
                    var indexInOldCards = commonUtilsService.findIndex(oldCards, newOrOldCard)
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
                    var indexInNewAndOld = commonUtilsService.findIndex(newAndOldCards, card)
                    if (indexInNewAndOld == -1){
                        commonUtilsService.deleteFromArray(oldCards, card)
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
                    commonUtilsService.deleteFromArray(self.shippingCards, card)
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
            shippingCardService.updateCardTempOrderImageUrl($scope, card)
            if(oldOrderImageAwsPath != card.orderImageAwsPath && oldOrderImageAwsPath != self.defaultImageAwsPath){
                awsFileService.deleteFile(oldOrderImageAwsPath)
            }
        }).catch(
        // Log the rejection reason
       (reason) => {
            console.log(`Failed to upload file to aws because: ${reason}`);
        })
    }

    self.getCoordinationLink = function(shippingID){
        var baseUrl = $location.$$absUrl.replace($location.$$url, '/')
        return baseUrl + 'coordination?shippingID=' + shippingID
    }

    self.navigateToCoordination = function(shippingID){
        $window.location.href = self.getCoordinationLink(shippingID);
    }

     self.getShippingCards()
             setInterval(function(){
          self.getShippingCards();
        }, 30000)
}

angular
    .module('shippingApp')
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope', '$location','$window', 'awsFileService', 'shippingCardService', 'commonUtilsService'])