function createGoogleMapsByAPI(Cesium,options){
    function GMImageryProvider(options) {
        this._url = "http://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center={y},{x}&zoom={level}&size=256x256&key={key}";

        this._key = options.key;
        this._tilingScheme = new Cesium.WebMercatorTilingScheme();

        this._tileWidth = 256;
        this._tileHeight = 256;
        this._maximumLevel = 18;

        this._credit = undefined;
        this._rectangle = this._tilingScheme.rectangle;
        this._ready = true;
    }

    function buildImageUrl(imageryProvider, x, y, level) {
        var rectangle = imageryProvider._tilingScheme.tileXYToNativeRectangle(x, y, level);

        var dWidth = rectangle.west + (rectangle.east - rectangle.west)/2;
        var dHeight = rectangle.south + (rectangle.north - rectangle.south)/2;

        var projection = imageryProvider._tilingScheme._projection;
        var centre = projection.unproject(new Cesium.Cartesian2(dWidth, dHeight));

        var url = imageryProvider._url
            .replace('{x}', centre.longitude * 180 / Math.PI)
            .replace('{y}', centre.latitude * 180 / Math.PI)
            .replace('{key}', imageryProvider._key)
            .replace('{level}', level);

        return url;
    }

    Cesium.defineProperties(GMImageryProvider.prototype, {
        url : {
            get : function() {
                return this._url;
            }
        },

        token : {
            get : function() {
                return this._token;
            }
        },

        proxy : {
            get : function() {
                return this._proxy;
            }
        },

        tileWidth : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('tileWidth must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return this._tileWidth;
            }
        },

        tileHeight: {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('tileHeight must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return this._tileHeight;
            }
        },

        maximumLevel : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('maximumLevel must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return this._maximumLevel;
            }
        },

        minimumLevel : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('minimumLevel must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return 0;
            }
        },

        tilingScheme : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return this._tilingScheme;
            }
        },

        rectangle : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return this._rectangle;
            }
        },

        tileDiscardPolicy : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this._ready) {
                    throw new DeveloperError('tileDiscardPolicy must not be called before the imagery provider is ready.');
                }
                //>>includeEnd('debug');

                return this._tileDiscardPolicy;
            }
        },

        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        ready : {
            get : function() {
                return this._ready;
            }
        },

        readyPromise : {
            get : function() {
                return this._readyPromise.promise;
            }
        },

        credit : {
            get : function() {
                return this._credit;
            }
        },

        usingPrecachedTiles : {
            get : function() {
                return this._useTiles;
            }
        },

        hasAlphaChannel : {
            get : function() {
                return true;
            }
        },

        layers : {
            get : function() {
                return this._layers;
            }
        }
    });

    GMImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };

    GMImageryProvider.prototype.requestImage = function(x, y, level) {
        if (!this._ready) {
            throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
        }

        var url = buildImageUrl(this, x, y, level);
        return Cesium.ImageryProvider.loadImage(this, url);
    };

    return new GMImageryProvider(options);
}

