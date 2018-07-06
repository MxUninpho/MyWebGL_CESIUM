// function createGoogleMapsByAPI(Cesium,options){
//     function GMImageryProvider(options) {
//         this._url = "http://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center={y},{x}&zoom={level}&size=256x256&key={key}";

//         this._key = options.key;
//         this._tilingScheme = new Cesium.WebMercatorTilingScheme();

//         this._tileWidth = 256;
//         this._tileHeight = 256;
//         this._maximumLevel = 18;

//         this._credit = undefined;
//         this._rectangle = this._tilingScheme.rectangle;
//         this._ready = true;
//     }

//     function buildImageUrl(imageryProvider, x, y, level) {
//         var rectangle = imageryProvider._tilingScheme.tileXYToNativeRectangle(x, y, level);

//         var dWidth = rectangle.west + (rectangle.east - rectangle.west)/2;
//         var dHeight = rectangle.south + (rectangle.north - rectangle.south)/2;

//         var projection = imageryProvider._tilingScheme._projection;
//         var centre = projection.unproject(new Cesium.Cartesian2(dWidth, dHeight));

//         var url = imageryProvider._url
//             .replace('{x}', centre.longitude * 180 / Math.PI)
//             .replace('{y}', centre.latitude * 180 / Math.PI)
//             .replace('{key}', imageryProvider._key)
//             .replace('{level}', level);

//         return url;
//     }

//     Cesium.defineProperties(GMImageryProvider.prototype, {
//         url : {
//             get : function() {
//                 return this._url;
//             }
//         },

//         token : {
//             get : function() {
//                 return this._token;
//             }
//         },

//         proxy : {
//             get : function() {
//                 return this._proxy;
//             }
//         },

//         tileWidth : {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('tileWidth must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return this._tileWidth;
//             }
//         },

//         tileHeight: {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('tileHeight must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return this._tileHeight;
//             }
//         },

//         maximumLevel : {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('maximumLevel must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return this._maximumLevel;
//             }
//         },

//         minimumLevel : {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('minimumLevel must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return 0;
//             }
//         },

//         tilingScheme : {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return this._tilingScheme;
//             }
//         },

//         rectangle : {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return this._rectangle;
//             }
//         },

//         tileDiscardPolicy : {
//             get : function() {
//                 //>>includeStart('debug', pragmas.debug);
//                 if (!this._ready) {
//                     throw new DeveloperError('tileDiscardPolicy must not be called before the imagery provider is ready.');
//                 }
//                 //>>includeEnd('debug');

//                 return this._tileDiscardPolicy;
//             }
//         },

//         errorEvent : {
//             get : function() {
//                 return this._errorEvent;
//             }
//         },

//         ready : {
//             get : function() {
//                 return this._ready;
//             }
//         },

//         readyPromise : {
//             get : function() {
//                 return this._readyPromise.promise;
//             }
//         },

//         credit : {
//             get : function() {
//                 return this._credit;
//             }
//         },

//         usingPrecachedTiles : {
//             get : function() {
//                 return this._useTiles;
//             }
//         },

//         hasAlphaChannel : {
//             get : function() {
//                 return true;
//             }
//         },

//         layers : {
//             get : function() {
//                 return this._layers;
//             }
//         }
//     });

//     GMImageryProvider.prototype.getTileCredits = function(x, y, level) {
//         return undefined;
//     };

//     GMImageryProvider.prototype.requestImage = function(x, y, level) {
//         if (!this._ready) {
//             throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
//         }

//         var url = buildImageUrl(this, x, y, level);
//         return Cesium.ImageryProvider.loadImage(this, url);
//     };

//     return new GMImageryProvider(options);
// }


// function createGoogleMapsByUrl(Cesium,options) {
//     options = Cesium.defaultValue(options, {});

//     var templateUrl = Cesium.defaultValue(options.url, 'http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}');

//     var trailingSlashRegex = /\/$/;
//     var defaultCredit = new Cesium.Credit('Google Maps');

//     var tilingScheme = new Cesium.WebMercatorTilingScheme({ ellipsoid : options.ellipsoid });

//     var tileWidth = 256;
//     var tileHeight = 256;

//     var minimumLevel = Cesium.defaultValue(options.minimumLevel, 0);
//     var maximumLevel = Cesium.defaultValue(options.minimumLevel, 17);

//     var rectangle = Cesium.defaultValue(options.rectangle, tilingScheme.rectangle);
    
