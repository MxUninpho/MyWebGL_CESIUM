function createGoogleMapsByUrl(Cesium,options) {
    options = Cesium.defaultValue(options, {});

    var templateUrl = Cesium.defaultValue(options.url, 'http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}');

    var trailingSlashRegex = /\/$/;
    var defaultCredit = new Cesium.Credit('Google Maps');

    var tilingScheme = new Cesium.WebMercatorTilingScheme({ ellipsoid : options.ellipsoid });

    var tileWidth = 256;
    var tileHeight = 256;

    var minimumLevel = Cesium.defaultValue(options.minimumLevel, 0);
    var maximumLevel = Cesium.defaultValue(options.minimumLevel, 19);

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
//顶层变量数据对象
var BMGolbe = {};
//谷歌影像地图---不带注记
BMGolbe.GoogleImageProvider = createGoogleMapsByUrl(Cesium,{url:"http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}"});
//Mapbox矢量地图---带注记---默认
BMGolbe.MapboxMapProvider = new Cesium.MapboxImageryProvider({
    mapId: 'mapbox.streets'
});
//天地图矢量地图---不带注记
BMGolbe.TianDiTuMapProvider = new Cesium.WebMapTileServiceImageryProvider({
    url : 'http://{s}.tianditu.com/vec_w/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=vec&style=default&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles',
    layer: "vec",
    style: "default",
    format: "tiles",
    tileMatrixSetID: "w",
    maximumLevel: 18,
    subdomains : ['t0','t1','t2','t3','t4','t5','t6','t7']
});
//天地图影像注记图层
BMGolbe.ImageLabelTianDiTuProvider = new Cesium.WebMapTileServiceImageryProvider({
        url : 'http://{s}.tianditu.com/cia_w/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=cia&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles',
        layer : 'cia',
        style : 'default',
        format : 'tiles',
        maximumLevel: 18,
        tileMatrixSetID : 'w',
        subdomains : ['t0','t1','t2','t3','t4','t5','t6','t7']
    });
//天地图矢量注记图层
BMGolbe.MapLabelTianDiTuProvider = new Cesium.WebMapTileServiceImageryProvider({
    url : 'http://{s}.tianditu.com/cva_w/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=cva&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles',
    layer : 'cva',
    style : 'default',
    format : 'tiles',
    maximumLevel: 18,
    tileMatrixSetID : 'w',
    subdomains : ['t0','t1','t2','t3','t4','t5','t6','t7']
});
//影像图层---默认为 BMGolbe.MapboxMapProvider
BMGolbe.ImageLayer = undefined;
//注记图层---默认为 空
BMGolbe.LabelLayer = undefined;
//cesium viewer 对象
BMGolbe.viewer = undefined;
//3DTiles集合
BMGolbe.BMTileSets = [];
//鼠标单击 选择的3DTile feature
BMGolbe.SelectTileFeature = undefined;
//HomeView 矩形
BMGolbe.HomeViewRectangle = undefined;
//FlyRectangle 矩形
BMGolbe.FlyRectangle = new Cesium.Rectangle();
//FlyBoundingSphere 包围球
BMGolbe.FlyBoundingSphere = new Cesium.BoundingSphere();
//在线全球高程数据
BMGolbe.GlobalTerrain = Cesium.createWorldTerrain({
    requestWaterMask: true,
    requestVertexNormals: true
});
//简单椭球高程
BMGolbe.SimpleEllipsoidTerrain = new Cesium.EllipsoidTerrainProvider();
//场景选中3DTileSet node 事件
BMGolbe.Select3DTileNodeEvent = new Cesium.Event();
//场景取消选中3DTileSet node 事件
BMGolbe.UnSelect3DTileNodeEvent = new Cesium.Event();
//取消 高亮事件
BMGolbe.UnHighlightEvent = new Cesium.Event();
//选中颜色
BMGolbe.SelectColor = new Cesium.Color(1.0,0.0,0.0,1.0);
//漫游Entity
BMGolbe.RoamingPositionProperty = undefined;
BMGolbe.IsRoaming = false;
BMGolbe.RoamingLineEntity = undefined;
BMGolbe.RoamingLineVisible = false;
BMGolbe.RoamingLineMaterialGlow = new Cesium.PolylineGlowMaterialProperty({ glowPower : 0.5,color : Cesium.Color.PALETURQUOISE });
BMGolbe.RoamingPositionOffset = 0.0;
BMGolbe.RoamingEyeOffsetAngle = 0.0;
//图片标签根节点
BMGolbe.ImageLabelRoot = new Cesium.Entity();
BMGolbe.ImageLabelEntites = [];
BMGolbe.ClickImageLabelEvent = new Cesium.Event();
//文字标签根节点
BMGolbe.TextLabelRoot = new Cesium.Entity();
BMGolbe.TextLabelEntites = [];
BMGolbe.ClickTextLabelEvent = new Cesium.Event();
BMGolbe.LabelPixelOffset = new Cesium.Cartesian2(0,-5);
//DIV标签
BMGolbe.DIVLabelIDs = [];
BMGolbe.DIVLabelPoss = [];
BMGolbe.BMGISRootDOM = undefined;
BMGolbe.GlintLabels = [];//闪烁的Div标签
BMGolbe.BeginGlintDate = new Date();
BMGolbe.Duration = 2000;
BMGolbe.GlintColor = new Cesium.Color(1.0,0,0);
//cesium操作器
BMGolbe.PreventRotatUnderGoundHandler = undefined;//防止旋转至地下 操作器----默认打开
BMGolbe.SelectHander = undefined;//选择 操作器-----默认打开
BMGolbe.MeasurePointCoordinateHander = undefined;//点坐标测量 操作器
BMGolbe.HanderType = 0;//操作类型  0选择 1坐标测量 2多线测量 3面积测量 4垂直距离测量
BMGolbe.MeasureMultiLineLengthHander = undefined;//多段线长度测量 操作器
BMGolbe.MeasureAreaHander = undefined;//面积测量 操作器
BMGolbe.MeasureVerticalDistanceHander = undefined;//垂直距离测量 操作器 
BMGolbe.CanvasContainerElement = undefined;//Canvas DIV 设置光标用

//
BMGolbe.scratchCartesianPt = new Cesium.Cartesian3(0, 0,0);
BMGolbe.scratchCartesian2Pt = new Cesium.Cartesian2();
BMGolbe.scratchCartographicPt = new Cesium.Cartographic(0, 0,0);
//
function createModel(url, height) {
    //viewer.entities.removeAll();
    var position = Cesium.Cartesian3.fromDegrees(104.05898094177246, 30.435991287231445, 453.517914);
    var heading = Cesium.Math.toRadians(0);
    var pitch = 0;
    var roll = 0;
    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
    var entity = viewer.entities.add({
        name : url,
        position : position,
        orientation : orientation,
        model : {
            uri : url,
            maximumScale : 200
        }
    });
    viewer.zoomTo(entity);
}
/**   初始化
* @param {String} container DOM DIV ID
* @param {Object} [options] 配置选项
* @param {String} [options.BIMMode3DTileURL] BIM模型3DTile URL
* @param {String} [options.Terrain3DTileURL] 地形模型3DTile URL
* @param {Boolean} [options.UseOnLineGlobalTerrain = false] 使用默认在线全球地形数据---若提供Terrain3DTileURL 则不建议使用全球地形
* @param {Number} [options.HomeView_West = 73.916] HOME视图范围 默认中国境内 
* @param {Number} [options.HomeView_South = 15.336] HOME视图范围 默认中国境内
* @param {Number} [options.HomeView_East = 128.056] HOME视图范围 默认中国境内 
* @param {Number} [options.HomeView_North = 49.746] HOME视图范围 默认中国境内 
*/
function BMInit(container,options)
{
    BMGolbe.viewer = new Cesium.Viewer(container, {
        timeline:false,
        animation:false,
        navigation:true,
        fullscreenButton:false,
        navigationHelpButton:false,
        baseLayerPicker: false,
        homeButton:false,
        infoBox:false,
        sceneModePicker:false,
        geocoder:false
    });
    //
    BMGolbe.HomeViewRectangle = Cesium.Rectangle.fromDegrees(options.HomeView_West, options.HomeView_South, options.HomeView_East, options.HomeView_North);
    BMGolbe.viewer.extend(Cesium.viewerCesiumNavigationMixin, {defaultResetView:BMGolbe.HomeViewRectangle});
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE  = BMGolbe.HomeViewRectangle;
    BMGolbe.viewer.scene.camera.flyTo({
        destination : BMGolbe.HomeViewRectangle
    });
    //BMGolbe.viewer.scene.sun.show = false;
    
    //
    var imageryLayers = BMGolbe.viewer.imageryLayers;
    BMGolbe.viewer.scene.globe.depthTestAgainstTerrain = false;
   
    BMGolbe.ImageLayer = imageryLayers.addImageryProvider(BMGolbe.MapboxMapProvider,1);
    //
    BMGolbe.viewer.scene.camera._suspendTerrainAdjustment = false;
    BMGolbe.viewer.cesiumWidget.creditContainer.style.display= "none";
    //
    BMGolbe.viewer.entities.add(BMGolbe.ImageLabelRoot);
    BMGolbe.viewer.entities.add(BMGolbe.TextLabelRoot);
    //
    if(options.BIMMode3DTileURL !== "")
    {
        var tileset = BMGolbe.viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
            url: options.BIMMode3DTileURL
         }));
         tileset.maximumScreenSpaceError = 200;
         tileset.pullingHeight = 0.0;
         tileset.originURL = options.BIMMode3DTileURL;
         BMGolbe.BMTileSets.push(tileset);
         BMGolbe.viewer.zoomTo(tileset);
         Set3DTileSetSelectVariables(tileset);
         Set3DTileSetTileVisibleAndTileUnloadEvent(tileset);
    }
    if(options.Terrain3DTileURL !== "")
    {
         var tilesetT = BMGolbe.viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
            url: options.Terrain3DTileURL
         }));
         tilesetT.pullingHeight = 0.0;
         tilesetT.maximumScreenSpaceError = 300;
         tilesetT.originURL = options.Terrain3DTileURL;
         BMGolbe.BMTileSets.push(tilesetT);
         Set3DTileSetSelectVariables(tilesetT);
         BMGolbe.viewer.zoomTo(tilesetT);
    }
    if(options.UseOnLineGlobalTerrain)
    {
        BMGolbe.viewer.terrainProvider = BMGolbe.GlobalTerrain;
        BMGolbe.viewer.scene.globe.enableLighting = true;
    }
    else
    {
        BMGolbe.viewer.terrainProvider = BMGolbe.SimpleEllipsoidTerrain;
    }
    //
    var rootDOM = document.getElementById(container);
    var lonEle = document.createElement('div');
    lonEle.innerHTML = '经度：<span id="longitude_show"></span>';
    lonEle.style.cssText = "color:Yellow;width:200px;height:30px;float:left;left:25%;bottom:0.5%;position:absolute;z-index:2"; 
    var latEle = document.createElement('div');
    latEle.innerHTML = '纬度：<span id="latitude_show"></span>';
    latEle.style.cssText = "color:Yellow;width:200px;height:30px;float:left;left:40%;bottom:0.5%;position:absolute;z-index:2"; 
    var altEle = document.createElement('div');
    altEle.innerHTML = '视角高：<span id="altitude_show"></span>';
    altEle.style.cssText = "color:Yellow;width:240px;height:30px;float:left;left:55%;bottom:0.5%;position:absolute;z-index:2"; 
    rootDOM.appendChild(lonEle);
    rootDOM.appendChild(latEle);
    rootDOM.appendChild(altEle);
    BMGolbe.BMGISRootDOM =rootDOM; 
    //
    var longitude_show=document.getElementById('longitude_show');
    var latitude_show=document.getElementById('latitude_show');
    var altitude_show=document.getElementById('altitude_show');
    var canvas=BMGolbe.viewer.scene.canvas;
    var ellipsoid=BMGolbe.viewer.scene.globe.ellipsoid;
    //鼠标移动显示 鼠标位置与相机高度
    BMGolbe.viewer.screenSpaceEventHandler.setInputAction(function(movement){
        var cartesian=BMGolbe.viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid,BMGolbe.scratchCartesianPt);
        if(cartesian)
        {   
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var lat_String=Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);
            var log_String=Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);
            var alti_String=(BMGolbe.viewer.camera.positionCartographic.height/1000).toFixed(3);
            longitude_show.innerHTML=log_String + '\u00B0';
            latitude_show.innerHTML=lat_String + '\u00B0';
            altitude_show.innerHTML=alti_String + 'km';
        }
    },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    BMGolbe.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    BMGolbe.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    ////////////////////////////////////////////
    var preventRotatUnderGoundhandler = new Cesium.ScreenSpaceEventHandler(canvas);
    BMGolbe.PreventRotatUnderGoundHandler = preventRotatUnderGoundhandler;
    //防止旋转到地下---
    BMGolbe.viewer.scene.screenSpaceCameraController.minimumZoomDistance=1;
    BMGolbe.viewer.clock.onTick.addEventListener(function () {
        if(BMGolbe.viewer.camera.pitch > 0){
            BMGolbe.viewer.scene.screenSpaceCameraController.enableTilt = false;
        }
    }); 
    var startMousePosition;
    var mousePosition;
    preventRotatUnderGoundhandler.setInputAction(function(movement) {	
        mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
        preventRotatUnderGoundhandler.setInputAction(function(movement) {
            mousePosition = movement.endPosition;
            var y = mousePosition.y - startMousePosition.y;
            if(y>0){
                BMGolbe.viewer.scene.screenSpaceCameraController.enableTilt = true;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);  
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    preventRotatUnderGoundhandler.setInputAction(function(movement) {
        preventRotatUnderGoundhandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }, Cesium.ScreenSpaceEventType.MIDDLE_UP);
    
    //选择
    var selectHandler = new Cesium.ScreenSpaceEventHandler(canvas);
    BMGolbe.SelectHander = selectHandler;
    selectHandler.setInputAction(function onLeftClick(movement) {
        if(BMGolbe.HanderType == 0)
        {
            var pickedFeature = BMGolbe.viewer.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) 
            {
                UnSelectAll3DTileSetSelectNodes();
                return;
            }
            //
            if (pickedFeature instanceof Cesium.Cesium3DTileFeature) 
            {
                if(pickedFeature.tileset.asset.id === "terrain")
                {
                    UnSelectAll3DTileSetSelectNodes();
                    return;
                }
                if(BMGolbe.SelectTileFeature !== pickedFeature)
                {
                    UnSelectAll3DTileSetSelectNodes();
                    //
                    BMGolbe.SelectTileFeature = pickedFeature;
                    pickedFeature.color =  BMGolbe.SelectColor;
                    //此处不能将 选中的Feature的Tile添加至TileSet的SelectedTiles数组中
                    var tile = pickedFeature.content.tile;
                    if(!Cesium.defined(tile.SelectedFeatures)) tile.SelectedFeatures = [];
                    tile.SelectedFeatures.push(pickedFeature);
                    //
                    var guid = pickedFeature.getProperty('name'); 
                    var url = tile.tileset.originURL;
                    BMGolbe.Select3DTileNodeEvent.raiseEvent(url + ':'+guid);
                }
            }
            else if(pickedFeature.id instanceof Cesium.Entity)
            {
                var index = GetArrayElementIndex(BMGolbe.TextLabelEntites,pickedFeature.id);
                if(index !== -1)
                    BMGolbe.ClickTextLabelEvent.raiseEvent(pickedFeature.id.id);
                else
                {
                    index = GetArrayElementIndex(BMGolbe.ImageLabelEntites,pickedFeature.id);
                    if(index !== -1)
                        BMGolbe.ClickImageLabelEvent.raiseEvent(pickedFeature.id.id);
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //
    //漫游实现
    var _scratchNextTime = new Cesium.JulianDate();
    var _scratchCurPt = new Cesium.Cartesian3(0, 0,0);
    var _scratchNexPt = new Cesium.Cartesian3(0, 0,0);
    var _scratchDirection = new Cesium.Cartesian3(0, 0,0);
    var _scratchUp = new Cesium.Cartesian3(0,0,0);
    BMGolbe.viewer.clock.onTick.addEventListener(function(clock) {
        var camera = BMGolbe.viewer.camera;
        var ellipsoid = BMGolbe.viewer.scene.globe.ellipsoid; 
        if (BMGolbe.IsRoaming && BMGolbe.RoamingPositionProperty) 
        {
            var currentTime = clock.currentTime;
            var startTime = clock.startTime;
            var stopTime = clock.stopTime;
            var nextTime = Cesium.JulianDate.addSeconds(currentTime,1,_scratchNextTime);
            if(Cesium.JulianDate.greaterThanOrEquals(nextTime,stopTime))
                nextTime = startTime;
            //
            var currentPosition = BMGolbe.RoamingPositionProperty.getValue(currentTime,_scratchCurPt);
            var nextPosition = BMGolbe.RoamingPositionProperty.getValue(nextTime,_scratchNexPt);
            _scratchDirection = Cesium.Cartesian3.subtract(nextPosition,currentPosition,_scratchDirection);
            _scratchDirection = Cesium.Cartesian3.normalize(_scratchDirection,_scratchDirection);
            _scratchUp = ellipsoid.geocentricSurfaceNormal(currentPosition,_scratchUp);
            //
            if(BMGolbe.RoamingPositionOffset !== 0.0)
            {
                Cesium.Cartographic.fromCartesian(currentPosition,Cesium.Ellipsoid.WGS84,BMGolbe.scratchCartographicPt);
                BMGolbe.scratchCartographicPt.height += BMGolbe.RoamingPositionOffset;
                Cesium.Cartesian3.fromRadians(BMGolbe.scratchCartographicPt.longitude,BMGolbe.scratchCartographicPt.latitude,BMGolbe.scratchCartographicPt.height,Cesium.Ellipsoid.WGS84,currentPosition);
            }
            //
            camera.position = currentPosition; 
            camera.direction =  _scratchDirection;
            camera.up = _scratchUp;
            //
            if(BMGolbe.RoamingEyeOffsetAngle !== 0.0)
            {
                camera.lookUp(Cesium.Math.toRadians(BMGolbe.RoamingEyeOffsetAngle));
            }
        }
    });
    //更新DIV标签位置
    var i = 0;
    BMGolbe.viewer.scene.preRender.addEventListener(function() {
        var rootTop = BMGolbe.BMGISRootDOM.offsetTop+document.body.scrollTop;
        var rootLeft = BMGolbe.BMGISRootDOM.offsetLeft;
        for(i=0;i<BMGolbe.DIVLabelIDs.length;++i)
        {
            var DIVPosition = BMGolbe.DIVLabelPoss[i];
            var DIVID = BMGolbe.DIVLabelIDs[i];
            var htmlOverlay = document.getElementById(DIVID);
            if (Cesium.defined(htmlOverlay))
            {
                var canvasPosition = BMGolbe.viewer.scene.cartesianToCanvasCoordinates(DIVPosition, BMGolbe.scratchCartesian2Pt);
                if (Cesium.defined(canvasPosition)) 
                {
                    htmlOverlay.style.top = canvasPosition.y + rootTop+ 'px';
                    htmlOverlay.style.left = canvasPosition.x + rootLeft+ 'px';
                }
            }
        }
    });
    //闪烁场景标签
    BMGolbe.viewer.scene.preRender.addEventListener(function() {
        if (BMGolbe.GlintLabels.length > 0)
        {
            var cTime = (new Date()).getTime();
            var sTime = BMGolbe.BeginGlintDate.getTime();
            var dTime = cTime -sTime;
            if(dTime <=  BMGolbe.Duration)
            {
                dTime %= 500;
                BMGolbe.GlintColor.red = 1;
                BMGolbe.GlintColor.green = Math.sin(dTime);
                for(i=0;i<BMGolbe.GlintLabels.length;++i)
                {
                    var fEntity = BMGolbe.GlintLabels[i];
                    if(Cesium.defined(fEntity.label))
                    {
                        fEntity.label.fillColor = BMGolbe.GlintColor;
                    }
                    else
                    {
                        fEntity.billboard.color = BMGolbe.GlintColor;
                    }  
                }
            }
            else
            {
                for(;i<BMGolbe.GlintLabels.length;++i)
                {
                    var findEntity =  BMGolbe.GlintLabels[i];
                    if(Cesium.defined(findEntity.label))
                    {
                        findEntity.label.fillColor = findEntity.oldColor;
                    }
                    else
                    {
                        findEntity.billboard.color = findEntity.oldColor;
                    }
                }
                BMGolbe.GlintLabels.splice(0,BMGolbe.GlintLabels.length);
            }      
        }
    });
    //获取CanvasContainerDIV,classname = 'cesium-widget'
    BMGolbe.CanvasContainerElement = BMGolbe.viewer.container.getElementsByTagName('div')[0].getElementsByTagName('div')[0].getElementsByTagName('div')[0];
    //
    BMSetOperateHanderType(0);
    InitMeasurePointCoordinateHander();
    InitMeasureMultiLineLengthHander();
}
/** 调整3DTile 高度
 * @Fuction
 *
 * @param {String} tileURL 3Dtile URL
 * @param {Number} pullingHeight 拉伸高度
 */
function BMPulling3DTileHeight(tileURL,pullingHeight) {

    pullingHeight = Number(pullingHeight);
    if (isNaN(pullingHeight)) {
        return;
    }
    var cartographic;
    var tempTile;
    var surface;
    var offset;
    var translation;
    if(tileURL === ""){
        for(var i=0;i<BMGolbe.BMTileSets.length;++i)
        {
            tempTile = BMGolbe.BMTileSets[i];
            if (tempTile.asset.id !== "terrain")
            {
                cartographic = Cesium.Cartographic.fromCartesian(tempTile.boundingSphere.center);
                surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
                offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, pullingHeight);
                translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
                tempTile.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
                tempTile.pullingHeight = pullingHeight;
            }
        }
    }
    else
    {
        tempTile = Get3DTileSetByURL(tileURL);
        if(tempTile !== undefined){
            cartographic = Cesium.Cartographic.fromCartesian(tempTile.boundingSphere.center);
            surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
            offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, pullingHeight);
            translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
            tempTile.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
            tempTile.pullingHeight = pullingHeight;
        }
    } 
}
/** 添加3DTile
 * @Fuction
 *
 * @param {String} tileURL 3Dtile URL
 * @param {Boolean} NeedZoomTo 是否缩放至此
 */
function BMAdd3DTile(tileURL,NeedZoomTo) {
    var findTile = Get3DTileSetByURL(tileURL);
    if(Cesium.defined(findTile))
        return;
    //
    var tileset = BMGolbe.viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: tileURL
     }));
     tileset.maximumScreenSpaceError = 200;
     tileset.pullingHeight = 0.0;
     tileset.originURL = tileURL;
     BMGolbe.BMTileSets.push(tileset);
     if(NeedZoomTo)
        BMGolbe.viewer.zoomTo(tileset);
    //
    Set3DTileSetSelectVariables(tileset);
    Set3DTileSetTileVisibleAndTileUnloadEvent(tileset);
}
/** 移除3DTile
 * @Fuction
 *
 * @param {String} tileURL 3Dtile URL
 */
function BMRemove3DTile(tileURL) {

    var index = 0;
    var findTile = Get3DTileSetByURL(tileURL,index);
    if(!Cesium.defined(findTile))
        return;
    //
    if (Cesium.defined(BMGolbe.SelectTileFeature) && BMGolbe.SelectTileFeature.tileset === findTile) 
    {
        var guid = BMGolbe.SelectTileFeature.getProperty('name'); 
        var url = findTile.originURL;
        BMGolbe.UnSelect3DTileNodeEvent.raiseEvent(url + ':' + guid);
        BMGolbe.SelectTileFeature = undefined;
    }
    //
    if(findTile.SelectedTiles.length !== 0)
    {
        BMGolbe.UnHighlightEvent.raiseEvent();
    }
    //
    BMGolbe.viewer.scene.primitives.remove(findTile);
    BMGolbe.BMTileSets.splice(index,1);
}
/** 显示\隐藏3DTile
 * @Fuction
 *
 * @param {String} tileURL 3Dtile URL
 * @param {Boolean} visible 是否可见 
 */
function BMVisible3DTile(tileURL,visible) {

    var index = 0;
    var findTile = Get3DTileSetByURL(tileURL,index);
    if(!Cesium.defined(findTile))
        return;
    //
    findTile.show = visible;
}
/** 设置homeView
 * @Fuction
 * @param {Number} HomeView_West = 73.916 HOME视图范围 默认中国境内 
 * @param {Number} HomeView_South = 15.336 HOME视图范围 默认中国境内
 * @param {Number} HomeView_East = 128.056 HOME视图范围 默认中国境内 
 * @param {Number} HomeView_North = 49.746 HOME视图范围 默认中国境内  
 * @param {Boolean} NeedFlyTo = false 是否缩放至此
 */
function BMSetHomeView(HomeView_West,HomeView_South,HomeView_East,HomeView_North,NeedFlyTo) {

    BMGolbe.HomeViewRectangle.west = Cesium.Math.toRadians(HomeView_West);
    BMGolbe.HomeViewRectangle.south = Cesium.Math.toRadians(HomeView_South);
    BMGolbe.HomeViewRectangle.east = Cesium.Math.toRadians(HomeView_East);
    BMGolbe.HomeViewRectangle.north = Cesium.Math.toRadians(HomeView_North);
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = BMGolbe.HomeViewRectangle;
    if(NeedFlyTo)
    {
        BMGolbe.viewer.scene.camera.flyTo({
            destination : BMGolbe.HomeViewRectangle
        });
    }
}
/** 缩放至矩形范围
 * @Fuction
 * @param {Number} Rectangle_West = 73.916  经度（°）默认中国境内 
 * @param {Number} Rectangle_South = 15.336 纬度（°）默认中国境内
 * @param {Number} Rectangle_East = 128.056 经度（°）默认中国境内 
 * @param {Number} Rectangle_North = 49.746 纬度（°）默认中国境内  
 */
function BMFlyToRectangle(Rectangle_West,Rectangle_South,Rectangle_East,Rectangle_North) {

    BMGolbe.FlyRectangle.west = Cesium.Math.toRadians(Rectangle_West);
    BMGolbe.FlyRectangle.south = Cesium.Math.toRadians(Rectangle_South);
    BMGolbe.FlyRectangle.east = Cesium.Math.toRadians(Rectangle_East);
    BMGolbe.FlyRectangle.north = Cesium.Math.toRadians(Rectangle_North);
    //
    BMGolbe.viewer.scene.camera.flyTo({
        destination : BMGolbe.FlyRectangle
    });
}
/** 缩放至包围球范围
 * @Fuction
 * @param {Number} Sphere_longitude = 113.2599  经度（°） 
 * @param {Number} Sphere_latitude = 23.1324  纬度（°）
 * @param {Number} Sphere_height = 100 高度（m）
 * @param {Number} Sphere_radius = 5000  半径（m）  
 */
function BMFlyToBoundingSphere(Sphere_longitude,Sphere_latitude,Sphere_height,Sphere_radius) {

    Cesium.Cartesian3.fromDegrees(Sphere_longitude,Sphere_latitude,Sphere_height,Cesium.Ellipsoid.WGS84,BMGolbe.FlyBoundingSphere.center);
    BMGolbe.FlyBoundingSphere.radius = Sphere_radius;
    //
    BMGolbe.viewer.camera.flyToBoundingSphere(BMGolbe.FlyBoundingSphere);
}
/** 缩放至3DTile
 * @Fuction
 * @param {String} tileURL 3Dtile URL  
 */
function BMFlyTo3DTile(tileURL) {

    var index = 0;
    var findTile = Get3DTileSetByURL(tileURL,index);
    if(!Cesium.defined(findTile))
        return;
    //
    BMGolbe.viewer.zoomTo(findTile);
}
/** 缩放至3DTile 节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Number} tileNode_centerX 数据库中获取
 * @param {Number} tileNode_centerY 数据库中获取
 * @param {Number} tileNode_centerZ 数据库中获取
 * @param {Number} tileNode_radius 数据库中获取   
 */
function BMFlyTo3DTileNode(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius) {

    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile)) 
    {
        BMGolbe.FlyBoundingSphere.center.x = tileNode_centerX;
        BMGolbe.FlyBoundingSphere.center.y = tileNode_centerY;
        BMGolbe.FlyBoundingSphere.center.z = tileNode_centerZ;
        BMGolbe.FlyBoundingSphere.radius = tileNode_radius;
    }
    else
    {
        BMGolbe.scratchCartesianPt.x = tileNode_centerX;
        BMGolbe.scratchCartesianPt.y = tileNode_centerY;
        BMGolbe.scratchCartesianPt.z = tileNode_centerZ;
       
        Cesium.Cartographic.fromCartesian(BMGolbe.scratchCartesianPt,Cesium.Ellipsoid.WGS84,BMGolbe.scratchCartographicPt);
        BMGolbe.scratchCartographicPt.height += findTile.pullingHeight;
       
        Cesium.Cartesian3.fromRadians(BMGolbe.scratchCartographicPt.longitude,BMGolbe.scratchCartographicPt.latitude,BMGolbe.scratchCartographicPt.height,Cesium.Ellipsoid.WGS84,BMGolbe.scratchCartesianPt);
        //
        BMGolbe.FlyBoundingSphere.center = BMGolbe.scratchCartesianPt;
        BMGolbe.FlyBoundingSphere.radius = tileNode_radius;
    }
    
    //
    BMGolbe.viewer.camera.flyToBoundingSphere(BMGolbe.FlyBoundingSphere);
}
/** 缩放至3DTile节点 并高亮节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Number} tileNode_centerX 数据库中获取
 * @param {Number} tileNode_centerY 数据库中获取
 * @param {Number} tileNode_centerZ 数据库中获取
 * @param {Number} tileNode_radius 数据库中获取   
 * @param {String[]} tileNode_GUIDs 数据库中获取---数组---  
 */
