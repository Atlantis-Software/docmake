# docmake
docmake is a document templating language library for javascript.

## Installation

Installation uses the [npm](http://npmjs.org/) package manager.  Just type the following command after installing npm.

    npm install docmake

## usage

```javascript
var Docmake = require('docmake');
var fs = require('fs');

var doc = new Docmake();
doc.compile('{{hello}}', { hello: 'hello world!' }, function(err) {
  if (err) {
    return console.log(err);
  }
  doc.getPdf().pipe(fs.createWriteStream('document.pdf')); 
});
```

doc.compile takes three arguments:
* template: a string containing the template
* scope: an object containing data used in template
* cb: a callback

doc.getPdf takes one optional argument:
* options: an object describing document shape

options:
* size: document format, default 'A4'
* margins: pages margins containing left, top, right and bottom margin, default {left: 10, top: 10, right: 10, bottom: 10}

## template language

docmake simple expressions starts with `{{` , some content, and ends with `}}`.
when the document is rendered with the template, the expression is evaluated and the value is printed in the document.
in the previous exemple, `{{hello}}` expression is replaced by the corresponding value in the scope.

### nested object scope

Sometimes, scope contains other objects or arrays. For example:

```javascript
{
  person: {
    firsname: "Alexandre",
    lastname: "Tiertant"
  }
}
```

In such a case, you can use a dot-notation to gain access to the nested properties

```javascript
{{person.firstname}}
{{person.lastname}}
```

### text

Text tag starts with `{{text`, a text, some attributes , and ends with `}}`.


```javascript
{{text person.firstname fontSize=24}}
{{text "some text here" bold=true}}
```

available attributes for text:
* font: (string) name of the font
* fontSize: (number) size of the font in pt
* lineHeight: (number) the line height (default: 1)
* bold: (boolean) whether to use bold text (default: false)
* italics: (boolean) whether to use italic text (default: false)
* characterSpacing: (number) size of the letter spacing in pt
* color: (string) the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
* decoration: (string) the text decoration to apply (‘none’ or ‘underline’ or ‘strike’)
* alignment: (string) (‘left’ or ‘center’ or ‘right’) the alignment of the text

### image

Image tag starts with `{{image`, an image jpg or png (filepath or buffer or base64 string), and ends with `}}`.

```javascript
{{image "/home/user/image.png"}}
```

available attributes for image:
* width: (number or string containing a number and ends with `%`) width of the image
* height: (number or string containing a number and ends with `%`) height of the image
* alignment: (string) (‘left’ or ‘center’ or ‘right’) the alignment of the image

### svg

Svg tag starts with `{{svg`, an svg image (filepath or string), and ends with `}}`.

```javascript
{{svg "/home/user/image.svg"}}
```

available attributes for svg:
* width: (number or string containing a number and ends with `%`) width of the svg
* height: (number or string containing a number and ends with `%`) height of the svg
* alignment: (string) (‘left’ or ‘center’ or ‘right’) the alignment of the svg

### qr

Qr tag starts with `{{qr`, a string value, and ends with `}}`.

```javascript
{{qr "this is a qrcode"}}
```

available attributes for qr:
* width: (number or string containing a number and ends with `%`) width of the qrcode
* height: (number or string containing a number and ends with `%`) height of the qrcode
* alignment: (string) (‘left’ or ‘center’ or ‘right’) the alignment of the qrcode

### columns

by default, elements are placed one below other. using columns, elements are placed horizontally.
the tag `{{#columns}}` require a closing tag `{{/columns}}`.

```javascript
{{#columns widths=["auto", 25, "*"]}}
  {{text "column one"}}
  {{text "column two"}}
  {{text "column three"}}
{{/columns}}
```

available attributes for columns:
* columnGap: (number) specify gap (space) between columns
* width: (number or string containing a number and ends with `%`) total width of the columns
* widths: (array) width of each column that could be:
  * a number: fixed width
  * a string containing a number and ends with `%`: a percent of total width
  * "auto": auto-sized columns have their widths based on their content
  * "*": star-sized columns fill the remaining space. if there's more than one star-column, available width is divided equally
* font: (string) name of the font
* fontSize: (number) size of the font in pt
* lineHeight: (number) the line height (default: 1)
* bold: (boolean) whether to use bold text (default: false)
* italics: (boolean) whether to use italic text (default: false)
* characterSpacing: (number) size of the letter spacing in pt
* color: (string) the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
* decoration: (string) the text decoration to apply (‘none’ or ‘underline’ or ‘strike’)
* alignment: (string) (‘left’ or ‘center’ or ‘right’) the alignment of the columns
* fillColor: (string) the background color of the columns
* margin: ([left, top, right, bottom], [horizontal, vertical], number equalLeftTopRightBottom) space arround columns element
* border: ([left, top, right, bottom], [horizontal, vertical], number equalLeftTopRightBottom) size of the border

### table

tables allow you to arrange elements into rows and columns of cells.
table element starts with tag `{{#table}}` and ends with `{{/table}}`, it must contain one or more row element.
row element starts with tag `{{#row}}` and ends with `{{/row}}`, it must contain one or more header or column element.
header element starts with tag `{{#header}}` and ends with `{{/header}}`.
column element starts with tag `{{#column}}` and ends with `{{/column}}`.


```javascript
{{#table width="75%" repeatHeader=true}}
  {{#row}}
    {{#header}}"firstname"{{/header}}
    {{#header}}"lastname"{{/header}}
  {{/row}}
  {{#row}}
    {{#column}}"Alexandre"{{/column}}
    {{#column}}"Tiertant"{{/column}}
  {{/row}}
{{/table}}
```

available attributes for table:
* repeatHeader: (boolean) repeat headers on page break when true
* width: (number or string containing a number and ends with `%`) total width of the table
* widths: (array) width of each column that could be:
  * a number: fixed width
  * a string containing a number and ends with `%`: a percent of total width
  * "auto": auto-sized columns have their widths based on their content
  * "*": star-sized columns fill the remaining space. if there's more than one star-column, available width is divided equally

available attributes for table, row, header and columns:
* font: (string) name of the font
* fontSize: (number) size of the font in pt
* lineHeight: (number) the line height (default: 1)
* bold: (boolean) whether to use bold text (default: false)
* italics: (boolean) whether to use italic text (default: false)
* characterSpacing: (number) size of the letter spacing in pt
* color: (string) the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
* decoration: (string) the text decoration to apply (‘none’ or ‘underline’ or ‘strike’)
* alignment: (string) (‘left’ or ‘center’ or ‘right’) the alignment of the element
* fillColor: (string) the background color of the element
* margin: ([left, top, right, bottom], [horizontal, vertical], number equalLeftTopRightBottom) space arround element
* border: ([left, top, right, bottom], [horizontal, vertical], number equalLeftTopRightBottom) size of the border

### class

Class tag define a class that can be applyed to any element.
Class tag starts with `{{class`, a class name string, some attributes, and ends with `}}`.

```javascript
{{class "red" color="#FF0000"}}
{{text "text displayed in red" class=["red"]}}
```

### font

Font tag add .ttf files as font
Font tag starts with `{{font`, a font name string, some attributes, and ends with `}}`.

```javascript
{{font myFont normal="/home/user/myfont.ttf"}}
{{text "text displayed in red" class=["red"]}}
```

available attributes for font:
* normal: (string) .ttf filepath for normal text
* bold: (string) .ttf filepath for bold text
* italics: (string) .ttf filepath for italics text
* bolditalics: (string) .ttf filepath for bold and italics text

### page header and page footer

contents of page header and page footer are repeat on each page on top for page header and at the bottom for page footer.
text `{{currentPage}}` in page footer is replaced by the number of the current page.
text `{{pageCount}}` in page footer is replaced by the count of pages.

```javascript
{{#pageHeader}}
  {{image "/home/user/header.png" width="100%"}}
{{/pageHeader}}
{{#pageFooter}}
  {{image "/home/user/footer.png" width="100%"}}
  {{text "{{currentPage}} / {{pageCount}}" alignment="right"}}
{{/pageFooter}}
```
### page break

`{{pageBreak}}` tag move to the next page.

### reset page count

`{{resetPageCount}}` tag break the page and reset the number of page and page count.

### if

If tag include its contents in document only if a condition is satisfied.
If tag starts with `{{#if `, a conditional expression, and ends with `}}`.
If tag must be close with tag `{{/if}}`

```javascript
{{#if person.firstname == "Alexandre"}}
  {{person.firstname}}
{{/if}}
```

### each

Each tag include its contents in document once for each element in an array, in order and replace scope by it.

```javascript
{
  my_array: [
    {
      data: "first"
    },
    {
      data: "second"
    }
  ]
}
```

```javascript
{{#each my_array}}
  {{data}}
{{/each}}
```

