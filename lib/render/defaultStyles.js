module.exports = {
  // with inheritance
  font: 'Roboto', // string: name of the font
  fontSize: 24, // number: size of the font in pt
  lineHeight: 1, // number: the line height (default: 1)
  bold: false, // boolean: whether to use bold text (default: false)
  italics: false, // boolean: whether to use italic text (default: false)
  characterSpacing: 0, //number: size of the letter spacing in pt
  color: [255, 0, 0], //string: the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
  decoration: 'none', // string: the text decoration to apply (‘none’ or ‘underline’ or ‘strike’)
  markerColor: [0, 0, 0], // string: the color of the bullets in a buletted list
  // without inheritance
  alignment: 'left', // string: (‘left’ or ‘center’ or ‘right’) the alignment of the text
  fillColor: 'none', // string: the background color of a table cell
  columnGap: 10, // number specify gap (space) between columns
  margin: [0, 0, 0, 0], // [left, top, right, bottom], [horizontal, vertical], equalLeftTopRightBottom
  padding: [0, 0, 0, 0], // [left, top, right, bottom], [horizontal, vertical], equalLeftTopRightBottom
  border: [0, 0, 0, 0], // [left, top, right, bottom], [horizontal, vertical], equalLeftTopRightBottom

  // class
  classes: {
    header: {
      margin: 5,
      border: [1, 1, 1, 10],
      fillColor: [255, 255, 255],
      color: [0, 0, 0],
      fontSize: 13,
      bold: true,
      alignment: 'right'
    },
    row_even: {
      color: [0, 0, 0],
      border: [0, 0, 0, 0],
      fillColor: [204, 204, 204]
    },
    row_odd: {
      color: [0, 255, 0],
      border: [0, 0, 0, 0],
      fillColor: [255, 255, 255]
    }
  }
};
