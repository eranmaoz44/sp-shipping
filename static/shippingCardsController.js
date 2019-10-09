function shippingCardsController($http, $scope, awsFileService,$mdDialog){

    var self = this

    self.idLength = 16

    self.shippingCards = []

    self.findIndex = function(id){
       var res = -1
       self.shippingCards.forEach(function (item, index) {
            if(item['id'] == id)
            res = index
       });

       return res
    }

    self.addShippingCard = function(){
        var cardToAdd = {
                'id' : self.makeID(self.idLength),
                'orderNumber' : '',
                'orderImageAwsPath' : "orderImages/default.png"
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
                self.shippingCards = response.data
                self.updateCardsTempOrderImages(self.shippingCards)
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

    self.uploadFileToAws = function(shippingID, file){
        if(file == null){
            console.log('File not selected, exiting upload to aws function')
            return
         }
        var destination_file_name = `orderImages/${shippingID}`
        awsFileService.postFile(file, destination_file_name).then(function(value){
            var currentCard = self.shippingCards[self.findIndex(shippingID)]
            currentCard.orderImageAwsPath = destination_file_name
            self.updateShippingCard(currentCard)
            self.updateCardTempOrderImageUrl(currentCard)
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

    function DialogController($scope, $mdDialog, shippingID) {
        var dialogController = this
        $scope.hide = function() {
          $mdDialog.hide();
        };

        $scope.cancel = function() {
          $mdDialog.cancel();
        };

        $scope.answer = function(answer) {
          $mdDialog.hide(answer);
        };

        dialogController.setOrderImageAwsPath = function(){
            var currentCard = self.shippingCards[self.findIndex(shippingID)]
//            self.updateCardTempOrderImageUrl(currentCard)
//            $scope.orderImageTempUrl = currentCard.tempOrderImageUrl
            awsFileService.getPresignedFileUrl(currentCard.orderImageAwsPath).then(function(value){
            $scope.$apply(function () {
                $scope.orderImageTempUrl = value
                currentCard.orderImageTempUrl = value
             });
            }).catch(
                (reason) => {
                    console.log(`Failed to get file url because: ${reason}`)
                }
            )
        }

        dialogController.setOrderImageAwsPath()

    }

    self.showShippingDialog = function(ev, shippingID) {
        $mdDialog.show({
          controller: DialogController,
          templateUrl: '/static/shippingdialog.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose:true,
          fullscreen: true, // Only for -xs, -sm breakpoints.,
          locals:{shippingID: shippingID},
        })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
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
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope', 'awsFileService', '$mdDialog'])
    .config(function($mdThemingProvider) {
      $mdThemingProvider.theme('light-blue').backgroundPalette('light-blue');
    });