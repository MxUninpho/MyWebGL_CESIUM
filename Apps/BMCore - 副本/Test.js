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