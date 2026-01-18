/*
This script processes the 7 UNCCD categories using default reclassification factors and a transition matrix for the GLC-FCS30D land cover series.

In the final image stack, for each target year, you will get four images: change, gain, loss, and degradation.

Target Periods according to UNCCD PRAIS and to availability:
BASELINE: 2000–2015   ---- for land cover use 2000–2015 (available: ok)
Period 1: 2016–2019   ---- for land cover use 2015–2019 (available: ok)
Period 2: 2016–2023   ---- for land cover use 2015–2023 (available: 2015–2022)
LONG TERM: 2000–2023  ---- for land cover use 2000–2023 (available: 2000–2022)

Steps:
Part 0: Load boundaries and set up export folder paths
Part 1: Load GLC-FCS30D dataset (available years: 2000–2022)
Part 2: Reclassify GLC-FCS30D LC dataset into UNCCD categories
Part 3: Process the land cover images and calculate transitions

Script developed with the support of Apacheta team - www.apacheta.org
@author Cesar Luis Garcia - cesarnon@gmail.com

This work is licensed under Apache License Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/ 

/* ============== Part 0 ============================
   Load boundaries and set up export folder paths
   ================================================== */

// Modify countryName and iso3 variables accordingly. Alternatively replace ftc0 variable with custom feature collection for boundaries
var sidsWithBuffer = ee.FeatureCollection("projects/apacheta/assets/SIDS/SIDS_GAUL_1kmBufffer_ADM0");
var sids = ee.FeatureCollection("projects/apacheta/assets/SIDS/SIDS_GAUL_ADM0");

var countryName = 'Haiti';  // name to filter FAO GAUL collection
var iso3 = 'HTI'; // ISO to use in files and folders names

// Export of land cover and transitions assets (images) - Change output assets folder accordingly 
var geeAssetFolder = 'projects/apacheta-pislm/assets/UNCCD2026_' + iso3 + '/LC/';


var ftc0 = sidsWithBuffer.filter(ee.Filter.eq('ADM0_NAME', countryName));
var areaCrop = ftc0.geometry();


/* ============== Part 1 ===========================
   Load GLC-FCS30D dataset (available years: 2000–2022)
   ================================================== */

var lcCBAS = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual").mosaic().clip(areaCrop);

var gl2000 = lcCBAS.select('b1').rename('y2000');
var gl2015 = lcCBAS.select('b16').rename('y2015');
var gl2019 = lcCBAS.select('b20').rename('y2019');
var gl2022 = lcCBAS.select('b23').rename('y2022');

// Uncomment the following code block to test and see distributions of specific classes


Map.addLayer(lcCBAS, {}, 'glc-FCS30D-allYears', false);

var GLC30Palette = [
    'f096ff', //10 Cultivated Land 
    '006400', //20 Forest 
    'ffff4c', //30 Grassland 
    'afffa4', //40 Shrublands
    '29d6d6', //50 Wetland
    '0064c8', //60 Water bodies
    'fae6a0', //70 Tundra
    'fa0000', //80 Artificial surface
    'b4b4b4', //90 Bareland
    'f0f0f0', //100 Permanent snow and ice
];

Map.addLayer(gl2000, {}, 'glc-2000', false);
Map.addLayer(gl2015, {}, 'glc-2015', false);
Map.addLayer(gl2019, {}, 'glc-2019', false);
Map.addLayer(gl2022, {}, 'glc-2022', false);


/* ============== Part 2 =============================
   Reclassify GLC-FCS30D dataset into UNCCD categories
   =================================================== */
// UNCCD categories & palette
var lcPalette = ['#377e3f', '#c19511', '#fcdb00', '#18eebe', '#d7191c', '#cfdad2', '#4458eb'];
var names1 = ['1Tree-covered', '2Grassland', '3Cropland', '4Wetland', '5Artificial', '6Other land', '7Water body'];

var GLrec = function (lcov) {
      var imagen2 = lcov.eq(51) //forest
      var imagen2 = imagen2.where(lcov.gte(52).and(lcov.lte(92)),1)//forest
                    .where(lcov.eq(185),1)//Mangroove
                    .where(lcov.gte(120).and(lcov.lte(130)),2)//grasslands
                    .where(lcov.gte(140).and(lcov.lte(153)),2)//grasslands
                    .where(lcov.gte(10).and(lcov.lte(20)),3)//cropland
                    .where(lcov.gte(181).and(lcov.lte(184)),4)//Wetland
                    .where(lcov.eq(186),4)// Wetland
                    .where(lcov.eq(187),7)// Water body
                    .where(lcov.eq(190),5)//artificial
                    .where(lcov.gte(200).and(lcov.lte(202)),6)//OtherLAnd
                    .where(lcov.gte(220).and(lcov.lte(250)),6)//OtherLAnd
                    .where(lcov.eq(210),7)//Water body
                    .mask(lcov.neq(255))
                    .clip(areaCrop)
    return imagen2
}

var LC2000 = GLrec(gl2000);
var LC2015 = GLrec(gl2015);
var LC2019 = GLrec(gl2019);
var LC2022 = GLrec(gl2022);

Map.addLayer(LC2000, { min: 1, max: 7, palette: lcPalette }, 'LC2000', false);
Map.addLayer(LC2015, { min: 1, max: 7, palette: lcPalette }, 'LC2015', false);
Map.addLayer(LC2019, { min: 1, max: 7, palette: lcPalette }, 'LC2019', false);
Map.addLayer(LC2022, { min: 1, max: 7, palette: lcPalette }, 'LC2022', false);

