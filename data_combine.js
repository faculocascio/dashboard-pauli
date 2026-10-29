// Combina los chunks en DASH_DATA
(function() {
  var pot = (window.DASH_POT_PARTS || []).join('\n');
  window.DASH_DATA = {
    pot: pot,
    col: window.DASH_COL || '',
    grp: window.DASH_GRP || ''
  };
})();
