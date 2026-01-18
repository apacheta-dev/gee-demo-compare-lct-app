/** 
* App:  Land Cover Transitions Comparison Tool  
*/

/* Boundaries with precaclulated statistics */
var ftc0 = ee.FeatureCollection('projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/HTI_LC_Precal_Level0_v1'),
    ftc1 = ee.FeatureCollection('projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/HTI_LC_Precal_Level1_v1'),
    ftc2 = ee.FeatureCollection('projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/HTI_LC_Precal_Level1_v1');  

// Add coordinates for points you want to visualize in the points selector for quick localization
var demoPoints = {
    'Point 1': { lon: -72.49287, lat: 19.144502 },
};

var imgLCESA = ee.Image('users/projectgeffao/World/ESA_2021_v200_9cat_World');
//https://gee-community-catalog.org/projects/S2TSLULC/#class-definitions
var imcLCESRI = ee.ImageCollection("projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS");
var imgLCESRI = ee.ImageCollection(imcLCESRI.filterDate('2023-01-01', '2023-12-31').mosaic()).map(
    function remapper(image) {
        var remapped = image.remap([1, 2, 4, 5, 7, 8, 9, 10, 11], [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        return remapped;
    });

/** Modules */
var mdlLegends = require('users/apacheta/lct-demo:app-lct/legends.js');
var mdlPrecalculation = require('users/apacheta/lct-demo:app-lct/precalculation.js');
var mdlLocalization = require('users/apacheta/lct-demo:app-lct/localization.js');


initApp('English');

function initApp(lan) {

    /*******************************************************************************
    * 1-Model *
    ******************************************************************************/

    // JSON object for storing the data model.
    var m = {};
    m.labels = mdlLocalization.getLocLabels(lan, mdlLocalization.labels);
    m.evalSet = {};
    m.maxAreaHa = 10000000;
    m.imgCustom = ee.Image(0).selfMask();

    // Transitions sources from precalculation script
    m.transitionsSources = mdlPrecalculation.lcSources;
    // Land Cover comparison sources from precalculation script
    m.lcSources = mdlPrecalculation.lcSources;

    // More info & contact
    m.info = {
        referenceDocUrl: '',
        contact1: 'contact@',
        contactEmail1: 'contact@',
        contact2: '',
        contactEmail2: '',
        contact3: '',
        contactEmail3: '',
    };

    // Feature collections options to click on the map to obtain precalculated statistics
    m.assetsClick = {};
    m.assetsClick[m.labels.lblNone] = null;
    m.assetsClick[m.labels.lblLevel1] = ftc1;
    // Feature collection used to query on map click
    m.ftcClickOn = null;



    // Layers Visualization Parameters
    m.lv = {

        borderLevel1: { vis: { color: 'black', fillColor: '00000000', width: 1 } },
        borderLevel2: { vis: { color: '#838888', fillColor: '00000000', width: 1 } },
        borderLevelAreasProyectoAIDER: { vis: { color: 'green', fillColor: '00000000', width: 1 } },
        borderLevelRegions: { vis: { color: 'pink', fillColor: '00000000', width: 1 } },
        borderLevelBasins: { vis: { color: 'blue', fillColor: '00000000', width: 1 } },
        highlight: { vis: { color: 'purple', fillColor: '00000000' } },
        lcESA: {
            vis: {
                min: 1, max: 9, opacity: 1,
                palette: ['#377e3f', '#f096ff', '#A7D282', '#c19511', '#fcdb00', '#d7191c', '#cfdad2', '#18eebe', '#4458eb'],
            },
            names: [
                m.labels.lblTreeCovered,
                m.labels.lblMangrove,
                m.labels.lblShrubland,
                m.labels.lblGrassland,
                m.labels.lblCropland,
                m.labels.lblArtificial,
                m.labels.lblOtherLand,
                m.labels.lblWetland,
                m.labels.lblWaterbody,
            ]
        },
        lcESRI: {
            vis: {
                min: 1, max: 9, opacity: 1,
                palette: ["#1A5BAB", "#358221", "#87D19E", "#FFDB5C", "#ED022A", "#EDE9E4", "#F2FAFF", "#C8C8C8", "#C6AD8D"],

            },
            names: [
                m.labels.lblWater,
                m.labels.lblTrees,
                m.labels.lblFloodedVegetation,
                m.labels.lblCrops,
                m.labels.lblBuiltArea,
                m.labels.lblBareGround,
                m.labels.lblSnowIce,
                m.labels.lblClouds,
                m.labels.lblRangelands,
            ]
        },
        custom: { vis: { max: 1, min: 1, opacity: 1, palette: ['#FF00FF'] } },
        equalMask: { vis: { max: 1, min: 1, opacity: 1, palette: ['#FFFFFF'] } },


    };


    // Map layers configuration
    m.layerEntries = {};

    // General layers entries
    m.layerEntries.gl = [
        {
            asset: ftc1,
            style: m.lv.borderLevel1.vis,
            name: m.labels.lblLevel1,
            visible: false,
            legend: null,
            group: 'FEATURES',
            singleColor: 'SQUARE',
        },


    ];
    // Other LC world layers entries
    m.layerEntries.lcOther = [
        {
            asset: imgLCESA.clip(ftc0),
            style: m.lv.lcESA.vis,
            name: m.labels.lblESA10m2021,
            visible: false,
            legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblESA10m2021, m.lv.lcESA.names, m.lv.lcESA.vis.palette, false, false),
            group: 'RASTER',
        },
        {
            asset: imgLCESRI.mosaic().clip(ftc0),
            style: m.lv.lcESRI.vis,
            name: m.labels.lblESRI10m2023,
            visible: false,
            legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblESRI10m2023, m.lv.lcESRI.names, m.lv.lcESRI.vis.palette, false, false),
            group: 'RASTER',
        },

    ];

    // LC comparison entries
    m.layerEntries.lc = [];

    // Multicriteria options for analysis
    m.mcOptions = [];

    // Names from map stack
    m.namesLayers = [];

    /*******************************************************************************
    * 2-Components *
    ******************************************************************************/

    // JSON object for storing UI components.
    var c = {};
    // Root Container Panel 
    c.pnlRoot = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal'),
        style: { height: '100%', width: '100%', }, // todo panel dimensions if set in style does not work as expected   
    });

    // Left panel
    c.lp = {};
    c.lp.pnlControl = ui.Panel({ style: { height: '100%', width: '20%' } });
    // Center panel
    c.cp = {};
    c.cp.pnlMap = ui.Panel({ style: { height: '100%', width: '70%' } });
    // Right panel
    c.rp = {};
    c.rp.pnlOutput = ui.Panel({ style: { height: '100%', width: '30%' } });

    // Split panel (Map & Output Panel)
    c.sppMapOutput = ui.SplitPanel(c.cp.pnlMap, c.rp.pnlOutput);

    // Left Panel - Logo & Contact section 
    c.lp.info = {};
    c.lp.info.lblIntro = ui.Label(m.labels.lblTitle);
    c.lp.info.lblApp = ui.Label(m.labels.lblExpl1);
    c.lp.info.lblAppDev = ui.Label(m.labels.lblAppDeveloped);
    c.lp.info.lblEmail1 = ui.Label(m.info.contact1).setUrl('mailto:' + m.info.contactEmail1);
    c.lp.info.lblEmail2 = ui.Label(m.info.contact2).setUrl('mailto:' + m.info.contactEmail2);
    c.lp.info.lblEmail3 = ui.Label(m.info.contact3).setUrl('mailto:' + m.info.contactEmail3);
    c.lp.info.referenceDocUrl = ui.Label(m.labels.lblUserManual).setUrl(m.info.referenceDocUrl);
    c.lp.info.pointsForm = ui.Label(m.labels.lblPointsForm).setUrl('');
    c.lp.info.btnClose = ui.Button({ label: m.labels.lblCloseInfoPanel });

    c.lp.info.pnlContainer = ui.Panel(
        [c.lp.info.lblApp,
        //c.lp.info.referenceDocUrl,
        //c.lp.info.pointsForm,
        c.lp.info.lblAppDev,
        c.lp.info.lblEmail1,
        ]);


    // Left Panel - Language section
    c.lp.lan = {};
    c.lp.lan.selLanguage = ui.Select({
        items: ['English', 'Spanish'],
        value: lan
    });

    // Left Panel - Fly to Lat/Lon
    c.lp.flyTo = {};
    c.lp.flyTo.btnSection = ui.Button(m.labels.lblGeolocation);
    c.lp.flyTo.lblFlyTo = ui.Label(m.labels.lblFlyToText);
    c.lp.flyTo.txtLat = ui.Textbox(m.labels.lblLatitude, '');
    c.lp.flyTo.txtLon = ui.Textbox(m.labels.lblLongitude, '');
    c.lp.flyTo.btnFlyTo = ui.Button(m.labels.lblFlyTo);
    c.lp.flyTo.btnUserLocation = ui.Button(m.labels.lblUserLocation + '\u25BC');
    c.lp.flyTo.btnRemoveLocation = ui.Button(m.labels.lblRemoveLocation + ' \u2716');

    c.lp.flyTo.btnSection.onClick(function () {
        c.lp.flyTo.pnlContainer.style().set({ shown: !c.lp.flyTo.pnlContainer.style().get('shown') });
    });

    /* Demo points selector */
    var handleOnChangeDemoPoint = function (pointName) {
        var selectedPoint = demoPoints[pointName];
        var coords = [selectedPoint.lon, selectedPoint.lat];
        goToPoint(coords);
    };

    c.lp.flyTo.selDemoPoints = ui.Select({
        items: Object.keys(demoPoints),
        style: { width: "80%" },
        placeholder: m.labels.lblSelectPoint,
        onChange: handleOnChangeDemoPoint,
    });

    c.lp.flyTo.pnlContainer = ui.Panel({
        layout: ui.Panel.Layout.flow('vertical'),
        widgets: [
            c.lp.flyTo.lblFlyTo,
            c.lp.flyTo.selDemoPoints,
            ui.Panel({
                layout: ui.Panel.Layout.flow('horizontal'),
                widgets: [c.lp.flyTo.txtLat, c.lp.flyTo.txtLon, c.lp.flyTo.btnFlyTo]
            }),
            ui.Panel({
                layout: ui.Panel.Layout.flow('horizontal'),
                widgets: [c.lp.flyTo.btnUserLocation, c.lp.flyTo.btnRemoveLocation]
            })]
    });

    // Left Panel - Asset id
    c.lp.customAsset = {};
    c.lp.customAsset.lblEnterAssetId = ui.Label(m.labels.lblEnterAssetId);
    c.lp.customAsset.txtAssetId = ui.Textbox(m.labels.lblAssetId, '');
    c.lp.customAsset.btnLoadAsset = ui.Button(m.labels.lblLoadAsset);
    c.lp.customAsset.pnlCustomAsset = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal'),
        widgets: [c.lp.customAsset.txtAssetId, c.lp.customAsset.btnLoadAsset]
    });


    // Left Panel - Administrative boundaries section
    c.lp.levels = {};
    c.lp.levels.lblChoose = ui.Label(m.labels.lblExpl2);
    c.lp.levels.selLevel1 = ui.Select({
        items: [],
        placeholder: m.labels.lblSelectLevel1,
    });
    c.lp.levels.selLevel2 = ui.Select({
        items: [],
        placeholder: m.labels.lblSelectLevel1First,
    });

    // Left Panel - Section for boundaries selection
    c.lp.boundaries = {};
    c.lp.boundaries.lblChoose = ui.Label(m.labels.lblAssetClick);
    c.lp.boundaries.selBoundariesLayer = ui.Select({
        items: Object.keys(m.assetsClick),
        value: m.labels.lblNone,
    });


    /* Function to create a layer entry check panel component with an opacity slider */
    function configureLayerEntry(layer) {
        var pnl = mdlLegends.createLayerEntry(layer);
        var stackName = layer.layerId !== undefined ? layer.layerId : layer.name;

        pnl.widgets().get(0).onChange(function (checked) {
            var list = c.cp.map.layers().getJsArray().filter(function (l) { return l.get('name') === stackName });

            list[0].setShown(checked);
            showFrontLayerLegend();
            if (stackName === m.labels.lblHotspots) {
                c.cp.pnlCombinedLegend.style().set({
                    shown: checked,
                });
            }
        });

        pnl.widgets().get(3).onSlide(function (v) {
            var list = c.cp.map.layers().getJsArray().filter(function (l) { return l.get('name') === stackName });
            list[0].setOpacity(v);
        });
        return pnl;
    }

    // AOI Mask
    c.lp.mask = {};
    c.lp.mask.chkMaskAOI = ui.Checkbox(m.labels.lblAOIMask, false);
    c.lp.mask.chkMaskAOI.onChange(function (checked) {
        var i = m.namesLayers.indexOf(m.labels.lblAOIMask);
        var layer = c.cp.map.layers().get(i);
        layer.setShown(checked);
    });


    c.lp.mask.sldOpacity = ui.Slider({
        min: 0,
        max: 1,
        value: 1,
        step: 0.1,
    });
    c.lp.mask.pnlMaskAOI = ui.Panel({
        widgets: [c.lp.mask.chkMaskAOI, c.lp.mask.sldOpacity],
        layout: ui.Panel.Layout.Flow('horizontal'),
    });

    c.lp.mask.sldOpacity.onSlide(function (value) {
        var i = m.namesLayers.indexOf(m.labels.lblAOIMask);
        c.cp.map.layers().get(i).setOpacity(value);
    });


    // Left Panel - General layers section
    c.lp.gl = {};
    c.lp.gl.btnSection = ui.Button(m.labels.lblAdmBoundaries);
    c.lp.gl.pnlContainer = ui.Panel();
    c.lp.gl.pnlLayers = ui.Panel();
    c.lp.gl.entries = m.layerEntries.gl;
    c.lp.gl.pnlContainer.add(c.lp.gl.pnlLayers);


    m.layerEntries.gl.filter(function (e) {
        return e.group === 'FEATURES';
    }).forEach(function (layer) {
        c.lp.gl.pnlLayers.add(configureLayerEntry(layer));
    });
    m.layerEntries.gl.filter(function (e) {
        return e.group === 'RASTER';
    }).forEach(function (layer) {
        c.lp.gl.pnlLayers.add(configureLayerEntry(layer));
    });

    c.lp.gl.btnSection.onClick(function () {
        c.lp.gl.pnlContainer.style().set({ shown: !c.lp.gl.pnlContainer.style().get('shown') });
    });

    // Left Panel - Transitions sections: MAPBIOMAS ESA GLC GLAD
    c.lp.tr = {};

    /** Function to create a list of layer entries for each transition product */
    var createTransitionsEntriesFromSource = function (source, tr) {

        var defaultPeriod = source.lcTransitionsPeriods[0];

        // Transitions layers configuration
        var entries = [
            {
                asset: source.imgLcAll.select('y' + defaultPeriod[0]).selfMask().clip(ftc0),
                style: source.lcStyle.vis,
                layerId: tr + m.labels.lblFromLC,
                name: m.labels.lblLandCover + ' ' + defaultPeriod[0],
                visible: false,
                legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblLandCover,
                    source.lcStyle.names.map(function (lbl) { return m.labels[lbl] }),
                    source.lcStyle.vis.palette, false, false),
            },
            {
                asset: source.imgLcAll.select('y' + defaultPeriod[1]).selfMask().clip(ftc0),
                style: source.lcStyle.vis,
                layerId: tr + m.labels.lblCurrentLC,
                name: m.labels.lblLandCover + ' ' + defaultPeriod[1],
                visible: false,
                legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblLandCover,
                    source.lcStyle.names.map(function (lbl) { return m.labels[lbl] }),
                    source.lcStyle.vis.palette, false, false),
            },
            {
                asset: source.imgLcTransitions.select('lc_gain_' + defaultPeriod[0] + '_' + defaultPeriod[1]).selfMask().clip(ftc0),
                style: source.lcTransitionsStyle.vis,
                layerId: tr + m.labels.lblGains,
                name: m.labels.lblGains + ' ' + defaultPeriod[0] + '-' + defaultPeriod[1],
                visible: false,
                legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblGains,
                    source.lcTransitionsStyle.names.map(function (lbl) { return m.labels[lbl] }),
                    source.lcTransitionsStyle.vis.palette, false, false),
            },
            {
                asset: source.imgLcTransitions.select('lc_loss_' + defaultPeriod[0] + '_' + defaultPeriod[1]).selfMask().clip(ftc0),
                style: source.lcTransitionsStyle.vis,
                layerId: tr + m.labels.lblLosses,
                name: m.labels.lblLosses + ' ' + defaultPeriod[0] + '-' + defaultPeriod[1],
                visible: false,
                legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblLosses,
                    source.lcTransitionsStyle.names.map(function (lbl) { return m.labels[lbl] }),
                    source.lcTransitionsStyle.vis.palette, false, false),
            },
            {
                asset: source.imgLcTransitions.select('lc_degradation_' + defaultPeriod[0] + '_' + defaultPeriod[1]).selfMask().clip(ftc0),
                style: source.lcDegradationStyle.vis,
                layerId: tr + m.labels.lblDegradation,
                name: m.labels.lblDegradation + ' ' + defaultPeriod[0] + '-' + defaultPeriod[1],
                visible: false,
                legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblDegradation,
                    source.lcDegradationStyle.names.map(function (lbl) { return m.labels[lbl] }),
                    source.lcDegradationStyle.vis.palette, false, false),
            }];



        return entries;
    };

    // Left Panel - LC comparison section
    c.lp.lc = {};
    c.lp.lc.btnSection = ui.Button(m.labels.lblLCComparison);
    c.lp.lc.pnlContainer = ui.Panel();

    c.lp.lc.lblLCYears = ui.Label(m.labels.lblTargetYear + ': ');
    var lcYears = ['2000', '2015', '2019', '2023'];
    c.lp.lc.selLCYears = ui.Select({
        items: lcYears,
        value: '2000',
    });

    c.lp.lc.pnlYear = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal'),
        widgets: [c.lp.lc.lblLCYears, c.lp.lc.selLCYears]
    });

    var imgEqualMask;
    m.lcSources.forEach(function (source, i) {

        var goal = c.lp.lc.selLCYears.getValue();

        var closest = source.lcYears.reduce(function (previous, current) {
            return (Math.abs(current - goal) < Math.abs(previous - goal) ? current : previous);
        });

        // Create layer entry for lc with the closest year available for the selected year
        var entry = {
            asset: source.imgLcAll.select('y' + closest).selfMask().clip(ftc0),
            style: source.lcStyle.vis,
            layerId: m.labels.lblLandCover + source.initials,
            name: m.labels[source.name] + ' ' + closest,
            visible: false,
            legend: mdlLegends.createDiscreteLegendPanel(m.labels.lblLandCover,
                source.lcStyle.names.map(function (lbl) { return m.labels[lbl] }),
                source.lcStyle.vis.palette, false, false),
        };
        m.layerEntries.lc.push(entry);

        // Create equal mask image
        if (i === 0) {
            imgEqualMask = entry.asset;
        }
        else {
            imgEqualMask = imgEqualMask.mask(entry.asset.eq(imgEqualMask));
        }


    });

    // Add an entry for the equal mask
    m.layerEntries.lc.push({
        asset: imgEqualMask,
        style: m.lv.equalMask.vis,
        name: m.labels.lblEqualMask,
        layerId: m.labels.lblEqualMask,
        visible: false,
        legend: null,
    });

    // Left Panel - LC comparison section
    c.lp.lc.pnlLayers = ui.Panel();
    c.lp.lc.entries = m.layerEntries.lc;
    c.lp.lc.entries.forEach(function (layer) {
        c.lp.lc.pnlLayers.add(configureLayerEntry(layer));
    });
    c.lp.lc.pnlContainer.add(c.lp.lc.pnlYear);
    c.lp.lc.pnlContainer.add(c.lp.lc.pnlLayers);

    c.lp.lc.btnSection.onClick(function () {
        c.lp.lc.pnlContainer.style().set({ shown: !c.lp.lc.pnlContainer.style().get('shown') });
    });

    // Charts panels on the right for  LC comparison section
    c.rp.lc = {};
    c.rp.lc.btnSection = ui.Button(m.labels.lblLCComparison);
    c.rp.lc.pnlContainer = ui.Panel();
    c.rp.lc.btnSection.onClick(function () {
        c.rp.lc.pnlContainer.style().set({ shown: !c.rp.lc.pnlContainer.style().get('shown') });
    });

    // Left Panel - Other world lc layers
    c.lp.lcother = {};
    c.lp.lcother.btnSection = ui.Button(m.labels.lblOtherLC);
    c.lp.lcother.pnlContainer = ui.Panel();
    c.lp.lcother.pnlLayers = ui.Panel();
    c.lp.lcother.entries = m.layerEntries.lcOther;
    c.lp.lcother.entries.forEach(function (layer) {
        c.lp.lcother.pnlLayers.add(configureLayerEntry(layer));
    });
    c.lp.lcother.pnlContainer.add(c.lp.lcother.pnlLayers);
    c.lp.lcother.btnSection.onClick(function () {
        c.lp.lcother.pnlContainer.style().set({ shown: !c.lp.lcother.pnlContainer.style().get('shown') });
    });

    // Generate as many transitions section as sources 
    m.transitionsSources.forEach(function (source, i) {
        var name = 'tr' + i;
        c.lp[name] = {};
        c.lp[name].btnTransitions = ui.Button(m.labels.lblTransitions + ' - ' + m.labels[source.name]);
        c.lp[name].pnlContainer = ui.Panel();

        c.lp[name].lblInitialYears = ui.Label(m.labels.lblPeriod + ': ');
        var periodItems = source.lcTransitionsPeriods.map(function (p) {
            return p[0] + '-' + p[1];
        });
        c.lp[name].selTransitionPeriods = ui.Select({
            items: periodItems,
            value: periodItems[0],
        });
        c.lp[name].pnlFromYear = ui.Panel({
            layout: ui.Panel.Layout.flow('horizontal'),
            widgets: [c.lp[name].lblInitialYears, c.lp[name].selTransitionPeriods]
        });
        c.lp[name].pnlLayers = ui.Panel();
        c.lp[name].entries = createTransitionsEntriesFromSource(source, 'tr' + i);
        c.lp[name].entries.forEach(function (layer) {
            c.lp[name].pnlLayers.add(configureLayerEntry(layer));
        });
        c.lp[name].pnlContainer.add(c.lp[name].pnlFromYear);
        c.lp[name].pnlContainer.add(c.lp[name].pnlLayers);

        c.lp[name].source = source;

        // Create charts panels on the right column
        c.rp[name] = {};
        c.rp[name].btnTransitions = ui.Button(m.labels.lblTransitions + ' - ' + m.labels[source.name]);
        c.rp[name].pnlContainer = ui.Panel();
    });


    // Left Panel - Multi-criteria analysis section   
    c.lp.mc = {};
    c.lp.mc.btnSection = ui.Button(m.labels.lblHotspots);
    c.lp.mc.lblLCYears = ui.Label(m.labels.lblTargetYear + ': ');
    c.lp.mc.selLCYears = ui.Select({
        items: lcYears,
        value: '2000',
    });
    c.lp.mc.pnlYear = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal'),
        widgets: [c.lp.mc.lblLCYears, c.lp.mc.selLCYears]
    });

    // All list of layer entries in multicriteria for default selected year
    mdlPrecalculation.lcSources.forEach(function (source) {

        var goal = c.lp.mc.selLCYears.getValue();

        var closest = source.lcYears.reduce(function (previous, current) {
            return (Math.abs(current - goal) < Math.abs(previous - goal) ? current : previous);
        });

        // Add lc comparison entries to multicriteria options
        var mcEntry = {
            title: m.labels[source.name] + ' ' + closest,
            palette: source.lcStyle.vis.palette,
            names: source.lcStyle.names.map(function (lbl) { return m.labels[lbl] }),
            image: source.imgLcAll.select('y' + closest),
            categories: source.lcCategories,
        };
        m.mcOptions.push(mcEntry);
    });


    c.lp.mc.pnlEntries = mdlLegends.createMultiCriteriaPanel(m.mcOptions);
    c.lp.mc.lblDisplay = ui.Label(m.labels.lblStepDisplay);
    c.lp.mc.btnCalculate = ui.Button({ label: m.labels.lblDisplay, disabled: true });
    c.lp.mc.btnReset = ui.Button({ label: m.labels.lblReset, disabled: true });
    c.lp.mc.pnlButtons = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal'),
        widgets: [c.lp.mc.btnCalculate, c.lp.mc.btnReset]
    });
    c.lp.mc.pnlLayers = ui.Panel();

    c.lp.mc.pnlLayers.add(configureLayerEntry({
        asset: m.imgCustom,
        style: m.lv.custom.vis,
        name: m.labels.lblHotspots,
        layerId: m.labels.lblHotspots,
        visible: false,
        legend: null,
        group: 'RASTER',
        singleColor: 'SQUARE',
        citation: ''
    }));
    c.lp.mc.pnlContainer = ui.Panel({
        widgets: [
            c.lp.mc.pnlYear,
            c.lp.mc.pnlEntries,
            c.lp.mc.lblDisplay,
            c.lp.mc.pnlButtons,
            c.lp.mc.pnlLayers]
    });


    // Left Panel - Drawing tool section
    c.lp.dt = {};
    c.lp.dt.btnDrawingTools = ui.Button(m.labels.lblDrawingTools + ' 📍');

    c.lp.dt.lblCustomLayer = ui.Label(m.labels.lblCustomLayer);
    c.lp.dt.txbLayerName = ui.Textbox(m.labels.lblLayerName, '');
    c.lp.dt.btnAddLayer = ui.Button('+');
    c.lp.dt.pnlFileName = ui.Panel({
        widgets: [c.lp.dt.txbLayerName, c.lp.dt.btnAddLayer],
        layout: ui.Panel.Layout.Flow('horizontal'),
    });
    c.lp.dt.lblDrawFeatures = ui.Label(m.labels.lblDrawFeatures);
    c.lp.dt.lblGetStatistics = ui.Label(m.labels.lblGetStatistics);
    c.lp.dt.btnZonalStats = ui.Button(m.labels.lblSelectAndCalculate);
    c.lp.dt.lblDownloadLinks = ui.Label(m.labels.lblDownloadLinks);
    c.lp.dt.lblLinks = ui.Label(m.labels.lblLinks);
    c.lp.dt.lblJson = ui.Label();
    c.lp.dt.lblKml = ui.Label();
    c.lp.dt.pnlLinks = ui.Panel({
        widgets: [c.lp.dt.lblLinks, c.lp.dt.lblJson, c.lp.dt.lblKml],
        layout: ui.Panel.Layout.Flow('horizontal'),
    });
    c.lp.dt.pnlContainer = ui.Panel({
        widgets: [
            c.lp.dt.lblCustomLayer,
            c.lp.dt.pnlFileName,
            c.lp.dt.lblDrawFeatures,
            c.lp.dt.lblGetStatistics,
            c.lp.dt.btnZonalStats,
            c.lp.dt.lblDownloadLinks,
            c.lp.dt.pnlLinks
        ]
    });


    // Left Panel - Disclaimer
    c.lp.lblDisclaimer = ui.Label(m.labels.lblDisclaimer);

    // Center Panel   
    c.cp.map = ui.Map();
    c.cp.pnlCombinedLegend = ui.Panel();
    c.cp.pnlFrontLayerLegend = ui.Panel();
    c.cp.drt = ui.Map.DrawingTools();
    c.cp.btnSelectContainer = ui.Button(m.labels.lblSelectContainer);

    // Right Panel
    // MESSAGES PANEL    
    c.rp.lblMessages = ui.Label('');
    c.rp.pnlMessages = ui.Panel({
        widgets: [c.rp.lblMessages]
    });

    // STATS PANEL
    c.rp.stats = {};
    c.rp.stats.pnlStats = ui.Panel();
    c.rp.stats.lblStatsTitle = ui.Label(m.labels.lblSelectedAOI);
    c.rp.stats.lblHighlightBox = ui.Label();
    c.rp.stats.pnlSelectedArea = ui.Panel({
        widgets: [c.rp.stats.lblStatsTitle, c.rp.stats.lblHighlightBox],
        layout: ui.Panel.Layout.Flow("horizontal"),

    });
    c.rp.stats.pnlStats.add(c.rp.stats.pnlSelectedArea);
    // Stats panel - general entries 
    c.rp.stats.ge = {};
    c.rp.stats.ge.pnlEntryAreaName = ui.Panel({
        widgets: [ui.Label(m.labels.lblAreaName + ': '), ui.Label(m.labels.lblLoading)],
    });
    c.rp.stats.ge.pnlEntryArea = ui.Panel({
        widgets: [ui.Label(m.labels.lblArea + ': '), ui.Label(m.labels.lblLoading)],
    });

    // Add entries to general stats panel
    Object.keys(c.rp.stats.ge).forEach(function (key) {
        c.rp.stats.ge[key].setLayout(ui.Panel.Layout.Flow('horizontal'));
        c.rp.stats.pnlStats.add(c.rp.stats.ge[key]);
    });


    /*******************************************************************************
    * 3-Composition *   
    ******************************************************************************/

    ui.root.clear();
    ui.root.add(c.pnlRoot);

    c.pnlRoot.add(ui.SplitPanel(c.lp.pnlControl, ui.Panel(c.sppMapOutput)));

    // Control panel
    c.lp.pnlControl.add(c.lp.info.lblIntro);
    c.lp.pnlControl.add(c.lp.info.pnlContainer);
    //c.lp.pnlControl.add(c.lp.info.referenceDocUrl);
    c.lp.pnlControl.add(c.lp.info.btnClose);

    c.lp.pnlControl.add(c.lp.lan.selLanguage);

    c.lp.pnlControl.add(c.lp.levels.lblChoose);
    c.lp.pnlControl.add(c.lp.levels.selLevel1);
    //c.lp.pnlControl.add(c.lp.levels.selLevel2);

    c.lp.pnlControl.add(c.lp.boundaries.lblChoose);
    c.lp.pnlControl.add(c.lp.boundaries.selBoundariesLayer);

    c.lp.pnlControl.add(c.lp.mask.pnlMaskAOI);

    c.lp.pnlControl.add(c.lp.gl.btnSection);
    c.lp.pnlControl.add(c.lp.gl.pnlContainer);


    m.transitionsSources.forEach(function (source, i) {
        c.lp.pnlControl.add(c.lp['tr' + i].btnTransitions);
        c.lp.pnlControl.add(c.lp['tr' + i].pnlContainer);

    });

    c.lp.pnlControl.add(c.lp.lc.btnSection);
    c.lp.pnlControl.add(c.lp.lc.pnlContainer);

    c.lp.pnlControl.add(c.lp.lcother.btnSection);
    c.lp.pnlControl.add(c.lp.lcother.pnlContainer);

    c.lp.pnlControl.add(c.lp.mc.btnSection);
    c.lp.pnlControl.add(c.lp.mc.pnlContainer);

    c.lp.pnlControl.add(c.lp.dt.btnDrawingTools);
    c.lp.pnlControl.add(c.lp.dt.pnlContainer);

    c.lp.dt.pnlContainer.add(c.lp.customAsset.lblEnterAssetId);
    c.lp.dt.pnlContainer.add(c.lp.customAsset.pnlCustomAsset);

    c.lp.pnlControl.add(c.lp.flyTo.btnSection);
    c.lp.pnlControl.add(c.lp.flyTo.pnlContainer);

    c.lp.pnlControl.add(c.lp.lblDisclaimer);

    // Map panel 
    c.cp.pnlMap.add(c.cp.map);
    c.cp.map.add(c.cp.pnlFrontLayerLegend);
    c.cp.map.add(c.cp.drt);
    c.cp.map.add(c.cp.btnSelectContainer);

    // Output panel 
    c.rp.pnlOutput.add(c.rp.pnlMessages);
    c.rp.pnlOutput.add(c.rp.stats.pnlStats);

    m.transitionsSources.forEach(function (source, i) {
        c.rp.pnlOutput.add(c.rp['tr' + i].btnTransitions);
        c.rp.pnlOutput.add(c.rp['tr' + i].pnlContainer);
    });

    c.rp.pnlOutput.add(c.rp.lc.btnSection);
    c.rp.pnlOutput.add(c.rp.lc.pnlContainer);


    /*******************************************************************************
    * 4-Styling *  
    ******************************************************************************/

    // JSON object for defining CSS-like class style properties.
    var s = {};

    s.style1 = { fontSize: '12px', margin: '2px 5px' };
    s.styleStatsValue = { margin: '4px 0px', fontSize: '12px', whiteSpace: 'pre' };
    s.styleStatsHeader = { margin: '4px 0px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'pre' };
    s.styleInfoTitle = { fontSize: '16px', fontWeight: 'bold', margin: '4px 0px' };
    s.styelChartPanelTitle = { fontSize: '16px', fontWeight: 'bold', margin: '4px 15px' };

    s.styleMessage = { color: 'gray', fontSize: '12px', padding: '2px 0px 2px 10px' };
    s.styleWarning = { color: 'blue', fontSize: '12px' };

    c.lp.info.lblIntro.style().set({ fontWeight: 'bold', fontSize: '20px', margin: '10px 5px', });
    c.lp.info.lblApp.style().set({ fontSize: '12px', whiteSpace: 'pre-wrap' });
    c.lp.info.lblAppDev.style().set(s.style1);
    c.lp.info.referenceDocUrl.style().set({ fontSize: '12px', margin: '5px 5px' });
    c.lp.info.pointsForm.style().set({ fontSize: '12px', margin: '5px 5px' });
    c.lp.info.lblEmail1.style().set(s.style1);
    c.lp.info.lblEmail2.style().set(s.style1);
    c.lp.info.lblEmail3.style().set(s.style1);
    c.lp.info.pnlContainer.style().set({ margin: 0, padding: 0 });

    c.lp.lan.selLanguage.style().set({ width: '70%' });

    c.lp.flyTo.lblFlyTo.style().set(s.style1);
    c.lp.flyTo.txtLat.style().set({ width: '25%', margin: '5px 5px' });
    c.lp.flyTo.txtLon.style().set({ width: '25%', margin: '5px 5px' });
    c.lp.flyTo.btnFlyTo.style().set({ width: '30%', margin: '5px 5px' });

    c.lp.flyTo.btnUserLocation.style().set({ width: '40%', margin: '5px 5px' });
    c.lp.flyTo.btnRemoveLocation.style().set({ width: '40%', margin: '5px 5px' });

    c.lp.customAsset.lblEnterAssetId.style().set(s.style1);
    c.lp.customAsset.txtAssetId.style().set({ width: '60%' });
    c.lp.customAsset.btnLoadAsset.style().set({ width: '20%' });

    c.lp.levels.lblChoose.style().set(s.style1);
    c.lp.levels.selLevel1.style().set({ width: "90%", });
    c.lp.levels.selLevel2.style().set({ width: "90%", });

    c.lp.boundaries.lblChoose.style().set(s.style1);
    c.lp.boundaries.selBoundariesLayer.style().set({ width: '70%' });

    c.lp.mask.chkMaskAOI.style().set({ margin: '10px' });
    c.lp.mask.pnlMaskAOI.style().set(s.style1);

    s.sectionButton = { width: '95%', fontSize: '6px', fontWeight: 'normal' };
    s.sectionPanel = { margin: '5px 5px', shown: false, width: '95%' };
    s.paramPanel = { width: '90%', fontSize: '12px', margin: '0px', padding: '0px' };

    // General layers section
    c.lp.gl.btnSection.style().set(s.sectionButton);
    c.lp.gl.btnSection.style().set({ color: 'black' });
    c.lp.gl.pnlContainer.style().set(s.sectionPanel);
    c.lp.gl.pnlContainer.style().set({ border: '2px solid black', shown: true });

    // Style for each transition section
    var trSectionColors = ['black', 'purple', 'teal', 'orange']; // mapbiomas, esa, glad, glc
    m.transitionsSources.forEach(function (source, i) {
        // Left column
        c.lp['tr' + i].btnTransitions.style().set(s.sectionButton);
        c.lp['tr' + i].btnTransitions.style().set({ color: trSectionColors[i] });
        c.lp['tr' + i].pnlContainer.style().set(s.sectionPanel);
        c.lp['tr' + i].pnlContainer.style().set({ border: '2px solid ' + trSectionColors[i], shown: false });
        c.lp['tr' + i].selTransitionPeriods.style().set({ margin: '0px', padding: '5px 0 0 0' });
        c.lp['tr' + i].pnlFromYear.style().set(s.paramPanel);
        // Right column
        c.rp['tr' + i].btnTransitions.style().set(s.sectionButton);
        c.rp['tr' + i].btnTransitions.style().set({ color: trSectionColors[i] });
        c.rp['tr' + i].pnlContainer.style().set(s.sectionPanel);
        c.rp['tr' + i].pnlContainer.style().set({ border: '2px solid ' + trSectionColors[i], shown: false });
    });

    // Left column LC comparison section
    c.lp.lc.btnSection.style().set(s.sectionButton);
    c.lp.lc.btnSection.style().set({ color: 'blue' });
    c.lp.lc.pnlContainer.style().set(s.sectionPanel);
    c.lp.lc.pnlContainer.style().set({ border: '2px solid blue', shown: false });

    c.lp.lc.selLCYears.style().set({ margin: '0px', padding: '5px 0 0 0' });
    c.lp.lc.pnlYear.style().set(s.paramPanel);

    // Fly to
    c.lp.flyTo.btnSection.style().set(s.sectionButton);
    c.lp.flyTo.btnSection.style().set({ color: 'black' });
    c.lp.flyTo.pnlContainer.style().set(s.sectionPanel);
    c.lp.flyTo.pnlContainer.style().set({ border: '2px solid black', shown: false });

    // Right column LC comparison section
    c.rp.lc.btnSection.style().set(s.sectionButton);
    c.rp.lc.btnSection.style().set({ color: 'blue' });
    c.rp.lc.pnlContainer.style().set(s.sectionPanel);
    c.rp.lc.pnlContainer.style().set({ border: '2px solid blue', shown: false });

    // Other LC products section
    c.lp.lcother.btnSection.style().set(s.sectionButton);
    c.lp.lcother.btnSection.style().set({ color: 'black' });
    c.lp.lcother.pnlContainer.style().set(s.sectionPanel);
    c.lp.lcother.pnlContainer.style().set({ border: '2px solid black', shown: false });

    // Multicriteria Section
    c.lp.mc.btnSection.style().set(s.sectionButton);
    c.lp.mc.btnSection.style().set({ color: '#900303' });
    c.lp.mc.pnlContainer.style().set(s.sectionPanel);
    c.lp.mc.pnlContainer.style().set({ border: '2px solid #900303' });
    c.lp.mc.lblDisplay.style().set({
        fontWeight: 'bold',
        fontSize: '12px',
        margin: '1px 1px 1px 5px',
        padding: '2px',
    });
    c.lp.mc.btnCalculate.style().set({ width: '40%' });
    c.lp.mc.btnReset.style().set({ width: '40%' });
    c.lp.mc.selLCYears.style().set({ margin: '0px', padding: '5px 0 0 0' });
    c.lp.mc.pnlYear.style().set(s.paramPanel);

    // Drawing tools Section
    c.lp.dt.btnDrawingTools.style().set(s.sectionButton);
    c.lp.dt.pnlContainer.style().set(s.sectionPanel);
    c.lp.dt.pnlContainer.style().set({ border: '2px solid black' });
    c.lp.dt.lblCustomLayer.style().set({ fontSize: '12px' });
    c.lp.dt.pnlFileName.style().set({ margin: '0px 5px' });
    c.lp.dt.txbLayerName.style().set({ width: '60%', fontSize: '12px' });
    c.lp.dt.lblDrawFeatures.style().set({ fontSize: '12px' });
    c.lp.dt.lblGetStatistics.style().set({ fontSize: '12px' });
    c.lp.dt.lblJson.style().set({ fontSize: '12px' });
    c.lp.dt.lblKml.style().set({ fontSize: '12px' });
    c.lp.dt.lblDownloadLinks.style().set({ fontSize: '12px' });
    c.lp.dt.lblLinks.style().set({ fontSize: '12px' });

    c.lp.lblDisclaimer.style().set({ fontSize: '10px', margin: '2px 10px', whiteSpace: 'pre-wrap' });

    // --------- CENTER PANEL
    c.cp.pnlFrontLayerLegend.style().set({ position: 'bottom-left' });
    c.cp.pnlCombinedLegend.style().set({ shown: false });
    c.cp.btnSelectContainer.style().set({ position: "bottom-right" });

    c.cp.map.style().set('cursor', 'crosshair');

    // --------- RIGHT PANEL

    // Messages Panel
    c.rp.pnlMessages.style().set({ padding: '8px 15px' });
    c.rp.lblMessages.style().set(s.styleWarning);
    c.rp.lblMessages.style().set({ margin: '4px 0px' });

    // Stats Panel
    c.rp.stats.lblStatsTitle.style().set(s.styleInfoTitle);
    c.rp.stats.lblHighlightBox.style().set({
        border: "2px solid " + m.lv.highlight.vis.color,
        padding: "5px",
        margin: "7px 0 0 5px",
    });
    c.rp.stats.pnlStats.style().set({ padding: '8px 15px', });
    Object.keys(c.rp.stats.ge).forEach(function (key) {
        c.rp.stats.ge[key].widgets().get(0).style().set(s.styleStatsHeader);
        c.rp.stats.ge[key].widgets().get(1).style().set(s.styleStatsValue);
    });


    /*******************************************************************************
    * 5-Behaviors *   
    ******************************************************************************/

    var formatNumber = function (number, digits) {
        return number.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    };

    var sortByLabel = function (a, b) {
        if (a.label < b.label) { return -1; }
        if (a.label > b.label) { return 1; }
        return 0;
    };
    var createChartPanel = function (container) {
        var pnlChart = ui.Panel();
        container.add(pnlChart);
        return pnlChart;
    };


    /** Shows or hides specified layer in map */
    var showLayer = function (name, shown) {
        var i = m.namesLayers.indexOf(name);
        if (m.namesLayers.indexOf(name) >= 0) {
            c.cp.map.layers().get(i).setShown(shown);
        }
    };

    /** Shows the front layer legend (shows legend for first selected layer, from bottom to top, in order of apearence in left panel list) */
    var showFrontLayerLegend = function () {
        c.cp.pnlFrontLayerLegend.clear();
        var chk;

        //var sectionNames = ['lcother', 'lc', 'tr3', 'tr2', 'tr1', 'tr0', 'gl']; // reverse order of appearence

        var sectionNames = ['lcother', 'lc'];

        var tr = [];
        m.transitionsSources.forEach(function (source, i) {
            tr.push('tr' + i);
        });

        // Add transition sections
        sectionNames = sectionNames.concat(tr.reverse());
        sectionNames.push('gl');


        for (var index = 0; index < sectionNames.length; index++) {

            var sectionName = sectionNames[index];
            var container = c.lp[sectionName].pnlContainer;
            var layers = c.lp[sectionName].pnlLayers;
            var entries = c.lp[sectionName].entries;

            if (container.style().get('shown')) {
                for (var i = layers.widgets().length() - 1; i >= 0; i--) {
                    chk = layers.widgets().get(i).widgets().get(0);
                    if (chk.getValue() && entries[i].legend !== null) {
                        c.cp.pnlFrontLayerLegend.widgets().set(0, entries[i].legend);
                        return;
                    }
                }
            }
        }
    };

    function goToPoint(coords) {
        try {

            var gmyPoint = ee.Geometry.Point(coords);
            c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblFlyTo), ui.Map.Layer(ee.FeatureCollection(gmyPoint).style({ color: 'red', pointShape: 'star5', pointSize: 6 })));
            c.cp.map.centerObject(gmyPoint, 10);
            
            c.lp.flyTo.txtLon.setValue(coords[0]);
            c.lp.flyTo.txtLat.setValue(coords[1]);
 

        } catch (error) {
            c.lblMessages.setValue(error);
        }


    }


    c.lp.flyTo.btnFlyTo.onClick(function () {
        try {
            var coords = [parseFloat(c.lp.flyTo.txtLon.getValue()), parseFloat(c.lp.flyTo.txtLat.getValue())];
            goToPoint(coords);
        } catch (error) {
            c.rp.lblMessages.setValue(error);
        }

    });

    c.lp.flyTo.btnUserLocation.onClick(function () {
        c.rp.pnlMessages.style().set({ shown: false });

        var handlePosition = function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            if (navigator.geolocation) {
                var point = ee.Geometry.Point([lon, lat]);
                c.cp.map.centerObject(point);
                c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblFlyTo), ui.Map.Layer(point, { color: '#0099ff' }, m.labels.lblFlyTo));

            }
            else {
                c.rp.pnlMessages.style().set({ shown: true });
                c.rp.lblMessages.setValue(m.labels.lblLocNotSupported);
            }
        };
        var handleLocError = function (error) {
            c.rp.pnlMessages.style().set({ shown: true });
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    c.rp.lblMessages.setValue(m.labels.lblPermissionDenied);
                    break;
                case error.POSITION_UNAVAILABLE:
                    c.rp.lblMessages.setValue(m.labels.lblPositionUnavailable);
                    break;
                case error.TIMEOUT:
                    c.rp.lblMessages.setValue(m.labels.lblTimeout);
                    break;
                case error.UNKNOWN_ERROR:
                    c.rp.lblMessages.setValue(m.labels.lblUnknownError);
                    break;
            }
        };
        navigator.geolocation.getCurrentPosition(handlePosition, handleLocError);
    });

    c.lp.flyTo.btnRemoveLocation.onClick(function () {
        showLayer(m.labels.lblFlyTo, false);
    });
    /**  */
    var handleCustomFeatureCollection = function (gmy, name, level) {

        var f = ee.Feature(gmy).set('area_ha', gmy.area({ 'maxError': 1 }).divide(10000));
        f = f.set('name', name);

        handleEvaluating(true);
        f.get('area_ha').evaluate(function (area, error) {
            if (error) {
                handleEvaluating(false);
                c.rp.lblMessages.setValue(m.labels.lblUnexpectedError + error);
                c.rp.pnlMessages.style().set({ shown: true });
                return;
            }
            if (area > m.maxAreaHa) {
                handleEvaluating(false);
                c.rp.lblMessages.setValue(m.labels.lblSmallerArea
                    + formatNumber(m.maxAreaHa, 0) + 'ha. '
                    + m.labels.lblSelectedAreaHa
                    + ' ' + formatNumber(area, 2) + 'ha.');
                c.rp.pnlMessages.style().set({ shown: true });
                return;
            }
            //ftc0.geometry().intersects(gmy, 1).evaluate(function (intersection, error) {
            ftc0.geometry().contains(gmy, 1).evaluate(function (contained, error) {
                if (error) {
                    handleEvaluating(false);
                    c.rp.lblMessages.setValue(m.labels.lblUnexpectedError + error);
                    c.rp.pnlMessages.style().set({ shown: true });
                    return;
                }

                if (!contained) {
                    handleEvaluating(false);
                    c.rp.lblMessages.setValue(m.labels.lblGeometryNotContained);
                    //c.rp.lblMessages.setValue(m.labels.lblGeometryNoIntersection);
                    c.rp.pnlMessages.style().set({ shown: true });
                    return;
                }

                m.ftcAoi = ee.FeatureCollection(f);
                m.precalculated = false;
                m.haAoi = area;
                m.levelAoi = level;
                showInfoSelectedAoi();
            });
        });
    };

    c.lp.customAsset.btnLoadAsset.onClick(function () {

        var assetId = c.lp.customAsset.txtAssetId.getValue().trim();
        if (assetId === '') {
            c.rp.pnlMessages.style().set({ shown: true });
            c.rp.lblMessages.setValue(m.labels.lblInvalidAssetId);
            return;
        }
        try {
            var ftcCustom = ee.FeatureCollection(assetId);
            ftcCustom.size().getInfo(function (size) {
                if (size === undefined) {
                    c.rp.pnlMessages.style().set({ shown: true });
                    c.rp.lblMessages.setValue(m.labels.lblInvalidAssetId);
                }
                else {
                    handleCustomFeatureCollection(ftcCustom.geometry(), assetId, m.labels.lblCustomAsset);

                }
            });
        }
        catch (err) {
            c.rp.pnlMessages.style().set({ shown: true });
            c.rp.lblMessages.setValue(m.labels.lblInvalidAssetId + ': ' + err);
        }
    });

    c.lp.lan.selLanguage.onChange(function (lan) { initApp(lan); });

    c.lp.info.btnClose.onClick(function () {
        c.lp.info.pnlContainer.style().set({ shown: !c.lp.info.pnlContainer.style().get('shown') });
        c.lp.info.btnClose.setLabel(c.lp.info.pnlContainer.style().get('shown') ? m.labels.lblCloseInfoPanel : m.labels.lblOpenInfoPanel);
    });

    // Stack layers in map
    m.layerEntries.gl.filter(function (layer) {
        return layer.group === 'RASTER';
    }).forEach(function (layer) {
        c.cp.map.addLayer(layer.asset, layer.style, layer.name, layer.visible);
    });

    // LC products comparison
    m.layerEntries.lc.forEach(function (layer) {
        c.cp.map.addLayer(layer.asset, layer.style, layer.layerId, layer.visible);
    });

    // LC from year / LC to year / Gains / Losses layers for each source 
    m.transitionsSources.forEach(function (source, i) {
        var te = c.lp['tr' + i].entries;
        te.forEach(function (layer) {
            c.cp.map.addLayer(layer.asset, layer.style, layer.layerId, layer.visible);
        });

    });

    // Other world lc layers
    m.layerEntries.lcOther.filter(function (layer) {
        return layer.group === 'RASTER';
    }).forEach(function (layer) {
        c.cp.map.addLayer(layer.asset, layer.style, layer.name, layer.visible);
    });

    // General layers - FEATURES
    m.layerEntries.gl.filter(function (layer) {
        return layer.group === 'FEATURES';
    }).forEach(function (layer) {
        c.cp.map.addLayer(layer.asset.style(layer.style), {}, layer.name, layer.visible);
    });

    // Multicriteria layer - this layer is dinamically updated 
    c.cp.map.addLayer(m.imgCustom, m.lv.custom.vis, m.labels.lblHotspots, false);
    // User Localization - this layer is dinamically updated 
    c.cp.map.addLayer(ee.Geometry.Point([0, 0]), { color: '#0099ff' }, m.labels.lblFlyTo, false);
    // Selected AOI
    c.cp.map.addLayer(ee.Geometry.Point([0, 0]), {}, m.labels.lblSelectedAOI, false);
    // AOI Mask
    c.cp.map.addLayer(ee.Image(0), { palette: ['white'] }, m.labels.lblAOIMask, false);

    c.lp.boundaries.selBoundariesLayer.onChange(function (v) {
        m.ftcClickOn = m.assetsClick[v];
        if (m.ftcClickOn !== null) {
            // show layer on map
            for (var i = 0; i < c.lp.gl.pnlLayers.widgets().length(); i++) {
                var chk = c.lp.gl.pnlLayers.widgets().get(i).widgets().get(0);
                if (chk.getLabel() === v) {
                    chk.setValue(true);
                    break;
                }
            }
            // hide drawing tool panel
            c.lp.dt.pnlContainer.style().set({ shown: false });
            c.cp.map.drawingTools().stop();
            c.cp.map.drawingTools().setShown(false);
            c.cp.map.drawingTools().layers().forEach(function (l) {
                l.setShown(false);
            });
        }
    });

    /** Shows precalculated stats and charts for selected area of interest. 
     *  If area of interest is a user drawn-feature calculates all stats on the fly*/
    var showInfoSelectedAoi = function () {

        handleEvaluating(true);

        Object.keys(c.rp.stats.ge).forEach(function (key) {
            c.rp.stats.ge[key].widgets().get(1).setValue(m.labels.lblLoading);
        });

        var f;
        if (m.precalculated) { // aoi from precalculated assets
            var selectedArea = m.ftcAoi.first();
            //print(selectedArea)
            // Get area value in precalculated row, for drawn-feature is already calculated
            m.haAoi = selectedArea.get('area_ha').getInfo();
            var statslCols = ['name',];
            f = ee.Feature(null).copyProperties(selectedArea, statslCols);
        }
        else {
            // Calculate all statistics required for info panel
            var ftcSampleStats = mdlPrecalculation.precalculate(m.ftcAoi, []);
            f = ftcSampleStats.first();

        }
        c.rp.stats.ge.pnlEntryArea.widgets().get(1).setValue(formatNumber(m.haAoi, 2) + ' ha.');

        m.evalSet["stats"] = true;
        f.evaluate(function (ef, error) {
            delete m.evalSet["stats"];
            if (Object.keys(m.evalSet).length === 0) {
                handleEvaluating(false);
            }
            if (ef) {
                c.rp.stats.ge.pnlEntryAreaName.widgets().get(1).setValue(ef.properties.name);
            }
            else {
                c.rp.lblMessages.setValue(error);
            }
        });


        try {
            c.cp.map.centerObject(m.ftcAoi);
            c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblSelectedAOI), ui.Map.Layer(m.ftcAoi.style(m.lv.highlight.vis), {}, m.labels.lblSelectedAOI, true));

            var i = m.namesLayers.indexOf(m.labels.lblAOIMask);
            var e = c.cp.map.layers().get(i);
            e.setEeObject(ee.Image(1).updateMask(ee.Image(1).clip(m.ftcAoi).unmask().eq(0)));
            e.setVisParams({ palette: ['white'] });

        } catch (error) {
            c.rp.lblMessages.setValue(error);
        }


        c.cp.map.drawingTools().setSelected(null);

        // Generate all transitions related charts for selected area 
        setupTransitionsCharts();
        setupLCCharts();

        handleClickCalculateMulticriteria();
    };


    var handleChangeLevel2 = function (level2Code) {
        m.levelAoi = m.labels.lblLevel2;
        m.ftcAoi = ftc2.filter(ee.Filter.eq('ADM2_CODE', level2Code));
        m.precalculated = true;
        showInfoSelectedAoi();
    };


    var handleChangeLevel1 = function (level1Code) {
        if (level1Code !== null) {
            m.levelAoi = m.labels.lblLevel1;
            m.ftcAoi = ftc1.filter(ee.Filter.eq('ADM1_CODE', level1Code));
            m.precalculated = true;
            showInfoSelectedAoi();
            /*
            // load level 2
            c.lp.levels.selLevel2.setPlaceholder(m.labels.lblLoadingLevel2);
            c.lp.levels.selLevel2.items().reset([]);

            var namesLevel2 = m.ftcLelvel2.filter(ee.Filter.eq('ADM1_CODE', level1Code)).aggregate_array('ADM2_NAME');
            var codesLevel2 = m.ftcLelvel2.filter(ee.Filter.eq('ADM1_CODE', level1Code)).aggregate_array('ADM2_CODE');

            namesLevel2.getInfo(function (names2) {
                codesLevel2.getInfo(function (codes2) {
                    var siLevel2 = [];
                    for (var i = 0; i < names2.length; i++) {
                        siLevel2.push({
                            label: names2[i],
                            value: codes2[i]
                        });
                    }

                    siLevel2.sort(sortByLabel);

                    c.lp.levels.selLevel2.unlisten();
                    c.lp.levels.selLevel2.setValue(null);
                    c.lp.levels.selLevel2.items().reset(siLevel2);
                    c.lp.levels.selLevel2.setPlaceholder(m.labels.lblSelectLevel2);
                    c.lp.levels.selLevel2.onChange(handleChangeLevel2);

                });
            });*/
        }

    };

    var resetLevelsSelects = function () {

        c.lp.levels.selLevel1.unlisten();
        c.lp.levels.selLevel2.unlisten();

        c.lp.levels.selLevel1.items().reset(m.siLevel1);
        c.lp.levels.selLevel1.setPlaceholder(m.labels.lblSelectLevel1);
        c.lp.levels.selLevel1.setValue(null);

        c.lp.levels.selLevel2.items().reset([]);
        c.lp.levels.selLevel2.setPlaceholder(m.labels.lblSelectLevel1First);
        c.lp.levels.selLevel2.setValue(null);

        c.lp.levels.selLevel1.onChange(handleChangeLevel1);
        c.lp.levels.selLevel2.onChange(handleChangeLevel2);



    };


    /** Handles value selection in countries/territories dropdown */
    c.lp.levels.selLevel1.onChange(handleChangeLevel1);


    /* Handle click on selected layer */
    c.cp.map.onClick(function (coords) {

        c.lp.flyTo.txtLon.setValue(coords.lon);
        c.lp.flyTo.txtLat.setValue(coords.lat);

        if (Object.keys(m.evalSet).length === 0 && !c.lp.dt.pnlContainer.style().get('shown')) {
            if (m.ftcClickOn === null) {
                c.rp.pnlMessages.style().set({ shown: true });
                c.rp.lblMessages.setValue(m.labels.lblSelectLayer);
                return;
            }

            c.cp.map.widgets().remove(c.cp.pnlCombinedLegend);
            c.rp.lblMessages.setValue(m.labels.lblProcessingArea);
            c.rp.pnlMessages.style().set({ shown: true });

            var ftcCheck = m.ftcClickOn.filterBounds(ee.Geometry.Point(coords.lon, coords.lat));

            ftcCheck.size().getInfo(function (size) {
                if (size > 0) {
                    if (size === 2) {
                        m.ftcAoi = ftcCheck.filterMetadata('container', 'equals', 0);
                    }
                    else {
                        m.ftcAoi = ftcCheck;
                    }
                    resetLevelsSelects();
                    m.precalculated = true;

                    Object.keys(m.assetsClick).forEach(function (key) {
                        if (m.assetsClick[key] === m.ftcClickOn) {
                            m.levelAoi = key;
                        }
                    });
                    showInfoSelectedAoi();
                }
                else {
                    c.rp.pnlMessages.style().set({ shown: true });
                    c.rp.lblMessages.setValue(m.labels.lblNoFeature);
                }

            });


        }
    });

    /** Hide/Show mc panel on section button click*/
    c.lp.mc.btnSection.onClick(function () {
        c.lp.mc.pnlContainer.style().set({ shown: !c.lp.mc.pnlContainer.style().get('shown') });
        if (c.lp.mc.pnlContainer.style().get('shown')) {
            c.cp.map.setOptions('SATELLITE');
        }

    });

    /** Hide/Show panels on section button click*/
    m.transitionsSources.forEach(function (source, i) {
        c.lp['tr' + i].btnTransitions.onClick(function () {
            c.lp['tr' + i].pnlContainer.style().set({ shown: !c.lp['tr' + i].pnlContainer.style().get('shown') });
        });

        c.rp['tr' + i].btnTransitions.onClick(function () {
            c.rp['tr' + i].pnlContainer.style().set({ shown: !c.rp['tr' + i].pnlContainer.style().get('shown') });
        });

    });


    /** Reloads lc layers according to year selected*/
    var resetLCLayers = function (year) {

        var imgEqualMask = ee.Image(0);

        m.lcSources.forEach(function (source, i) {
            var closest = source.lcYears.reduce(function (previous, current) {
                return (Math.abs(current - year) < Math.abs(previous - year) ? current : previous);
            });

            c.lp.lc.pnlLayers.widgets().get(i).widgets().get(0).setLabel(m.labels[source.name] + ' ' + closest);
            var img = source.imgLcAll.select('y' + closest).selfMask().clip(ftc0);
            var lyr = ui.Map.Layer(img.visualize(source.lcStyle.vis), {}, m.labels.lblLandCover + source.initials, c.lp.lc.pnlLayers.widgets().get(i).widgets().get(0).getValue());
            c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblLandCover + source.initials), lyr);

            if (i === 0) {
                imgEqualMask = img;
            }
            else {
                imgEqualMask = imgEqualMask.mask(img.eq(imgEqualMask));
            }

        });

        // Update equal mask
        var lyrEqualMask = ui.Map.Layer(imgEqualMask.visualize(m.lv.equalMask.vis), {}, m.labels.lblEqualMask, c.lp.lc.pnlLayers.widgets().get(m.lcSources.length).widgets().get(0).getValue());
        c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblEqualMask), lyrEqualMask);
    };

    /** Reloads lc layers& charts according to selected year*/
    c.lp.lc.selLCYears.onChange(function (year) { resetLCLayers(year); setupLCCharts(); });

    /** Reloads mc lc layers according to selected year*/
    var resetMulticriteriaLCLayers = function (year) {
        clearCombinedLayerAndLegend();

        mdlPrecalculation.lcSources.forEach(function (source, i) {
            var closest = source.lcYears.reduce(function (previous, current) {
                return (Math.abs(current - year) < Math.abs(previous - year) ? current : previous);
            });

            c.lp.mc.pnlEntries.widgets().get(i).widgets().get(0).setValue(m.labels[source.name] + ' ' + closest);// change entry layer title
            m.mcOptions[i].image = source.imgLcAll.select('y' + closest); // change image              

        });

    };
    c.lp.mc.selLCYears.onChange(function (year) { resetMulticriteriaLCLayers(year); });


    /** Reloads transitions layers according to year and source selected*/
    var resetTransitionsLayers = function (period, trp) {

        var source = c.lp[trp].source;
        var pnlLayers = c.lp[trp].pnlLayers;

        //var lcFinalYear = source.lcYears[source.lcYears.length - 1];
        var lcInitialYear = period.substring(0, 4);
        var lcFinalYear = period.substring(5, 9);

        // Update check labels with selected year
        pnlLayers.widgets().get(0).widgets().get(0).setLabel(m.labels.lblLandCover + ' ' + lcInitialYear);
        pnlLayers.widgets().get(1).widgets().get(0).setLabel(m.labels.lblLandCover + ' ' + lcFinalYear);
        pnlLayers.widgets().get(2).widgets().get(0).setLabel(m.labels.lblGains + ' ' + lcInitialYear + '-' + lcFinalYear);
        pnlLayers.widgets().get(3).widgets().get(0).setLabel(m.labels.lblLosses + ' ' + lcInitialYear + '-' + lcFinalYear);
        pnlLayers.widgets().get(4).widgets().get(0).setLabel(m.labels.lblDegradation + ' ' + lcInitialYear + '-' + lcFinalYear);


        // Reload layers
        var imgFrom = source.imgLcAll.select('y' + lcInitialYear).selfMask().clip(ftc0);
        var lyrFrom = ui.Map.Layer(imgFrom.visualize(source.lcStyle.vis), {}, trp + m.labels.lblFromLC, pnlLayers.widgets().get(0).widgets().get(0).getValue());
        c.cp.map.layers().set(m.namesLayers.indexOf(trp + m.labels.lblFromLC), lyrFrom);

        var imgFinal = source.imgLcAll.select('y' + lcFinalYear).selfMask().clip(ftc0);
        var lyrfinal = ui.Map.Layer(imgFinal.visualize(source.lcStyle.vis), {}, trp + m.labels.lblCurrentLC, pnlLayers.widgets().get(1).widgets().get(0).getValue());
        c.cp.map.layers().set(m.namesLayers.indexOf(trp + m.labels.lblCurrentLC), lyrfinal);

        var imgGains = source.imgLcTransitions.select('lc_gain_' + lcInitialYear + '_' + lcFinalYear).selfMask().clip(ftc0);
        var lyrGains = ui.Map.Layer(imgGains.visualize(source.lcTransitionsStyle.vis), {}, trp + m.labels.lblGains, pnlLayers.widgets().get(2).widgets().get(0).getValue());
        c.cp.map.layers().set(m.namesLayers.indexOf(trp + m.labels.lblGains), lyrGains);

        var imgLosses = source.imgLcTransitions.select('lc_loss_' + lcInitialYear + '_' + lcFinalYear).selfMask().clip(ftc0);
        var lyrLosses = ui.Map.Layer(imgLosses.visualize(source.lcTransitionsStyle.vis), {}, trp + m.labels.lblLosses, pnlLayers.widgets().get(3).widgets().get(0).getValue());
        c.cp.map.layers().set(m.namesLayers.indexOf(trp + m.labels.lblLosses), lyrLosses);

        var imgDegradation = source.imgLcTransitions.select('lc_degradation_' + lcInitialYear + '_' + lcFinalYear).selfMask().clip(ftc0);
        var lyrDegradation = ui.Map.Layer(imgDegradation.visualize(source.lcDegradationStyle.vis), {}, trp + m.labels.lblDegradation, pnlLayers.widgets().get(4).widgets().get(0).getValue());
        c.cp.map.layers().set(m.namesLayers.indexOf(trp + m.labels.lblDegradation), lyrDegradation);


        // Update transitions charts with new selected period                
        setupTransitionsCharts(source);
    };



    m.transitionsSources.forEach(function (source, i) {
        c.lp['tr' + i].selTransitionPeriods.onChange(function (period) {
            resetTransitionsLayers(period, 'tr' + i);
        });
    });

    c.lp.dt.btnDrawingTools.onClick(function () {
        // handle drawing panel 
        c.lp.dt.pnlContainer.style().set({ shown: !c.lp.dt.pnlContainer.style().get('shown') });

        if (!c.lp.dt.pnlContainer.style().get('shown')) {
            c.cp.map.drawingTools().stop();
        }
        else {
            c.lp.boundaries.selBoundariesLayer.setValue(m.labels.lblNone);
        }

        c.cp.map.drawingTools().setShown(c.lp.dt.pnlContainer.style().get('shown'));
        c.cp.map.drawingTools().layers().forEach(function (l) {
            l.setShown(c.lp.dt.pnlContainer.style().get('shown'));
        });
    });

    /** Creates a new layer with custom name in drawing tools */
    c.lp.dt.btnAddLayer.onClick(function () {
        var paletteLayers = ['#ffb6fc', '#b797ff', '#6a5c5c', '#b3d2b6', '#06ffee', '#b63cff', '#9efba8', '#ff4848', '#ffffff'];
        if (c.lp.dt.txbLayerName.getValue().trim() !== '') {
            var gmlNewLayer = ui.Map.GeometryLayer({
                geometries: null,
                name: c.lp.dt.txbLayerName.getValue(),
                color: paletteLayers[c.cp.map.drawingTools().layers().length() % paletteLayers.length]
            });
            c.cp.map.drawingTools().layers().add(gmlNewLayer);
            c.lp.dt.txbLayerName.setValue('');
        }
    });

    /** Selects country */
    c.cp.btnSelectContainer.onClick(function () {
        resetLevelsSelects();
        m.levelAoi = m.labels.lblSelectContainer;
        m.ftcAoi = ftc0;
        m.precalculated = true;
        c.cp.map.centerObject(m.ftcAoi);
        showInfoSelectedAoi();

    });

    /** Removes combined legend widget from map panel and resets combined image*/
    var clearCombinedLayerAndLegend = function () {
        c.cp.map.widgets().remove(c.cp.pnlCombinedLegend);
        c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblHotspots), ui.Map.Layer(ee.Image(0).selfMask(), {}, m.labels.lblHotspots, false));
    };

    /** Disables or enables checks in hotspots panel, invoked from calculate and reset buttons */
    var handleDisableMcChecks = function (disable) {
        for (var p = 0; p < m.mcOptions.length; p++) {
            var widgetsArray = c.lp.mc.pnlEntries.widgets().get(p).widgets().getJsArray();
            for (var i = 1; i < widgetsArray.length; i++) { // 0=panel title
                widgetsArray[i].widgets().get(1).setDisabled(disable);
            }
        }
    };

    /** Function to enable/disable ui components that allows new aoi query */
    var handleEvaluating = function (disable) {

        c.lp.lan.selLanguage.setDisabled(disable);
        c.lp.customAsset.btnLoadAsset.setDisabled(disable);
        c.lp.levels.selLevel1.setDisabled(disable);
        c.lp.levels.selLevel2.setDisabled(disable);

        c.lp.mc.btnReset.setDisabled(disable);
        c.lp.mc.btnCalculate.setDisabled(disable);
        handleDisableMcChecks(disable);

        m.transitionsSources.forEach(function (source, n) {
            c.lp['tr' + n].selTransitionPeriods.setDisabled(disable);
        });

        c.lp.dt.btnZonalStats.setDisabled(disable);

        if (m.precalculated)
            c.rp.lblMessages.setValue(disable ? m.labels.lblProcessingArea : '');
        else
            c.rp.lblMessages.setValue(disable ? m.labels.lblProcessing : '');

        c.rp.pnlMessages.style().set({ shown: disable });

        c.cp.btnSelectContainer.setDisabled(disable);

    };


    c.cp.map.drawingTools().onSelect(function (geom, layer) {
        m.gmySelected = geom;
        m.selectedLayerName = layer.getName();

    });

    c.cp.map.drawingTools().onLayerSelect(function (layer) {
        if (layer === null) {
            m.gmySelected = undefined;
        }
    });


    /** If selected drawn-area is contained in region area and smaller than max area call showInfoSelectedAoi to
     * calculate on the fly stats.
     */
    c.lp.dt.btnZonalStats.onClick(function () {
        if (m.gmySelected === undefined) {
            c.rp.lblMessages.setValue(m.labels.lblSelectGeometry);
            c.rp.pnlMessages.style().set({ shown: true });
            return;
        }

        if (m.gmySelected.type().getInfo() === 'Point') {
            c.rp.lblMessages.setValue(m.labels.lblSelectArea);
            c.rp.pnlMessages.style().set({ shown: true });
            return;
        }

        handleCustomFeatureCollection(m.gmySelected, m.labels.lblDrawFeature + m.selectedLayerName, m.labels.lblDrawingTools);

    });

    var createChart = function (
        chartDataTable,
        chartOptions,
        chartType,
        chartPanel

    ) {
        // Until chart is rendered, display 'Generating chart x' message
        chartPanel.widgets().set(0,
            ui.Label({
                value: m.labels.lblGeneratingCharts + ': ' + chartOptions.title + '...',
                style: s.styleMessage,
            })
        );

        // Add current evaluation to been procesed list
        m.evalSet[chartOptions.title] = true;
        chartDataTable.evaluate(function (dataTable, error) {
            delete m.evalSet[chartOptions.title];

            if (Object.keys(m.evalSet).length === 0) {
                handleEvaluating(false);
            }

            if (error) {
                chartPanel.widgets().get(0).setValue(m.labels.lblUnexpectedError + ':' + error);
                return;
            }

            var chart = ui
                .Chart(dataTable)
                .setChartType(chartType)
                .setOptions(chartOptions);

            chartPanel.widgets().set(0, chart); // replace 'Generating...' label with chart

        });
    };

    var setupLCCharts = function () {

        var pnl = c.rp.lc.pnlContainer;
        pnl.clear();

        var catNames = m.lcSources[0].lcStyle.names.map(function (lbl) { return m.labels[lbl] });
        var goal = c.lp.lc.selLCYears.getValue();

        var chartSources = [];
        var statistics = [];

        m.lcSources.forEach(function (source) {
            var s = {};
            s.closestYear = source.lcYears.reduce(function (previous, current) {
                return (Math.abs(current - goal) < Math.abs(previous - goal) ? current : previous);
            });
            s.lc = source;
            chartSources.push(s);
            statistics.push('p_lc_' + s.closestYear + '_' + source.initials);
        });

        // If custom drawn-area calculate required statistics for charts
        var ftc = m.precalculated ? m.ftcAoi : mdlPrecalculation.precalculate(m.ftcAoi, statistics);

        var header = [{
            type: 'string',
            label: 'LC Comparison',
            role: 'domain',
        }];

        catNames.forEach(function (name) {
            header.push({
                type: 'number',
                label: name,
                role: 'data',
            });
        });

        var lstHeaderLCCombo = ee.List([header]);

        var dt = [];

        chartSources.forEach(function (source) {
            var row = [source.lc.initials + ' - ' + source.closestYear];
            source.lc.lcCategories.map(function (cat) {
                row.push(ftc.first().get('lc_' + cat + '_' + source.closestYear + '_' + source.lc.initials));
            });
            dt.push(row); // ['ESA - 2000', 10, 20, 30, 10, 20, 10 ,10]
        });

        var lstFeatLC = dt.map(function (r) {
            return ee.Feature(null, { row: r });
        });

        var optionsLC = {
            title: 'All LC products - Target year: ' + goal,
            legend: { position: 'none' },
            //width: 600,
            height: 400,
            isStacked: 'percent',
            colors: m.lcSources[0].lcStyle.vis.palette
        };

        createChart(lstHeaderLCCombo.cat(ee.FeatureCollection(lstFeatLC).aggregate_array('row')),
            optionsLC, 'BarChart',
            createChartPanel(pnl));


    };


    /** Setup transition charts, according to source and year selected in transition panel: LC comparison, LC net changes, LCxLC table*/
    var setupTransitionsCharts = function (s) {


        // Generate charts for each transition product 
        m.transitionsSources.forEach(function (source, i) {
            if (s === undefined || source === s) {

                var pnl = c.rp['tr' + i].pnlContainer;
                pnl.clear();

                var catNames = source.lcStyle.names.map(function (lbl) { return m.labels[lbl] });
                var fromYear = c.lp['tr' + i].selTransitionPeriods.getValue().substring(0, 4);
                var lcFinalYear = c.lp['tr' + i].selTransitionPeriods.getValue().substring(5, 9);


                // If custom drawn-area calculate required statistics for charts
                var ftc = m.precalculated ? m.ftcAoi : mdlPrecalculation.precalculate(m.ftcAoi, [
                    'p_lc_' + fromYear + '_' + source.initials,
                    'p_lc_' + lcFinalYear + '_' + source.initials,
                    'p_lc_trans_' + source.initials + '_' + fromYear + '_' + lcFinalYear,
                    'p_lc_degradation_' + source.initials + '_' + fromYear + '_' + lcFinalYear,
                    'p_lc_degradation_loss_adjusted_' + source.initials + '_' + fromYear + '_' + lcFinalYear]);


                //print(fromYear, lcFinalYear, source.initials)
                var namesLCColumns = [];
                source.lcCategories.forEach(function (cat) { namesLCColumns.push('lc_' + cat) });

                // chartTrans1 Comparison column chart LC
                var lstFeatLCCombo = namesLCColumns.map(function (pName, i) {
                    var initialValue = ftc.first().get(pName + '_' + fromYear + '_' + source.initials);
                    var finalValue = ftc.first().get(pName + '_' + lcFinalYear + '_' + source.initials);
                    var s = 'bar {fill-color:' + source.lcStyle.vis.palette[i] + '; stroke-width: 0.5; stroke-color: #000000}';
                    var lstValues = ee.List([catNames[i], initialValue, s, finalValue, s]);

                    return ee.Feature(null, { row: lstValues });
                });

                var lstHeaderLCCombo = ee.List([
                    [
                        { label: 'LC', role: 'domain', type: 'string' },
                        { label: fromYear, role: 'data', type: 'number' },
                        { label: 'color1', role: 'style', type: 'string' },
                        { label: lcFinalYear, role: 'data', type: 'number' },
                        { label: 'color2', role: 'style', type: 'string' },
                    ],
                ]);

                var optionsLCCombo = {
                    title: m.labels.lblLCPieChartChange + ' ' + fromYear + ' - ' + lcFinalYear + ' - ' + m.labels[source.name],
                    width: 600,
                    height: 400,
                    legend: { position: 'none' },
                    seriesType: 'bars',
                };

                createChart(lstHeaderLCCombo.cat(ee.FeatureCollection(lstFeatLCCombo)
                    .aggregate_array('row')), optionsLCCombo, 'ColumnChart',
                    createChartPanel(pnl));


                // charTrans2 LC CANDLESTICK NET GAIN/LOSS CHART
                var lstFeatLCNetChange = namesLCColumns.map(function (pName, i) {
                    var initialValue = ftc.first().get(pName + '_' + fromYear + '_' + source.initials);
                    var finalValue = ftc.first().get(pName + '_' + lcFinalYear + '_' + source.initials);
                    var diff = ee.Number(finalValue).subtract(ee.Number(initialValue)).format('%,.2f');
                    var tt = ee.String(m.labels.lblDifference + ' (ha): ').cat(diff);
                    var lstValues = ee.List([catNames[i], initialValue, initialValue, finalValue, finalValue, tt]);
                    return ee.Feature(null, { row: lstValues });
                });


                var lstHeaderLCNetChange = ee.List([
                    [
                        { label: 'LC', role: 'domain', type: 'string' },
                        { label: 'Low', role: 'data', type: 'number' },
                        { label: 'Open', role: 'data', type: 'number' },
                        { label: 'Close', role: 'data', type: 'number' },
                        { label: 'Final', role: 'data', type: 'number' },
                        { role: 'tooltip', p: { html: true } }
                    ],
                ]);

                var optionsLCNetChange = {
                    title: m.labels.lblNetLCChanges + ' ' + fromYear + ' - ' + lcFinalYear + ' - ' + m.labels[source.name],
                    legend: { position: 'none' },
                    bar: { groupWidth: '100%' },
                    candlestick: {
                        fallingColor: { strokeWidth: 0, fill: '#a52714' }, // red
                        risingColor: { strokeWidth: 0, fill: '#0f9d58' }   // green
                    }
                };

                createChart(lstHeaderLCNetChange.cat(ee.FeatureCollection(lstFeatLCNetChange)
                    .aggregate_array('row')), optionsLCNetChange, 'CandlestickChart',
                    createChartPanel(pnl));


                // chartTrans3 Table with transitions LC/LC
                var lstFeatLCTransTable = source.lcCategories.map(function (i) {
                    var transition = 'lc_trans_' + source.initials + '_' + fromYear + '_' + lcFinalYear + '_' + i;
                    var values = source.lcCategories.map(function (c) {
                        return ee.Number(ftc.first().get(transition + '_' + c)).format('%.2f');
                    });
                    var lstValues = ee.List([catNames[i - 1]]).cat(values);
                    return ee.Feature(null, { row: lstValues });
                });

                var colsT1 = [{ label: fromYear + '/' + lcFinalYear, role: 'domain', type: 'string' }];
                catNames.forEach(function (lc) {
                    colsT1.push({ label: lc, role: 'data', type: 'number' });
                });
                var lstHeaderLCTransTable = ee.List([colsT1]);

                var optionsLCTransTable = {
                    title: m.labels.lblTableLC + ' - ' + m.labels[source.name],
                    initial: fromYear,
                    final: lcFinalYear,
                    html: true,
                    frozenColumns: 1,

                };

                createChart(lstHeaderLCTransTable.cat(ee.FeatureCollection(lstFeatLCTransTable)
                    .aggregate_array('row')), optionsLCTransTable, 'Table',
                    createChartPanel(pnl));

                // Degradation state chart
                var lstFeatDeg = [1, 2, 3].map(function (deg, i) {
                    var degColumn = 'lc_deg_' + source.initials + '_' + fromYear + '_' + lcFinalYear + '_' + deg;
                    var lstValues = ee.List([m.labels[source.lcDegradationStyle.names[i]], ftc.first().get(degColumn)]);
                    return ee.Feature(null, { row: lstValues });
                });

                var lstHeaderDeg = ee.List([
                    [
                        { label: 'Deg', role: 'domain', type: 'string' },
                        { label: 'Value', role: 'data', type: 'number' },
                    ],
                ]);

                var optionsDeg = {
                    title: m.labels.lblDegradation + ' ' + fromYear + '-' + lcFinalYear,
                    height: 350,
                    legend: { position: 'top', maxLines: 1 },
                    colors: source.lcDegradationStyle.vis.palette,
                };

                createChart(lstHeaderDeg.cat(ee.FeatureCollection(lstFeatDeg)
                    .aggregate_array('row')), optionsDeg, 'PieChart',
                    createChartPanel(pnl));


            }

        });

    };

    /** Creates combined layer from image adding legend to map panel, invoked from calculateMultiCriteria() and combined chart click */
    var setupCombinedLayer = function (image, legendTitle, legendText) {

        c.cp.pnlCombinedLegend = ui.Panel();
        c.cp.pnlCombinedLegend.add(ui.Label(legendTitle, { margin: '1px 0px', fontSize: '12px', fontWeight: 'bold' }));

        c.cp.pnlCombinedLegend.add(mdlLegends.createCatRow(m.lv.custom.vis.palette[0], legendText, false));
        c.cp.pnlCombinedLegend.style().set({
            position: 'bottom-center'
        });

        var lblDownloadText = ui.Label({
            style: {
                fontSize: '12px',
                margin: '1px 1px 4px 1px',
                padding: '2px',
            },
        });
        c.cp.pnlCombinedLegend.add(lblDownloadText);

        if (image !== null) {
            var options = { region: m.ftcAoi.geometry(), name: legendText };
            image.getDownloadURL(options, function (url, error) {

                // errors ie: Pixel grid dimensions (159378x46852) must be less than or equal to 10000.
                // Total request size (273030772 bytes) must be less than or equal to 50331648 bytes
                lblDownloadText.setValue(m.labels.lblGeneratingDownloadLink);

                if (url !== null) {
                    lblDownloadText.setValue(m.labels.lblDownload);
                    lblDownloadText.setUrl(url);
                }
                else {
                    //lblDownloadText.setValue(labels.lblBigImage);
                    print(error);
                    lblDownloadText.setValue('');
                }

            });
        }
        c.cp.map.setOptions('SATELLITE');
        c.cp.map.widgets().add(c.cp.pnlCombinedLegend);

        c.cp.map.layers().set(m.namesLayers.indexOf(m.labels.lblHotspots), ui.Map.Layer(image, m.lv.custom.vis, m.labels.lblHotspots, true));

    };

    /** Creates a new image layer and calculate area considering categories selected in multicriteria panel*/
    var calculateMultiCriteria = function () {

        c.rp.lblMessages.setValue(m.labels.lblProcessingArea);
        c.rp.pnlMessages.style().set({ shown: true });

        handleEvaluating(true);
        var totalArea = 0;

        m.imgCustom = ee.Image(0).selfMask();

        // Function to filter image with categories 
        var getFilteredImage = function (image, categories) {
            var imgFiltered = image.clip(m.ftcAoi).eq(parseInt(categories[0]));
            for (var i = 1; i < categories.length; i++) {
                imgFiltered = imgFiltered.or(image.eq(parseInt(categories[i])));
            }
            return imgFiltered.selfMask();
        };


        // Foreach section panel in hotspots panel check which categories are selected
        var selectedPerSection = [];
        var filteredImages = [];

        c.lp.mc.pnlEntries.widgets().forEach(function (panel, panelIndex) {
            if (panelIndex < m.mcOptions.length) {
                var selectedCatNumbers = [];
                panel.widgets().forEach(function (element, index) {
                    if (index > 0) { // title
                        if (element.widgets().get(1).getValue()) {
                            var pidx = m.mcOptions[panelIndex].names.indexOf(element.widgets().get(1).getLabel());
                            selectedCatNumbers.push(m.mcOptions[panelIndex].categories[pidx]);
                        }
                    }
                });
                selectedPerSection.push(selectedCatNumbers);

                if (selectedCatNumbers.length > 0) {
                    // add filtered image to array 
                    filteredImages.push(getFilteredImage(m.mcOptions[panelIndex].image, selectedCatNumbers));
                }
            }
        });

        var imgProduct = ee.Image(1).clip(m.ftcAoi);
        filteredImages.forEach(function (f) {
            imgProduct = imgProduct.multiply(f);
        });

        m.imgCustom = imgProduct.clip(m.ftcAoi);

        // Calculate only selected categories
        var imgCombinedCatAreaAdv = m.imgCustom.eq(1)
            .rename('area')
            .multiply(ee.Image.pixelArea()).divide(10000);

        var statsAreaAdv = imgCombinedCatAreaAdv.reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: m.ftcAoi.geometry().bounds(),
            scale: 30,
            bestEffort: true
        });
        totalArea = statsAreaAdv.get('area');

        // Compute area sum, when ready set title with total ha and try to create url to download image
        m.evalSet['multicriteria'] = true;
        totalArea.evaluate(function (t, error) {
            delete m.evalSet['multicriteria'];
            if (Object.keys(m.evalSet).length === 0) {
                handleEvaluating(false);
            }

            if (error) {
                print('totalArea.evaluate error', error);
            }
            else {
                var legendTitle = m.labels.lblHotspots + ' Aprox.: ' + formatNumber(t, 2) + ' ha.';
                setupCombinedLayer(t === 0 ? null : m.imgCustom, legendTitle, m.labels.lblCombinedCategoriesArea);
            }
        });
    };

    /** Returns true if at least one category in hotspots is checked*/
    var mcCategoryChecked = function () {
        for (var p = 0; p < m.mcOptions.length; p++) {
            var widgetsArray = c.lp.mc.pnlEntries.widgets().get(p).widgets().getJsArray();
            for (var i = 1; i < widgetsArray.length; i++) { // 0=panel title
                if (widgetsArray[i].widgets().get(1).getValue()) { // 0=colorbox 1=chkbox
                    return true;
                }
            }
        }
        return false;
    };


    /** Reset calcultation and uncheck all multicriteria categories*/
    var handleClickReset = function () {
        clearCombinedLayerAndLegend();

        // unselect combined checks
        for (var p = 0; p < m.mcOptions.length; p++) {
            var widgetsArray = c.lp.mc.pnlEntries.widgets().get(p).widgets().getJsArray();
            for (var i = 1; i < widgetsArray.length; i++) { // 0=title
                widgetsArray[i].widgets().get(1).setValue(false);
            }
        }

    };

    function handleClickCalculateMulticriteria() {
        clearCombinedLayerAndLegend();
        if (mcCategoryChecked()) {
            c.lp.mc.pnlLayers.widgets().get(0).widgets().get(0).setValue(true);
            calculateMultiCriteria();
        }
    }

    /** Recalculate combined layer with selected multicriteria categories */
    c.lp.mc.btnCalculate.onClick(function () {
        handleClickCalculateMulticriteria();
    });
    c.lp.mc.btnReset.onClick(handleClickReset);

    // Layers names array ordered as stacked in the map
    c.cp.map.layers().forEach(function (l) {
        m.namesLayers.push(l.getName());
    });

    c.cp.map.drawingTools().setDrawModes(['point', 'polygon', 'rectangle']);
    var updateCollection = function () {
        var names = [];
        c.cp.map.drawingTools().layers().forEach(function (l) { return names.push(l.getName()) });

        var ftcDrawn = c.cp.map.drawingTools().toFeatureCollection("layerId");

        ftcDrawn = ftcDrawn.map(function (f) {
            return f
                .set("layerName", ee.List(names).get(f.get("layerId")))
                .set("layerId", f.get("layerId"));
        });

        ftcDrawn.size().evaluate(function (size) {
            if (size > 0) {
                c.lp.dt.lblJson.style().set('shown', true);
                c.lp.dt.lblJson.setValue(m.labels.lblUpdating + '...').setUrl(null);
                c.lp.dt.lblKml.style().set('shown', true);
                c.lp.dt.lblKml.setValue(m.labels.lblUpdating + '...').setUrl(null);


                ftcDrawn.getDownloadURL({
                    format: 'kml',
                    filename: m.labels.lblDownloadFileName,
                    callback: function (url) {
                        c.lp.dt.lblKml.setValue('.kml').setUrl(url);
                        c.lp.dt.lblKml.setUrl(url);
                    },
                });
                ftcDrawn.getDownloadURL({
                    format: 'json',
                    filename: m.labels.lblDownloadFileName,
                    callback: function (url) {
                        c.lp.dt.lblJson.setValue('.json').setUrl(url);
                        c.lp.dt.lblJson.setUrl(url);
                    },
                });
            }
            else {
                c.lp.dt.lblJson.style().set({ shown: false });
                c.lp.dt.lblKml.style().set({ shown: false });
            }
        });
    };

    c.cp.map.drawingTools().onDraw(updateCollection);
    c.cp.map.drawingTools().onEdit(updateCollection);
    c.cp.map.drawingTools().onErase(updateCollection);

    /*******************************************************************************
    * 6-Initialization *
    ******************************************************************************/

    // Project areas of interest Level1/Level2 
    m.ftcLelvel1 = ftc1;
    m.ftcLelvel2 = ftc2;
    m.ftcAoi = ftc0;
    m.levelAoi = m.labels.lblSelectContainer;
    m.haAoi = 0;
    m.precalculated = true;

    // Level 1 names for dropdown
    m.names1 = m.ftcLelvel1.aggregate_array('ADM1_NAME').getInfo();
    m.codes1 = m.ftcLelvel1.aggregate_array('ADM1_CODE').getInfo();
    m.siLevel1 = [];
    for (var i = 0; i < m.names1.length; i++) {
        m.siLevel1.push({
            label: m.names1[i],
            value: m.codes1[i]
        });
    }
    m.siLevel1.sort(sortByLabel);
    c.lp.levels.selLevel1.items().reset(m.siLevel1);

    showInfoSelectedAoi(); // on load show info of whole country region
    showFrontLayerLegend();

    c.cp.map.setControlVisibility({ 'layerList': false });
}
