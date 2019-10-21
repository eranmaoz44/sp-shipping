angular.module("shippingApp").directive('imageLoaderWithOrientation',function(){
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {

              function loadAnImage(url, parent) {

                    var imgSource = url
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', imgSource, true);
                    xhr.responseType = 'arraybuffer';


                    xhr.onload = function(e) {
                        var ori = 0;
                        if (this.status == 200) {
                               var arrayBufferView = new Uint8Array(this.response);
                               var image_suffix_regex = e.target.responseURL.match(/png|jpg/)
                               image_suffix = "jpeg"
                               suffix_translator = {
                                    'jpg': 'jpeg'
                               }
                               if (image_suffix_regex != null){
                                    var image_suffix = image_suffix_regex[0]
                                    if (suffix_translator.hasOwnProperty(image_suffix)){
                                        image_suffix = suffix_translator[image_suffix]
                                    }
                               }
                                var blob = new Blob([arrayBufferView], { type: `image/${image_suffix}` });
                            loadImage.parseMetaData(blob, function(data) {
                                if (data.exif) {
                                    ori = data.exif.get('Orientation');
                                }
                                var loadingImage = loadImage(
                                    blob,
                                    function(img) {
                                        img.className = parent.className
                                        parent.removeChild(parent.lastChild)
                                        parent.appendChild(img);
                                    }, {
                                        orientation: ori,
                                        canvas: false

                                    }
                                );
                            });


                        }
                    };
                    xhr.send();
              }

          scope.$watch(attrs['ngModel'], function (v) {
            if(v != undefined){
                loadAnImage(v, elem[0])
            }
          });
        }
      } ;
    }
);