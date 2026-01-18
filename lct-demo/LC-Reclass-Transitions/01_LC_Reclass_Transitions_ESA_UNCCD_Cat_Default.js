/*
This script processes the 7 UNCCD categories using default reclassification factors and a transition matrix for the ESA land cover series.

In the final image stack, for each target year, you will get four images: change, gain, loss, and degradation.

Target Periods according to UNCCD PRAIS and to availability:
BASELINE: 2000–2015   ---- for land cover use 2000–2015 (available: ok) 
Period 1: 2016–2019   ---- for land cover use 2015–2019 (available: ok)
Period 2: 2016–2023   ---- for land cover use 2015–2023 (available: 2015–2022)
LONG TERM: 2000–2023  ---- for land cover use 2000–2023 (available: 2000–2022)

Steps:
Part 0: Load boundaries and set up export folder paths
Part 1: Load ESA LC dataset (available years: 1992–2022)
Part 2: Reclassify ESA LC dataset into UNCCD categories
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
   Load ESA LC dataset (available years: 1992–2022)
   ================================================== */

var lcESA = ee.Image("users/geflanddegradation/toolbox_datasets/lcov_esacc_1992_2022");

// Uncomment the following code block to test and see distributions of specific classes

Map.addLayer(lcESA.select('y2022').randomVisualizer().clip(areaCrop),{},'ESA');

/*
var testclass = lcESA.select('y2022').eq(100).clip(areaCrop).selfMask();
Map.addLayer(testclass,{},'testclass1');

var testclass = lcESA.select('y2022').eq(120).clip(areaCrop).selfMask();
Map.addLayer(testclass,{},'testclass2');
*/

/* ============== Part 2 =============================
   Reclassify ESA LC dataset into UNCCD categories
   =================================================== */
// UNCCD categories & palette   
var lcPalette = ['#377e3f', '#c19511', '#fcdb00', '#18eebe', '#d7191c', '#cfdad2', '#4458eb'];
var names1 = ['1Tree-covered', '2Grassland', '3Cropland', '4Wetland', '5Artificial', '6Other land', '7Water body'];


// Reclassification as in PRAIS:
var ESArec = function (lcov) {
    var img = lcov.eq(50); //forest
    img = img.where(lcov.lte(40),3)// Cultivated
    .where(lcov.eq(190),5)//artificial
    .where(lcov.gte(50).and(lcov.lte(100)),1)//forest
    .where(lcov.gte(110).and(lcov.lte(153)),2)//grassland
    .where(lcov.gte(160).and(lcov.lte(180)),4) // Wetland
    .where(lcov.gte(200).and(lcov.lte(202)),6)// other land
    .where(lcov.eq(210),7)// waterbody
    .where(lcov.eq(220),6) // other land
    .clip(areaCrop);
    return img;
};

var LC2000 = ESArec(lcESA.select('y2000')).selfMask();
var LC2015 = ESArec(lcESA.select('y2015')).selfMask();
var LC2019 = ESArec(lcESA.select('y2019')).selfMask();
var LC2022 = ESArec(lcESA.select('y2022')).selfMask();

Map.addLayer(LC2000, { min: 1, max: 7, palette: lcPalette }, 'LC2000', false);
Map.addLayer(LC2015, { min: 1, max: 7, palette: lcPalette }, 'LC2015', false);
Map.addLayer(LC2019, { min: 1, max: 7, palette: lcPalette }, 'LC2019', false);
Map.addLayer(LC2022, { min: 1, max: 7, palette: lcPalette }, 'LC2022', false);

// Image with land covers for all years required to create the transitions images
var lcAll = LC2000.rename('y2000')
    .addBands(LC2015.rename('y2015'))
    .addBands(LC2019.rename('y2019'))
    .addBands(LC2022.rename('y2022'));

//print(lcAll)
var assetName = 'ESA_LC_all_2000_2022_UNCCD_Cat_' + iso3;
Export.image.toAsset({
    image: lcAll.clip(areaCrop),
    description: assetName,
    assetId: geeAssetFolder + assetName,
    crs: 'EPSG:4326',
    region: areaCrop.bounds(),
    scale: 300,
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
var lcInitialImage, lcFinalImage, lcChange, lcLoss, lcGain,  lcTransitions, lcDegradation;
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
var assetName = 'ESA_LC_Transitions_UNCCD_Cat_' + iso3;
Export.image.toAsset({
    image: lcTransitions,
    assetId: geeAssetFolder + assetName,
    description: assetName,
    region: areaCrop.bounds(),
    crs: 'EPSG:4326',
    maxPixels: 1e13,
    scale: 300,
    pyramidingPolicy: { '.default': 'mode' },
});
