//绘制半球
var viewer = new Cesium.Viewer('cesiumContainer');
var scene =  viewer.scene;
var originCarto = Cesium.Cartographic.fromDegrees(114,25,0);
var originPoint = scene.globe.ellipsoid.cartographicToCartesian(originCarto);
var point = viewer.entities.add({
    name : "originPoint",
    position : originPoint,
    point : {
        pixelSize : 5,
        color : Cesium.Color.RED,
        outlineColor : Cesium.Color.WHITE,
        outlineWidth : 2
    },
    label : {
        text : '半球',
        font : '14pt monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth : 2,
        verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
        pixelOffset : new Cesium.Cartesian2(0, -9)
    }
});
var ellipsoid = new Cesium.Ellipsoid(50000, 50000, 50000);
var modelmatrix = Cesium.Transforms.eastNorthUpToFixedFrame(originPoint);
var polygon = new Cesium.PolygonGeometry({
    polygonHierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray([
        90, 0.0,
         180.0, 0.0,
        90.0, 90.0
       
    ],ellipsoid)),
    vertexFormat : Cesium.MaterialAppearance.VERTEX_FORMAT,
    ellipsoid : ellipsoid,
    granularity : 0.1,
    extrudedHeight:1000
});
var polygonInstance = new Cesium.GeometryInstance({
    geometry:  polygon
});
scene.primitives.add(new Cesium.Primitive({
    geometryInstances: polygonInstance,
    modelMatrix : modelmatrix,
    appearance : new Cesium.MaterialAppearance({
        material :  Cesium.Material.fromType('Grid')
    })
}));


//绘制点---geometry
var viewer = new Cesium.Viewer('cesiumContainer');
var temppp = new Cesium.Cartesian3();
var pointNum = 1000000;
var positions = new Float64Array(pointNum*3);
for(var i=0;i<pointNum;++i)
{
    var px = Cesium.Math.randomBetween(0,180);
    var py = Cesium.Math.randomBetween(0,90);
    Cesium.Cartesian3.fromDegrees(px,py,10,Cesium.Ellipsoid.WGS84,temppp);
    positions[i*3 + 0] = temppp.x;
    positions[i*3 + 1] = temppp.y;
    positions[i*3 + 2] = temppp.z;
}
var geometry = new Cesium.Geometry({
  attributes : {
    position : new Cesium.GeometryAttribute({
      componentDatatype : Cesium.ComponentDatatype.DOUBLE,
      componentsPerAttribute : 3,
      values : positions
    })
  },
  primitiveType : Cesium.PrimitiveType.POINTS,
  boundingSphere : Cesium.BoundingSphere.fromVertices(positions)
});
var instanceTop = new Cesium.GeometryInstance({
  geometry : geometry,
     attributes : {
      color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
    }
});
viewer.scene.primitives.add(new Cesium.Primitive({
  geometryInstances : instanceTop,
    appearance :new Cesium.PerInstanceColorAppearance({flat : true,
                                                       vertexShaderSource:"attribute vec3 position3DHigh;attribute float batchId;attribute vec3 position3DLow;void main(){vec4 p = czm_computePosition();gl_Position = czm_modelViewProjectionRelativeToEye * p;gl_PointSize=1.0; }",
                                                       fragmentShaderSource:"void main() { gl_FragColor = vec4(1.0, 0.0,1.0,1.0);}"}),
    asynchronous:false,
    compressVertices:false
}));


////////////////////////////////////////////////////////////////////////////////
//绘制顶层物体
var defaults = {
depthTest : {
enabled : false
}
};
var rs = Cesium.RenderState.fromCache(defaults);
var instance = new Cesium.GeometryInstance({
geometry : new Cesium.EllipseGeometry({
center : Cesium.Cartesian3.fromDegrees(-74.00081302800248, 40.69314333714821),
semiMinorAxis : 500.0,
semiMajorAxis : 500.0
})
});
viewer.scene.primitives.add(new Cesium.Primitive({
geometryInstances : instance,
appearance : new Cesium.EllipsoidSurfaceAppearance({
material : Cesium.Material.fromType('Color'),
renderState:rs
})
}));

