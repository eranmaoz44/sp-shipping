function shippingCardsController($http, $scope, $location,$window, awsFileService,shippingCardService, commonUtilsService, $timeout, userService){

    var self = this

    self.idLength = 16

    self.shippingCards = []

    self.default_image_aws_path = "orderImages/default.png"

    self.dateFormat = 'dd/mm/yyyy'

    self.shouldFetchCards = true

    self.loadedFirstTime = false

    self.shippingCardInEditMode = false

    self.user_id = null

    self.supplyHours = [
	      '05:00','05:30',
	      '06:00','06:30',
	      '07:00','07:30',
	      '08:00','08:30',
	      '09:00','09:30',
	      '10:00','10:30',
	      '11:00','11:30',
	      '12:00','12:30',
	      '13:00','13:30',
	      '14:00','14:30',
	      '15:00','15:30',
	      '16:00','16:30',
	      '17:00','17:30',
	      '18:00','18:30',
	      '19:00','19:30',
	      '20:00','20:30',
	      '21:00','21:30',
	      '22:00','22:30',
	      '23:00','23:30',
	      '00:00'
    ]

    self.defaultSupplyHour = 'בחר/י שעה'

    self.dateFormat = 'dd/mm/yyyy'

        self.page = 1;
    self.page_size = 9;
    self.total_pages = 1;

    self.isEditable = function(){
        return self.state == 'ongoing'
    }

    self.hasAdminPermissions = function(){
        return self.user_id == 'admin'
    }


    $timeout(function(){
        userService.getUserIdWithPromise().then(function (value){
            self.user_id = value
        }, function(error){
            console.log(error)
        })
    }, 0);


     self.supply_date_to_int = function(supply_date){
        var res = 0;
        var parts = supply_date.split("/");
        var d1 = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return d1;
     }

     self.supply_hour_to_int = function(supply_hour){
        var res = -1;
        var parts = supply_hour.split(":");
        if (parts.length > 1){
            res = parts[0]
        }
        return res
     }


     self.compareCards = function(a, b) {
                return self.supply_date_to_int(a.supply_date) - self.supply_date_to_int(b.supply_date)
                        + (self.supply_hour_to_int(a.supply_from_hour)-self.supply_hour_to_int(b.supply_from_hour))*1000
                        + (self.supply_hour_to_int(a.supply_to_hour)-self.supply_hour_to_int(b.supply_to_hour))*10;
     }



//    self.setUserId()
//
//    self.setUserIdInterval = setInterval(function(){
//        console.log('Entering set user id interval')
//        if(self.user_id != null){
//            clearInterval(self.setUserIdInterval)
//            console.log('Ending set user id interval')
//        } else {
//            console.log('Set user id interval attempting another go')
//            self.setUserId();
//        }
//    }, 30000)
//
//    self.blabla = true

    self.moveCardToFinished = function(card){
        card.isMovingToFinishState = true
        card.state = "finished"
        self.updateShippingCardWithPresign(card).then(function(response){
            card.isMovingToFinishState = false
            commonUtilsService.deleteFromArray(self.shippingCards, card)
            $(`#approveCompletionModal${card.id}`).modal('hide')

        }, function(error){
            card.state = 'ongoing'
            console.log(`could not move shipping card ${card} to finished because ${error}`)
        })

    }


    self.setUpDateElement = function(shippingCard){
        var dateElement = $(`#datePicker`)
        dateElement.datepicker({
            weekStart: 1,
            daysOfWeekHighlighted: "6,0",
            autoclose: true,
            todayHighlight: true,
            format: self.dateFormat,
            language: 'he'
        });
        dateElement.datepicker("setDate",shippingCard.supply_date);

        dateElement.datepicker()
            .on('changeDate', function(e) {
//                currentID = e.currentTarget.id.replace('datePickerInEdit', '')
//                currentAvailability = commonUtilsService.findByID(self.availabilities, currentID)
//                currentAvailability.date = dateFormat(e.date, self.dateFormat)
                  self.cardToAdd.supply_date = dateFormat(e.date, self.dateFormat)
//                self.updateAvailability(currentAvailability)
            });
    }


    self.addShippingCard = function(){
        self.shouldFetchCards = false
        self.cardToAdd = {
                'id' : commonUtilsService.makeID(self.idLength),
                'order_number' : '',
                'order_image_aws_path' : self.default_image_aws_path,
                'date' : dateFormat(new Date(), self.dateFormat),
                'state' : 'ongoing',
                'phone_number' : '',
                'price' : '',
                'who_pays' : 'לא צוין',
                'supply_date' : dateFormat(new Date(), self.dateFormat),
                'supply_from_hour' : self.defaultSupplyHour,
                'supply_to_hour' : self.defaultSupplyHour,
                'extra_info' : ''
        }

        self.cardToSaveFilePath = 'default.png'

        self.onEditImage = '/static/default.png'

        self.setUpDateElement(self.cardToAdd)

//        shippingCardService.updateCardTempOrderImageUrl($scope, cardToAdd)

//        self.updateShippingCard(cardToAdd)
//
//        self.shippingCards.push(
//            cardToAdd
//        )

        $('#createModal').modal({})


    }

    if (typeof JSON.clone !== "function") {
        JSON.clone = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };
    }

    self.moveToEditMode = function(card){
        self.shouldFetchCards = false
        self.shippingCardInEditMode = true
        self.cardToAdd = JSON.clone(card)
        self.imageChanged = false
        self.cardToSaveFilePath = card.order_image_aws_path
        self.onEditImage = card.tempOrderImageUrl
        self.setUpDateElement(self.cardToAdd)
        $(`#dialog${card.id}`).on('hidden.bs.modal', function () {
            if(self.shippingCardInEditMode){
                $('#createModal').modal('show')
            }
        })
        $(`#dialog${card.id}`).modal('hide')
    }


    $('#createModal').on('hidden.bs.modal', function () {
        self.shippingCardInEditMode = false
        self.shouldFetchCards = true
    });

    self.getModalCreateType = function(){
        if (self.shippingCardInEditMode == false){
            return "צור"
        } else{
            return "שמור"
        }
    }

    self.createModalTitle = function(){
        if (self.shippingCardInEditMode == false){
            return "חלון יצירת תיאום למשלוח"
        } else{
            return "חלון עריכת תיאום משלוח קיים"
        }
    }

    self.uploadImageOnModal = function(file){
        if(file != null){
            self.imageChanged = true
            self.onEditImage = file
            self.cardToSaveFilePath = file.name
        }
    }

    self.saveShippingCard = function(){
        self.cardToAdd.isSaving = true
        if (self.onEditImage == '/static/default.png' || self.imageChanged == false){
            self.saveShippingCardPostImageUpload()
        } else {
            self.uploadFileToAwsWithPresign(self.cardToAdd, self.onEditImage).then(function(response){
                self.saveShippingCardPostImageUpload()
            }, function(error){
            })
        }
    }

    self.saveShippingCardPostImageUpload = function(){
        self.updateShippingCardWithPresign(self.cardToAdd).then(function(response){
            if (self.shippingCardInEditMode == true){
                var cardBeforeEdit = commonUtilsService.findByID(self.shippingCards, self.cardToAdd.id)
                commonUtilsService.deleteFromArray(self.shippingCards, cardBeforeEdit)
            }
            $timeout(function(){
                self.shippingCards.push(
                    self.cardToAdd
                    )
            }, 0);
            shippingCardService.updateCardTempOrderImageUrl($scope, self.cardToAdd)
            $('#createModal').modal('hide');
            self.cardToAdd.isSaving = false
            self.shouldFetchCards = true
        }, function(error){
        })
    }

    self.updateCardsTempOrderImages = function(cards){
        cards.forEach(function(card) {
          shippingCardService.updateCardTempOrderImageUrl($scope, card)
        });
    }

