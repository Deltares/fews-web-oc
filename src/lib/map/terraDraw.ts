import {
  TerraDrawCircleMode,
  TerraDrawFreehandMode,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
} from 'terra-draw'
import { SymbolLayerSpecification } from 'maplibre-gl'

export function getModeOtions(isDark: boolean = false) {
  return {
    point: new TerraDrawPointMode({
      editable: true,
      styles: {
        pointColor: isDark ? '#000000' : '#FFFFFF',
        pointWidth: 5,
        pointOutlineColor: isDark ? '#999999' : '#666666',
        pointOutlineWidth: 1,
      },
    }),
    linestring: new TerraDrawLineStringMode({
      editable: true,
      styles: {
        lineStringColor: isDark ? '#999999' : '#666666',
        lineStringWidth: 2,
        closingPointColor: isDark ? '#000000' : '#FFFFFF',
        closingPointWidth: 3,
        closingPointOutlineColor: isDark ? '#999999' : '#666666',
        closingPointOutlineWidth: 1,
      },
    }),
    polygon: new TerraDrawPolygonMode({
      editable: true,
      styles: {
        fillColor: isDark ? '#000000' : '#EDEFF0',
        fillOpacity: 0.7,
        outlineColor: isDark ? '#999999' : '#666666',
        outlineWidth: 2,
        closingPointColor: isDark ? '#000000' : '#FAFAFA',
        closingPointWidth: 3,
        closingPointOutlineColor: isDark ? '#999999' : '#666666',
        closingPointOutlineWidth: 1,
      },
    }),

    rectangle: new TerraDrawRectangleMode({
      styles: {
        fillColor: isDark ? '#000000' : '#EDEFF0',
        fillOpacity: 0.7,
        outlineColor: isDark ? '#999999' : '#666666',
        outlineWidth: 2,
      },
    }),
    circle: new TerraDrawCircleMode({
      styles: {
        fillColor: isDark ? '#000000' : '#EDEFF0',
        fillOpacity: 0.7,
        outlineColor: isDark ? '#999999' : '#666666',
        outlineWidth: 2,
      },
    }),
    freehand: new TerraDrawFreehandMode({
      styles: {
        fillColor: isDark ? '#000000' : '#EDEFF0',
        fillOpacity: 0.7,
        outlineColor: isDark ? '#999999' : '#666666',
        outlineWidth: 2,
        closingPointColor: isDark ? '#000000' : '#FAFAFA',
        closingPointWidth: 3,
        closingPointOutlineColor: isDark ? '#999999' : '#666666',
        closingPointOutlineWidth: 1,
      },
    }),
  }
}

export function getPointLayerLabelSpec(isDark: boolean = false) {
  const specification: SymbolLayerSpecification = {
    id: '{prefix}-point-label',
    type: 'symbol',
    source: '{prefix}-point',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['any', ['==', 'mode', 'point'], ['==', 'mode', 'marker']],
    ],
    layout: {
      'text-field': [
        'case',
        ['all', ['has', 'elevation'], ['>', ['get', 'elevation'], 0]],
        [
          'concat',
          'Alt. ',
          ['to-string', ['floor', ['get', 'elevation']]],
          ' ',
          ['get', 'elevationUnit'],
        ],
        '',
      ],
      'symbol-placement': 'point',
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        10,
        10,
        12.0,
        13,
        14.0,
        14,
        16.0,
        18,
        18.0,
      ],
      'text-overlap': 'always',
      'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
      'text-radial-offset': 0.5,
      'text-justify': 'center',
      'text-letter-spacing': 0.05,
    },
    paint: {
      'text-halo-color': isDark ? '#232E3D' : '#F7F7F7',
      'text-halo-width': 1,
      'text-color': isDark ? '#F7F7F7' : '#232E3D',
    },
  }
  return specification
}

export function getLineLayerLabelSpec(isDark: boolean = false) {
  const specification: SymbolLayerSpecification = {
    id: '{prefix}-line-label',
    type: 'symbol',
    source: '{prefix}-line-source',
    filter: ['==', '$type', 'Point'],
    layout: {
      'text-field': [
        'concat',
        ['to-string', ['get', 'distance']],
        ' ',
        ['get', 'unit'],
        [
          'case',
          ['==', ['get', 'total'], 0],
          '',
          [
            'concat',
            '\n(',
            ['to-string', ['get', 'total']],
            ' ',
            ['get', 'totalUnit'],
            ')',
          ],
        ],
        [
          'case',
          ['all', ['has', 'elevation'], ['>', ['get', 'elevation'], 0]],
          [
            'concat',
            '\nAlt. ',
            ['to-string', ['floor', ['get', 'elevation']]],
            ' ',
            ['get', 'elevationUnit'],
          ],
          '',
        ],
      ],
      'symbol-placement': 'point',
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        10,
        10,
        12.0,
        13,
        14.0,
        14,
        16.0,
        18,
        18.0,
      ],
      'text-overlap': 'always',
      'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
      'text-radial-offset': 0.5,
      'text-justify': 'center',
      'text-letter-spacing': 0.05,
    },
    paint: {
      'text-halo-color': isDark ? '#232E3D' : '#F7F7F7',
      'text-halo-width': 1,
      'text-color': isDark ? '#F7F7F7' : '#232E3D',
    },
  }
  return specification
}

export function getPolygonLayerSpec(isDark: boolean = false) {
  const specification: SymbolLayerSpecification = {
    id: '{prefix}-polygon-label',
    type: 'symbol',
    source: '{prefix}-polygon-source',
    filter: ['==', '$type', 'Point'],
    layout: {
      'text-field': [
        'concat',
        ['to-string', ['get', 'area']],
        ' ',
        ['get', 'unit'],
      ],
      'symbol-placement': 'point',
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        10,
        10,
        12.0,
        13,
        14.0,
        14,
        16.0,
        18,
        18.0,
      ],
      'text-overlap': 'always',
      'text-letter-spacing': 0.05,
    },
    paint: {
      'text-halo-color': isDark ? '#232E3D' : '#F7F7F7',
      'text-halo-width': 1,
      'text-color': isDark ? '#F7F7F7' : '#232E3D',
    },
  }
  return specification
}
