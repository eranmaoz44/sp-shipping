shippingApp = angular.module("shippingApp")

shippingApp.factory('commonUtilsService', commonUtilsService, []);


function commonUtilsService() {
    var self = this;

    self.makeID = function makeID(length) {
       var result           = '';
       var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
       var charactersLength = characters.length;
       for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       return result;
     }

     self.findIndex = function(array, item_to_find){
       var res = -1
       array.forEach(function (item, index) {
            if(item.id == item_to_find.id)
            res = index
       });

       return res
    }

    self.deleteFromArray = function(array, item_to_delete){
        index_to_delete = self.findIndex(array, item_to_delete)
        array.splice(index_to_delete, 1)
    }

    self.findByID= function(array, id){
       var res = undefined
       array.forEach(function (item, index) {
            if(item.id == id)
            res = item
       });

       return res
    }

    return {
        makeID:  self.makeID,
        findIndex: self.findIndex,
        deleteFromArray: self.deleteFromArray,
        findByID: self.findByID
    }


}