function BMFlyTo3DTileNodeAddHighlight(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius,tileNode_GUIDs) {

    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile)) return;
    //
    BMFlyTo3DTileNode(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius);
    //
    UnSelectAll3DTileSetSelectNodes();
    //添加需要选中的GUID至 数组
    for(var i=0;i<tileNode_GUIDs.length;++i)
    {
        findTile.NeedAddToSelectFeatureIDs.push(tileNode_GUIDs[i]);
    }
}
/** 开启\关闭 在线全球高程
 * @Fuction
 * @param {Boolean} UseOnLineGlobalTerrain = false 
 */
function BMUseGlobalTerrain(UseOnLineGlobalTerrain) {

    if(UseOnLineGlobalTerrain){
        BMGolbe.viewer.terrainProvider = BMGolbe.GlobalTerrain;
        BMGolbe.viewer.scene.globe.enableLighting = true;
    }else{
        BMGolbe.viewer.terrainProvider = BMGolbe.SimpleEllipsoidTerrain;
        BMGolbe.viewer.scene.globe.enableLighting = false;
    }
}
/** 开启\关闭 地形深度测试
 * @Fuction
 * @param {Boolean} depthTest = false 
 */
function BMDepthTestAgainstTerrain(depthTest) {

    BMGolbe.viewer.scene.globe.depthTestAgainstTerrain = depthTest;
}
/** 设置鼠标单击选中3DTile事件回调函数
 * @Fuction
 * @param {Function} listener
 */
