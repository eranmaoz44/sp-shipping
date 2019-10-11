app = angular.module("shippingApp")

app.factory('awsFileService', awsFileService, ['$http']);

function awsFileService($http) {
    var self = this;
    self.postFile = function(file, destination_file_name, resolve, reject) {

        var config = {
            headers : {
                    'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                'file_name': destination_file_name
            }
        }



        $http.get('/api/aws/presign_post', config)
            .then(
                function (response) {
                    console.log(`Successfully created presign post of ${destination_file_name}`)
                    self.postFileWithPresignPromise(response.data, file, destination_file_name).then(function(value){
                        resolve(value)
                    }).catch(
                        (reason) => {
                            reject(reason)
                        }

                    );
                },
                function (error) {
                    reject(`Failed to create presign post of file ${destination_file_name} because of ${error.status}`)
                }
           );
    }

    self.postFileWithPresignPromise = function(presign, file, destination_file_name){
        return new Promise(function(resolve, reject){
            self.postFileWithPresign(presign, file,destination_file_name, resolve, reject)
        })
    }

    self.postFileWithPresign = function(presign, file,destination_file_name, resolve, reject){

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
                    console.log(`successfully posted file ${destination_file_name} to aws`)
                    resolve(true)
                },
                function (error) {
                    reject(`Failed to post request containing presign of file ${destination_file_name} to aws because of ${error.status}`)
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
                    reject(`Failed to create presigned url of file ${file_name} because of ${error.status}`)
                }
           );
    }

    self.getPresignedFileUrlPromise = function(file_name){
        return new Promise(function(resolve, reject){
            self.getPresignedFileUrl(file_name, resolve, reject)
        })
    }

    self.deleteFile = function(file_name){
        var config = {
            headers : {
                      'Content-Type': 'application/json;charset=utf-8;'
            },
            params : {
                'file_name': file_name
            }
        }

        $http.delete('/api/aws/delete', config)
           .then(
                function(response){
                    console.log(`successfully deleted file ${file_name} from aws`)
                },
                function (error) {
                    console.log(`Failed to deleteFile ${file_name} from aws because of ${error.status}`)
                }
           );
    }

    return {
        postFile: function(file,file_name){
            return new Promise(function(resolve, reject) {
                self.postFile(file, file_name,resolve, reject)
            })
        },
        getPresignedFileUrl: self.getPresignedFileUrlPromise,
        deleteFile: self.deleteFile
    }


}