////////////////////////////////
//重写 viewer.prototype._onTick
var boundingSphereScratch = new Cesium.BoundingSphere();
Cesium.Viewer.prototype._onTick = function(clock) {
        var time = clock.currentTime;

        var isUpdated = this._dataSourceDisplay.update(time);
        if (this._allowDataSourcesToSuspendAnimation) {
            this._clockViewModel.canAnimate = isUpdated;
        }

        var entityView = this._entityView;
        if (Cesium.defined(entityView)) {
            var trackedEntity = this._trackedEntity;
            var trackedState = this._dataSourceDisplay.getBoundingSphere(trackedEntity, false, boundingSphereScratch);
            if (trackedState === Cesium.BoundingSphereState.DONE) {
                entityView.update(time, Cesium.boundingSphereScratch);
            }
        }

        var position;
        var enableCamera = false;
        var selectedEntity = this.selectedEntity;
        var showSelection = Cesium.defined(selectedEntity) && this._enableInfoOrSelection && !Cesium.defined(selectedEntity.notShowInfo);

        if (showSelection && selectedEntity.isShowing && selectedEntity.isAvailable(time)) {
            var state = this._dataSourceDisplay.getBoundingSphere(selectedEntity, true, boundingSphereScratch);
            if (state !== Cesium.BoundingSphereState.FAILED) {
                position = boundingSphereScratch.center;
            } else if (Cesium.defined(selectedEntity.position)) {
                position = selectedEntity.position.getValue(time, position);
            }
            enableCamera = Cesium.defined(position);
        }

        var selectionIndicatorViewModel = Cesium.defined(this._selectionIndicator) ? this._selectionIndicator.viewModel : undefined;
        if (Cesium.defined(selectionIndicatorViewModel)) {
            selectionIndicatorViewModel.position = Cesium.Cartesian3.clone(position, selectionIndicatorViewModel.position);
            selectionIndicatorViewModel.showSelection = showSelection && enableCamera;
            selectionIndicatorViewModel.update();
        }

        var infoBoxViewModel = Cesium.defined(this._infoBox) ? this._infoBox.viewModel : undefined;
        if (Cesium.defined(infoBoxViewModel)) {
            infoBoxViewModel.showInfo = showSelection;
            infoBoxViewModel.enableCamera = enableCamera;
            infoBoxViewModel.isCameraTracking = (this.trackedEntity === this.selectedEntity);

            if (showSelection ) {
                infoBoxViewModel.titleText = Cesium.defaultValue(selectedEntity.name, selectedEntity.id);
                infoBoxViewModel.description = Cesium.Property.getValueOrDefault(selectedEntity.description, time, '');
            } else {
                infoBoxViewModel.titleText = '';
                infoBoxViewModel.description = '';
            }
        }
    };
//
var viewer = new Cesium.Viewer('cesiumContainer');
var blueEllipsoid = viewer.entities.add({
    name : 'Blue ellipsoid',
    position: Cesium.Cartesian3.fromDegrees(-114.0, 40.0, 300000.0),
    ellipsoid : {
        radii : new Cesium.Cartesian3(200000.0, 200000.0, 300000.0),
        material : Cesium.Color.BLUE
    }
});
var redSphere = viewer.entities.add({
    name : 'Red sphere with black outline',
    position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
    ellipsoid : {
        radii : new Cesium.Cartesian3(300000.0, 300000.0, 300000.0),
        material : Cesium.Color.RED.withAlpha(0.5),
        outline : true,
        outlineColor : Cesium.Color.BLACK
    }
});
var outlineOnly = viewer.entities.add({
    name:"notshow",
    position: Cesium.Cartesian3.fromDegrees(-100.0, 40.0, 300000.0),
    ellipsoid : {
        radii : new Cesium.Cartesian3(200000.0, 200000.0, 300000.0),
        fill : false,
        outline : true,
        outlineColor : Cesium.Color.YELLOW,
        slicePartitions : 24,
        stackPartitions : 36
    }
});
outlineOnly.notShowInfo = 1;
viewer.zoomTo(viewer.entities);
//////////////////
//// 点云测试
var viewer = new Cesium.Viewer('cesiumContainer');
viewer.clock.currentTime = new Cesium.JulianDate(2457522.154792);
var tileset = new Cesium.Cesium3DTileset({ url: '../../../Specs/Data/Cesium3DTiles/PointCloud/Test0/tileset.json' ,
                                          shadows:false
                                          });