function BMGSetMouseLeftClickSelect3DTileNodeEventListener(listener) {

    BMGolbe.Select3DTileNodeEvent.addEventListener(listener);
}
/** 设置鼠标单击 取消选中3DTile事件回调函数
 * @Fuction
 * @param {Function} listener 
 */
function BMSetMouseLeftClickUnSelect3DTileNodeEventListener(listener) {

    BMGolbe.UnSelect3DTileNodeEvent.addEventListener(listener);
}
/** 设置 取消高亮 事件回调 ---注意与 BMGIS_SetMouseLeftClickUnSelect3DTileNodeEventListener 区别
 * @Fuction
 * @param {Function} listener  ---无 函数参数
 */
function BMSetUnHighlightListener(listener) {

    BMGolbe.UnHighlightEvent.addEventListener(listener);
}
/** 设置3DTile节点颜色
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Number} colorR 颜色[0-1]
 * @param {Number} colorG 颜色[0-1]
 * @param {Number} colorB 颜色[0-1]
 * @param {Number} colorA 颜色[0-1] 0完全透明   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 */
function BMSet3DTileNodeColor(tileURL,colorR,colorG,colorB,colorA,tileNode_GUIDs)
{
    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile))
        return;
    //
    var newObj = {};
    newObj.color = new Cesium.Color(colorR,colorG,colorB,colorA);
    newObj.guids = [];
    for(var i=0;i<tileNode_GUIDs.length;++i)
    {
        newObj.guids.push(tileNode_GUIDs[i]);
    }
    //
    findTile.NeedSetColorObjects.push(newObj);
}
/** 重置3DTile节点颜色
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 */
function BMReset3DTileNodeColor(tileURL,tileNode_GUIDs)
{
    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile))
        return;
    for(var i=0;i<tileNode_GUIDs.length;++i)
    {
        findTile.NeedResetColorFeatureIDs.push(tileNode_GUIDs[i]);
    }
}
/** 显示3DTile节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 */
function BMShow3DTileNode(tileURL,tileNode_GUIDs)
{
    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile))
        return;
    for(var i=0;i<tileNode_GUIDs.length;++i)
    {
        findTile.NeedShowFeatureIDs.push(tileNode_GUIDs[i]);
    }
}
/** 隐藏3DTile节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 */
function BMHide3DTileNode(tileURL,tileNode_GUIDs)
{
    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile))
        return;
    for(var i=0;i<tileNode_GUIDs.length;++i)
    {
        findTile.NeedHideFeatureIDs.push(tileNode_GUIDs[i]);
    }
}
/** 设置高亮颜色
 * @Fuction
 * @param {Number} colorR 颜色[0-1]
 * @param {Number} colorG 颜色[0-1]
 * @param {Number} colorB 颜色[0-1]
 * @param {Number} colorA 颜色[0-1] 0完全透明
 */
