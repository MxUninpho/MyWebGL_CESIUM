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
//谷歌影像图层
BMGolbe.imageGooglemap = createGoogleMapsByUrl(Cesium,{url:"http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}"});
//天地图注记图层
BMGolbe.imageLabel = new Cesium.WebMapTileServiceImageryProvider({
        url : 'http://{s}.tianditu.com/cia_w/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=cia&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles',
        layer : 'cia',
        style : 'default',
        format : 'tiles',
        maximumLevel: 18,
        tileMatrixSetID : 'w',
        credit : new Cesium.Credit('天地图全球影像中文注记服务'),
        subdomains : ['t0','t1','t2','t3','t4','t5','t6','t7']
    });
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
BMGolbe.RoamingEntiy = undefined;
BMGolbe.RoamingLineVisible = true;
BMGolbe.RoamingLineMaterialGlow = new Cesium.PolylineGlowMaterialProperty({ glowPower : 0.5,color : Cesium.Color.PALETURQUOISE });
BMGolbe.RoamingLineMaterialColor = new Cesium.Color(0.0,0.0,0.0,0.0);
//图片标签根节点
BMGolbe.ImageLabelRoot = new Cesium.Entity();
//文字标签根节点
BMGolbe.TextLabelRoot = new Cesium.Entity();
BMGolbe.LabelPixelOffset = new Cesium.Cartesian2(0,-10);
//
BMGolbe.scratchCartesianPt = new Cesium.Cartesian3(0, 0,0);
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
    //
    var imageryLayers = BMGolbe.viewer.imageryLayers;
    BMGolbe.viewer.scene.globe.depthTestAgainstTerrain = false;
    BMGolbe.imageGooglemap = imageryLayers.addImageryProvider(BMGolbe.imageGooglemap);
    BMGolbe.imageLabel= imageryLayers.addImageryProvider(BMGolbe.imageLabel);
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
    latEle.style.cssText = "color:Yellow;width:200px;height:30px;float:left;left:50%;bottom:0.5%;position:absolute;z-index:3"; 
    var altEle = document.createElement('div');
    altEle.innerHTML = '视角高：<span id="altitude_show"></span>';
    altEle.style.cssText = "color:Yellow;width:240px;height:30px;float:left;left:75%;bottom:0.5%;position:absolute;z-index:4"; 
    rootDOM.appendChild(lonEle);
    rootDOM.appendChild(latEle);
    rootDOM.appendChild(altEle);
    //
    var longitude_show=document.getElementById('longitude_show');
    var latitude_show=document.getElementById('latitude_show');
    var altitude_show=document.getElementById('altitude_show');
    var canvas=BMGolbe.viewer.scene.canvas;
    var ellipsoid=BMGolbe.viewer.scene.globe.ellipsoid;
    //
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);
    handler.setInputAction(function(movement){
        var cartesian=BMGolbe.viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if(cartesian){
            var cartographic=BMGolbe.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            var lat_String=Cesium.Math.toDegrees(cartographic.latitude).toFixed(8);
            var log_String=Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
            var alti_String=(BMGolbe.viewer.camera.positionCartographic.height/1000).toFixed(4);
            longitude_show.innerHTML=log_String + '\u00B0';
            latitude_show.innerHTML=lat_String + '\u00B0';
            altitude_show.innerHTML=alti_String + 'km';
        }
    },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    BMGolbe.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    //
    // BMGolbe.viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        
    //     var cartesian=BMGolbe.viewer.camera.pickEllipsoid(movement.position);
    //     if(cartesian){
            
    //         var cartographic=BMGolbe.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            
    //         var lat_String=Cesium.Math.toDegrees(cartographic.latitude);
    //         var log_String=Cesium.Math.toDegrees(cartographic.longitude);
    //         var alti_String=cartographic.height;
    //         //
    //         console.log(log_String+ "," + lat_String + "," + alti_String+ ",");
    //     }
    // },Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //

    handler.setInputAction(function onLeftClick(movement) {
        //
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
                BMGolbe.Select3DTileNodeEvent.raiseEvent(guid);
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    ////
    function computeCircle(radius) {
        var positions = [];
        for (var i = 0; i < 360; i++) {
          var radians = Cesium.Math.toRadians(i);
          positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
        }
        return positions;
      }
      //
    // var llll =  new Cesium.PolylineVolumeGeometry({
    //     polylinePositions : Cesium.Cartesian3.fromDegreesArray([
    //         113.3666, 23.1130,
    //         113.3153, 23.1158,
    //         113.3148, 23.1404
    //     ]),
    //     shapePositions:computeCircle(10),
    //     material : Cesium.Color.RED
    //   });
  
    // BMGolbe.viewer.scene.primitives.add(new Cesium.ClassificationPrimitive({
    //     geometryInstances : new Cesium.GeometryInstance({
    //         geometry : Cesium.PolylineVolumeGeometry.createGeometry(llll),
    //         attributes : {
    //             color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED),
    //         },
    //         id : 'volume'
    //     }),
    //     classificationType : Cesium.ClassificationType.BOTH
    // }));
    // var llll =  new Cesium.CorridorGeometry({
    //     vertexFormat : Cesium.VertexFormat.POSITION_ONLY,
    //     positions : Cesium.Cartesian3.fromDegreesArray([
    //         113.3666, 23.1130,
    //         113.3153, 23.1158,
    //         113.3148, 23.1404
    //     ]),
    //     width:10
    //   });
    // BMGolbe.viewer.scene.primitives.add(new Cesium.GroundPrimitive({
    //     geometryInstances : new Cesium.GeometryInstance({
    //         geometry : llll
    //     }),
    //     classificationType : Cesium.ClassificationType.BOTH
    // }));
    //
   // BMGolbe.viewer.scene.screenSpaceCameraController.tiltEventTypes = Cesium.CameraEventType.RIGHT_DRAG  ;
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
        BMGolbe.UnSelect3DTileNodeEvent.raiseEvent(guid);
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
    if(BMGolbe.RoamingEntiy !== undefined)
    {
        BMGolbe.viewer.entities.remove(BMGolbe.RoamingEntiy);
        BMGolbe.RoamingEntiy = undefined;
    }
    BMGolbe.viewer.trackedEntity = undefined;
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
        totalLen += _len;
        var _time = totalLen / RoamingSpeed;
        arryTimes[i+1] = Cesium.JulianDate.addSeconds(startTime,_time,new Cesium.JulianDate());
    }
    //
    var positionProperty = new Cesium.SampledPositionProperty();
    var PointGraphic = new Cesium.PointGraphics({
        pixelSize:2
    });
    var PathGraphic;
    if(BMGolbe.RoamingLineVisible)
    {
        PathGraphic= new Cesium.PathGraphics({
            width:4,
            material : BMGolbe.RoamingLineMaterialGlow
        });
    }
    else
    {
        PathGraphic= new Cesium.PathGraphics({
            width:1,
            material : BMGolbe.RoamingLineMaterialColor
        });
    }
    //
    positionProperty.addSamples(arryTimes,arryPts);
    var entity = new Cesium.Entity({
        id:"BMRoaming",
        name:"BMRoaming",
        position:positionProperty,
        point:PointGraphic,
        availability: new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: arryTimes[0],
                stop: arryTimes[numPt-1]
            })]),
        path:PathGraphic
    });
    //
    BMGolbe.RoamingEntiy = entity;
    BMGolbe.viewer.entities.add(entity);
    BMGolbe.viewer.trackedEntity = entity;
    BMGolbe.viewer.clock.shouldAnimate = true;
    BMGolbe.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    BMGolbe.viewer.clock.startTime = startTime;
    BMGolbe.viewer.clock.currentTime = startTime;
    BMGolbe.viewer.clock.stopTime = arryTimes[numPt-1];
}
//
/** 暂停漫游
 * @Fuction
 */
