/** 初始化接口
 * @Fuction
 * @param {String} container DOM DIV ID
 * @param {Object} [options] 配置选项
 * @param {String} [options.BIMMode3DTileURL] BIM模型3DTile URL
 * @param {String} [options.Terrain3DTileURL] 地形模型3DTile URL
 * @param {Boolean} [options.UseOnLineGlobalTerrain = false] 使用默认在线全球地形数据---若提供Terrain3DTileURL 则不建议使用全球地形
 * @param {Number} [options.HomeView_West = 73.916] 经度（°）HOME视图范围 默认中国境内 
 * @param {Number} [options.HomeView_South = 15.336] 纬度（°）HOME视图范围 默认中国境内
 * @param {Number} [options.HomeView_East = 128.056] 经度（°）HOME视图范围 默认中国境内 
 * @param {Number} [options.HomeView_North = 49.746] 纬度（°）HOME视图范围 默认中国境内 
 * @example
 * <div id="cesiumContainer"></div> 
 * BMGIS_Init('cesiumContainer',{
 * BIMMode3DTileURL:'../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',
 * Terrain3DTileURL:'../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT_T/'
 * }) 
 */
function BMGIS_Init(container,options) {

    if (typeof container !== 'string') {
        throw new Cesium.DeveloperError('container is not string');
    }
    var foundElement = document.getElementById(container);
    if(foundElement === null){
        throw new Cesium.DeveloperError('Element with id "' + container + '" does not exist in the document.');
    }
    foundElement = null;
    //
    options = Cesium.defaultValue(options, {});
    //
    options.BIMMode3DTileURL = Cesium.defaultValue(options.BIMMode3DTileURL, "");
    options.Terrain3DTileURL = Cesium.defaultValue(options.Terrain3DTileURL, "");
    options.UseOnLineGlobalTerrain = Cesium.defaultValue(options.UseOnLineGlobalTerrain, false);
    //
    options.HomeView_West = Cesium.defaultValue(options.HomeView_West, 73.916);
    options.HomeView_South = Cesium.defaultValue(options.HomeView_South, 15.336);
    options.HomeView_East = Cesium.defaultValue(options.HomeView_East, 128.056);
    options.HomeView_North = Cesium.defaultValue(options.HomeView_North, 49.746);
    //
    BMInit(container,options);
}
//
/** 调整3DTileSet 高度
 * @Fuction
 * @param {String} tileURL 3Dtile URL 如果参数为空，则拉伸处地形外所有Tile
 * @param {Number} pullingHeight 拉伸高度
 * @example
 * BMGIS_Pulling3DTileHeight('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',100) 
 */
function BMGIS_Pulling3DTileHeight(tileURL,pullingHeight) {

    tileID = Cesium.defaultValue(tileURL, "");
    pullingHeight = Cesium.defaultValue(pullingHeight, 0.0);
    //
    if(pullingHeight === 0.0) return;
    //
    BMPulling3DTileHeight(tileURL,pullingHeight);
}
//
/** 添加3DTileSet
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Boolean} NeedZoomTo 是否缩放至此
 * @example
 * BMGIS_Add3DTile('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',false) 
 */
function BMGIS_Add3DTile(tileURL,NeedZoomTo) {

    tileURL = Cesium.defaultValue(tileURL, "");
    NeedZoomTo = Cesium.defaultValue(NeedZoomTo, false);
    //
    if(tileURL === "") return;
    //
    BMAdd3DTile(tileURL,NeedZoomTo);
}
//
/** 移除3DTileSet
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @example 
 * BMGIS_Remove3DTile('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/')  
 */
function BMGIS_Remove3DTile(tileURL) {

    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    //
    BMRemove3DTile(tileURL);
}
//
/** 显示\隐藏3DTileSet
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Boolean} visible 是否可见 
 * @example
 * BMGIS_Visible3DTile('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',true) 
 */
