/* 
This script is structured to handle multiple datasets and calculate land cover, 
transitions, and degradation areas over time for specific areas of interest.
*/

// Land Cover, Transitions and Degradation Layers styles 
var lcUNCCDCatVis = {
    vis: {
        min: 1, max: 7, opacity: 1,
        palette: ['#377e3f', '#c19511', '#fcdb00', '#18eebe', '#d7191c', '#cfdad2', '#4458eb',],
    },
    names: [
        'lblTreeCovered',
        'lblGrassland',
        'lblCropland',
        'lblWetland',
        'lblArtificial',
        'lblOtherLand',
        'lblWaterbody',
    ]
}; 

var lcDegCatVis = {
    vis: {
        min: 1, max: 3, opacity: 1,
        palette: ['#AB2727', '#e5e5c9', '#45A146'],
    },
    names: [
        'lblDegradation',
        'lblStable',
        'lblImprovement',

    ]
};

var lcTransUNCCDCatVis = {
    vis: {
        min: 0, max: 7, opacity: 1,
        palette: ['#FEFFE5'].concat(lcUNCCDCatVis.vis.palette.slice(0)),
    },
    names: ['lblNoChange'].concat(lcUNCCDCatVis.names.slice(0)),
};

/*
Target Periods
BASELINE  2000-2015 
Period 1  2016-2019 
Period 2  2016-2023 
LONG TERM 2000-2023 
*/


/* Land Cover sources configuration */
var lcSources = [
    {
        initials: 'ESA',
        name: 'lblLCESA', //'Land Cover - ESA (Default)',
        imgLcAll: ee.Image("projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/ESA_LC_all_2000_2022_UNCCD_Cat_HTI"),
        lcYears: ['2000', '2015', '2019', '2022'],
        lcTransitionsPeriods: [[2000, 2015], [2015, 2019], [2015, 2022], [2000, 2022]],
        imgLcTransitions: ee.Image("projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/ESA_LC_Transitions_UNCCD_Cat_HTI"),
        lcScale: 300,
        lcCategories: [1, 2, 3, 4, 5, 6, 7],
        lcStyle: lcUNCCDCatVis,
        lcTransitionsStyle: lcTransUNCCDCatVis,
        lcDegradationStyle: lcDegCatVis

    },
    {

        initials: 'GLA',
        name: 'lblLCGLAD', //'Land Cover - GLAD',
        imgLcAll: ee.Image("projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/GLAD_LC_all_2000_2020_UNCCD_Cat_HTI"),
        lcYears: ['2000', '2015', '2020'],
        lcTransitionsPeriods: [[2000, 2015], [2015, 2020], [2000, 2020]],
        imgLcTransitions: ee.Image("projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/GLAD_LC_Transitions_UNCCD_Cat_HTI"),
        lcScale: 30,
        lcCategories: [1, 2, 3, 4, 5, 6, 7],
        lcStyle: lcUNCCDCatVis,
        lcTransitionsStyle: lcTransUNCCDCatVis,
        lcDegradationStyle: lcDegCatVis

    },
    {
        initials: 'GLC',
        name: 'lblLCGLC', //'Land Cover - GLC_FCS30D',
        imgLcAll: ee.Image("projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/GLC_FCS30D_LC_all_2000_2022_UNCCD_Cat_HTI"),
        lcYears: ['2000', '2015', '2019', '2022'],
        lcTransitionsPeriods: [[2000, 2015], [2015, 2019], [2015, 2022], [2000, 2022]],
        imgLcTransitions: ee.Image("projects/apacheta-pislm/assets/UNCCD2026_HTI/LC/GLC_FCS30D_LC_Transitions_UNCCD_Cat_HTI"),
        lcScale: 30,
        lcCategories: [1, 2, 3, 4, 5, 6, 7],
        lcStyle: lcUNCCDCatVis, 
        lcTransitionsStyle: lcTransUNCCDCatVis,
        lcDegradationStyle: lcDegCatVis
    },
];


// Configure images reducers
var processList = [];

