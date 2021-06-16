var tokenizer = function() {
  this.tokenizers = [
    'skipWhiteSpace',
    'tokenizeTagOpen',
    'tokenizeTagClose',
    'tokenizeComment',
    'tokenizeBlock',
    'tokenizeOperator',
    'tokenizeTrue',
    'tokenizeFalse',
    'tokenizeString',
    'tokenizeNumber',
    'tokenizeName',
    'tokenizeArray'
  ];
};

tokenizer.prototype.tokenizeCharacter = function(type, value, input, current) {
  if (value === input[current]) {
    return [1, { type, value }];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeBlock = function(input, current) {
  return this.tokenizeCharacter("blockOpen", '#', input, current);
};

tokenizer.prototype.tokenizeTwoCharacter = function(type, value, input, current) {
  if (value[0] === input[current] && value[1] === input[current + 1]) {
    return [2, { type, value }];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeTagOpen = function(input, current) {
  return this.tokenizeTwoCharacter('paren', '{{', input, current);
};

tokenizer.prototype.tokenizeTagClose = function(input, current) {
  return this.tokenizeTwoCharacter('paren', '}}', input, current);
};

tokenizer.prototype.tokenizeComment = function(input, current) {
  if (input[current] === '/' && input[current + 1] === '/') {
    consumedChars = 2;
    while (input[current + consumedChars] !== '\n') {
      consumedChars++;
    }
    return [consumedChars, null];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeOperator = function(input, current) {
  switch (input.slice(current, current + 3)) {
    case 'mod':
      return [3, { type: 'operator', value: 'mod' }];
    case '>>>':
      return [3, { type: 'operator', value: '>>>' }];
    case 'and':
      return [3, { type: 'operator', value: 'and' }];
    case 'not':
      return [3, { type: 'operator', value: 'not' }];
    case 'xor':
      return [3, { type: 'operator', value: 'xor' }];
  }
  switch (input.slice(current, current + 2)) {
    case '==':
      return [2, { type: 'operator', value: '==' }];
    case '!=':
      return [2, { type: 'operator', value: '!=' }];
    case '<<':
      return [2, { type: 'operator', value: '<<' }];
    case '>>':
      return [2, { type: 'operator', value: '>>' }];
    case 'or':
      return [2, { type: 'operator', value: 'or' }];
    case '<=':
      return [2, { type: 'operator', value: '<=' }];
    case '>=':
      return [2, { type: 'operator', value: '>=' }];
  }
  switch (input[current]) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
    case '>':
    case '<':
    case '&':
    case '|':
    case '!':
    case '=':
    case '^':
    case ',':
    case '(':
    case ')':
      return [1, { type: 'operator', value: input[current] }];
    default:
      return [0, null];
  }
};

tokenizer.prototype.tokenizePattern = function(type, pattern, input, current) {
  let char = input[current];
  let consumedChars = 0;
  if (pattern.test(char)) {
    let value = '';
    while (char && pattern.test(char)) {
      value += char;
      consumedChars ++;
      char = input[current + consumedChars];
    }
    return [consumedChars , { type, value }];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeNumber = function(input, current) {
  return this.tokenizePattern("number", /[0-9]/, input, current);
};

tokenizer.prototype.tokenizeName = function(input, current) {
  let char = input[current];
  let consumedChars = 0;
  if (/[A-Za-z]/.test(char)) {
    var value = '';
    var name = true;
    while (name  && consumedChars < (input.length - current)) {
      if (char === "[") {
        while (char !== "]") {
          value += char;
          consumedChars++;
          char = input[current + consumedChars];
        }
        value += char;
        consumedChars++;
        char = input[current + consumedChars];
      }
      //eslint-disable-next-line
      if (/[A-Za-z0-9\._\]\[]/.test(char)) {
        value += char;
        consumedChars++;
        char = input[current + consumedChars];
      } else {
        name = false;
      }
    }
    return [consumedChars , { type: 'name', value }];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeArray = function(input, current) {
  let char = input[current];
  if (char === '[') {
    let consumedChars = 1;
    var value = '[';
    var count = 1;
    while (count && (consumedChars + current) < input.length) {
      char = input[current + consumedChars];
      if (char === '[') {
        count++;
      }
      if (char === ']') {
        count--;
      }
      value += char;
      consumedChars++;
    }
    if (count) {
      var err = new Error('Unterminated Array: ' + value);
      err.position = current;
      throw err;
    }
    return [consumedChars , { type: 'array', value }];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeExactMatch = function(type, word, input, current) {
  var size = word.length;
  var value = input.slice(current, current + size);
  if (word === value) {
    return [size, { type, value}];
  }
  return [0, null];
};

tokenizer.prototype.tokenizeTrue = function(input, current) {
  return this.tokenizeExactMatch("boolean", 'true', input, current);
};

tokenizer.prototype.tokenizeFalse = function(input, current) {
  return this.tokenizeExactMatch("boolean", 'false', input, current);
};

tokenizer.prototype.tokenizeString = function(input, current) {
  if (input[current] === '"') {
    let value = '';
    let consumedChars = 0;
    consumedChars ++;
    var char = input[current + consumedChars];
    while (char !== '"') {
      if (char === undefined) {
        var err = new TypeError("unterminated string");
        err.position = current;
        throw err;
      }
      // escape
      if (char === '\\' && input[current + consumedChars + 1] === '"') {
        value += '"';
        consumedChars ++;
      } else {
        value += char;
      }
      consumedChars ++;
      char = input[current + consumedChars];
    }
    return [consumedChars + 1, { type: 'string', value }];
  }
  return [0, null];
};

tokenizer.prototype.skipWhiteSpace = function(input, current) {
  if (/\s/.test(input[current])) {
    return [1, null];
  }
  return [0, null];
};

tokenizer.prototype.tokenize = function(input) {
  var self = this;
  let current = 0;
  let tokens = [];
  while (current < input.length) {
    let tokenized = false;
    this.tokenizers.forEach(function(tokenizer_fn) {
      if (tokenized) {
        return;
      }
      let [consumedChars, token] = self[tokenizer_fn](input, current);
      if (token) {
        token.position = current;
        tokens.push(token);
      }
      if (consumedChars !== 0) {
        tokenized = true;
        current += consumedChars;
      }
    });
    if (!tokenized) {
      let char = input[current];
      var err = new TypeError('unexpected character: ' + char);
      err.character = char;
      err.position = current;
      throw err;
    }
  }
  return tokens;
};

module.exports = tokenizer;
