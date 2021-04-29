var tokenizer = function() {
  this.tokenizers = [
    'skipWhiteSpace',
    'tokenizeTagOpen',
    'tokenizeTagClose',
    'tokenizeBlock',
    'tokenizeOperator',
    'tokenizeTrue',
    'tokenizeFalse',
    'tokenizeString',
    'tokenizeNumber',
    'tokenizeName'
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

tokenizer.prototype.tokenizeOperator = function(input, current) {
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
    case '(':
    case ')':
    case '[':
    case ']':
    case ',':
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
  return this.tokenizePattern("name", /[a-z]/i, input, current);
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
        throw new TypeError("unterminated string ");
      }
      value += char;
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
      if (consumedChars !== 0) {
        tokenized = true;
        current += consumedChars;
      }
      if (token) {
        tokens.push(token);
      }
    });
    if (!tokenized) {
      let char = input[current];
      throw new TypeError('I dont know what this character is: ' + char);
    }
  }
  return tokens;
};

module.exports = tokenizer;