//     // Check the number of tiles at the minimum level.  If it's more than four,
//     // throw an exception, because starting at the higher minimum
//     // level will cause too many tiles to be downloaded and rendered.
//     var swTile = tilingScheme.positionToTileXY(Cesium.Rectangle.southwest(rectangle), minimumLevel);
//     var neTile = tilingScheme.positionToTileXY(Cesium.Rectangle.northeast(rectangle), minimumLevel);
//     var tileCount = (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
//     //>>includeStart('debug', pragmas.debug);
//     if (tileCount > 4) {
//         throw new Cesium.DeveloperError('The rectangle and minimumLevel indicate that there are ' + tileCount + ' tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.');
//     }
//     //>>includeEnd('debug');

//     var credit = Cesium.defaultValue(options.credit, defaultCredit);
//     if (typeof credit === 'string') {
//         credit = new Cesium.Credit(credit);
//     }

//     return new Cesium.UrlTemplateImageryProvider({
//         url: templateUrl,
//         proxy: options.proxy,
//         credit: credit,
//         tilingScheme: tilingScheme,
//         tileWidth: tileWidth,
//         tileHeight: tileHeight,
//         minimumLevel: minimumLevel,
//         maximumLevel: maximumLevel,
//         rectangle: rectangle
//     });
// }
var googlemap2 = createGoogleMapsByUrl(Cesium,{url:"http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}"});
var outviewer;
var pullingHeight = 0;
var scratchCartesianPt = new Cesium.Cartesian3(0, 0,0);
var scratchCartographicPt = new Cesium.Cartographic(0, 0,0);
var scratchBoundingSphere = new Cesium.BoundingSphere(scratchCartesianPt,5.700195) ;
//
function fly() {
    // 1d227775-d8b6-4ba2-97d9-e55afd359bd1
    scratchCartesianPt.x = -2317130.540275;
    scratchCartesianPt.y = 5394349.186563;
    scratchCartesianPt.z = 2484174.871629;
    scratchCartographicPt = Cesium.Cartographic.fromCartesian(scratchCartesianPt,Cesium.Ellipsoid.WGS84,scratchCartographicPt);
    scratchCartographicPt.height += pullingHeight;

    scratchCartesianPt = Cesium.Cartesian3.fromRadians(scratchCartographicPt.longitude,scratchCartographicPt.latitude,scratchCartographicPt.height);
    //
    scratchBoundingSphere.center = scratchCartesianPt;
    scratchBoundingSphere.radius = 5.700195;
  
    outviewer.camera.flyToBoundingSphere(scratchBoundingSphere);
}
//
(function () {
    var viewer = new Cesium.Viewer('cesiumContainer', {
        // imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
        //     url: 'http://{s}.tianditu.com/img_c/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=img&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles',
        //     layer: 'img',
        //     style: 'default',
        //     format: 'tiles',
        //     tileMatrixSetID: 'c',
        //     credit: new Cesium.Credit('天地图全球影像服务'),
        //     subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        //     maximumLevel: 18,
        //     tilingScheme: new Cesium.GeographicTilingScheme(),
        //     tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18']
        // }),
        timeline:false,
        animation:false,
        navigation:true,
        fullscreenButton:false,
        navigationHelpButton:false,
        baseLayerPicker: false
    });
    outviewer = viewer;
    var baseView = Cesium.Rectangle.fromDegrees(104, 30.3, 104.3, 30.5);
    viewer.extend(Cesium.viewerCesiumNavigationMixin, {defaultResetView:baseView});
    var navigation = viewer.cesiumNavigation;
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE  = baseView;
    //
    var imageryLayers = viewer.imageryLayers;
    var url2 =  'http://{s}.tianditu.com/cia_w/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=cia&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles';
    var labelImagery = new Cesium.WebMapTileServiceImageryProvider({
        url : url2,
        layer : 'cia',
        style : 'default',
        format : 'tiles',
        maximumLevel: 18,
        tileMatrixSetID : 'w',
        credit : new Cesium.Credit('天地图全球影像中文注记服务'),
        subdomains : ['t0','t1','t2','t3','t4','t5','t6','t7']
    });
  //  imageryLayers.addImageryProvider(labelImagery);
    //
   //viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.enableLighting = true;
    imageryLayers.addImageryProvider(googlemap2);
    imageryLayers.addImageryProvider(labelImagery);
    //
  // viewer.extend(Cesium.viewerCesiumNavigationMixin, {});
    //
    viewer.scene.camera._suspendTerrainAdjustment = false;
    //viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
    viewer.cesiumWidget.creditContainer.style.display= "none";
    //
    var d = new Date();
    var hour = 0 - d.getTimezoneOffset();
    // viewer.animation.viewModel.timeFormatter = function(date, viewModel) {
    //     var dateZone8 = Cesium.JulianDate.addMinutes(date,hour,new Cesium.JulianDate());
    //     var gregorianDate = Cesium.JulianDate.toGregorianDate(dateZone8);
    //     var millisecond = Math.round(gregorianDate.millisecond);
    //     if (Math.abs(viewModel._clockViewModel.multiplier) < 1) {
    //         return Cesium.sprintf("%02d:%02d:%02d.%03d", gregorianDate.hour, gregorianDate.minute, gregorianDate.second, millisecond);
    //     }
    //     return Cesium.sprintf("%02d:%02d:%02d GMT+8", gregorianDate.hour, gregorianDate.minute, gregorianDate.second);
    // };
    var viewModel = {
        height: 0
    };
    Cesium.knockout.track(viewModel);
    var toolbar = document.getElementById('toolbar');
    Cesium.knockout.applyBindings(viewModel, toolbar);
    
    
     //
    Cesium.knockout.getObservable(viewModel, 'height').subscribe(function(height) {
        height = Number(height);
        if (isNaN(height)) {
            return;
        }
        var cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        pullingHeight = height;
    });

   
//
var czml = [{
    "id" : "document",
    "name" : "CZML Model",
    "version" : "1.0"
}, {
    "id" : "aircraft model",
    "name" : "Cesium Air",
    "position" : {
        "cartographicDegrees" : [-77, 37, 1]
    },
    "model": {
        "gltf":"../../../../Apps/SampleData/models/CesiumMilkTruck/CesiumMilkTruck.gltf",
        "distanceDisplayCondition":[0,200]
        
    },
    
}];


//var dataSourcePromise = viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
//viewer.zoomTo(dataSourcePromise);
    //
    var vkkkk = Cesium.Math.toRadians(104.05898094177246);
    console.log(vkkkk);
    vkkkk = Cesium.Math.toRadians(30.428266525268555);
    console.log(vkkkk);
    vkkkk = Cesium.Math.toRadians(104.06447410583496);
    console.log(vkkkk);
    vkkkk = Cesium.Math.toRadians(30.433759689331055);
    console.log(vkkkk);
    //
    var position = Cesium.Cartesian3.fromDegrees(104.05898094177246, 30.435991287231445, 453.517914);
    console.log(position);
    
    
    function createModel(url, height) {
        //viewer.entities.removeAll();
        var position = Cesium.Cartesian3.fromDegrees(104.05898094177246, 30.435991287231445, 453.517914);
        var heading = Cesium.Math.toRadians(0);
        var pitch = 0;
        var roll = 0;
        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        var jjjj = new Cesium.DistanceDisplayCondition(10.0,2000.0);
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
        var entity = viewer.entities.add({
            name : url,
            position : position,
            orientation : orientation,
            model : {
                uri : url,
                maximumScale : 200,
                distanceDisplayCondition:jjjj
            }
        });
        viewer.zoomTo(entity);
    }
    createModel("../../../../Apps/SampleData/models/CesiumMilkTruck/CesiumMilkTruck.gltf",10);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/555/0.glb',0);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/BatchedTestJGB/0_0_1_3.glb',0);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/BatchedTestJGB/0_0_2_3.glb',0);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/BatchedTestJGB/0_0_3.glb',0);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/BatchedTestJGB/0_1.glb',0);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/BatchedTestJGB/0_2.glb',0);
    // createModel('../Specs/Data/Cesium3DTiles/Batched/BatchedTestJGB/0_3_3.glb',0);
    //
   var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
       Cesium.Cartesian3.fromDegrees(104.06048834, 30.66109327, 0.0));
   console.log(modelMatrix);
   //
    //
    // var blueEllipsoid = viewer.entities.add({
    //     name : 'Blue ellipsoid',
    //     position: Cesium.Cartesian3.fromDegrees(104.07048834, 30.66109327, 0.0),
    //     ellipsoid : {
    //         radii : new Cesium.Cartesian3(200, 200.0, 200.0),
    //         material : Cesium.Color.BLUE
    //     }
    // });
   // viewer.zoomTo(blueEllipsoid);
    //
    var ellipsoid = viewer.scene.globe.ellipsoid;
    var coord_wgs84 = Cesium.Cartographic.fromDegrees(0, 0, 0);//单位：度，度，米
    var coord_xyz = ellipsoid.cartographicToCartesian(coord_wgs84);
    console.log('longitude 0->x=' + coord_xyz.x + ',latitude 0->y=' + coord_xyz.y + ',heigh 0->z=' + coord_xyz.z);
    //
     coord_wgs84 = Cesium.Cartographic.fromDegrees(180, 0, 0);//单位：度，度，米
    coord_xyz = ellipsoid.cartographicToCartesian(coord_wgs84);
    console.log('longitude 180->x=' + coord_xyz.x + ',latitude 0->y=' + coord_xyz.y + ',heigh 0->z=' + coord_xyz.z);
    //
    coord_wgs84 = Cesium.Cartographic.fromDegrees(90, 0, 0);//单位：度，度，米
    coord_xyz = ellipsoid.cartographicToCartesian(coord_wgs84);
    console.log('longitude 90->x=' + coord_xyz.x + ',latitude 0->y=' + coord_xyz.y + ',heigh 0->z=' + coord_xyz.z);
    //

    var longitude_show=document.getElementById('longitude_show');
    var latitude_show=document.getElementById('latitude_show');
    var altitude_show=document.getElementById('altitude_show');
    var canvas=viewer.scene.canvas;
    //具体事件的实现
    ellipsoid=viewer.scene.globe.ellipsoid;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);

    handler.setInputAction(function(movement){
        //捕获椭球体，将笛卡尔二维平面坐标转为椭球体的笛卡尔三维坐标，返回球体表面的点
        var cartesian=viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if(cartesian){
            //将笛卡尔三维坐标转为地图坐标（弧度）
            var cartographic=viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            var pix =viewer.scene.cartesianToCanvasCoordinates(cartesian);
            //将地图坐标（弧度）转为十进制的度数
            var lat_String=Cesium.Math.toDegrees(cartographic.latitude).toFixed(8);
            var log_String=Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
            var alti_String=(viewer.camera.positionCartographic.height/1000).toFixed(4);
            longitude_show.innerHTML=log_String + "   x=" +cartesian.x + " pixX=" + pix.x;
            latitude_show.innerHTML=lat_String+ "   y=" +cartesian.y + " pixY=" + pix.y;
            altitude_show.innerHTML=alti_String+ "   z=" +cartesian.z;
        }
    },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(function(movement){
        //捕获椭球体，将笛卡尔二维平面坐标转为椭球体的笛卡尔三维坐标，返回球体表面的点
        var cartesian=viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if(cartesian){
            //将笛卡尔三维坐标转为地图坐标（弧度）
            var cartographic=viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            var pix =viewer.scene.cartesianToCanvasCoordinates(cartesian);
            //将地图坐标（弧度）转为十进制的度数
            var lat_String=Cesium.Math.toDegrees(cartographic.latitude).toFixed(8);
            var log_String=Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
            var alti_String=Cesium.Math.toDegrees(cartographic.height).toFixed(8);
            console.log( lat_String + "," +log_String + "," +alti_String);
        }
    },Cesium.ScreenSpaceEventType.LEFT_CLICK );
    // Color a feature yellow on hover.
    //
    var highlighted = {
        feature: undefined
    };
    var selected = {
        feature: undefined
    };
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
    //     // If a feature was previously highlighted, undo the highlight
    //     if (Cesium.defined(highlighted.feature)) {
    //         highlighted.feature.color =Cesium.Color.WHITE;
    //         highlighted.feature = undefined;
    //     }
    //     // Pick a new feature
    //     var pickedFeature = viewer.scene.pick(movement.endPosition);
    //     if (!Cesium.defined(pickedFeature)) {
    //         return;
    //     }
    //     if (Cesium.defined(selected.feature))
    //     {
    //         if (pickedFeature !== selected.feature)
    //         {
    //             highlighted.feature = pickedFeature;
    //             highlighted.feature.color = Cesium.Color.RED;
    //         }
    //     }
    //     else
    //     {
    //         highlighted.feature = pickedFeature;
    //         highlighted.feature.color = Cesium.Color.RED;
    //     }
    // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    /////////////////////////////////////////////////////////////////////////////

    var selectedEntity = new Cesium.Entity();
    handler.setInputAction(function onLeftClick(movement) {
        // If a feature was previously selected, undo the highlight
        if (Cesium.defined(selected.feature)) {
            selected.feature.color = Cesium.Color.WHITE;
            selected.feature = undefined;
        }
        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.position);
        if (!Cesium.defined(pickedFeature)) {
            return;
        }
        if (!(pickedFeature instanceof Cesium.Cesium3DTileFeature)) {
            return;
        }
        //
        console.log(pickedFeature.tileset.asset.id);
        //
        if(pickedFeature.tileset === tileset1){
            return;
        }
        selected.feature = pickedFeature;
        //console.log( selected.feature.color);
        selected.feature.color =  new Cesium.Color(1.0, 0.0, 0.0, 1.0);
        // Set feature infobox description
        selectedEntity.name = pickedFeature.getProperty('name');
        selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
        viewer.selectedEntity = selectedEntity;
        selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
            '<tr><th>GE</th><td>' + pickedFeature.content.tileset.url   + '</td></tr>' +
            '</tbody></table>';
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}());