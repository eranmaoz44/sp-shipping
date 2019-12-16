function coordinationController($http, $scope, $location, $timeout, $filter, shippingCardService, commonUtilsService){

    var self = this

    self.idLength = 16

    self.defaultHourValue = 'בחר/י שעה'

    self.dateFormat = 'dd/mm/yyyy'

    self.isEditable = function(){
        res = false
        if (self.card != null){
            res = (self.card.state == 'ongoing')
        }
        return res
    }

    self.getShippingID =  function(){
        return $location.search()['shippingID']
    }

    self.getShippingCard = function(shippingID){
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                    shippingID: shippingID
            }
        }


        $http.get('/api/shipping', config).then(
            function (response) {
                self.card = response.data
                shippingCardService.updateCardTempOrderImageUrl($scope, self.card)

            }, function (error) {
                $scope.ResponseDetails = "Data: " + error.data +
                    "<hr />status: " + error.status +
                    "<hr />headers: " + error.headers +
                    "<hr />config: " + error.config;
            }
         );
    }

    self.availabilities = []

    self.createCoordinationWithModal = function(){
        self.disableCoordinationRefresh = true
        self.isCreatingNewCoordination = true
//        var nextAvailabilityIndex = self.availabilities.length
        self.coordinationInEdit = {
            id: commonUtilsService.makeID(self.idLength),
            shipping_id: self.getShippingID(),
            date: dateFormat(new Date(), self.dateFormat),
            from_hour: self.defaultHourValue,
            to_hour: self.defaultHourValue,
        }
//        self.availabilities.push(nextAvailability)

//        self.updateAvailability(nextAvailability)

        $('#editCoordinationModal').modal({})

        $timeout(self.setUpDateElement.bind(null, self.coordinationInEdit), 0);

    }

    if (typeof JSON.clone !== "function") {
        JSON.clone = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };
    }

    self.openEditModalForExistingCoordination = function(coordination) {
        self.disableCoordinationRefresh = true
        self.isCreatingNewCoordination = false
        self.coordinationInEdit = JSON.clone(coordination)

        $('#editCoordinationModal').modal({})

        $timeout(self.setUpDateElement.bind(null, self.coordinationInEdit), 0);
    }

    $('#editCoordinationModal').on('hidden.bs.modal', function () {
        self.disableCoordinationRefresh = false
    });

    self.getEditCoordinationModalUpdateButton = function (){
        if (self.isCreatingNewCoordination == true){
            return "צור"
        } else {
            return "שמור"
        }
    }

    self.getEditCoordinationModalTitle = function (){
        if (self.isCreatingNewCoordination == true){
            return "חלון יצירת טווח שעות לתיאום חדש"
        } else {
            return "חלון עריכת טווח שעות לתיאום קיים"
        }
    }

    self.saveCoordinationFromEditModal = function(){
        self.isSavingCoordination = true
        self.updateAvailabilityWithPresign(self.coordinationInEdit)
            .then(function(result){
                if (self.isCreatingNewCoordination == false){
                    var oldCoordination = commonUtilsService.findByID(self.availabilities, self.coordinationInEdit.id)
                    commonUtilsService.deleteFromArray(self.availabilities, oldCoordination)
                }
                $timeout(function(){
                    self.availabilities.push(self.coordinationInEdit)
                }, 0);
                self.isSavingCoordination = false
                $('#editCoordinationModal').modal('hide');
            }, function(error){
                console.log(`Failed creating/saving coordination because ${error}`)
                self.isSavingCoordination = false
            })

    }

    self.deleteCoordinationInEdit = function(){
        self.isDeletingCoordination = true
        self.deleteCoordinationWithPresign(self.coordinationInEdit).then(function(result){

            self.isDeletingCoordination = false
            $timeout(function(){
                commonUtilsService.deleteFromArray(self.availabilities, self.coordinationInEdit)
            }, 0);
            $('#editCoordinationModal').modal('hide');
        }, function(error){
            self.isDeletingCoordination = false
            console.log(`could not remove coordination inside edit because ${error}`)
        })
    }

    self.setUpDateElement = function(availability){
        console.log('setUpDateElement')
        console.log(availability)
        var dateElement = $(`#datePickerInEdit${availability.id}`)
        dateElement.datepicker({
            weekStart: 1,
            daysOfWeekHighlighted: "6,0",
            autoclose: true,
            todayHighlight: true,
            format: self.dateFormat,
            language: 'he'
        });
        dateElement.datepicker("setDate",availability.date);

        dateElement.datepicker()
            .on('changeDate', function(e) {
                currentID = e.currentTarget.id.replace('datePickerInEdit', '')
                currentAvailability = commonUtilsService.findByID(self.availabilities, currentID)
                currentAvailability.date = dateFormat(e.date, self.dateFormat)
//                self.updateAvailability(currentAvailability)
            });
    }

    self.hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

    self.deleteCoordination = function(availability, resolve, reject){
        console.log(availability)

        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                availability: availability
            }
        }


        $http.delete('/api/availability', config)
            .then(
                function (response) {
                    $scope.PostDataResponse = response.data;
//                    commonUtilsService.deleteFromArray(self.availabilities, availability)
                    resolve(true)
                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                    resolve(error.data)
                 }
           );
        console.log(self.availabilities)
    }

    self.deleteCoordinationWithPresign = function(coordination){
        return new Promise(function(resolve, reject){
            self.deleteCoordination(coordination, resolve,reject)
        })
    }

    self.updateAvailability = function(availability, resolve, reject){

        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
            }
        }

        data = availability

        $http.post('/api/availability', data, config)
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
                    reject(error.data)
                 }
           );
    }

    self.updateAvailabilityWithPresign = function(availability){
        return new Promise(function(resolve, reject){
            return self.updateAvailability(availability, resolve, reject)
        })
    }

    self.getAllAvailabilities = function(shipping_id){
        if(self.disableCoordinationRefresh == true){
            return
        }
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                shipping_id: shipping_id
            }
        }


        $http.get('/api/availabilities', config).then(
            function (response) {
                self.availabilities = response.data
                self.availabilities.forEach(function(availability, index){
                    $timeout(self.setUpDateElement.bind(null, availability), 0);
                })

            }, function (error) {
                $scope.ResponseDetails = "Data: " + error.data +
                    "<hr />status: " + error.status +
                    "<hr />headers: " + error.headers +
                    "<hr />config: " + error.config;
            }
         );
    }

     self.getShippingCard(self.getShippingID())

     self.getAllAvailabilities(self.getShippingID())

     setInterval(function(){

          self.getShippingCard(self.getShippingID())

          self.getAllAvailabilities(self.getShippingID())

     }, 30000)




}


angular
    .module('shippingApp')
    .controller('coordinationController', coordinationController, ['$http', '$scope', '$location', '$timeout', '$filter', 'shippingCardService', 'commonUtilsService'])