function BMGIS_Visible3DTile(tileURL,visible) {

    tileURL = Cesium.defaultValue(tileURL, "");
    visible = Cesium.defaultValue(visible,true);
    if(tileURL === "") return;
    //
    BMVisible3DTile(tileURL,visible);
}
//
/** 设置homeView
 * @Fuction
 * @param {Number} HomeView_West = 73.916 经度（°）HOME视图范围 默认中国境内 
 * @param {Number} HomeView_South = 15.336 纬度（°）HOME视图范围 默认中国境内
 * @param {Number} HomeView_East = 128.056 经度（°）HOME视图范围 默认中国境内 
 * @param {Number} HomeView_North = 49.746 纬度（°）HOME视图范围 默认中国境内  
 * @param {Boolean} NeedFlyTo = false 是否缩放至此
 * @example
 * BMGIS_SetHomeView(113.2002,23.0645,113.3807,23.1790,true) //广州范围
 */
function BMGIS_SetHomeView(HomeView_West,HomeView_South,HomeView_East,HomeView_North,NeedFlyTo) {

    HomeView_West = Cesium.defaultValue(HomeView_West, 73.916);
    HomeView_South = Cesium.defaultValue(HomeView_South,15.336);
    HomeView_East = Cesium.defaultValue(HomeView_East, 128.056);
    HomeView_North = Cesium.defaultValue(HomeView_North,49.746);
    NeedFlyTo = Cesium.defaultValue(NeedFlyTo,false);
    //
    BMSetHomeView(HomeView_West,HomeView_South,HomeView_East,HomeView_North,NeedFlyTo);
}
//
/** 缩放至矩形范围
 * @Fuction
 * @param {Number} Rectangle_West = 73.916  经度（°）默认中国境内 
 * @param {Number} Rectangle_South = 15.336 纬度（°）默认中国境内
 * @param {Number} Rectangle_East = 128.056 经度（°）默认中国境内 
 * @param {Number} Rectangle_North = 49.746 纬度（°）默认中国境内  
 * @example
 * BMGIS_FlyToRectangle(113.2002,23.0645,113.3807,23.1790) //广州范围
 */
function BMGIS_FlyToRectangle(Rectangle_West,Rectangle_South,Rectangle_East,Rectangle_North) {

    Rectangle_West = Cesium.defaultValue(Rectangle_West, 73.916);
    Rectangle_South = Cesium.defaultValue(Rectangle_South,15.336);
    Rectangle_East = Cesium.defaultValue(Rectangle_East, 128.056);
    Rectangle_North = Cesium.defaultValue(Rectangle_North,49.746);
    //
    BMFlyToRectangle(Rectangle_West,Rectangle_South,Rectangle_East,Rectangle_North);
}
//
/** 缩放至包围球范围
 * @Fuction
 * @param {Number} Sphere_longitude = 113.2599  经度（°） 
 * @param {Number} Sphere_latitude = 23.1324  纬度（°）
 * @param {Number} Sphere_height = 100 高度（m）
 * @param {Number} Sphere_radius = 5000  半径（m）  
 * @example
 * BMGIS_FlyToBoundingSphere(113.2599,23.1324,100,5000) //广州范围
 */
function BMGIS_FlyToBoundingSphere(Sphere_longitude,Sphere_latitude,Sphere_height,Sphere_radius) {

    Sphere_longitude = Cesium.defaultValue(Sphere_longitude, 113.2599);
    Sphere_latitude = Cesium.defaultValue(Sphere_latitude,23.1324);
    Sphere_height = Cesium.defaultValue(Sphere_height, 100);
    Sphere_radius = Cesium.defaultValue(Sphere_radius,5000);
    //
    BMFlyToBoundingSphere(Sphere_longitude,Sphere_latitude,Sphere_height,Sphere_radius);
}
//
/** 缩放至3DTileSet
 * @Fuction
 * @param {String} tileURL 3Dtile URL  
 * @example
 * BMGIS_FlyTo3DTile('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/') 
 */
function BMGIS_FlyTo3DTile(tileURL) {

    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    //
    BMFlyTo3DTile(tileURL);
}
//
/** 缩放至3DTileSet节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Number} tileNode_centerX 数据库中获取
 * @param {Number} tileNode_centerY 数据库中获取
 * @param {Number} tileNode_centerZ 数据库中获取
 * @param {Number} tileNode_radius 数据库中获取   
 * @example
 * BMGIS_FlyTo3DTileNode('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',-2317130.540275,5394349.186563,2484174.871629,5.700195) 
 */