function BMSetSelectColor(colorR,colorG,colorB,colorA)
{
    BMGolbe.SelectColor.red = colorR;
    BMGolbe.SelectColor.green = colorG;
    BMGolbe.SelectColor.blue = colorB;
    BMGolbe.SelectColor.alpha = colorA;
}
/** 设置3DTileSet 屏幕误差---值越大 则相当相机位置 显示的模型越少，反之越多
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {Number} ScreenSpaceError = 200 误差值[16-500]
 */
function BMSetScreenSpaceErrorr(tileURL,ScreenSpaceError)
{
    var findTile = Get3DTileSetByURL(tileURL);
    if(!Cesium.defined(findTile))
        return;
    //
    findTile.maximumScreenSpaceError = ScreenSpaceError;
}
/** 设置漫游路径
 * @Fuction
 * @param {Number[]} Datas 路径点数组 经度0,纬度0,高度0,经度1,纬度1,高度1……  
 * @param {Number} RoamingSpeed = 200 漫游速度(m/s)
 * @param {Number} offsetHeight = 10 路径点高度值偏移量m（每个点的高度值 += offsetHeight）
 */
function BMRoaming(Datas,RoamingSpeed,offsetHeight)
{
    if(BMGolbe.RoamingPositionProperty !== undefined)
    {
        BMGolbe.IsRoaming = false;
        BMGolbe.RoamingPositionProperty = undefined;
        BMGolbe.viewer.entities.remove(BMGolbe.RoamingLineEntity);
        BMGolbe.RoamingLineEntity = undefined;
    }
    //
    var i,j;
    var length = Datas.length;
    var numPt = length / 3;
    var arryPts = new Array(numPt);
    var arryTimes = new Array(numPt);
    for(i=0,j=0;i<length;i+=3,++j)
    {
        arryPts[j] = Cesium.Cartesian3.fromDegrees(Datas[i],Datas[i+1],Datas[i+2] + offsetHeight);
    }
    //
    var startTime = Cesium.JulianDate.now();
    arryTimes[0] = startTime;
    var totalLen = 0;
    for(i=0;i<numPt-1;++i)
    {
        var pt0 = arryPts[i];
        var pt1 = arryPts[i+1];
        //
        var _len = Cesium.Cartesian3.distance(pt0,pt1);
        totalLen += _len;totalLen += _len;
        var _time = totalLen / RoamingSpeed;
        arryTimes[i+1] = Cesium.JulianDate.addSeconds(startTime,_time,new Cesium.JulianDate());
    }
    //
    var positionProperty = new Cesium.SampledPositionProperty();
    positionProperty.addSamples(arryTimes,arryPts);
    BMGolbe.RoamingLineEntity = new Cesium.Entity({
        name:"BMRoaming",
        polyline:{
            positions:arryPts,
            width:2,
            material:BMGolbe.RoamingLineMaterialGlow
        }
    });
    //
    BMGolbe.RoamingLineEntity.show = BMGolbe.RoamingLineVisible;
    BMGolbe.viewer.entities.add(BMGolbe.RoamingLineEntity);
    BMGolbe.viewer.clock.shouldAnimate = true;
    BMGolbe.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    BMGolbe.viewer.clock.startTime = startTime;
    BMGolbe.viewer.clock.currentTime = startTime;
    BMGolbe.viewer.clock.stopTime = arryTimes[numPt-1];
    BMGolbe.IsRoaming = true;
    BMGolbe.RoamingPositionProperty = positionProperty;
}
//
/** 暂停漫游
 * @Fuction
 */
function BMPauseRoaming()
{
    BMGolbe.viewer.clock.shouldAnimate = false;
    BMGolbe.IsRoaming = false;
}
/** 开始漫游
 * @Fuction
 */
function BMStartRoaming()
{
    BMGolbe.viewer.clock.shouldAnimate = true;
    BMGolbe.IsRoaming = true;
}
/** 加速 当前速度的1.1倍
 * @Fuction
 */
function BMAccelerateRoaming()
{
    BMGolbe.viewer.clock.multiplier = BMGolbe.viewer.clock.multiplier * 1.1;
}
/** 减速 当前速度的0.9倍
 * @Fuction
 */
function BMDecelerateRoaming()
{
    BMGolbe.viewer.clock.multiplier = BMGolbe.viewer.clock.multiplier * 0.9;
}
 /** 停止漫游---删除漫游路径，需要重新调用 BMGIS_Roaming()函数
 * @Fuction
 */
function BMStopRoaming()
{
    BMGolbe.viewer.clock.shouldAnimate = false;
    BMGolbe.IsRoaming = false;
    if(BMGolbe.RoamingPositionProperty !== undefined)
    {
        BMGolbe.viewer.entities.remove(BMGolbe.RoamingLineEntity);
        BMGolbe.RoamingLineEntity = undefined;
        BMGolbe.RoamingPositionProperty = undefined;
    }
}
/** 显示\隐藏漫游路径线
 * @Fuction
 * @param {Boolean} LineVisible = true 
 */
function BMSetRoamingLineVisibility(LineVisible)
{
    BMGolbe.RoamingLineVisible = LineVisible;
    if(BMGolbe.RoamingLineEntity !== undefined)
        BMGolbe.RoamingLineEntity.show = LineVisible;
}
/** 获取 漫游位置偏移
 * @Fuction
 * @returns {Number} 
 */
function BMGetRoamingPosiOffset()
{
    return BMGolbe.RoamingPositionOffset;
}
/** 设置 漫游位置偏移
 * @Fuction
 * @returns {Number} 
 */
function BMSetRoamingPosiOffset(newOffset)
{
    BMGolbe.RoamingPositionOffset = newOffset;
}
/** 获取 漫游视线偏移
 * @Fuction
 * @param {Number} newOffset
 */
function BMGetRoamingEyeAngleOffset()
{
    return BMGolbe.RoamingEyeOffsetAngle;
}
/** 设置 漫游视线偏移
 * @Fuction
 * @returns {Number} 
 */
function BMSetRoamingEyeAngleOffset(newOffset)
{
    BMGolbe.RoamingEyeOffsetAngle = newOffset;
}
/** 显示\隐藏 路网标注图层
 * @Fuction
 * @param {Boolean} Visible = true 
 */
function BMAnnotationLayerVisibility(Visible)
{
    if(BMGolbe.LabelLayer !== undefined)
    {
        BMGolbe.LabelLayer.show = Visible;
    }
}
/** 添加EntityImageLabel
 * @Fuction
 * @param {Number} Pos_longitude 经度（°） 
 * @param {Number} Pos_latitude 纬度（°）
 * @param {Number} Pos_height 高度（m）
 * @param {String} imageURL 图片 URL
 * @param {Object} [options] 配置选项
 * @param {Number} [options.colorR = 1.0] 颜色[0-1] 默认白色
 * @param {Number} [options.colorG = 1.0] 颜色[0-1]
 * @param {Number} [options.colorB = 1.0] 颜色[0-1]
 * @param {Number} [options.colorA = 1.0] 颜色[0-1] 0完全透明
 * @param {Boolean} [options.ShowLabelPoint = true] 标注位置
 * @param {Number} [options.minVisibleDis = 1.0] 最小显示距离---图片位置与相机位置的距离---小于该距离 标签不显示
 * @param {Number} [options.maxVisibleDis = 2e6] 最大显示距离---图片位置与相机位置的距离---大于该距离 标签不显示 
 * 
 * @returns {String} lableID
 */
