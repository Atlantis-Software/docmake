module.exports = [{
  property: 'font',
  type: 'string',
  inherit: true,
  default: 'Roboto'
}, {
  property: 'fontSize',
  type: 'number',
  inherit: true,
  default: 12
}, {
  property: 'lineHeight',
  type: 'number',
  inherit: true,
  default: 1
}, {
  property: 'bold',
  type: 'boolean',
  inherit: true,
  default: false
}, {
  property: 'italics',
  type: 'boolean',
  inherit: true,
  default: false
}, {
  property: 'characterSpacing',
  type: 'number',
  inherit: true,
  default: 0
}, {
  property: 'color',
  type: 'string',
  inherit: true,
  default: [0, 0, 0]
}, {
  property: 'decoration',
  type: ['none', 'underline', 'strike'],
  inherit: true,
  default: 'none'
}, {
  property: 'markerColor',
  type: 'string',
  inherit: true,
  default: [0, 0, 0]
}, {
  property: 'alignment',
  type: ['left', 'center', 'right'],
  inherit: true,
  default: null
}, {
  property: 'valignment',
  type: ['top', 'center', 'bottom'],
  inherit: true,
  default: null
}, {
  property: 'fillColor',
  type: 'string',
  inherit: false,
  default: 'none'
}, {
  property: 'columnGap',
  type: 'number',
  inherit: true,
  default: 10
}, {
  property: 'margin',
  type: "space",
  inherit: false,
  default: [0, 0, 0, 0]
}, {
  property: 'border',
  type: "space",
  inherit: false,
  default: [0, 0, 0, 0]
}, {
  property: 'borderColor',
  type: "colors",
  inherit: true,
  default: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
}];
