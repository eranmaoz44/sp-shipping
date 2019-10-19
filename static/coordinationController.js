function coordinationController($http, $scope, $location, $timeout, $filter, shippingCardService, commonUtilsService){

    var self = this

    self.idLength = 16

    self.defaultHourValue = 'בחר/י שעה'

    self.dateFormat = 'dd/mm/yyyy'

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

    self.addAvailability = function(){
        var nextAvailabilityIndex = self.availabilities.length
        nextAvailability = {
            id: commonUtilsService.makeID(self.idLength),
            shipping_id: self.getShippingID(),
            date: dateFormat(new Date(), self.dateFormat),
            from_hour: self.defaultHourValue,
            to_hour: self.defaultHourValue,
        }
        self.availabilities.push(nextAvailability)

        self.updateAvailability(nextAvailability)

        $timeout(self.setUpDateElement.bind(null, nextAvailability), 0);

    }

    self.setUpDateElement = function(availability){
        console.log('setUpDateElement')
        console.log(availability)
        var dateElement = $(`#datePicker${availability.id}`)
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
                currentID = e.currentTarget.id.replace('datePicker', '')
                currentAvailability = commonUtilsService.findByID(self.availabilities, currentID)
                currentAvailability.date = dateFormat(e.date, self.dateFormat),
                self.updateAvailability(currentAvailability)
            });
    }

    self.hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

    self.removeAvailability = function(availability){
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
                    commonUtilsService.deleteFromArray(self.availabilities, availability)
                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                 }
           );
        console.log(self.availabilities)
    }

    self.updateAvailability = function(availability){

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
                 },
                function (error) {
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                 }
           );
    }

    self.getAllAvailabilities = function(shipping_id){
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