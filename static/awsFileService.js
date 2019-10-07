app = angular.module("shippingApp")

app.factory('awsFileService', awsFileService, ['$http']);

function awsFileService($http) {
    var self = this;
    self.postFile = function(file, resolve, reject) {

        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                'file_name': file.name
            }
        }



        $http.get('/api/aws/presign_post', config)
            .then(
                function (response) {
                    console.log(`Successfully created presign post of ${file.name}`)
                    self.postFileWithPresignPromise(response.data, file).then(function(value){
                        resolve(value)
                    }).catch(
                        (reason) => {
                            reject(reason)
                        }

                    );
                },
                function (error) {
                    reject(`Failed to create presign post of file ${file.name}`)
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                }
           );
    }

    self.postFileWithPresignPromise = function(presign, file){
        return new Promise(function(resolve, reject){
            self.postFileWithPresign(presign, file, resolve, reject)
        })
    }

    self.postFileWithPresign = function(presign, file, resolve, reject){

        var postData = new FormData();
        for(key in presign.fields){
            postData.append(key, presign.fields[key]);
        }
        postData.append('file', file);


        var config = {
            headers : {
                    'Content-Type': undefined
            },
            params : {
            }
        }

        $http.post(presign.url, postData, config)
           .then(
                function(response){
                    console.log(`successfully posted file ${file.name} to aws`)
                    resolve(true)
                },
                function (data, status, header, config) {
                    reject(`Failed to post request containing presign of file ${file.name} to aws`)
                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                }
           );
    }


    self.getPresignedFileUrl = function(file_name, resolve, reject){
        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                'file_name': file_name
            }
        }


        $http.get('/api/aws/presign_get', config)
           .then(
                function (response) {
                    console.log(`Successfully retrieved file ${file_name} presigned url`)
                    resolve(response.data)
                },
                function (error) {
                    reject(`Failed to create presigned url of file ${file_name}`)

                    $scope.ResponseDetails = "Data: " + error.data +
                        "<hr />status: " + error.status +
                        "<hr />headers: " + error.headers +
                        "<hr />config: " + error.config;
                }
           );
    }

    return {
        postFile: function(file){
            return new Promise(function(resolve, reject) {
                self.postFile(file, resolve, reject)
            })
        },
        getPresignedFileUrl: function(file_name){
            return new Promise(function(resolve, reject){
                self.getPresignedFileUrl(file_name, resolve, reject)
            })
        }
    }


}