function BMGIS_FlyTo3DTileNode(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius) {

    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    if (typeof tileNode_centerX !== 'number') return;
    if (typeof tileNode_centerY !== 'number') return;
    if (typeof tileNode_centerZ !== 'number') return;
    if (typeof tileNode_radius !== 'number') return;
    //
    BMFlyTo3DTileNode(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius);
}
/** 缩放至3DTileSet节点 并高亮节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Number} tileNode_centerX 数据库中获取
 * @param {Number} tileNode_centerY 数据库中获取
 * @param {Number} tileNode_centerZ 数据库中获取
 * @param {Number} tileNode_radius 数据库中获取   
 * @param {String[]} tileNode_GUIDs 数据库中获取---数组---  
 * @example
 * BMGIS_FlyTo3DTileNodeAddHighlight('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',-2317130.540275,5394349.186563,2484174.871629,5.700195,['1d227775-d8b6-4ba2-97d9-e55afd359bd1']) 
 */
function BMGIS_FlyTo3DTileNodeAddHighlight(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius,tileNode_GUIDs) {

    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    if (typeof tileNode_centerX !== 'number') return;
    if (typeof tileNode_centerY !== 'number') return;
    if (typeof tileNode_centerZ !== 'number') return;
    if (typeof tileNode_radius !== 'number') return;
    tileNode_GUIDs = Cesium.defaultValue(tileNode_GUIDs, []);
    if(tileNode_GUIDs.length === 0) return;
    //
    BMFlyTo3DTileNodeAddHighlight(tileURL,tileNode_centerX,tileNode_centerY,tileNode_centerZ,tileNode_radius,tileNode_GUIDs);
}
//
/** 开启\关闭 在线全球高程
 * @Fuction
 * @param {Boolean} UseOnLineGlobalTerrain = false 
 * @example
 * BMGIS_UseGlobalTerrain(true) 
 */
function BMGIS_UseGlobalTerrain(UseOnLineGlobalTerrain) {

    UseOnLineGlobalTerrain = Cesium.defaultValue(UseOnLineGlobalTerrain, false);
    //
    BMUseGlobalTerrain(UseOnLineGlobalTerrain);
}
//
/** 开启\关闭 地形深度测试---若关闭：当模型在地形之下时也会显示；若开启则不会显示
 * @Fuction
 * @param {Boolean} depthTest = false 
 * @example
 * BMGIS_DepthTestAgainstTerrain(false) 
 */
function BMGIS_DepthTestAgainstTerrain(depthTest) {

    depthTest = Cesium.defaultValue(depthTest, false);
    //
    BMDepthTestAgainstTerrain(depthTest);
}
//
/** 设置鼠标单击选中3DTileSet 节点事件回调函数
 * @Fuction
 * @param {Function} listener ---函数参数为 选中的GUID String
 * @example
 * 
 * BMGIS_SetMouseLeftClickSelect3DTileNodeEventListener(listener) 
 */
function BMGIS_SetMouseLeftClickSelect3DTileNodeEventListener(listener) {

    if (typeof listener !== 'function') return;
    //
    BMGSetMouseLeftClickSelect3DTileNodeEventListener(listener);
}
//
/** 设置鼠标单击 取消选中3DTileSet节点事件回调函数
 * @Fuction
 * @param {Function} listener  ---函数参数为 取消选中的GUID String
 * @example
 * 
 * BMGIS_SetMouseLeftClickUnSelect3DTileNodeEventListener(listener) 
 */
function BMGIS_SetMouseLeftClickUnSelect3DTileNodeEventListener(listener) {

    if (typeof listener !== 'function') return;
    //
    BMSetMouseLeftClickUnSelect3DTileNodeEventListener(listener);
}
//
/** 设置 取消高亮 事件回调 ---注意与 BMGIS_SetMouseLeftClickUnSelect3DTileNodeEventListener 区别
 * @Fuction
 * @param {Function} listener  ---无 函数参数
 * @example
 * 
 * BMGIS_SetUnHighlightListener(listener) 
 */