function BMAddEntityImageLabel(Pos_longitude,Pos_latitude,Pos_height,imageURL,options)
{
   var ddc = new Cesium.DistanceDisplayCondition(options.minVisibleDis ,options.maxVisibleDis);  
   var newEntity =  BMGolbe.viewer.entities.add({
        parent : BMGolbe.ImageLabelRoot,
        position : Cesium.Cartesian3.fromDegrees(Pos_longitude, Pos_latitude, Pos_height),
        billboard : {
            image : imageURL,
            horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
            color : new Cesium.Color(options.colorR,options.colorG,options.colorB,options.colorA),
            distanceDisplayCondition : ddc,
            pixelOffset:BMGolbe.LabelPixelOffset
        },
        point:{
            color: Cesium.Color.SNOW ,
            outlineColor: Cesium.Color.CORAL,
            outlineWidth:1,
            pixelSize:3,
            distanceDisplayCondition: ddc
        }
    });
    //
    newEntity.point.show = options.ShowLabelPoint = true;
    BMGolbe.ImageLabelEntites.push(newEntity);
    return newEntity.id;
}
/** 添加EntityTextLabel
 * @Fuction
 * @param {Number} Pos_longitude 经度（°） 
 * @param {Number} Pos_latitude 纬度（°）
 * @param {Number} Pos_height 高度（m）
 * @param {String} text 文字 
 * @param {Object} [options] 配置选项
 * @param {Number} [options.colorR = 1.0] 颜色[0-1] 默认白色
 * @param {Number} [options.colorG = 1.0] 颜色[0-1]
 * @param {Number} [options.colorB = 1.0] 颜色[0-1]
 * @param {Number} [options.colorA = 1.0] 颜色[0-1] 0完全透明
 * @param {Number} [options.font = '30px sans-serif'] CSS font
 * @param {Boolean} [options.ShowLabelPoint = true] 标注位置
 * @param {Number} [options.minVisibleDis = 1.0] 最小显示距离---图片位置与相机位置的距离---小于该距离 标签不显示
 * @param {Number} [options.maxVisibleDis = 2e6] 最大显示距离---图片位置与相机位置的距离---大于该距离 标签不显示 
 * 
 * @returns {String} lableID
 */
function BMAddEntityTextLabel(Pos_longitude,Pos_latitude,Pos_height,text,options)
{
    var ddc = new Cesium.DistanceDisplayCondition(options.minVisibleDis ,options.maxVisibleDis);  
    var newEntity =  BMGolbe.viewer.entities.add({
         parent : BMGolbe.TextLabelRoot,
         position : Cesium.Cartesian3.fromDegrees(Pos_longitude, Pos_latitude, Pos_height),
         label : {
             text : text,
             horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
             verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
             fillColor : new Cesium.Color(options.colorR,options.colorG,options.colorB,options.colorA),
             distanceDisplayCondition : ddc,
             font:options.font,
             pixelOffset:BMGolbe.LabelPixelOffset
         },
         point:{
             color: Cesium.Color.SNOW ,
             outlineColor: Cesium.Color.CORAL,
             outlineWidth:1,
             pixelSize:3,
             distanceDisplayCondition: ddc
         }
     });
     //
     newEntity.point.show = options.ShowLabelPoint = true;
     BMGolbe.TextLabelEntites.push(newEntity);
     return newEntity.id;
}
/** 修改EntityTextLabel---修改标签位置、颜色、文字内容、显示隐藏
 * @Fuction
 * @param {String} lableID 标签ID  
 * @param {Object} [options] 配置选项
 * @param {Number} [options.colorR] 颜色[0-1] 默认白色
 * @param {Number} [options.colorG] 颜色[0-1]
 * @param {Number} [options.colorB] 颜色[0-1]
 * @param {Number} [options.colorA] 颜色[0-1] 0完全透明
 * @param {Number} [options.Pos_longitude] 经度（°）
 * @param {Number} [options.Pos_latitude] 纬度（°）
 * @param {Number} [options.Pos_height] 高度（m）
 * @param {String} [options.text] 文字内容
 * @param {Boolean} [options.Show] 显示隐藏
 */
function BMEditEntityTextLabel(lableID,options)
{
    var findEntity =  BMGolbe.viewer.entities.getById(lableID);
    if(!Cesium.defined(findEntity) || !Cesium.defined(findEntity.label)) return;
    //
    if(Cesium.defined(options.Pos_longitude) && Cesium.defined(options.Pos_latitude) && Cesium.defined(options.Pos_height))
    {
        var newPos =  new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(options.Pos_longitude, options.Pos_latitude, options.Pos_height));
        findEntity.position = newPos;
    }
    //
    if(Cesium.defined(options.colorR) && Cesium.defined(options.colorG) && Cesium.defined(options.colorB) && Cesium.defined(options.colorA))
    {
        var newColor = new Cesium.Color(options.colorR,options.colorG,options.colorB,options.colorA);
        findEntity.label.fillColor = newColor; 
    }
    //
    if(Cesium.defined(options.text))
    {
        findEntity.label.text = options.text;
    }
    if(Cesium.defined(options.Show))
    {
        findEntity.show = options.Show;
    }
}
/** 修改EntityImageLabel---修改标签位置、颜色、图片URL、显示隐藏
 * @Fuction
 * @param {String} lableID 标签ID  
 * @param {Object} [options] 配置选项
 * @param {Number} [options.colorR] 颜色[0-1] 默认白色
 * @param {Number} [options.colorG] 颜色[0-1]
 * @param {Number} [options.colorB] 颜色[0-1]
 * @param {Number} [options.colorA] 颜色[0-1] 0完全透明
 * @param {Number} [options.Pos_longitude] 经度（°）
 * @param {Number} [options.Pos_latitude] 纬度（°）
 * @param {Number} [options.Pos_height] 高度（m）
 * @param {String} [options.imageURL] 图片
 * @param {Boolean} [options.Show] 显示隐藏
 */
function BMEditEntityImageLabel(lableID,options)
{
    var findEntity =  BMGolbe.viewer.entities.getById(lableID);
    if(!Cesium.defined(findEntity) || !Cesium.defined(findEntity.billboard)) return;
    //
    if(Cesium.defined(options.Pos_longitude) && Cesium.defined(options.Pos_latitude) && Cesium.defined(options.Pos_height))
    {
        var newPos =  new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(options.Pos_longitude, options.Pos_latitude, options.Pos_height));
        findEntity.position = newPos;
    }
    //
    if(Cesium.defined(options.colorR) && Cesium.defined(options.colorG) && Cesium.defined(options.colorB) && Cesium.defined(options.colorA))
    {
        var newColor = new Cesium.Color(options.colorR,options.colorG,options.colorB,options.colorA);
        findEntity.billboard.color = newColor; 
    }
    //
    if(Cesium.defined(options.imageURL))
    {
        findEntity.billboard.image = options.imageURL;
    }
    if(Cesium.defined(options.Show))
    {
        findEntity.show = options.Show;
    }
}
/** 删除标签
 * @Fuction
 * @param {String} lableID 标签ID  
 */
function BMDeleteEntityLabel(lableID)
{
    var findEntity =  BMGolbe.viewer.entities.getById(lableID);
    if(!Cesium.defined(findEntity)) return;
    var index = GetArrayElementIndex(BMGolbe.TextLabelEntites,findEntity);
    if(index !== -1)
    {
        BMGolbe.TextLabelEntites.splice(index,1);
    }
    else
    {
        index = GetArrayElementIndex(BMGolbe.ImageLabelEntites,findEntity);
        BMGolbe.ImageLabelEntites.splice(index,1);
    }
    //
    BMGolbe.viewer.entities.remove(findEntity);
}
/** 删除所有标签
 * @Fuction
 * @param {Number} labelType 0图片标签、1文本标签、2both
 */
function BMDeleteAllEntityLabel(labelType)
{
    BMGolbe.viewer.entities.suspendEvents();
    var i=0;
    switch(labelType)
    {
    case 0:
        for(i=0;i<BMGolbe.ImageLabelEntites.length;++i)
        {
            BMGolbe.viewer.entities.remove(BMGolbe.ImageLabelEntites[i]);
        }
        BMGolbe.ImageLabelEntites.splice(0,BMGolbe.ImageLabelEntites.length);
        break;
    case 1:
        for(i=0;i<BMGolbe.TextLabelEntites.length;++i)
        {
            BMGolbe.viewer.entities.remove(BMGolbe.TextLabelEntites[i]);
        }
        BMGolbe.TextLabelEntites.splice(0,BMGolbe.TextLabelEntites.length);
        break;
    case 2:
        for(i=0;i<BMGolbe.ImageLabelEntites.length;++i)
        {
            BMGolbe.viewer.entities.remove(BMGolbe.ImageLabelEntites[i]);
        }
        BMGolbe.ImageLabelEntites.splice(0,BMGolbe.ImageLabelEntites.length);
        //
        for(i=0;i<BMGolbe.TextLabelEntites.length;++i)
        {
            BMGolbe.viewer.entities.remove(BMGolbe.TextLabelEntites[i]);
        }
        BMGolbe.TextLabelEntites.splice(0,BMGolbe.TextLabelEntites.length);
        break;
    }
    //
    BMGolbe.viewer.entities.resumeEvents();
}
/** 显示\隐藏 所有标签
 * @Fuction
 * @param {Number} labelType 0图片标签、1文本标签、2both
 * @param {Boolean} Show 显示隐藏
 */
function BMVisibleAllEntityLabel(labelType,Show)
{
    switch(labelType)
    {
    case 0:
        BMGolbe.ImageLabelRoot.show = Show;
        break;
    case 1:
        BMGolbe.TextLabelRoot.show = Show;
        break;
    case 2:
        BMGolbe.ImageLabelRoot.show = Show;
        BMGolbe.TextLabelRoot.show = Show;
        break;
    }
}
/** 设置鼠标单击  图标标签 事件回调函数
 * @Fuction
 * @param {Function} listener  ---函数参数为 选中的图片标签ID String
 */
