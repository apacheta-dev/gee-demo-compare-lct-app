 
/* This script defines all user interface labels used in the application for multiple languages. 
Cite as: 
This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-sa/4.0/ 
*/ 
var labels = {
    lblTitle: [
    "Land Cover Maps Comparison Tool for Haiti"  ,  
    "Herramienta para la Comparación de Mapas de Cobertura de Suelo en Haiti"],
    
    lblLCPieChartChange: ["Land Cover change", "Cambio de Uso del Suelo"], 
    lblLandCover: ["Land Cover", "Cobertura del Suelo (CS)"],
    lblTreeCovered: ["Tree covered", "Bosque"],
    lblMangrove: ["Mangrove", "Mangle"],
    lblShrubland: ["Shrubland", "Arbusto"],
    lblGrassland: ["Grassland", "Pastizal/Arbustal"], 
    lblCropland: ["Cropland", "Cultivos"],
    lblWetland: ["Wetland", "Humedal"],
    lblArtificial: ["Artificial", "Artificial"],
    lblOtherLand: ["Other land", "Otras tierras"],
    lblWaterbody: ["Water body", "Agua"],
    lblExpl1: [
    "This interactive GEE application* allows national experts to visualize and analyze land cover changes **, for three UNCCD reporting periods*** (Baseline period: 2000–2015, Period 1: 2015–2019, and Period 2: 2015–2023). It provides area statistics, transition matrices, and spatial comparisons to support evidence-based decision-making and facilitate the 2026 UNCCD reporting process.", 
    "Esta aplicación interactiva de GEE* permite a los expertos nacionales visualizar y analizar los cambios en la cobertura del suelo **, para tres períodos de reporte a la CNULD*** (Período de base: 2000-2015, Período 1: 2015-2019 y Período 2: 2015-2023). Proporciona estadísticas de superficie, matrices de transición y comparaciones espaciales para respaldar la toma de decisiones basada en evidencia y apoyar el proceso de reporte a la CNULD 2026."],
     lblExpl2: ["Choose an administrative unit from the list below or click on the map to get statistics.", "Elija una unidad administrativa del listado de abajo o haga click en el mapa para obtener estadísticas."],
    lblAssetClick: ["Select which layer you want to click on:", "Seleccione en qué capa desea hacer click:"],
    lblAreaName: ["Name", "Nombre"],
    lblAppDeveloped: ["For questions and feedback please contact: ", "Para mas información por favor contactar a:"],
    lblLoading: ["Loading...", "Cargando..."],
    lblGeneratingCharts: ["Generating chart", "Generando gráfico"],
    lblSelectedAOI: ["Selected area of interest", "Área de interés seleccionada"],
    lblCombinedCategoriesArea: ["Combined categories area", "Superficie de la combinación"],
    lblDownload: ["Download combined layer as tif", "Descargar la capa combinada como tif"],
    lblFromLC: ["From Land Cover", "Desde Uso"],
    lblCurrentLC: ["To Land Cover", "Hasta Uso"],
    lblGains: ["Gains", "Ganancias"],
    lblLosses: ["Losses", "Pérdidas"],
    lblStepDisplay: ["Click 'Calculate' to preview layer, 'Reset' for new categories selection.", "Presione 'Calcular' para visualizar la capa, 'Reestablecer' para realizar una nueva combinación."],
    lblDisplay: ["Calculate", "Calcular"],
    lblReset: ["Reset", "Reestablecer"],
    lblArea: ["Area", "Área"],
    lblHotspots: ["Multi-Criteria Analysis", "Análisis de Multicriterio"],
    lblTableLC: ["Areas with Land Cover changes", "Áreas con cambios en el Uso"],
    lblLC: ["LC", "CS"],
    lblDifference: ["Difference", "Diferencia"],
    lblDrawingTools: ["Drawing tool", "Herramienta de dibujo"],
    lblDownloadFileName: ["Drawn-features", "Elementos-dibujados"],
    lblDrawFeature: ['Drawn-feature in ', 'Elemento dibujado en '],
    lblUpdating: ["Updating", "Actualizando"],
    lblSelectContainer: ["Select the country", "Seleccionar el país"],
    lblLayerName: ["Layer Name", "Nombre de la capa"],
    lblLoadingLevel2: ["Loading administrative units...", "Cargando unidades administrativas..."],
    lblSelectLevel2: ["Select administrative unit", "Seleccionar unidad administrativa"],
    lblSelectLevel1First: ["Select an administrative unit 1 first", "Seleccione una unidad administrativa 1 primero"],
    lblLevel1: ["Administrative units 1", "Unidad administrativa 1"],
    lblLevel2: ["Administrative units 2", "Unidad administrativa 2"],
    lblGeneratingDownloadLink: ["Generating download link...", "Generando link de descarga..."],
    lblNetLCChanges: ["Net LC Changes (ha)", ""],
    lblNone: ["None", "Ninguno"],
    lblSelectGeometry: ["Please select a geometry first using the hand icon.", "Seleccione primero una geometría usando el icono de la mano."],
    lblProcessing: ["Processing selected drawn-area for statistics, this might take a while...", "Procesando el área dibujada seleccionada para estadísticas, esto puede llevar un tiempo..."],
    lblUnexpectedError: ["Unexpected error occurred while processing geometry.", "Ocurrió un error inesperado al procesar la geometría."],
    lblGeometryNotContained: ["Geometry has to be contained in country area.", "La geometría tiene que estar contenida en el área del país."],
    lblSmallerArea: ["Please select area smaller than", "Seleccione un área más pequeña que"],
    lblSelectedAreaHa: ["Selected area:", "Área selecionada:"],
    lblSelectArea: ["Please select an area.", "Please select an area."],
    lblSelectAndCalculate: ["Calculate  stats for selected polygon", "Calcular estadísticas para el polígono seleccionado"],
    lblProcessingArea: ["Processing area, please wait...", "Procesando el área, por favor espere..."],
    lblCustomLayer: ["1- What will you map? Enter the name and click '+' button. Layer will be added to the map", "1- ¿Qué mapeará? Introduzca el nombre y haga clic en el botón '+'. La capa se agregará al mapa"],
    lblDrawFeatures: ["2- Select the drawing tool (points or polygon) and draw on the map by clicking", "2- Seleccione la herramienta de dibujo (puntos o polígono) y dibuje sobre el mapa haciendo click"],
    lblGetStatistics: ["3- Select a polygon in the map (using the hand icon) and click the button below to obtain statistics for the area.", "3- Seleccione un polígono en el mapa (usando el icono de la mano) y haga clic en el botón de abajo para obtener estadísticas del área."],
    lblDownloadLinks: ["4- Download your polygons and points (links appear and are updated while drawing)", "4- Descargue tus polígonos y puntos (los enlaces aparecen y se actualizan mientras dibuja)"],
    lblLinks: ["Links", "Enlaces"],
    lblSelectLayer: ["Please first select which layer you want to click on", "Primero seleccione en qué capa desea hacer clic"],
    lblNoFeature: ["There is no feature at clicked point", "No hay ninguna característica en el punto en el que se hizo clic"],
    lblCloseInfoPanel: ["Close info panel", "Cerrar panel de información"],
    lblOpenInfoPanel: ["Open info panel", "Abrir panel de información"],
    lblUserLocation: ["User location", "Localización del usuario"],
    lblLocNotSupported: ["Device geolocalization is not not supported for this browser/OS.", "La geolocalización del dispositivo no es compatible con este navegador/SO."],
    lblFlyTo: ["Go", "Ir"],
    lblPermissionDenied: ["User denied the request for Geolocation.", "Usuario denegó la solicitud de Geolocalización."],
    lblPositionUnavailable: ["Location information is unavailable.", "La información de ubicación no está disponible."],
    lblTimeout: ["The request to get user location timed out.", "Se agotó el tiempo de espera de la solicitud para obtener la ubicación del usuario."],
    lblUnknownError: ["An unknown error occurred.", "Ocurrió un error inesperado."],
    lblRemoveLocation: ["Remove marker", "Eliminar marcador"],
    lblLatitude: ["Lat.", "Lat."],
    lblLongitude: ["Lon.", "Lon."],
    lblFlyToText: ["Select a point from the list or enter lat/lon and press 'Go' if you want to add a marker and zoom in.", "Seleccione un punto de la lista o ingrese lat/lon y presione 'Ir' si desea agregar un marcador y hacer zoom en ese punto."],
    lblEnterAssetId: [
    "Alternatively, if you want to calculate stats for a preloaded single feature asset please enter the Table ID and click on the button to load the asset from GEE", 
    "Alternativamente, si desea calcular estadísticas para un único elemento, ingrese el ID de la tabla y haga clic en el botón para cargarlo desde GEE"],
    lblAssetId: ["GEE asset id", "ID de elemento GEE"],
    lblLoadAsset: ["Load", "Cargar"],
    lblCustomAsset: ["Custom GEE asset", "Elemento de GEE"],
    lblInvalidAssetId: ["Invalid GEE asset id", "ID de elemento GEE inválido"],
    lblMoreThanOneFeature: ["The GEE preloaded asset must contain only one feature", "El elemento precargado en GEE debe contener solo una característica"],
    lblDegradation: ["Degradation", "Degradación"],
    lblClouds: ["Clouds", "Nubes"],
    lblPeriod: ["Period", "Período"],
    lblTargetYear: ["Target year", "Año objetivo"],
    lblLCComparison: ["LC Products Comparison", "Comparación de Productos de LC"],
    lblEqualMask: ["Equal mask", "Equal mask"],
    lblOtherLC: ["Other LC Maps", "Otros Mapas de CS"],
    lblAdmBoundaries: ["Administrative Boundaries", "Límites Administrativos"],
    lblTransitions: ["Transitions", "Transiciones"],
    lblSelectLevel1: ["Select administrative unit 1", "Seleccionar unidad administrativa 1"],
    lblWater: ["Water", "Agua"],
    lblTrees: ["Trees", "Árboles"],
    lblFloodedVegetation: ["Flooded Vegetation", "Vegetación inundada"],
    lblCrops: ["Crops", "Cultivos"],
    lblBuiltArea: ["Built Area", "Área construida"],
    lblBareGround: ["Bare Ground", "Suelo Desnudo"],
    lblSnowIce: ["Snow/Ice", "Nieve/Hielo"],
    lblRangelands: ["Rangelands", "Pastizales"],
    lblESA10m2021: ["ESA 10m (2021)", "ESA 10m (2021)"],
    lblESRI10m2023: ["ESRI 10m (2023)", "ESRI 10m (2023)"],
    lblNote1: ["ESRI 10m (2023)", "ESRI 10m (2023)"],
    lblDisclaimer: [
        "(*) Adapted from the SIDS LC and Transitions Comparison tool (https://doi.org/10.5281/zenodo.15276250)\n\n\
(**) The boundaries and names shown and the designations used on this map do not imply the expression of any opinion whatsoever on the part of Apacheta LLC or Apacheta Foundation, concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers and boundaries.\n\n\
(***) UNCCD reporting requires three periods: Baseline (2000–2015), Period 1 (2015–2019), and Period 2 (2015–2023). If any of these years are not covered by the land cover product, the closest available year is used. We also add the long-term period using the first and last map available for each product to assess overall trends. \n  ",
        "(*) Creada a partir de la App de Comparación de Mapas de Cobertura y Transiciones de las SIDS (https://doi.org/10.5281/zenodo.15276250) \n\n\
(**) Los límites y nombres que se muestran y las designaciones utilizadas en este mapa no implican la expresión de ninguna opinión por parte de Apacheta LLC o Apacheta Foundation con respecto al estado legal de ningún país, territorio, ciudad o área o de sus autoridades, o con respecto a la delimitación de sus fronteras y límites.\n\n\
(***) El informe para la CNULD requiere tres períodos: Línea de base (2000–2015), Período 1 (2015–2019) y Período 2 (2015–2023). Si alguno de estos años no está disponible en el mapa de cobertura, se utiliza el año disponible más cercano. También se añade un período de largo plazo utilizando el primer y el último año disponible para cada producto con el fin de evaluar la tendencia general.\n  ",
    ],
    lblGeolocation: ["Geolocation", "Geolocalización"],
    // from precalculation script
    lblStable: ["Stable", "Estable"],
    lblIncreasing: ["Increasing", "Aumento"],
    lblImprovement: ["Improvement", "Mejora"],
    lblNoChange: ["No change", "Sin cambio"],
    lblLCESA: ["Land Cover - ESA (Default)","Cobertura del Suelo - ESA (predeterminado)"],
    lblLCGLAD: ["Land Cover - GLAD","Cobertura del Suelo - GLAD"],
    lblLCGLC: ["Land Cover - GLC_FCS30D","Cobertura del Suelo - GLC_FCS30D"],
    
    lblUserManual: ["App User Manual","Manual de Usuario de la Herramienta"],
    
    lblAOIMask: ["AOI Mask", "AOI Mask"],
    lblOpacity: ["Opacity","Opacidad"],
    
   
    lblPointsForm: ["Points of interest form", "Formulario de puntos de interés"],
   
};
var languages = ["English", "Spanish"];

var getLocLabels = function (lan) {
    var loc = {};
    var index = languages.indexOf(lan);
    Object.keys(labels).forEach(function (key) {
        loc[key] = labels[key][index];
    });
    return loc;
};
exports.getLocLabels = getLocLabels;