function BMGIS_SetUnHighlightListener(listener) {

    if (typeof listener !== 'function') return;
    //
    BMSetUnHighlightListener(listener);
}
//
/** 设置3DTileSet节点颜色
 * @Fuction
 * @param {String} tileURL 3Dtile URL
 * @param {Number} colorR 颜色[0-1]
 * @param {Number} colorG 颜色[0-1]
 * @param {Number} colorB 颜色[0-1]
 * @param {Number} colorA 颜色[0-1] 0完全透明   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 * @example
 * 
 * BMGIS_Set3DTileNodeColor('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',1,1,0,1,['1d227775-d8b6-4ba2-97d9-e55afd359bd1']) 
 */
function BMGIS_Set3DTileNodeColor(tileURL,colorR,colorG,colorB,colorA,tileNode_GUIDs)
{
    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    if (typeof colorR !== 'number') return;
    if (typeof colorG !== 'number') return;
    if (typeof colorB !== 'number') return;
    if (typeof colorA !== 'number') return;
    tileNode_GUIDs = Cesium.defaultValue(tileNode_GUIDs, []);
    if(tileNode_GUIDs.length === 0) return;
    //
    BMSet3DTileNodeColor(tileURL,colorR,colorG,colorB,colorA,tileNode_GUIDs);
}
//
/** 重置3DTileSet节点颜色
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 * @example
 * 
 * BMGIS_Reset3DTileNodeColor('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',['1d227775-d8b6-4ba2-97d9-e55afd359bd1']) 
 */
function BMGIS_Reset3DTileNodeColor(tileURL,tileNode_GUIDs)
{
    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    tileNode_GUIDs = Cesium.defaultValue(tileNode_GUIDs, []);
    if(tileNode_GUIDs.length === 0) return;
    //
    BMReset3DTileNodeColor(tileURL,tileNode_GUIDs);
}
//
/** 显示3DTileSet节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 * @example
 * 
 * BMGIS_Show3DTileNode('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',['1d227775-d8b6-4ba2-97d9-e55afd359bd1']) 
 */
function BMGIS_Show3DTileNode(tileURL,tileNode_GUIDs)
{
    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    tileNode_GUIDs = Cesium.defaultValue(tileNode_GUIDs, []);
    if(tileNode_GUIDs.length === 0) return;
    //
    BMShow3DTileNode(tileURL,tileNode_GUIDs);
}
//
/** 隐藏3DTileSet节点
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {String[]} tileNode_GUIDs 节点GUID 数据库中获取---数组--- 
 * @example
 * 
 * BMGIS_Hide3DTileNode('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',['1d227775-d8b6-4ba2-97d9-e55afd359bd1']) 
 */
function BMGIS_Hide3DTileNode(tileURL,tileNode_GUIDs)
{
    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    tileNode_GUIDs = Cesium.defaultValue(tileNode_GUIDs, []);
    if(tileNode_GUIDs.length === 0) return;
    //
    BMHide3DTileNode(tileURL,tileNode_GUIDs);
}
//
/** 设置高亮颜色
 * @Fuction
 * @param {Number} colorR 颜色[0-1]
 * @param {Number} colorG 颜色[0-1]
 * @param {Number} colorB 颜色[0-1]
 * @param {Number} colorA 颜色[0-1] 0完全透明
 * @example
 * 
 * BMGIS_SetSelectColor(0,0,1,1) 
 */
function BMGIS_SetSelectColor(colorR,colorG,colorB,colorA)
{
    if (typeof colorR !== 'number') return;
    if (typeof colorG !== 'number') return;
    if (typeof colorB !== 'number') return;
    if (typeof colorA !== 'number') return;
    //
    BMSetSelectColor(colorR,colorG,colorB,colorA);
}
//
/** 设置3DTileSet 屏幕误差---值越大 则相同相机位置 显示的模型越少，反之越多
 * @Fuction
 * @param {String} tileURL 3Dtile URL   
 * @param {Number} ScreenSpaceError = 200 误差值[16-500]
 * @example
 * 
 * BMGIS_SetScreenSpaceErrorr('../Specs/Data/Cesium3DTiles/Batched/B3DMTEST/GZDT/',100) 
 */