// Image with land cover bands for all years required to generate the transition images
var lcAll = LC2000.rename('y2000')
    .addBands(LC2015.rename('y2015'))
    .addBands(LC2019.rename('y2019'))
    .addBands(LC2022.rename('y2022'));


var assetName = 'GLC_FCS30D_LC_all_2000_2022_UNCCD_Cat_' + iso3;
Export.image.toAsset({
    image: lcAll.clip(areaCrop),
    description: assetName,
    assetId: geeAssetFolder + assetName,
    crs: 'EPSG:4326',
    region: areaCrop.bounds(),
    scale: 30,
    maxPixels: 1e13,
    pyramidingPolicy: { '.default': 'mode' },
});



/* ============== Part 3 =====================================
   Process the land cover images and calculate transitions 
  ============================================================ */

var periods = [[2000, 2015], [2015, 2019], [2015, 2022], [2000, 2022]];
/** For each period defined in the array 4 bands will be added to the final image, ie:
lc_change_2000_2015
lc_loss_2000_2015
lc_gain_2000_2015
lc_degradation_2000_2015
 */
var lcInitialYear, lcFinalYear;
var numCats = 7;
var lcInitialImage, lcFinalImage, lcChange, lcLoss, lcGain, lcTransitions, lcDegradation;
var periodText;


for (var x = 0; x < periods.length; x++) {

    lcInitialYear = periods[x][0];
    lcFinalYear = periods[x][1];

    lcInitialImage = lcAll.select('y' + lcInitialYear);
    lcFinalImage = lcAll.select('y' + lcFinalYear);
    lcChange = lcInitialImage.multiply(10).add(lcFinalImage);

    lcLoss = ee.Image(0);
    lcGain = ee.Image(0);
    lcDegradation = ee.Image(0);

    periodText = lcInitialYear + '_' + lcFinalYear;

    if (x === 0) { // First period analyzed
        lcTransitions = lcChange.rename("lc_change_" + periodText);
    }
    else {
        lcTransitions = lcTransitions.addBands(lcChange.rename("lc_change_" + periodText));
    }

    for (var i = 1; i <= numCats; i++) {
        lcLoss = lcLoss.where(lcInitialImage.eq(i).and(lcFinalImage.neq(i)), i);
        lcGain = lcGain.where(lcFinalImage.eq(i).and(lcInitialImage.neq(i)), i);
    }

    lcTransitions = lcTransitions.addBands(lcLoss.rename("lc_loss_" + periodText));
    lcTransitions = lcTransitions.addBands(lcGain.rename("lc_gain_" + periodText));

    /* Add a Land Degradation layer based on the transition matrix.
    Depending on the category change that has occurred, set the final value to:
    1 = 'Degradation', 2 = 'Stable', 3 = 'Improvement'. */

    // Default LC transition matrix        
    lcDegradation = lcChange
        .remap([
            11, 12, 13, 14, 15, 16, 17,
            21, 22, 23, 24, 25, 26, 27,
            31, 32, 33, 34, 35, 36, 37,
            41, 42, 43, 44, 45, 46, 47,
            51, 52, 53, 54, 55, 56, 57,
            61, 62, 63, 64, 65, 66, 67,
            71, 72, 73, 74, 75, 76, 77],
            [
             2,  1,  1,  1,  1,  1,  2,
             3,  2,  3,  1,  1,  1,  2,
             3,  1,  2,  1,  1,  1,  2,
             1,  1,  1,  2,  1,  1,  2,
             3,  3,  3,  3,  2,  3,  2,
             3,  3,  3,  3,  1,  2,  2,
             2,  2,  2,  2,  2,  2,  2]);


    lcTransitions = lcTransitions.addBands(lcDegradation.rename("lc_degradation_" + periodText));

}

Map.addLayer(lcTransitions, {}, 'Transition images stack', false);
print(lcTransitions, 'lcTransitions');

// Gain and Loss layers
var test1 = lcTransitions.select('lc_gain_2000_2015');
var test2 = lcTransitions.select('lc_loss_2000_2015');

Map.addLayer(test1.selfMask(), { min: 1, max: 7, palette: lcPalette }, 'Transitions unified image - lc_gain_2000_2015', false);
Map.addLayer(test2.selfMask(), { min: 1, max: 7, palette: lcPalette }, 'Transitions unified image - lc_loss_2000_2015', false);

// Degradation layers
var degPalette = ['#AB2727', '#e5e5c9', '#45A146'];
var degNames = ['Degradation', 'Stable', 'Improvement'];

var test3 = lcTransitions.select('lc_degradation_2000_2015');
Map.addLayer(test3, { min: 1, max: 3, palette: degPalette }, 'Transitions unified image - lc_deg_2000_2015', false);

var test4 = lcTransitions.select('lc_degradation_2015_2019');
Map.addLayer(test4, { min: 1, max: 3, palette: degPalette }, 'Transitions unified image - lc_deg_2015_2019', false);

// Export task
var assetName = 'GLC_FCS30D_LC_Transitions_UNCCD_Cat_' + iso3;
Export.image.toAsset({
    image: lcTransitions,
    assetId: geeAssetFolder + assetName,
    description: assetName,
    region: areaCrop.bounds(),
    crs: 'EPSG:4326',
    maxPixels: 1e13,
    scale: 30,
    pyramidingPolicy: { '.default': 'mode' },
});

