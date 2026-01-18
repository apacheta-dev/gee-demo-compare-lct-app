/*
This script processes the 7 UNCCD categories using default reclassification factors and a transition matrix for the 
The Global Land Analysis & Discover (GLAD) LC series.

In the final image stack, for each target year, you will get four images: change, gain, loss, and degradation.

Target Periods according to UNCCD PRAIS and to availability:
BASELINE: 2000–2015   ---- for land cover use 2000–2015 (available: ok)
Period 1: 2016–2019   ---- for land cover use 2015–2019 (available: 2015–2020)
Period 2: 2016–2023   ---- for land cover use 2015–2023 (available: 2015–2020)
LONG TERM: 2000–2023  ---- for land cover use 2000–2023 (available: 2000–2020)

Steps:
Part 0: Load boundaries and set up export folder paths
Part 1: Load GLAD LC dataset (available years: 2000, 2005, 2010, 2015, 2020)
Part 2: Reclassify GLAD LC dataset into UNCCD categories
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

var GLAD2000 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2000').rename('y2000').clip(areaCrop);
var GLAD2015 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2015').rename('y2015').clip(areaCrop);
var GLAD2020 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2020').rename('y2020').clip(areaCrop);

// Uncomment the following code block to test and see distributions of specific classes

var visParamMap = {
    "min": 0, "max": 255, "palette": ["FEFECC", "FAFAC3", "F7F7BB", "F4F4B3", "F1F1AB", "EDEDA2", "EAEA9A", "E7E792", "E4E48A",
        "E0E081", "DDDD79", "DADA71", "D7D769", "D3D360", "D0D058", "CDCD50", "CACA48", "C6C63F", "C3C337", "C0C02F", "BDBD27", "B9B91E", "B6B616",
        "B3B30E", "B0B006", "609C60", "5C985C", "589558", "549254", "508E50", "4C8B4C", "488848", "448544", "408140", "3C7E3C", "387B38", "347834",
        "317431", "2D712D", "296E29", "256B25", "216721", "1D641D", "196119", "155E15", "115A11", "0D570D", "095409", "065106", "643700", "643a00",
        "643d00", "644000", "644300", "644600", "644900", "654c00", "654f00", "655200", "655500", "655800", "655a00", "655d00", "656000", "656300",
        "666600", "666900", "666c00", "666f00", "667200", "667500", "667800", "667b00", "ff99ff", "FC92FC", "F98BF9", "F685F6", "F37EF3", "F077F0",
        "ED71ED", "EA6AEA", "E763E7", "E45DE4", "E156E1", "DE4FDE", "DB49DB", "D842D8", "D53BD5", "D235D2", "CF2ECF", "CC27CC", "C921C9", "C61AC6",
        "C313C3", "C00DC0", "BD06BD", "bb00bb", "000003", "000004", "000005", "BFC0C0", "B7BDC2", "AFBBC4", "A8B8C6", "A0B6C9", "99B3CB", "91B1CD",
        "89AFD0", "82ACD2", "7AAAD4", "73A7D6", "6BA5D9", "64A3DB", "5CA0DD", "549EE0", "4D9BE2", "4599E4", "3E96E6", "3694E9", "2E92EB", "278FED",
        "1F8DF0", "188AF2", "1088F4", "0986F7", "55A5A5", "53A1A2", "519E9F", "4F9B9C", "4D989A", "4B9597", "499294", "478F91", "458B8F", "43888C",
        "418589", "3F8286", "3D7F84", "3B7C81", "39797E", "37767B", "357279", "336F76", "316C73", "2F6970", "2D666E", "2B636B", "296068", "285D66",
        "bb93b0", "B78FAC", "B48CA9", "B189A6", "AE85A2", "AA829F", "A77F9C", "A47B99", "A17895", "9E7592", "9A718F", "976E8C", "946B88", "916885",
        "8D6482", "8A617F", "875E7B", "845A78", "815775", "7D5472", "7A506E", "774D6B", "744A68", "714765", "de7cbb", "DA77B7", "D772B3", "D46EAF",
        "D169AB", "CE64A8", "CB60A4", "C85BA0", "C4579C", "C15298", "BE4D95", "BB4991", "B8448D", "B54089", "B23B86", "AF3682", "AB327E", "A82D7A",
        "A52976", "A22473", "9F1F6F", "9C1B6B", "991667", "961264", "000000", "000000", "000000",
        "1964EB", "1555E4", "1147DD", "0E39D6", "0A2ACF", "071CC8", "030EC1", "0000BA",
        "0000BA", "040464", "0000FF", "3051cf", "000000", "000000", "000000", "000000",
        "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000",
        "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000",
        "547FC4", "4D77BA", "466FB1", "4067A7", "395F9E", "335895", "335896", "335897", "ff2828", "ffffff", "d0ffff", "ffe0d0", "ff7d00", "fac800", "c86400",
        "fff000", "afcd96", "afcd96", "64dcdc", "00ffff", "00ffff", "00ffff", "111133", "000000"]
};


Map.addLayer(GLAD2000, visParamMap, 'GLAD2000',false);
Map.addLayer(GLAD2015, visParamMap, 'GLAD2015',false);
Map.addLayer(GLAD2020, visParamMap, 'GLAD2020',false);


/* ============== Part 2 =============================
   Reclassify GLAD dataset into UNCCD categories
   =================================================== */