function BMGIS_SetScreenSpaceErrorr(tileURL,ScreenSpaceError)
{
    tileURL = Cesium.defaultValue(tileURL, "");
    if(tileURL === "") return;
    ScreenSpaceError = Cesium.defaultValue(ScreenSpaceError,200);
    //
    BMSetScreenSpaceErrorr(tileURL,ScreenSpaceError);
}
//
/** 设置漫游路径
 * @Fuction
 * @param {Number[]} Datas 路径点数组 经度0,纬度0,高度0,经度1,纬度1,高度1……  
 * @param {Number} RoamingSpeed = 200 漫游速度(m/s)
 * @param {Number} offsetHeight = 10 路径点高度值偏移量m（每个点的高度值 += offsetHeight）
 * @example
 * 
 * BMGIS_Roaming([122,23,0,123,23,0,……],200,10) 
 */
function BMGIS_Roaming(Datas,RoamingSpeed,offsetHeight)
{
    if(!(Datas instanceof Array)) return;
    if(Datas.length  < 6) return;
    if(Datas.length % 3 !== 0) return;
    RoamingSpeed = Cesium.defaultValue(RoamingSpeed, 200);
    offsetHeight = Cesium.defaultValue(offsetHeight, 10);
    //
    BMRoaming(Datas,RoamingSpeed,offsetHeight);
}
/** 暂停漫游
 * @Fuction
 */
function BMGIS_PauseRoaming()
{
    BMPauseRoaming();
}
/** 开始漫游
 * @Fuction
 */
function BMGIS_StartRoaming()
{
    BMStartRoaming();
}
/** 加速 当前速度的1.1倍
 * @Fuction
 */
function BMGIS_AccelerateRoaming()
{
    BMAccelerateRoaming();
}
/** 减速 当前速度的0.9倍
 * @Fuction
 */
function BMGIS_DecelerateRoaming()
{
    BMDecelerateRoaming();
}
/** 停止漫游---删除漫游路径，需要重新调用 BMGIS_Roaming()函数
 * @Fuction
 */
function BMGIS_StopRoaming()
{
    BMStopRoaming();
}
/** 显示\隐藏漫游路径线
 * @Fuction
 * @param {Boolean} LineVisible = true 
 * @example
 * 
 * BMGIS_SetRoamingLineVisibility(true) 
 */
function BMGIS_SetRoamingLineVisibility(LineVisible)
{
    LineVisible = Cesium.defaultValue(LineVisible, true);
    BMSetRoamingLineVisibility(LineVisible);
}
/** 获取 漫游位置偏移
 * @Fuction
 * @returns {Number} 
 */
function BMGIS_GetRoamingPosiOffset()
{
    return BMGetRoamingPosiOffset();
}
/** 设置 漫游位置偏移
 * @Fuction
 * @param {Number} newOffset
 */
function BMGIS_SetRoamingPosiOffset(newOffset)
{
    newOffset = Cesium.defaultValue(newOffset, 0);
    BMSetRoamingPosiOffset(newOffset);
}
/** 获取 漫游视线偏移
 * @Fuction
 * @returns {Number} 
 */
function BMGIS_GetRoamingEyeAngleOffset()
{
    return BMGetRoamingEyeAngleOffset();
}
/** 设置 漫游视线偏移
 * @Fuction
 * @param {Number} newOffset  -90度 至 90度 
 */
function BMGIS_SetRoamingEyeAngleOffset(newOffset)
{
    newOffset = Cesium.defaultValue(newOffset, 0);
    if(newOffset >= 90 || newOffset <= -90) return;
    BMSetRoamingEyeAngleOffset(newOffset);
}
/** 显示\隐藏 影像路网标注图层
 * @Fuction
 * @param {Boolean} Visible = true 
 * @example
 * 
 * BMGIS_AnnotationLayerVisibility(true) 
 */
function BMGIS_AnnotationLayerVisibility(Visible)
{
    Visible = Cesium.defaultValue(Visible, true);
    BMAnnotationLayerVisibility(Visible);
}
/** 添加 场景图片标签
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
 * @param {Boolean} [options.ShowLabelPoint = true] 标注位置点
 * @param {Number} [options.minVisibleDis = 1.0] 最小显示距离---图片位置与相机位置的距离---小于该距离 标签不显示
 * @param {Number} [options.maxVisibleDis = 2e6] 最大显示距离---图片位置与相机位置的距离---大于该距离 标签不显示 
 * 
 * @returns {String} lableID
 * @example
 * 
 * BMGIS_AddEntityImageLabel(113.2599, 23.1324,10,"./TestImage/cesium_credit.png") 
 */