viewer.scene.primitives.add(tileset);
viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.0, -1.0, 50.0));
var styles = [];
function addStyle(name, style) {
    style.pointSize = Cesium.defaultValue(style.pointSize, 3.0);
    styles.push({
        name : name,
        style : style
    });
}
var minHei = 10;
var maxHei = 70;
var deltaHei = (maxHei - minHei)/21;
var conditonHei = [];
for(var iii = 0;iii < 21;++iii)
{
    var kkk = '${POSITION}[2] < ' + Number(minHei + deltaHei * iii).toString();
    conditonHei.push(kkk);
}
viewer.scene.globe.enableLighting = false;
addStyle('Test', {
    color : {
        conditions : [
            [conditonHei[0], "color('rgb(0, 0, 255)')"],
            [conditonHei[1], "color('rgb(0, 35, 220)')"],
            [conditonHei[2], "color('rgb(0, 70, 185)')"],
            [conditonHei[3], "color('rgb(0, 105, 150)')"],
            [conditonHei[4], "color('rgb(0, 140, 115)')"],
            [conditonHei[5], "color('rgb(0, 175, 80)')"],
            [conditonHei[6], "color('rgb(0, 215, 40)')"],
            [conditonHei[7], "color('rgb(0, 255, 0)')"],
            [conditonHei[8], "color('rgb(35, 255, 0)')"],
            [conditonHei[9], "color('rgb(70, 225, 0)')"],
            [conditonHei[10], "color('rgb(105, 255, 0)')"],
            [conditonHei[11], "color('rgb(140, 255, 0)')"],
            [conditonHei[12], "color('rgb(175, 255, 0)')"],
            [conditonHei[13], "color('rgb(215, 255, 0)')"],
            [conditonHei[14], "color('rgb(255, 255, 0)')"],
            [conditonHei[15], "color('rgb(255, 220, 0)')"],
            [conditonHei[16], "color('rgb(255, 185, 0)')"],
            [conditonHei[17], "color('rgb(255, 150, 0)')"],
            [conditonHei[18], "color('rgb(255, 115, 0)')"],
            [conditonHei[19], "color('rgb(255, 80, 0)')"],
            [conditonHei[20], "color('rgb(255, 40, 0)')"],
            ['true', "color('rgb(255, 0, 0)')"]
        ]
    }
});
tileset.readyPromise.then(function(tileset0) {
    // tile.properties is not defined until readyPromise resolves.
     tileset0.style = new Cesium.Cesium3DTileStyle(styles[0].style);
});
function setStyle(style) {
    return function() {
        tileset.style = new Cesium.Cesium3DTileStyle(style);
    };
}
var styleOptions = [];
for (var i = 0; i < styles.length; ++i) {
    var style = styles[i];
    styleOptions.push({
        text : style.name,
        onselect : setStyle(style.style)
    });
}
//Sandcastle.addToolbarMenu(styleOptions);
var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
var id = 0;
handler.setInputAction(function(movement) {
    var feature = viewer.scene.pick(movement.position);
    var jjjj = viewer.scene.pickPosition(movement.position);
    var jjjjjjj = Cesium.Cartographic.fromCartesian(jjjj);
    if (feature instanceof Cesium.Cesium3DTileFeature) {
        var propertyNames = feature.getPropertyNames();
        feature.pointSize = 10;
        feature.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);      
        console.log(feature);
        if(feature.hasProperty('id'))
        {
            console.log(feature.getProperty('id'));
            console.log(feature);
        }
        else
        {
            feature.setProperty('id',id);
            id++;
            console.log("setProperty ");
        }
        var length = propertyNames.length;
        for (var i = 0; i < length; ++i) {
            var propertyName = propertyNames[i];
            console.log(propertyName + ': ' + feature.getProperty(propertyName));
        }
    }
    //console.log(feature);
    console.log(jjjj);
    if(jjjjjjj.height < 0.0)
    {
        var ray = viewer.camera.getPickRay(movement.position);
        var intersection = viewer.scene.globe.pick(ray, viewer.scene);
        jjjjjjj.height = Cesium.Cartographic.fromCartesian(intersection).height;
    }
    //console.log(jjjjjjj.longitude * Cesium.Math.DEGREES_PER_RADIAN);
    //console.log(jjjjjjj.latitude * Cesium.Math.DEGREES_PER_RADIAN);
    console.log(jjjjjjj.height );
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);



 

