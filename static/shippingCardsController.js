function shippingCardsController($http, $scope, $location,$window, awsFileService,shippingCardService, commonUtilsService, $timeout){

    var self = this

    self.idLength = 16

    self.shippingCards = []

    self.default_image_aws_path = "orderImages/default.png"

    self.dateFormat = 'dd/mm/yyyy'

    self.isEditable = function(){
        return self.state == 'ongoing'
    }

    self.moveCardToFinished = function(card){
        card.state = "finished"
        self.updateShippingCard(card)
        commonUtilsService.deleteFromArray(self.shippingCards, card)
    }

    self.addShippingCard = function(){
        var cardToAdd = {
                'id' : commonUtilsService.makeID(self.idLength),
                'order_number' : '',
                'order_image_aws_path' : self.default_image_aws_path,
                'date' : dateFormat(new Date(), self.dateFormat),
                'state' : 'ongoing'
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
        console.log('state is ')
        console.log(self.state)
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                state: self.state
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
                       oldCard.order_number = newOrOldCard.order_number
                       if(oldCard.order_image_aws_path != newOrOldCard.order_image_aws_path){
                            cardsToUpdateTempImageUrl.push(oldCard)
                       }
                       oldCard.order_image_aws_path = newOrOldCard.order_image_aws_path
                       oldCard.date = newOrOldCard.date
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
                    if(card.order_image_aws_path != self.default_image_aws_path){
                        awsFileService.deleteFile(card.order_image_aws_path)
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
            var oldOrderImageAwsPath = card.order_image_aws_path
            card.order_image_aws_path = destination_file_name
            self.updateShippingCard(card)
            shippingCardService.updateCardTempOrderImageUrl($scope, card)
            if(oldOrderImageAwsPath != card.order_image_aws_path && oldOrderImageAwsPath != self.default_image_aws_path){
                awsFileService.deleteFile(oldOrderImageAwsPath)
            }
        }).catch(
        // Log the rejection reason
       (reason) => {
            console.log(`Failed to upload file to aws because: ${reason}`);
        })
    }

    self.copyToClipboard = function(text_to_share) {

        // create temp element
        var copyElement = document.createElement("span");
        copyElement.appendChild(document.createTextNode(text_to_share));
        copyElement.id = 'tempCopyToClipboard';
        angular.element(document.body.append(copyElement));

        // select the text
        var range = document.createRange();
        range.selectNode(copyElement);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        // copy & cleanup
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        copyElement.remove();
    }

    self.getCoordinationLink = function(shippingID){
        var baseUrl = $location.$$absUrl.replace($location.$$url, '/')
        return baseUrl + 'coordination?shippingID=' + shippingID
    }

    self.copyCoordinationLinkToClipboard = function(shippingID){
        self.copyToClipboard(self.getCoordinationLink(shippingID))
    }

    self.navigateToCoordination = function(shippingID){
        $window.location.href = self.getCoordinationLink(shippingID);
    }

    $timeout(self.getShippingCards, 0);


    setInterval(function(){
        self.getShippingCards();
    }, 30000)
}

angular
    .module('shippingApp')
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope', '$location','$window', 'awsFileService', 'shippingCardService', 'commonUtilsService', '$timeout'])