function createGoogleMapsByUrl(Cesium,options) {
    options = Cesium.defaultValue(options, {});

    var templateUrl = Cesium.defaultValue(options.url, 'http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}');

    var trailingSlashRegex = /\/$/;
    var defaultCredit = new Cesium.Credit('Google Maps');

    var tilingScheme = new Cesium.WebMercatorTilingScheme({ ellipsoid : options.ellipsoid });

    var tileWidth = 256;
    var tileHeight = 256;

    var minimumLevel = Cesium.defaultValue(options.minimumLevel, 0);
    var maximumLevel = Cesium.defaultValue(options.minimumLevel, 17);

    var rectangle = Cesium.defaultValue(options.rectangle, tilingScheme.rectangle);

    // Check the number of tiles at the minimum level.  If it's more than four,
    // throw an exception, because starting at the higher minimum
    // level will cause too many tiles to be downloaded and rendered.
    var swTile = tilingScheme.positionToTileXY(Cesium.Rectangle.southwest(rectangle), minimumLevel);
    var neTile = tilingScheme.positionToTileXY(Cesium.Rectangle.northeast(rectangle), minimumLevel);
    var tileCount = (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
    //>>includeStart('debug', pragmas.debug);
    if (tileCount > 4) {
        throw new Cesium.DeveloperError('The rectangle and minimumLevel indicate that there are ' + tileCount + ' tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.');
    }
    //>>includeEnd('debug');

    var credit = Cesium.defaultValue(options.credit, defaultCredit);
    if (typeof credit === 'string') {
        credit = new Cesium.Credit(credit);
    }

    return new Cesium.UrlTemplateImageryProvider({
        url: templateUrl,
        proxy: options.proxy,
        credit: credit,
        tilingScheme: tilingScheme,
        tileWidth: tileWidth,
        tileHeight: tileHeight,
        minimumLevel: minimumLevel,
        maximumLevel: maximumLevel,
        rectangle: rectangle
    });
}
var googlemap2 = createGoogleMapsByUrl(Cesium,{url:"http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}"});
(function () {
    var viewer = new Cesium.Viewer('cesiumContainer');
    viewer.clock.shouldAnimate = true;
    var n1=[
        //出浆0.401
        0.601,925.498, 6.8099,
        0.601,926.498, 6.8099,
        0.601, 933.684 ,6.8099,
        0.5887 ,933.82 ,6.8099,
        0.5535 ,933.948, 6.8099,
        0.4974 ,934.066 ,6.8099,
        0.4226 ,934.172 ,6.8099,
        0.3313 ,934.263, 6.8099,
        0.2255, 934.338 ,6.8099,
        0.1075 ,934.394, 6.8099,
        -0.0206, 934.429 ,6.8099,
        -0.1567 ,934.442, 6.8099,
        -8.594, 934.442 ,6.8099,
        -8.7301, 934.454 ,6.8099,
        -8.8582 ,934.489, 6.8099,
        -8.9762 ,934.545 ,6.8099,
        -9.082 ,934.62 ,6.8099,
        -9.1734 ,934.711 ,6.8099,
        -9.2482, 934.817 ,6.8099,
        -9.3042, 934.935 ,6.8099,
        -9.3395 ,935.063, 6.8099,
        -9.3517, 935.199, 6.8099,
        -9.3521, 940.186 ,6.8099,
        -9.3521, 940.322, 6.7977,
        -9.3521 ,940.45, 6.7624,
        -9.3521 ,940.568, 6.7063,
        -9.3521 ,940.674, 6.6316,
        -9.3522, 940.765, 6.5402,
        -9.3522 ,940.84 ,6.4345,
        -9.3522, 940.896, 6.3164,
        -9.3522 ,940.931, 6.1883,
        -9.3522 ,940.944, 6.0522,
        -9.3522, 940.944, 5.142,
        -9.3522, 942.915, 5.1421,
        -9.3571, 943.162 ,5.1408,
        -9.3571 ,943.282 ,5.1273,
        -9.3571 ,943.377, 5.0893,
        -9.3571 ,943.449 ,5.0309,
        -9.3571 ,943.5, 4.9559,
        -9.3571, 943.529 ,4.8683,
        -9.3571 ,943.537, 4.772,
        -9.3571, 943.527,4.6709,
        -9.3571, 943.498 ,4.569,
        -9.3571 ,943.453 ,4.4703,
        -9.3571, 943.372 ,4.3485,
        -9.3571 ,943.334, 4.2534,
        -9.3571, 943.318, 4.1616,
        -9.3571, 943.322, 4.0751,
        -9.3571, 943.346 ,3.9961,
        -9.3571 ,943.388 ,3.9267,
        -9.3571 ,943.447 ,3.869,
        -9.3571 ,943.522, 3.8251,
        -9.3571, 943.611 ,3.7972,
        -9.3571 ,943.713, 3.7874,
        -9.3571 ,943.962, 3.7875,
        -9.3571, 945.935, 3.7876,
        -9.3451 ,946.068 ,3.7876,
        -9.3107 ,946.193, 3.7876,
        -9.2559, 946.309 ,3.7876,
        -9.1828 ,946.412, 3.7876,
        -9.0935, 946.501,3.7876,
        -8.9901 ,946.574 ,3.7876,
        -8.8747, 946.629 ,3.7876,
        -8.7495 ,946.664 ,3.7876,
        -8.6165, 946.675 ,3.7876,
        -6.2361 ,946.675, 3.7876,
        -6.1029 ,946.687 ,3.7876,
        -5.9775 ,946.722 ,3.7876,
        -5.8619 ,946.777 ,3.7876,
        -5.7584 ,946.85 ,3.7876,
        -5.6688, 946.939 ,3.7876,
        -5.5955, 947.042, 3.7876,
        -5.5403 ,947.158, 3.7876 ,
        -5.5055 ,947.283 ,3.7876,
        -5.4932 ,947.416, 3.7876,
        -5.469, 955.341, 3.7876,
        -5.469 ,955.625 ,3.7805,
        -5.469, 955.925 ,3.7489,
        -5.469 ,956.223 ,3.6965,
        -5.469, 956.516, 3.6234,
        -5.469, 956.816, 3.5258
    ];
    var n2=[
        //出浆0.5015
        -5.4693 ,956.800, 3.5279,
        -5.4692 ,956.802, 3.5279,
        -5.4233, 957.555, 3.2501,
        -5.4233 ,962.203, 1.5294
    ];

    //经纬度转世界坐标                             经度，纬度，高度
    var position = Cesium.Cartesian3.fromDegrees(114.456585,33.264885,0);
    var heading = Cesium.Math.PI * 90 / 180; //标题
    var pitch = 0;      //俯视
    var roll = 0;       //滚动
    //表示为标题，俯仰和滚动的旋转。标题是围绕负z轴的旋转。间距是围绕负y轴的旋转。Roll是围绕正x轴的旋转。
    var hpr = new Cesium.HeadingPitchRoll(heading,pitch,roll);
    //用参考坐标系计算四元数，坐标轴以所提供原点为中心的航向 - 俯仰 - 滚转角计算。
    // 标题是从正北角向东增加的局部北方的旋转。沥青是从当地东 - 北飞机的旋转。正俯仰角在平面之上。
    // 负桨距角低于平面。滚动是关于当地东方轴线应用的第一个旋转。
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position,hpr);
    var mat = new Cesium.Matrix4();
    var rotateMat = new Cesium.Matrix3();
    //从提供的四元数计算3x3旋转矩阵。
    Cesium.Matrix3.fromQuaternion(orientation,rotateMat);
    //从表示旋转的Matrix3和表示翻译的Cartesian3计算Matrix4实例。
    Cesium.Matrix4.fromRotationTranslation(rotateMat,position,mat);

    var newary0=[];
    var localtPos ;
    var worldPos;
    for (var i=0;i<n1.length;i+=3)
    {
        localtPos = new Cesium.Cartesian3(n1[i],n1[i+1],n1[i+2]);
        worldPos = Cesium.Matrix4.multiplyByPoint(mat,localtPos,new Cesium.Cartesian3());
        newary0.push(worldPos);
    }
    var newary1=[];
    for (i=0;i<n2.length;i+=3)
    {
        localtPos = new Cesium.Cartesian3(n2[i],n2[i+1],n2[i+2]);
        worldPos = Cesium.Matrix4.multiplyByPoint(mat,localtPos,new Cesium.Cartesian3());
        newary1.push(worldPos);
    }

    function computeCircle(radius) {
        var positions = [];
        var radians ;
        for (var i = 0; i <= 24; i++) {
            radians = Cesium.Math.toRadians(i*15);
            positions.push(new Cesium.Cartesian2(radius * Math.cos(radians),radius * Math.sin(radians)));
        }
        //套管
        for(i =24;i>=0;i--)
        {
            radians  = Cesium.Math.toRadians(i*15);
            positions.push(new Cesium.Cartesian2(radius *0.7* Math.cos(radians),radius *0.7* Math.sin(radians)));
        }

        return positions;
    }
    var startTime0 = Cesium.JulianDate.now();
    var startTime1;
    var lable1;
    var hasCreateLable1 = 0;
    var lable= viewer.entities.add({
        polylineVolume : {
            positions :  new Cesium.CallbackProperty(getPath, false),
            shape : computeCircle(0.4)
        }
    });
////////////////////////////////////////////////
    //流速 2.0 m/s
    var flowVelocity = 2.0;
    //总长度
    var totalLen0 = 0;
    var timePassedArray0 = [];
    timePassedArray0.push(0);
    for (i = 0; i < newary0.length - 1; i++) {
        var pt0 = newary0[i];
        var pt1 = newary0[i+1];
        var d = Cesium.Cartesian3.distance(pt0,pt1);
        totalLen0 += d;
        //
        var timePass = totalLen0 / flowVelocity;
        timePassedArray0.push(timePass);
    }
    //
    var totalSimuTimeSec0 = timePassedArray0[timePassedArray0.length - 1];
    function getPath(time, result) {
        var newPositions=[];
        var tempPt = newary0[0];
        newPositions.push(tempPt.clone());
        var i;
        //
        var timePassedSec = Cesium.JulianDate.secondsDifference(time, startTime0);
        if (timePassedSec >= totalSimuTimeSec0)
        {
            for (i = 0; i < newary0.length; i++) {
                tempPt = newary0[i];
                newPositions.push(tempPt.clone());
            }
            //
            if (hasCreateLable1 === 0)
            {
                startTime1 = time.clone();
                hasCreateLable1 = 1;
                lable1 = viewer.entities.add({
                    polylineVolume : {
                        positions :  new Cesium.CallbackProperty(getPath1, false),
                        shape : computeCircle(0.4)
                    }
                });
            }
        }
        else {
            var tempIndex;//tempIndex 肯定大于0
            for (tempIndex = 0; tempIndex < timePassedArray0.length; ++tempIndex) {
                if (timePassedArray0[tempIndex] >= timePassedSec)
                {
                    break;
                }
            }
            for (i = 1; i < tempIndex; i++) {
                tempPt = newary0[i];
                newPositions.push(tempPt.clone());
            }
            //
            if (timePassedArray0[tempIndex] === timePassedSec) {
                tempPt = newary0[tempIndex];
                newPositions.push(tempPt.clone());
            }
            else
            {
                //timePassedArray[tempIndex] > timePassedSec
                var time0 = timePassedArray0[tempIndex-1];
                var time1 = timePassedArray0[tempIndex];
                var deltaTime = time1 - time0;
                var t = (timePassedSec - time0) / deltaTime;

                var pt0 =  newPositions[tempIndex-1];
                var pt1 = newary0[tempIndex];
                var  newPt = new Cesium.Cartesian3();
                Cesium.Cartesian3.lerp(pt0,pt1,t ,newPt);
                newPositions.push(newPt);
            }
        }
        return newPositions;
    }
////////////////////////////////////////////////
    var totalLen1 = 0;
    var timePassedArray1 = [];
    timePassedArray1.push(0);
    for (i = 0; i < newary1.length - 1; i++) {
        var pt0 = newary1[i];
        var pt1 = newary1[i+1];
        var d = Cesium.Cartesian3.distance(pt0,pt1);
        totalLen1 += d;
        //
        var timePass1 = totalLen1 / flowVelocity;
        timePassedArray1.push(timePass1);
    }
    var totalSimuTimeSec1 = timePassedArray1[timePassedArray1.length - 1];
    function getPath1(time, result) {
        var newPositions=[];
        var tempPt = newary1[0];
        newPositions.push(tempPt.clone());
        var i;
        //
        var timePassedSec = Cesium.JulianDate.secondsDifference(time, startTime1);
        if (timePassedSec >= totalSimuTimeSec1)
        {
            for (i = 0; i < newary1.length; i++) {
                tempPt = newary1[i];
                newPositions.push(tempPt.clone());
            }
        }
        else {
            var tempIndex;//tempIndex 肯定大于0
            for (tempIndex = 0; tempIndex < timePassedArray1.length; ++tempIndex) {
                if (timePassedArray1[tempIndex] >= timePassedSec)
                {
                    break;
                }
            }
            for (i = 1; i < tempIndex; i++) {
                tempPt = newary1[i];
                newPositions.push(tempPt.clone());
            }
            //
            if (timePassedArray1[tempIndex] === timePassedSec) {
                tempPt = newary1[tempIndex];
                newPositions.push(tempPt.clone());
            }
            else
            {
                //timePassedArray[tempIndex] > timePassedSec
                var time0 = timePassedArray1[tempIndex-1];
                var time1 = timePassedArray1[tempIndex];
                var deltaTime = time1 - time0;
                var t = (timePassedSec - time0) / deltaTime;

                var pt0 =  newPositions[tempIndex-1];
                var pt1 = newary1[tempIndex];
                var  newPt = new Cesium.Cartesian3();
                Cesium.Cartesian3.lerp(pt0,pt1,t ,newPt);
                newPositions.push(newPt);
            }
        }
        return newPositions;
    }
///
    viewer.zoomTo(lable);

}());