function BMSetMouseLeftClickImageLabelEventListener(listener) {

    BMGolbe.ClickImageLabelEvent.addEventListener(listener);
}
/** 设置鼠标单击  文字标签 事件回调函数
 * @Fuction
 * @param {Function} listener  ---函数参数为 选中的文字标签ID String
 */
function BMSetMouseLeftClickTextLabelEventListener(listener) {

    BMGolbe.ClickTextLabelEvent.addEventListener(listener);
}
/** 缩放至场景标签  
 * @Fuction
 * @param {String} lableID 标签ID  
 */
function BMZoomToEntityLabel(lableID) {
    var findEntity =  BMGolbe.viewer.entities.getById(lableID);
    if(!Cesium.defined(findEntity)) return;
    //
    BMGolbe.viewer.flyTo(findEntity);
}
/** 添加 DIV标签
 * @Fuction
 * @param {Number} Pos_longitude 经度（°） 
 * @param {Number} Pos_latitude 纬度（°）
 * @param {Number} Pos_height 高度（m）
 */
function BMAddDIVLabel(Pos_longitude,Pos_latitude,Pos_height)
{
    var num = BMGolbe.DIVLabelIDs.length;
    var newDIV = document.createElement('div');
    newDIV.id = "_BMInnerDIV" + num.toString();
    newDIV.style.cssText = "position:absolute;z-index:5"; 
    BMGolbe.BMGISRootDOM.appendChild(newDIV);
    //
    var position = Cesium.Cartesian3.fromDegrees(Pos_longitude, Pos_latitude,Pos_height);
    BMGolbe.DIVLabelIDs.push(newDIV.id);
    BMGolbe.DIVLabelPoss.push(position);
    //
    return newDIV;
}
/** 闪烁场景标签
 * @Fuction
 * @param {String[]} lableIDs 标签ID---数组---
 * @param {Number} duration 闪烁持续时间 毫秒 
 */
function BMGlintEntityLabels(lableIDs,duration) {
    var i=0;
    for(;i<BMGolbe.GlintLabels.length;++i)
    {
        var fEntity =  BMGolbe.GlintLabels[i];
        if(Cesium.defined(fEntity.label))
        {
            fEntity.label.fillColor = fEntity.oldColor;
        }
        else
        {
            fEntity.billboard.color = fEntity.oldColor;
        }
    }
    BMGolbe.GlintLabels.splice(0,BMGolbe.GlintLabels.length);
    //
    for(i=0;i<lableIDs.length;++i)
    {
        var findEntity =  BMGolbe.viewer.entities.getById(lableIDs[i]);
        if(Cesium.defined(findEntity)) 
        {
            BMGolbe.GlintLabels.push(findEntity);
            var oldColor;
            if(Cesium.defined(findEntity.label))
            {
                oldColor = findEntity.label.fillColor;
            }
            else
            {
                oldColor = findEntity.billboard.color;
            }
            findEntity.oldColor = oldColor;
        }
    }
    //
    BMGolbe.BeginGlintDate = new Date();
    BMGolbe.Duration = duration;
}

/** 显示\隐藏 三维球体
 * @Fuction
 * @param {Boolean} Show 显示隐藏 
 */
function BMShowGlobe(Show)
{
    BMGolbe.viewer.scene.globe.show = Show;
    BMGolbe.viewer.scene.skyAtmosphere.show = Show;
}
/** 设置地图类型---默认为 mapbox矢量地图
 * @Fuction
 * @param {Number} mapType :0 谷歌影像地图（无注记层）、1 mapbox矢量地图（含注记层）、2 天地图矢量地图（无注记层）
 */
function BMSetGlobeMapType(mapType)
{
    BMGolbe.viewer.imageryLayers.remove(BMGolbe.ImageLayer);
    //
    if(mapType === 0)
        BMGolbe.ImageLayer = BMGolbe.viewer.imageryLayers.addImageryProvider(BMGolbe.GoogleImageProvider,1);
    else if(mapType === 1)
        BMGolbe.ImageLayer = BMGolbe.viewer.imageryLayers.addImageryProvider(BMGolbe.MapboxMapProvider,1);
    else
        BMGolbe.ImageLayer = BMGolbe.viewer.imageryLayers.addImageryProvider(BMGolbe.TianDiTuMapProvider,1);
}
/** 设置地图注记类型---默认为 空
 * @Fuction
 * @param {Number} labelType :0 天地图矢量注记、1 天地图影像注记、2 无附加注记图层---当底图为mapbox矢量地图时，不需要再附加注记图层 
 */
function BMSetGlobeMapLabelType(labelType)
{
    if(BMGolbe.LabelLayer !== undefined)
    {
        BMGolbe.viewer.imageryLayers.remove(BMGolbe.LabelLayer);
        BMGolbe.LabelLayer = undefined;
    }
    //
    if(labelType === 0)
        BMGolbe.LabelLayer = BMGolbe.viewer.imageryLayers.addImageryProvider(BMGolbe.MapLabelTianDiTuProvider,2);
    else if(labelType === 1)
        BMGolbe.LabelLayer = BMGolbe.viewer.imageryLayers.addImageryProvider(BMGolbe.ImageLabelTianDiTuProvider,2);
}
/** 修改图层样式
 * @Fuction
 * @param {Number} mapType 图层类型 ：0 底图图层、1 注记图层
 * @param {Object} [options] 配置选项
 * @param {Number} [options.alpha] 透明度[0-1] 1.0
 * @param {Number} [options.brightness] 亮度[0-1] 1.0
 * @param {Number} [options.contrast] 对比度[0-1] 1.0
 * @param {Number} [options.hue] 色调[0-1] 0.0
 * @param {Number} [options.saturation] 饱和度[0-1] 1.0
 * @param {Number} [options.gammaCorrection] 灰度校正[0-1] 1.0
 */
function BMEditGlobeMapStyle(mapType,options)
{
    options.alpha = Cesium.defaultValue(options.alpha, 1.0);
    options.brightness = Cesium.defaultValue(options.brightness, 1.0);
    options.contrast = Cesium.defaultValue(options.contrast, 1.0);
    options.hue = Cesium.defaultValue(options.hue, 0.0);
    options.saturation = Cesium.defaultValue(options.saturation, 1.0);
    options.gammaCorrection = Cesium.defaultValue(options.gammaCorrection, 1.0);
    if(mapType === 0)
    {
        BMGolbe.ImageLayer.alpha =  options.alpha;
        BMGolbe.ImageLayer.brightness =  options.brightness;
        BMGolbe.ImageLayer.contrast =  options.contrast;
        BMGolbe.ImageLayer.hue =  options.hue;
        BMGolbe.ImageLayer.saturation =  options.saturation;
        BMGolbe.ImageLayer.gamma =  options.gammaCorrection;
    }
    else if(mapType === 1 && BMGolbe.LabelLayer !== undefined)
    {
        BMGolbe.LabelLayer.alpha =  options.alpha;
        BMGolbe.LabelLayer.brightness =  options.brightness;
        BMGolbe.LabelLayer.contrast =  options.contrast;
        BMGolbe.LabelLayer.hue =  options.hue;
        BMGolbe.LabelLayer.saturation =  options.saturation;
        BMGolbe.LabelLayer.gamma =  options.gammaCorrection;
    }
}
//
/** 设置操作类型
 * @Fuction
 * @param {Number} handerType 0选择 1坐标测量 2多线测量 3面积测量 4垂直距离测量
 */