function BMPauseRoaming()
{
    BMGolbe.viewer.clock.shouldAnimate = false;
}
/** 开始漫游
 * @Fuction
 */
function BMStartRoaming()
{
    BMGolbe.viewer.clock.shouldAnimate = true;
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
    if(BMGolbe.RoamingEntiy !== undefined)
    {
        BMGolbe.viewer.entities.remove(BMGolbe.RoamingEntiy);
        BMGolbe.RoamingEntiy = undefined;
    }
    BMGolbe.viewer.trackedEntity = undefined;
}
/** 显示\隐藏漫游路径线
 * @Fuction
 * @param {Boolean} LineVisible = true 
 */
function BMSetRoamingLineVisibility(LineVisible)
{
    BMGolbe.RoamingLineVisible = LineVisible;
    if(LineVisible)
    {
        if(BMGolbe.RoamingEntiy !== undefined)
            BMGolbe.RoamingEntiy.path.material = BMGolbe.RoamingLineMaterialGlow;
    }
    else
    {
        if(BMGolbe.RoamingEntiy !== undefined)
            BMGolbe.RoamingEntiy.path.material = BMGolbe.RoamingLineMaterialColor;
    }
    
}
/** 显示\隐藏 影像路网标注图层
 * @Fuction
 * @param {Boolean} Visible = true 
 */
function BMAnnotationLayerVisibility(Visible)
{
    BMGolbe.imageLabel.show = Visible;
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
     return newEntity.id;
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
        BMGolbe.UnSelect3DTileNodeEvent.raiseEvent(guid);
    }
}

