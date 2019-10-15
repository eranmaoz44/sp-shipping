shippingApp = angular.module("shippingApp")

shippingApp.factory('shippingCardService', shippingCardService, ['$http', 'awsFileService']);


function shippingCardService($http, awsFileService) {
    var self = this;

    self.updateCardTempOrderImageUrl = function($scope, card){
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

    return {
        updateCardTempOrderImageUrl:  self.updateCardTempOrderImageUrl
    }


}