//    self.getShippingCards = function(){
//
//        if(self.shouldFetchCards == false){
//            return;
//        }
//        console.log('state is ')
//        console.log(self.state)
//        var config = {
//            headers : {
//                    'Content-Type': 'application/json;charset=utf-8;'
//            },
//            params : {
//                state: self.state
//            }
//        }
//
//        $http.get('/api/shipping', config).then(
//            function (response) {
//                if(self.shouldFetchCards == false){
//                    return;
//                }
//                var oldCards = self.shippingCards
//                var newAndOldCards = response.data
//                var cardsToUpdateTempImageUrl = []
//                newAndOldCards.forEach(function(newOrOldCard){
//                    var indexInOldCards = commonUtilsService.findIndex(oldCards, newOrOldCard)
//                    if(indexInOldCards > -1){
//                       var oldCard = oldCards[indexInOldCards]
//                       oldCard.id = newOrOldCard.id
//                       oldCard.order_number = newOrOldCard.order_number
//                       if(oldCard.order_image_aws_path != newOrOldCard.order_image_aws_path){
//                            cardsToUpdateTempImageUrl.push(oldCard)
//                       }
//                       oldCard.order_image_aws_path = newOrOldCard.order_image_aws_path
//                       oldCard.date = newOrOldCard.date
//                       oldCard.state = newOrOldCard.state
//                       oldCard.phone_number = newOrOldCard.phone_number
//                       oldCard.price = newOrOldCard.price
//                       oldCard.who_pays = newOrOldCard.who_pays
//                       oldCard.supply_date = newOrOldCard.supply_date
//                       oldCard.supply_from_hour = newOrOldCard.supply_from_hour
//                       oldCard.supply_to_hour = newOrOldCard.supply_to_hour
//                       oldCard.extra_info = newOrOldCard.extra_info
//                    }
//                    else {
//                        oldCards.push(newOrOldCard)
//                        cardsToUpdateTempImageUrl.push(newOrOldCard)
//                    }
//                });
//
//                var i = 0;
//                var count = 0;
//                var oldCardsLength = oldCards.length;
//
//                while(count < oldCardsLength){
//                    var card = oldCards[i]
//                    i = i + 1
//                    var indexInNewAndOld = commonUtilsService.findIndex(newAndOldCards, card)
//                    if (indexInNewAndOld == -1){
//                        commonUtilsService.deleteFromArray(oldCards, card)
//                        i = i - 1
//                    }
//                    count = count + 1
//                }
//
//                self.shippingCards.sort(self.compareCards)
//
//                self.loadedFirstTime = true
//
//                self.updateCardsTempOrderImages(cardsToUpdateTempImageUrl)
//
//            }, function (error) {
//                $scope.ResponseDetails = "Data: " + error.data +
//                    "<hr />status: " + error.status +
//                    "<hr />headers: " + error.headers +
//                    "<hr />config: " + error.config;
//            }
//         );
//    }


    self.getShippingCards = function() {
        if (self.shouldFetchCards == false) return;

        var config = {
            headers: { 'Content-Type': 'application/json;charset=utf-8;' },
            params: {
                state: self.state,
                page: self.page,
                page_size: self.page_size
            }
        };

        $http.get('/api/shipping', config).then(
            function(response) {
                if(self.shouldFetchCards == false) return;

                var data = response.data;
                self.shippingCards = data.items;
                self.total_pages = data.total_pages;
                self.page = data.page;

                self.shippingCards.sort(self.compareCards);
                self.loadedFirstTime = true;
                self.updateCardsTempOrderImages(self.shippingCards);
            },
            function(error) {
                console.log("Error fetching shippings:", error);
            }
        );
    };

    self.getPageRange = function () {
    var pages = [];
    var maxVisible = 9;
    var total = $scope.scc.total_pages;
    var current = $scope.scc.page;

    if (total <= maxVisible) {
        for (var i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        var left = Math.max(2, current - 2);
        var right = Math.min(total - 1, current + 2);

        pages.push(1);
        if (left > 2) pages.push("...");

        for (var i = left; i <= right; i++) {
            pages.push(i);
        }

        if (right < total - 1) pages.push("...");
        pages.push(total);
    }
    return pages;
};

     self.goToPage = function(n) {
        if (n >= 1 && n <= self.total_pages) {
            self.page = n;
            self.getShippingCards();
        }
    };

    self.updateShippingCard = function(card, resolve, reject){

        self.shouldFetchCards = false
        $timeout(function(){
            self.shouldFetchCards = true
        }, 5000);

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
                    resolve(true)
                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                    reject(`could not update shipping card because of ${error.data}`)
                 }
           );
    };

    self.updateShippingCardWithPresign = function(card){
        return new Promise(function(resolve, reject) {
            self.updateShippingCard(card, resolve, reject)
        })
    }

    self.deleteShippingCard = function(card){

        card.isDeleting = true

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
                    card.isDeleting = false
                    $(`#dialog${card.id}`).modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                 }
           );
    };


    self.uploadFileToAws = function(card, file, resolve, reject){

        if(file == null){
            console.log('File not selected, exiting upload to aws function')
            reject('File not selected, exiting upload to aws function')
            return
         }
         card.loadingImage = true
        var destination_file_name = `orderImages/${card.id}/${file.name}`
        awsFileService.postFile(file, destination_file_name).then(function(value){
            var oldOrderImageAwsPath = card.order_image_aws_path
            card.order_image_aws_path = destination_file_name
            //self.updateShippingCard(card)
            //shippingCardService.updateCardTempOrderImageUrl($scope, card)
            if(oldOrderImageAwsPath != card.order_image_aws_path && oldOrderImageAwsPath != self.default_image_aws_path){
                awsFileService.deleteFile(oldOrderImageAwsPath)
            }
            resolve(true)
        }).catch(
        // Log the rejection reason
       (reason) => {
            console.log(`Failed to upload file to aws because: ${reason}`);
            reject(`Failed to upload file to aws because: ${reason}`)
        })
    }

    self.uploadFileToAwsWithPresign= function(card, file) {
        return new Promise(function(resolve, reject) {
            self.uploadFileToAws(card, file, resolve, reject)
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


//    setInterval(function(){
//        self.getShippingCards();
//    }, 30000)
}

angular
    .module('shippingApp')
    .controller('shippingCardsController', shippingCardsController, ['$http', '$scope', '$location','$window', 'awsFileService', 'shippingCardService', 'commonUtilsService', '$timeout', 'userService'])