function BMGIS_AddEntityImageLabel(Pos_longitude,Pos_latitude,Pos_height,imageURL,options)
{
    imageURL = Cesium.defaultValue(imageURL, "");
    if(imageURL === "") return -1;
    if (typeof Pos_longitude !== 'number') return -1;
    if (typeof Pos_latitude !== 'number') return -1;
    if (typeof Pos_height !== 'number') return -1;
    //
    options = Cesium.defaultValue(options, {});
    options.colorR = Cesium.defaultValue(options.colorR, 1.0);
    options.colorG = Cesium.defaultValue(options.colorG, 1.0);
    options.colorB = Cesium.defaultValue(options.colorB, 1.0);
    options.colorA = Cesium.defaultValue(options.colorA, 1.0);
    options.ShowLabelPoint = Cesium.defaultValue(options.ShowLabelPoint, true);
    options.minVisibleDis = Cesium.defaultValue(options.minVisibleDis, 1.0);
    options.maxVisibleDis = Cesium.defaultValue(options.maxVisibleDis, 2e6);
    //
    return BMAddEntityImageLabel(Pos_longitude,Pos_latitude,Pos_height,imageURL,options);
}
/** 添加 场景文字标签
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
 * @param {Boolean} [options.ShowLabelPoint = true] 标注位置点
 * @param {Number} [options.minVisibleDis = 1.0] 最小显示距离---图片位置与相机位置的距离---小于该距离 标签不显示
 * @param {Number} [options.maxVisibleDis = 2e6] 最大显示距离---图片位置与相机位置的距离---大于该距离 标签不显示 
 * 
 * @returns {String} lableID
 * @example
 * 
 * BMGIS_AddEntityTextLabel(113.2599, 23.1324,10,"文字标签") 
 */
function BMGIS_AddEntityTextLabel(Pos_longitude,Pos_latitude,Pos_height,text,options)
{
    text = Cesium.defaultValue(text, "");
    if(text === "") return -1;
    if (typeof Pos_longitude !== 'number') return -1;
    if (typeof Pos_latitude !== 'number') return -1;
    if (typeof Pos_height !== 'number') return -1;
    //
    options = Cesium.defaultValue(options, {});
    options.colorR = Cesium.defaultValue(options.colorR, 1.0);
    options.colorG = Cesium.defaultValue(options.colorG, 1.0);
    options.colorB = Cesium.defaultValue(options.colorB, 1.0);
    options.colorA = Cesium.defaultValue(options.colorA, 1.0);
    options.font = Cesium.defaultValue(options.font, '30px sans-serif');
    options.ShowLabelPoint = Cesium.defaultValue(options.ShowLabelPoint, true);
    options.minVisibleDis = Cesium.defaultValue(options.minVisibleDis, 1.0);
    options.maxVisibleDis = Cesium.defaultValue(options.maxVisibleDis, 2e6);
    //
    return BMAddEntityTextLabel(Pos_longitude,Pos_latitude,Pos_height,text,options);
}
/** 修改 场景文字标签---修改标签位置、颜色、文字内容、显示隐藏
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
 * 
 * @example
 * 
 * BMGIS_EditEntityTextLabel("IDDDDDDDDDDDD",{
   text:"修改后内容"
  }) 
 * BMGIS_EditEntityTextLabel("IDDDDDDDDDDDD",{
    Pos_longitude:102
    Pos_latitude:20,
    Pos_height:10
  }) 
 * BMGIS_EditEntityTextLabel("IDDDDDDDDDDDD",{
    colorR:1.0
    colorG:0.0,
    colorB:0.0,
    colorA:1.0
  }) 
 * BMGIS_EditEntityTextLabel("IDDDDDDDDDDDD",{
    Show:false
  }) 
 */