// Add to process lc area for cat/year/product and lc transition for product/period/transition
// For transition calculation, for each period, if n is the number of lc categories, nxn columns will be added for period and product)
lcSources.forEach(function (source) {

    // Add reducer for lc area for each year and product
    source.lcYears.forEach(function (year) {

        var colNamesLCYear = [];
        source.lcCategories.forEach(function (catNumber) {
            colNamesLCYear.push('lc_' + catNumber + '_' + year + '_' + source.initials);
        });

        var imgRenamedLC = source.imgLcAll.select('y' + year).eq(source.lcCategories).rename(colNamesLCYear);
        var imgAreaLC = imgRenamedLC.multiply(ee.Image.pixelArea()).divide(10000);
        processList.push({
            name: 'p_lc_' + year + '_' + source.initials,
            image: imgAreaLC,
            reducer: ee.Reducer.sum(),
            scale: source.lcScale
        });
    });


    // Add reducers for lc transitions and degradation por each period and product
    source.lcTransitionsPeriods.forEach(function (period) {

        var initialYear = period[0];
        var finalYear = period[1];

        // LC transition
        var lcChangeBand = 'lc_change_' + initialYear + '_' + finalYear; // name of the band: lc_change_1990_2018

        var colBaseName = 'lc_trans_' + source.initials + '_' + initialYear + '_' + finalYear; // name of the column: lc_trans_ESA_1990_2018

        var colNames = [];
        var catValues = [];
        var n = source.lcCategories.length;
        source.lcCategories.forEach(function (initialCat) {
            source.lcCategories.forEach(function (finalCat) {
                catValues.push(initialCat * (n < 10 ? 10 : 100) + finalCat);
                colNames.push(colBaseName + '_' + initialCat + '_' + finalCat); // lc_trans_ESA_1990_2020_1_1
            });
        });


        var imgRenamedLCChange = source.imgLcTransitions.select(lcChangeBand).eq(catValues).rename(colNames);
        var imgAreaLCChange = imgRenamedLCChange.multiply(ee.Image.pixelArea()).divide(10000);
        processList.push({
            name: 'p_lc_trans_' + source.initials + '_' + initialYear + '_' + finalYear,
            image: imgAreaLCChange,
            reducer: ee.Reducer.sum(),
            scale: source.lcScale
        });

        //  Degradation
        var lcDegradationBand = 'lc_degradation_' + initialYear + '_' + finalYear; // name of the band: lc_degradation_1990_2018
        var colDegBaseName = 'lc_deg_' + source.initials + '_' + initialYear + '_' + finalYear; // base name of the column: lc_deg_COR_1990_2018
        var colDegNames = [];


        var catValuesDeg = [1, 2, 3];
        catValuesDeg.forEach(function (n) {
            colDegNames.push(colDegBaseName + '_' + n); // final names for the columns: lc_deg_ESA_1990_2020_1 / 2 / 3
        });

        var imgRenamedLCDegradation = source.imgLcTransitions.select(lcDegradationBand).eq(catValuesDeg).rename(colDegNames);
        var imgAreaLCDegradation = imgRenamedLCDegradation.multiply(ee.Image.pixelArea()).divide(10000);
        processList.push({
            name: 'p_lc_degradation_' + source.initials + '_' + initialYear + '_' + finalYear,
            image: imgAreaLCDegradation,
            reducer: ee.Reducer.sum(),
            scale: source.lcScale
        });

        // Only for MAPBIOMAS TEST ADDING FOREST LOSS            
        if (source.initials === 'BIO') {

            //  Degradation with forest loss adjusted
            var lcDegradationLossAdjustedBand = 'lc_degradation_loss_adjusted_' + initialYear + '_' + finalYear; // name of the band: lc_degradation_loss_adjusted_1990_2018
            var colDegLossAdjustedBaseName = 'lc_deg_' + source.initials + '_loss_adjusted_' + initialYear + '_' + finalYear; // base name of the column: lc_deg_loss_adjusted_BIO_2000_2015
            var colDegLossAdjustedNames = [];

            catValuesDeg.forEach(function (n) {
                colDegLossAdjustedNames.push(colDegLossAdjustedBaseName + '_' + n); // final names for the columns: lc_deg_ESA_1990_2020_1 / 2 / 3
            });

            var imgRenamedLCDegradationWithForestLoss = source.imgLcTransitions.select(lcDegradationLossAdjustedBand)
                .eq(catValuesDeg)
                .rename(colDegLossAdjustedNames);

            var imgAreaLCDegradationLossAdjusted = imgRenamedLCDegradationWithForestLoss.multiply(ee.Image.pixelArea()).divide(10000);
            processList.push({
                name: 'p_lc_degradation_loss_adjusted_' + source.initials + '_' + initialYear + '_' + finalYear,
                image: imgAreaLCDegradationLossAdjusted,
                reducer: ee.Reducer.sum(),
                scale: source.lcScale
            });

        }
    });

});



var names=[];
processList.forEach(function(p){names.push(p.name)});
//print(names);


// For all features in the pFeatureCollection collection, precalculates area and process all tasks defined in processList
var precalculate = function (pFeatureCollection, pStats) {

    // Add area column
    var ftcStats = pFeatureCollection.map(function (f) {
        return f.set(
            'area_ha', f
                .geometry()
                .area({ 'maxError': 1 })
                .divide(10000)
        );
    });

    var image;
    for (var j = 0; j < processList.length; j++) {
        // Include only desired stats 
        if (pStats === undefined || pStats.indexOf(processList[j].name) >= 0) {
            image = processList[j].image;
            ftcStats = image.reduceRegions({
                reducer: processList[j].reducer,
                scale: processList[j].scale,
                collection: ftcStats,
            });
        }
    }

    return ftcStats;
};

// Exports to use in app
exports.precalculate = precalculate;
exports.lcSources = lcSources;


