module.exports = {
  // with inheritance
  font: 'Roboto', // string: name of the font
  fontSize: 12, // number: size of the font in pt
  lineHeight: 1, // number: the line height (default: 1)
  bold: false, // boolean: whether to use bold text (default: false)
  italics: false, // boolean: whether to use italic text (default: false)
  characterSpacing: 0, //number: size of the letter spacing in pt
  color: [0, 0, 0], //string: the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
  decoration: 'none', // string: the text decoration to apply (‘none’ or ‘underline’ or ‘strike’)
  markerColor: [0, 0, 0], // string: the color of the bullets in a buletted list
  alignment: null, // string: (‘left’ or ‘center’ or ‘right’) the alignment of the text
  valignment: null, // string: (‘top’ or ‘center’ or ‘bottom’) the alignment of the text
  // without inheritance
  fillColor: 'none', // string: the background color of a table cell
  columnGap: 10, // number specify gap (space) between columns
  margin: [0, 0, 0, 0], // [left, top, right, bottom], [horizontal, vertical], equalLeftTopRightBottom
  border: [0, 0, 0, 0], // [left, top, right, bottom], [horizontal, vertical], equalLeftTopRightBottom

  // class
  classes: {
    table: {
      border: [1, 1, 1, 1]
    },
    row: {
      border: [1, 1, 1, 1]
    },
    cell: {
      margin: [2, 2, 2, 2],
      border: [1, 1, 1, 1]
    },
    header: {
      bold: true
    },
    row_even: {
      fillColor: [204, 204, 204]
    },
    row_odd: {
      fillColor: [255, 255, 255]
    }
  }
};