function BMSetOperateHanderType(handerType)
{
    if(BMGolbe.HanderType != handerType)
    {
        ResetMeasureData();
        BMGolbe.HanderType = handerType;
        if(handerType == 0)
        {
            BMGolbe.CanvasContainerElement.style.cursor="auto";
        }
        else
        {
            BMGolbe.CanvasContainerElement.style.cursor="crosshair";
        }
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//private
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* 获取3DTileSet 对象
*/
function Get3DTileSetByID(tileID){

    for(var i=0;i<BMGolbe.BMTileSets.length;++i)
    {
        var tempTile = BMGolbe.BMTileSets[i];
        if(tempTile.asset.id === tileID)
        {
            return tempTile;
        }
    }
    //
    return undefined;
}
/* 获取3DTileSet 对象 
*/
function Get3DTileSetByURL(tileURL,index){
    for(var i=0;i<BMGolbe.BMTileSets.length;++i)
    {
        var tempTile = BMGolbe.BMTileSets[i];
        if(tempTile.originURL === tileURL)
        {
            if(Cesium.defined(index))
                index = i;
            return tempTile;
        }
    }
    //
    return undefined;
}
/* 设置3DTileSet选择相关变量---扩展3DTileSet对象 
*/
function Set3DTileSetSelectVariables(tileSet)
{
    //需要 被选中的GUID数组
    tileSet.NeedAddToSelectFeatureIDs = [];
    //被选中feature的 tile对象数组
    tileSet.SelectedTiles = [];
    //需要 被移除含选中feature的 tile对象数组
    tileSet.NeedRemoveSelectTiles = [];
    //需要 设置颜色的GUID+Color数组
    tileSet.NeedSetColorObjects = [];
    //需要 重置颜色的GUID数组
    tileSet.NeedResetColorFeatureIDs = [];
    //需要 显示的GUID数组
    tileSet.NeedShowFeatureIDs = [];
    //需要 隐藏的GUID数组
    tileSet.NeedHideFeatureIDs = [];
}
/* 设置3DTileSet tile显示与tile卸载事件函数---处理选择相关 
*/
function Set3DTileSetTileVisibleAndTileUnloadEvent(tileSet)
{
    tileSet.tileUnload.addEventListener(function(tile) {
        var i = 0;
        var content = tile.content;
        var j = 0;
        var feature;
        var k=0;
        var _tileSet = tile.tileset;
        if(Cesium.defined(tile.SelectedFeatures) && tile.SelectedFeatures.length > 0 && _tileSet.SelectedTiles.length > 0 )
        {
            for(i=0;i<_tileSet.SelectedTiles.length;++i)
            {
                if(_tileSet.SelectedTiles[i] === tile) 
                {
                    for (j = 0; j < content.featuresLength; j++)
                    {
                        feature = content.getFeature(j);
                        for(k=0;k<tile.SelectedFeatures.length;++k)
                        {
                            if(feature === tile.SelectedFeatures[k])
                            {
                                _tileSet.NeedAddToSelectFeatureIDs.push(feature.getProperty('name'));
                                break;
                            }
                        }     
                    }
                    //
                    tile.SelectedFeatures.splice(0,tile.SelectedFeatures.length);
                    _tileSet.SelectedTiles.splice(i,1);
                    //
                    break;
                }
            }
        }
        //
        for (j = 0; j < content.featuresLength; j++)
        {
            feature = content.getFeature(j);
            if(feature.show === false)
            {
                _tileSet.NeedShowFeatureIDs.push(feature.getProperty('name'));
            }
        }
        //
        if(Cesium.defined(BMGolbe.SelectTileFeature) && BMGolbe.SelectTileFeature.content.tile === tile)  
        {
            _tileSet.NeedAddToSelectFeatureIDs.push(BMGolbe.SelectTileFeature.getProperty('name'));
            BMGolbe.SelectTileFeature = undefined; 
        }
    });
    //
    tileSet.tileVisible.addEventListener(function(tile) {

        var content;
        var i = 0;
        var feature;
        var guid0;
        var j = 0;
        var k = 0;
        var _tileSet = tile.tileset;
        //
        if(!Cesium.defined(tile.SelectedFeatures)) tile.SelectedFeatures = [];
        //移除 选中
        if(_tileSet.NeedRemoveSelectTiles.length > 0)
        {
            for(k=0;k<_tileSet.NeedRemoveSelectTiles.length;++k)
            {
                if(_tileSet.NeedRemoveSelectTiles[k] === tile)
                {
                    for(var m=0;m<tile.SelectedFeatures.length;++m)
                    {
                        var tempFeature = tile.SelectedFeatures[m];
                        if(Cesium.defined(tempFeature.originColor))
                            tempFeature.color = tempFeature.originColor;
                        else
                            tempFeature.color = Cesium.Color.WHITE;
                        //
                        if(Cesium.defined(BMGolbe.SelectTileFeature) && BMGolbe.SelectTileFeature === tempFeature)     
                            BMGolbe.SelectTileFeature = undefined; 
                    }
                    //
                    tile.SelectedFeatures.splice(0,tile.SelectedFeatures.length);
                    _tileSet.NeedRemoveSelectTiles.splice(k,1);
                }
            }
        }
        //设置 选中
        if(_tileSet.NeedAddToSelectFeatureIDs.length > 0)
        {
            content = tile.content;
            for (i = 0; i < content.featuresLength; i++)
            {
                feature = content.getFeature(i);
                guid0 = feature.getProperty('name'); 
                for(j=0;j<_tileSet.NeedAddToSelectFeatureIDs.length;++j)
                {
                    if(guid0 === _tileSet.NeedAddToSelectFeatureIDs[j])
                    {
                        tile.SelectedFeatures.push(feature);
                        _tileSet.SelectedTiles.push(tile);
                        feature.color =  BMGolbe.SelectColor; 
                        //
                        _tileSet.NeedAddToSelectFeatureIDs.splice(j,1);
                        break;
                    }
                }
            }
        }
        //设置 颜色---被设置的颜色若tile被Unloaded 则恢复不了
        if(_tileSet.NeedSetColorObjects.length > 0)
        {
            content = tile.content;
            for (i = 0; i < content.featuresLength; i++)
            {
                feature = content.getFeature(i);
                guid0 = feature.getProperty('name'); 
                var find = false;
                for(j=0;j<_tileSet.NeedSetColorObjects.length;++j)
                {
                    var tempObj = _tileSet.NeedSetColorObjects[j];
                    var tempGUIDS = tempObj.guids;
                    for(k=0;k<tempGUIDS.length;++k)
                    {
                        if(guid0 === tempGUIDS[k])
                        {
                            find = true;
                            feature.color =  tempObj.color; 
                            feature.originColor = tempObj.color;
                            tempGUIDS.splice(k,1);
                            if(tempGUIDS.length === 0)
                            {
                                _tileSet.NeedSetColorObjects.splice(j,1);
                            }
                            break;
                        }
                    }
                    //
                    if(find) break; 
                }
            }
        }
        //重置 颜色
        if(_tileSet.NeedResetColorFeatureIDs.length > 0)
        {
            content = tile.content;
            for (i = 0; i < content.featuresLength; i++)
            {
                feature = content.getFeature(i);
                guid0 = feature.getProperty('name'); 
                for(j=0;j<_tileSet.NeedResetColorFeatureIDs.length;++j)
                {
                    if(guid0 === _tileSet.NeedResetColorFeatureIDs[j])
                    {
                        feature.color = Cesium.Color.WHITE;
                        feature.originColor = undefined;
                        _tileSet.NeedResetColorFeatureIDs.splice(j,1);
                        break;
                    }
                }
            }
        }
        //设置 显示
        if(_tileSet.NeedShowFeatureIDs.length > 0)
        {
            content = tile.content;
            for (i = 0; i < content.featuresLength; i++)
            {
                feature = content.getFeature(i);
                guid0 = feature.getProperty('name'); 
                for(j=0;j<_tileSet.NeedShowFeatureIDs.length;++j)
                {
                    if(guid0 === _tileSet.NeedShowFeatureIDs[j])
                    {
                        feature.show  = true;
                        _tileSet.NeedShowFeatureIDs.splice(j,1);
                        break;
                    }
                }
            }
        }
        //设置 隐藏
        if(_tileSet.NeedHideFeatureIDs.length > 0)
        {
            content = tile.content;
            for (i = 0; i < content.featuresLength; i++)
            {
                feature = content.getFeature(i);
                guid0 = feature.getProperty('name'); 
                for(j=0;j<_tileSet.NeedHideFeatureIDs.length;++j)
                {
                    if(guid0 === _tileSet.NeedHideFeatureIDs[j])
                    {
                        feature.show  = false;
                        _tileSet.NeedHideFeatureIDs.splice(j,1);
                        break;
                    }
                }
            }
        }
    });
}
/* 取消所有3DTileSet的选择 
*/
function UnSelectAll3DTileSetSelectNodes()
{
    var hasCall = false;
    for(var i=0;i<BMGolbe.BMTileSets.length;++i)
    {
        var tempTile = BMGolbe.BMTileSets[i];
        //
        if(tempTile.SelectedTiles.length !== 0)
        {
            for(var j=0;j<tempTile.SelectedTiles.length;++j)
            {
                tempTile.NeedRemoveSelectTiles.push(tempTile.SelectedTiles[j]);
            }
            tempTile.SelectedTiles.splice(0,tempTile.SelectedTiles.length);
            //
            if(hasCall === false)
            {
                BMGolbe.UnHighlightEvent.raiseEvent();
                hasCall = true;
            }
        }
    }
    //
    if (Cesium.defined(BMGolbe.SelectTileFeature)) 
    {
        var tile = BMGolbe.SelectTileFeature.content.tile;
        tile.tileset.NeedRemoveSelectTiles.push(tile);
        var guid = BMGolbe.SelectTileFeature.getProperty('name'); 
        var url = tile.tileset.originURL;
        BMGolbe.UnSelect3DTileNodeEvent.raiseEvent(url + ':' +guid);
    }
}
/*获取数组index
*/
function GetArrayElementIndex(arr,value)
{
    var index = -1;
    for(var i=0;i<arr.length;++i)
    {
        if(arr[i] === value)
        {
            index = i;
            break;
        }
    }
    //
    return index;
}
/*根据 屏幕坐标获取场景Cartesian3坐标
*/
function GetCartesian3ByMousePoint(mousePoint,scratchCartesianPt)
{
    var scenePick = BMGolbe.viewer.scene.pickPosition(mousePoint,scratchCartesianPt);
    if(scenePick)
    {
         Cesium.Cartographic.fromCartesian(scenePick,BMGolbe.viewer.scene.globe.ellipsoid,BMGolbe.scratchCartographicPt);
         if(BMGolbe.scratchCartographicPt.height < -100)
         {
            BMGolbe.viewer.camera.pickEllipsoid(mousePoint, BMGolbe.viewer.scene.globe.ellipsoid,scratchCartesianPt);
         }
         //
         return scratchCartesianPt;
    }
    else
    {
         return undefined;
    }
}

/*重置 测量数据
*/
function ResetMeasureData()
{
    BMGolbe.PointCoordinateEntity.show = false;
    //
    BMGolbe.MeasureMultiLineEntities.forEach(function(en){BMGolbe.viewer.entities.remove(en);});
    BMGolbe.MeasureMultiLinePoints.splice(0,BMGolbe.MeasureMultiLinePoints.length);
    BMGolbe.MeasureMultiLineEntities.splice(0,BMGolbe.MeasureMultiLineEntities.length);
    BMGolbe.MeasureMultiLineMouseMoveEntity.show = false;
    //
}
/*初始化 坐标测量hander
*/
BMGolbe.MeasureUseColor = new Cesium.Color(0.2,0.7,0.78,1.0);
BMGolbe.MeasureDistanceDisplayCondition = new Cesium.DistanceDisplayCondition(0.5 ,50000);
BMGolbe.MeasureDisableDepthTestDistance = new Cesium.ConstantProperty(10000);
BMGolbe.PointCoordinateEntity = undefined;
function InitMeasurePointCoordinateHander()
{
    var positon = new Cesium.ConstantPositionProperty(BMGolbe.scratchCartesianPt);
    BMGolbe.PointCoordinateEntity =  BMGolbe.viewer.entities.add({
         position : Cesium.Cartesian3.fromDegrees(0, 0, 0),
         label : {
             text : "",
             horizontalOrigin : Cesium.HorizontalOrigin.LEFT ,
             verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
             fillColor : BMGolbe.MeasureUseColor,
             distanceDisplayCondition : BMGolbe.MeasureDistanceDisplayCondition,
             font:"20px sans-serif",
             pixelOffset:BMGolbe.LabelPixelOffset,
             disableDepthTestDistance:BMGolbe.MeasureDisableDepthTestDistance
         },
         point:{
             color: Cesium.Color.SNOW ,
             outlineColor: Cesium.Color.CORAL,
             outlineWidth:1,
             pixelSize:3,
             distanceDisplayCondition: BMGolbe.MeasureDistanceDisplayCondition,
             disableDepthTestDistance :BMGolbe.MeasureDisableDepthTestDistance
         }
     });
     BMGolbe.PointCoordinateEntity.show = false;
     //
    BMGolbe.MeasurePointCoordinateHander = new Cesium.ScreenSpaceEventHandler(BMGolbe.viewer.scene.canvas);
    BMGolbe.MeasurePointCoordinateHander.setInputAction(function(movement) {
        if(BMGolbe.HanderType == 1)
        {
            var scenePick = GetCartesian3ByMousePoint(movement.position,BMGolbe.scratchCartesianPt);
            if(scenePick)
            {
                 Cesium.Cartographic.fromCartesian(scenePick,BMGolbe.viewer.scene.globe.ellipsoid,BMGolbe.scratchCartographicPt);
                 //
                 positon.setValue(scenePick);
                 BMGolbe.PointCoordinateEntity.position = positon;
                 BMGolbe.PointCoordinateEntity.show = true;
                 //
                 var lat_String=Cesium.Math.toDegrees(BMGolbe.scratchCartographicPt.latitude).toFixed(5);
                 var log_String=Cesium.Math.toDegrees(BMGolbe.scratchCartographicPt.longitude).toFixed(5);
                 var alti_String=BMGolbe.scratchCartographicPt.height.toFixed(3);
                 BMGolbe.PointCoordinateEntity.label.text = "  lon=" + log_String + ' \u00B0' +"\n" + "  lat=" + lat_String + ' \u00B0' + "\n" + "  z=" +alti_String + ' m' ;
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //
     BMGolbe.MeasurePointCoordinateHander.setInputAction(function(movement) {
        BMSetOperateHanderType(0);
        BMGolbe.PointCoordinateEntity.show = false;
     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}
/*初始化 多线长度测量hander
*/
function AddEntityForMeasureMultiLineLength_Label_Polyline(labelTxt,polylinePoints)
{
    BMGolbe.scratchCartesianPt.x =( polylinePoints[0].x +polylinePoints[1].x)/2.0; 
    BMGolbe.scratchCartesianPt.y =( polylinePoints[0].y +polylinePoints[1].y)/2.0;
    BMGolbe.scratchCartesianPt.z =( polylinePoints[0].z +polylinePoints[1].z)/2.0;
    //
    var newEntity =  BMGolbe.viewer.entities.add({
        position : BMGolbe.scratchCartesianPt,
        label : {
            text : labelTxt,
            horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
            fillColor : BMGolbe.MeasureUseColor,
            distanceDisplayCondition : BMGolbe.MeasureDistanceDisplayCondition,
            font:"20px sans-serif",
            pixelOffset:BMGolbe.LabelPixelOffset,
            disableDepthTestDistance:BMGolbe.MeasureDisableDepthTestDistance
        },
        polyline : {
            positions : polylinePoints,
            width : 2,
            material : Cesium.Color.LIGHTGREEN,
            depthFailMaterial:Cesium.Color.LIGHTGREEN
        }
    });
    //
    return newEntity;
}
function AddEntityForMeasureMultiLineLength_Point(pointPos)
{
    var newEntity =  BMGolbe.viewer.entities.add({
        position : pointPos,
        point:{
            color: Cesium.Color.SNOW ,
            outlineColor: Cesium.Color.CORAL,
            outlineWidth:1,
            pixelSize:3,
            distanceDisplayCondition: BMGolbe.MeasureDistanceDisplayCondition,
            disableDepthTestDistance :BMGolbe.MeasureDisableDepthTestDistance
        }
    });
    //
    return newEntity;
}
function AddEntityForMeasureMultiLineLength_Label(pointPos,labelTxt)
{
    var newEntity =  BMGolbe.viewer.entities.add({
        position : pointPos,
        label : {
            text : labelTxt,
            horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
            fillColor : BMGolbe.MeasureUseColor,
            distanceDisplayCondition : BMGolbe.MeasureDistanceDisplayCondition,
            font:"20px sans-serif",
            pixelOffset:BMGolbe.LabelPixelOffset,
            disableDepthTestDistance:BMGolbe.MeasureDisableDepthTestDistance
        }
    });
    //
    return newEntity;
}
BMGolbe.MeasureMultiLineEntities = [];
BMGolbe.MeasureMultiLinePoints = [];
BMGolbe.MeasureMultiLineMouseMoveEntity = undefined;
Cesium.ScreenSpaceEventHandler.mouseEmulationIgnoreMilliseconds = 1000;
function InitMeasureMultiLineLengthHander()
{
    var positions = new Cesium.ConstantProperty([new Cesium.Cartesian3(),new Cesium.Cartesian3()]);
    var position = new Cesium.ConstantPositionProperty(new Cesium.Cartesian3());
    BMGolbe.MeasureMultiLineMouseMoveEntity =  BMGolbe.viewer.entities.add({
         position : position,
         label : {
             text : "",
             horizontalOrigin : Cesium.HorizontalOrigin.LEFT ,
             verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
             fillColor : BMGolbe.MeasureUseColor,
             distanceDisplayCondition : BMGolbe.MeasureDistanceDisplayCondition,
             font:"20px sans-serif",
             pixelOffset:BMGolbe.LabelPixelOffset,
             disableDepthTestDistance:BMGolbe.MeasureDisableDepthTestDistance
         },
         polyline : {
            positions : positions,
            width : 2,
            material : Cesium.Color.LIGHTGREEN,
            depthFailMaterial:Cesium.Color.LIGHTGREEN
        }
     });
    BMGolbe.MeasureMultiLineMouseMoveEntity.show = false;
     //
    BMGolbe.MeasureMultiLineLengthHander = new Cesium.ScreenSpaceEventHandler(BMGolbe.viewer.scene.canvas);
    BMGolbe.MeasureMultiLineLengthHander.setInputAction(function(movement) {
        if(BMGolbe.HanderType == 2)
        {
            BMGolbe.MeasureMultiLineMouseMoveEntity.show = false;
            if(BMGolbe.MeasureMultiLinePoints.length == 0)
            {
                BMGolbe.MeasureMultiLineEntities.forEach(function(en){BMGolbe.viewer.entities.remove(en);});
                BMGolbe.MeasureMultiLineEntities.splice(0,BMGolbe.MeasureMultiLineEntities.length);
            }
            var scenePick = GetCartesian3ByMousePoint(movement.position, new Cesium.Cartesian3());
            if(scenePick)
            {
                BMGolbe.MeasureMultiLinePoints.push(scenePick);
                var pointEntity = AddEntityForMeasureMultiLineLength_Point(scenePick);
                BMGolbe.MeasureMultiLineEntities.push(pointEntity);
                //
                if(BMGolbe.MeasureMultiLinePoints.length > 1)
                {
                    var prePosition= BMGolbe.MeasureMultiLinePoints[BMGolbe.MeasureMultiLinePoints.length - 2];
                    var len = Cesium.Cartesian3.distance(prePosition, scenePick);
                    var labelTxt = "";
                    if(len > 1001.0)
                    {
                        labelTxt = (len / 1000.0).toFixed(3) + ' km';
                    }
                    else
                    {
                        labelTxt = len.toFixed(2) + ' m';
                    }
                    var labelEntity = AddEntityForMeasureMultiLineLength_Label_Polyline(labelTxt,[prePosition,scenePick]);
                    BMGolbe.MeasureMultiLineEntities.push(labelEntity);
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //
    BMGolbe.MeasureMultiLineLengthHander.setInputAction(function(movement) {
        if(BMGolbe.MeasureMultiLinePoints.length > 0)
        {
            var scenePick = GetCartesian3ByMousePoint(movement.endPosition, new Cesium.Cartesian3());
            if(scenePick)
            {
                var prePosition= BMGolbe.MeasureMultiLinePoints[BMGolbe.MeasureMultiLinePoints.length - 1];
                var len = Cesium.Cartesian3.distance(prePosition, scenePick);
                var labelTxt = "";
                if(len > 1001.0)
                {
                    labelTxt = (len / 1000.0).toFixed(3) + ' km';
                }
                else
                {
                    labelTxt = len.toFixed(2) + ' m';
                }
                //
                positions.setValue([prePosition,scenePick]);
                BMGolbe.scratchCartesianPt.x =( prePosition.x +scenePick.x)/2.0; 
                BMGolbe.scratchCartesianPt.y =( prePosition.y +scenePick.y)/2.0;
                BMGolbe.scratchCartesianPt.z =( prePosition.z +scenePick.z)/2.0;
                position.setValue(BMGolbe.scratchCartesianPt);
                //
                BMGolbe.MeasureMultiLineMouseMoveEntity.positon =position; 
                BMGolbe.MeasureMultiLineMouseMoveEntity.label.text = labelTxt;
                BMGolbe.MeasureMultiLineMouseMoveEntity.polyline.positions = positions;
            }
            BMGolbe.MeasureMultiLineMouseMoveEntity.show = true;
        }
     }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    //
    BMGolbe.MeasureMultiLineLengthHander.setInputAction(function(movement) {
        if(BMGolbe.MeasureMultiLinePoints.length > 1)
        {
            var len = 0;
            for(var i=1;i<BMGolbe.MeasureMultiLinePoints.length;++i)
            {
                var prePoint = BMGolbe.MeasureMultiLinePoints[i-1];
                var point = BMGolbe.MeasureMultiLinePoints[i];
                len += Cesium.Cartesian3.distance(prePoint, point);
            }
            var labelTxt = "";
            if(len > 1001.0)
            {
                labelTxt = "  total:" + (len / 1000.0).toFixed(3) + ' km';
            }
            else
            {
                labelTxt = "  total:" +len.toFixed(2) + ' m';
            }
            var newEnnn = AddEntityForMeasureMultiLineLength_Label(BMGolbe.MeasureMultiLinePoints[BMGolbe.MeasureMultiLinePoints.length -1],labelTxt);
            BMGolbe.MeasureMultiLineEntities.push(newEnnn);
        }
        BMGolbe.MeasureMultiLinePoints.splice(0,BMGolbe.MeasureMultiLinePoints.length);
        BMGolbe.MeasureMultiLineMouseMoveEntity.show = false;
     }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
     //
     BMGolbe.MeasureMultiLineLengthHander.setInputAction(function(movement) {
        BMSetOperateHanderType(0);
        BMGolbe.MeasureMultiLineEntities.forEach(function(en){BMGolbe.viewer.entities.remove(en);});
        BMGolbe.MeasureMultiLinePoints.splice(0,BMGolbe.MeasureMultiLinePoints.length);
        BMGolbe.MeasureMultiLineEntities.splice(0,BMGolbe.MeasureMultiLineEntities.length);
        BMGolbe.MeasureMultiLineMouseMoveEntity.show = false;
     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}