function BMGIS_EditEntityTextLabel(lableID,options)
{
    lableID = Cesium.defaultValue(lableID, "");
    if(lableID === "") return;
    options = Cesium.defaultValue(options, {});
    //
    BMEditEntityTextLabel(lableID,options);
}
/** 修改 场景图片标签---修改标签位置、颜色、图片URL、显示隐藏
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
 * 
 * @example
 * 
 * BMGIS_EditEntityImageLabel("IDDDDDDDDDDDD",{
   imageURL:"./TestImage/google_earth_credit.png"
  }) 
 * BMGIS_EditEntityImageLabel("IDDDDDDDDDDDD",{
    Pos_longitude:102
    Pos_latitude:20,
    Pos_height:10
  }) 
 * BMGIS_EditEntityImageLabel("IDDDDDDDDDDDD",{
    colorR:1.0
    colorG:0.0,
    colorB:0.0,
    colorA:1.0
  }) 
 * BMGIS_EditEntityImageLabel("IDDDDDDDDDDDD",{
    Show:false
  }) 
 */
function BMGIS_EditEntityImageLabel(lableID,options)
{
    lableID = Cesium.defaultValue(lableID, "");
    if(lableID === "") return;
    options = Cesium.defaultValue(options, {});
    //
    BMEditEntityImageLabel(lableID,options);
}
/** 删除 场景标签
 * @Fuction
 * @param {String} lableID 标签ID  
 * 
 * @example
 * 
 * BMGIS_DeleteEntityLabel("IDDDDDDDDDDDD") 
 */
function BMGIS_DeleteEntityLabel(lableID)
{
    lableID = Cesium.defaultValue(lableID, "");
    if(lableID === "") return;
    //
    BMDeleteEntityLabel(lableID);
}
/** 删除 所有场景标签
 * @Fuction
 * @param {Number} labelType 0图片标签、1文本标签、2both
 * @example
 * 
 * BMGIS_DeleteAllEntityLabel(2) 
 */
function BMGIS_DeleteAllEntityLabel(labelType)
{
    if(labelType !== 0 && labelType !== 1 && labelType !== 2) return;
    //
    BMDeleteAllEntityLabel(labelType);
}
/** 显示\隐藏 所有场景标签
 * @Fuction
 * @param {Number} labelType 0图片标签、1文本标签、2both
 * @param {Boolean} Show 显示隐藏
 * @example
 * 
 * BMGIS_VisibleAllEntityLabel(2,false) 
 */
function BMGIS_VisibleAllEntityLabel(labelType,Show)
{
    if(labelType !== 0 && labelType !== 1 && labelType !== 2) return;
    Show = Cesium.defaultValue(Show, true);
    //
    BMVisibleAllEntityLabel(labelType,Show);
}
/** 设置鼠标单击  场景图标标签 事件回调函数
 * @Fuction
 * @param {Function} listener  ---函数参数为 选中的图片标签ID String
 * @example
 * 
 * BMGIS_SetMouseLeftClickImageLabelEventListener(listener) 
 */
function BMGIS_SetMouseLeftClickImageLabelEventListener(listener) {

    if (typeof listener !== 'function') return;
    //
    BMSetMouseLeftClickImageLabelEventListener(listener);
}
/** 设置鼠标单击  场景文字标签 事件回调函数
 * @Fuction
 * @param {Function} listener  ---函数参数为 选中的文字标签ID String
 * @example
 * 
 * BMGIS_SetMouseLeftClickTextLabelEventListener(listener) 
 */
function BMGIS_SetMouseLeftClickTextLabelEventListener(listener) {

    if (typeof listener !== 'function') return;
    //
    BMSetMouseLeftClickTextLabelEventListener(listener);
}
/** 添加 DIV标签
 * @Fuction
 * @param {Number} Pos_longitude 经度（°） 
 * @param {Number} Pos_latitude 纬度（°）
 * @param {Number} Pos_height 高度（m）
 * 
 * @returns {DOM} DIVElement
 * @example
 * 
 * BMGIS_AddDIVLabel(113.2599, 23.1324,10) 
 */
function BMGIS_AddDIVLabel(Pos_longitude,Pos_latitude,Pos_height)
{
    if (typeof Pos_longitude !== 'number') return null;
    if (typeof Pos_latitude !== 'number') return null;
    if (typeof Pos_height !== 'number') return null;
    //
    return BMAddDIVLabel(Pos_longitude,Pos_latitude,Pos_height);
}