var lcPalette = ['#377e3f', '#c19511', '#fcdb00', '#18eebe', '#d7191c', '#cfdad2', '#4458eb'];
var names1 = ['1Tree-covered', '2Grassland', '3Cropland', '4Wetland', '5Artificial', '6Other land', '7Water body'];

var GLADrec = function (lcov) {
    var img = lcov.eq(41); //forest
    img = img
        .where(lcov.lte(1), 6)//OtherLAnds
        .where(lcov.gte(2).and(lcov.lte(26)), 2)//grasslands
        .where(lcov.gte(27).and(lcov.lte(48)), 1)//forest
        .where(lcov.gte(100).and(lcov.lte(101)), 6)//OtherLAnds
        .where(lcov.gte(102).and(lcov.lte(126)), 4)//Wetland
        .where(lcov.gte(181).and(lcov.lte(184)), 4)//Wetland
        .where(lcov.gte(127).and(lcov.lte(148)), 1)
        .where(lcov.gte(200).and(lcov.lte(205)), 4)//Wetland
        .where(lcov.gte(206).and(lcov.lte(207)), 7)//water body
        .where(lcov.eq(241), 6)//OtherLAnds
        .where(lcov.eq(244), 3)//cropland
        .where(lcov.eq(250), 5)//Artificial
        .where(lcov.eq(254), 7)
        .clip(areaCrop);
    return img;
};

// UNCCD categories & palette
var lcPalette = ['#377e3f', '#c19511', '#fcdb00', '#18eebe', '#d7191c', '#cfdad2', '#4458eb'];
var names1 = ['1Tree-covered', '2Grassland', '3Cropland', '4Wetland', '5Artificial', '6Other land', '7Water body'];

var LC2000 = GLADrec(GLAD2000);
var LC2015 = GLADrec(GLAD2015);
var LC2020 = GLADrec(GLAD2020);

Map.addLayer(LC2000, { min: 1, max: 7, palette: lcPalette }, 'LC2000', false);
Map.addLayer(LC2015, { min: 1, max: 7, palette: lcPalette }, 'LC2015', false);
Map.addLayer(LC2020, { min: 1, max: 7, palette: lcPalette }, 'LC2020', false);

var lcAll = LC2000.rename('y2000')
    .addBands(LC2015.rename('y2015'))
    .addBands(LC2020.rename('y2020'));


var assetName = 'GLAD_LC_all_2000_2020_UNCCD_Cat_' + iso3;
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

var periods = [[2000, 2015], [2015, 2020], [2000, 2020]];
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

var test4 = lcTransitions.select('lc_degradation_2015_2020');
Map.addLayer(test4, { min: 1, max: 3, palette: degPalette }, 'Transitions unified image - lc_deg_2015_2020', false);

// Export task
var assetName = 'GLAD_LC_Transitions_UNCCD_Cat_' + iso3;
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

