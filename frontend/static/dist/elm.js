(function(scope){
'use strict';

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}




// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**_UNUSED/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**_UNUSED/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**/
	if (typeof x.$ === 'undefined')
	//*/
	/**_UNUSED/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0 = 0;
var _Utils_Tuple0_UNUSED = { $: '#0' };

function _Utils_Tuple2(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2_UNUSED(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3_UNUSED(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr(c) { return c; }
function _Utils_chr_UNUSED(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil = { $: 0 };
var _List_Nil_UNUSED = { $: '[]' };

function _List_Cons(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons_UNUSED(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log = F2(function(tag, value)
{
	return value;
});

var _Debug_log_UNUSED = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString(value)
{
	return '<internals>';
}

function _Debug_toString_UNUSED(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash_UNUSED(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.aV.aj === region.bj.aj)
	{
		return 'on line ' + region.aV.aj;
	}
	return 'on lines ' + region.aV.aj + ' through ' + region.bj.aj;
}



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**_UNUSED/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (Object.prototype.hasOwnProperty.call(value, key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap_UNUSED(value) { return { $: 0, a: value }; }
function _Json_unwrap_UNUSED(value) { return value.a; }

function _Json_wrap(value) { return value; }
function _Json_unwrap(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	var unwrapped = _Json_unwrap(value);
	if (!(key === 'toJSON' && typeof unwrapped === 'function'))
	{
		object[key] = unwrapped;
	}
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		c: null
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			});
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.dO,
		impl.fk,
		impl.e8,
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


function _Platform_initialize(flagDecoder, args, init, update, subscriptions, stepperBuilder)
{
	var result = A2(_Json_run, flagDecoder, _Json_wrap(args ? args['flags'] : undefined));
	$elm$core$Result$isOk(result) || _Debug_crash(2 /**_UNUSED/, _Json_errorToString(result.a) /**/);
	var managers = {};
	var initPair = init(result.a);
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);

	function sendToApp(msg, viewMetadata)
	{
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));

	return ports ? { ports: ports } : {};
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}




// HELPERS


var _VirtualDom_divertHrefToApp;

var _VirtualDom_doc = typeof document !== 'undefined' ? document : {};


function _VirtualDom_appendChild(parent, child)
{
	parent.appendChild(child);
}

var _VirtualDom_init = F4(function(virtualNode, flagDecoder, debugMetadata, args)
{
	// NOTE: this function needs _Platform_export available to work

	/**/
	var node = args['node'];
	//*/
	/**_UNUSED/
	var node = args && args['node'] ? args['node'] : _Debug_crash(0);
	//*/

	node.parentNode.replaceChild(
		_VirtualDom_render(virtualNode, function() {}),
		node
	);

	return {};
});



// TEXT


function _VirtualDom_text(string)
{
	return {
		$: 0,
		a: string
	};
}



// NODE


var _VirtualDom_nodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 1,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_node = _VirtualDom_nodeNS(undefined);



// KEYED NODE


var _VirtualDom_keyedNodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 2,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_keyedNode = _VirtualDom_keyedNodeNS(undefined);



// CUSTOM


function _VirtualDom_custom(factList, model, render, diff)
{
	return {
		$: 3,
		d: _VirtualDom_organizeFacts(factList),
		g: model,
		h: render,
		i: diff
	};
}



// MAP


var _VirtualDom_map = F2(function(tagger, node)
{
	return {
		$: 4,
		j: tagger,
		k: node,
		b: 1 + (node.b || 0)
	};
});



// LAZY


function _VirtualDom_thunk(refs, thunk)
{
	return {
		$: 5,
		l: refs,
		m: thunk,
		k: undefined
	};
}

var _VirtualDom_lazy = F2(function(func, a)
{
	return _VirtualDom_thunk([func, a], function() {
		return func(a);
	});
});

var _VirtualDom_lazy2 = F3(function(func, a, b)
{
	return _VirtualDom_thunk([func, a, b], function() {
		return A2(func, a, b);
	});
});

var _VirtualDom_lazy3 = F4(function(func, a, b, c)
{
	return _VirtualDom_thunk([func, a, b, c], function() {
		return A3(func, a, b, c);
	});
});

var _VirtualDom_lazy4 = F5(function(func, a, b, c, d)
{
	return _VirtualDom_thunk([func, a, b, c, d], function() {
		return A4(func, a, b, c, d);
	});
});

var _VirtualDom_lazy5 = F6(function(func, a, b, c, d, e)
{
	return _VirtualDom_thunk([func, a, b, c, d, e], function() {
		return A5(func, a, b, c, d, e);
	});
});

var _VirtualDom_lazy6 = F7(function(func, a, b, c, d, e, f)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f], function() {
		return A6(func, a, b, c, d, e, f);
	});
});

var _VirtualDom_lazy7 = F8(function(func, a, b, c, d, e, f, g)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g], function() {
		return A7(func, a, b, c, d, e, f, g);
	});
});

var _VirtualDom_lazy8 = F9(function(func, a, b, c, d, e, f, g, h)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g, h], function() {
		return A8(func, a, b, c, d, e, f, g, h);
	});
});



// FACTS


var _VirtualDom_on = F2(function(key, handler)
{
	return {
		$: 'a0',
		n: key,
		o: handler
	};
});
var _VirtualDom_style = F2(function(key, value)
{
	return {
		$: 'a1',
		n: key,
		o: value
	};
});
var _VirtualDom_property = F2(function(key, value)
{
	return {
		$: 'a2',
		n: key,
		o: value
	};
});
var _VirtualDom_attribute = F2(function(key, value)
{
	return {
		$: 'a3',
		n: key,
		o: value
	};
});
var _VirtualDom_attributeNS = F3(function(namespace, key, value)
{
	return {
		$: 'a4',
		n: key,
		o: { f: namespace, o: value }
	};
});



// XSS ATTACK VECTOR CHECKS
//
// For some reason, tabs can appear in href protocols and it still works.
// So '\tjava\tSCRIPT:alert("!!!")' and 'javascript:alert("!!!")' are the same
// in practice. That is why _VirtualDom_RE_js and _VirtualDom_RE_js_html look
// so freaky.
//
// Pulling the regular expressions out to the top level gives a slight speed
// boost in small benchmarks (4-10%) but hoisting values to reduce allocation
// can be unpredictable in large programs where JIT may have a harder time with
// functions are not fully self-contained. The benefit is more that the js and
// js_html ones are so weird that I prefer to see them near each other.


var _VirtualDom_RE_script = /^script$/i;
var _VirtualDom_RE_on_formAction = /^(on|formAction$)/i;
var _VirtualDom_RE_js = /^\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i;
var _VirtualDom_RE_js_html = /^\s*(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|d\s*a\s*t\s*a\s*:\s*t\s*e\s*x\s*t\s*\/\s*h\s*t\s*m\s*l\s*(,|;))/i;


function _VirtualDom_noScript(tag)
{
	return _VirtualDom_RE_script.test(tag) ? 'p' : tag;
}

function _VirtualDom_noOnOrFormAction(key)
{
	return _VirtualDom_RE_on_formAction.test(key) ? 'data-' + key : key;
}

function _VirtualDom_noInnerHtmlOrFormAction(key)
{
	return key == 'innerHTML' || key == 'outerHTML' || key == 'formAction' ? 'data-' + key : key;
}

function _VirtualDom_noJavaScriptUri(value)
{
	return _VirtualDom_RE_js.test(value)
		? /**/''//*//**_UNUSED/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlUri(value)
{
	return _VirtualDom_RE_js_html.test(value)
		? /**/''//*//**_UNUSED/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlJson(value)
{
	return (
		(typeof _Json_unwrap(value) === 'string' && _VirtualDom_RE_js_html.test(_Json_unwrap(value)))
		||
		(Array.isArray(_Json_unwrap(value)) && _VirtualDom_RE_js_html.test(String(_Json_unwrap(value))))
	)
		? _Json_wrap(
			/**/''//*//**_UNUSED/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		) : value;
}



// MAP FACTS


var _VirtualDom_mapAttribute = F2(function(func, attr)
{
	return (attr.$ === 'a0')
		? A2(_VirtualDom_on, attr.n, _VirtualDom_mapHandler(func, attr.o))
		: attr;
});

function _VirtualDom_mapHandler(func, handler)
{
	var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

	// 0 = Normal
	// 1 = MayStopPropagation
	// 2 = MayPreventDefault
	// 3 = Custom

	return {
		$: handler.$,
		a:
			!tag
				? A2($elm$json$Json$Decode$map, func, handler.a)
				:
			A3($elm$json$Json$Decode$map2,
				tag < 3
					? _VirtualDom_mapEventTuple
					: _VirtualDom_mapEventRecord,
				$elm$json$Json$Decode$succeed(func),
				handler.a
			)
	};
}

var _VirtualDom_mapEventTuple = F2(function(func, tuple)
{
	return _Utils_Tuple2(func(tuple.a), tuple.b);
});

var _VirtualDom_mapEventRecord = F2(function(func, record)
{
	return {
		bM: func(record.bM),
		aW: record.aW,
		aQ: record.aQ
	}
});



// ORGANIZE FACTS


function _VirtualDom_organizeFacts(factList)
{
	for (var facts = {}; factList.b; factList = factList.b) // WHILE_CONS
	{
		var entry = factList.a;

		var tag = entry.$;
		var key = entry.n;
		var value = entry.o;

		if (tag === 'a2')
		{
			(key === 'className')
				? _VirtualDom_addClass(facts, key, _Json_unwrap(value))
				: facts[key] = _Json_unwrap(value);

			continue;
		}

		var subFacts = facts[tag] || (facts[tag] = {});
		(tag === 'a3' && key === 'class')
			? _VirtualDom_addClass(subFacts, key, value)
			: subFacts[key] = value;
	}

	return facts;
}

function _VirtualDom_addClass(object, key, newClass)
{
	var classes = object[key];
	object[key] = classes ? classes + ' ' + newClass : newClass;
}



// RENDER


function _VirtualDom_render(vNode, eventNode)
{
	var tag = vNode.$;

	if (tag === 5)
	{
		return _VirtualDom_render(vNode.k || (vNode.k = vNode.m()), eventNode);
	}

	if (tag === 0)
	{
		return _VirtualDom_doc.createTextNode(vNode.a);
	}

	if (tag === 4)
	{
		var subNode = vNode.k;
		var tagger = vNode.j;

		while (subNode.$ === 4)
		{
			typeof tagger !== 'object'
				? tagger = [tagger, subNode.j]
				: tagger.push(subNode.j);

			subNode = subNode.k;
		}

		var subEventRoot = { j: tagger, p: eventNode };
		var domNode = _VirtualDom_render(subNode, subEventRoot);
		domNode.elm_event_node_ref = subEventRoot;
		return domNode;
	}

	if (tag === 3)
	{
		var domNode = vNode.h(vNode.g);
		_VirtualDom_applyFacts(domNode, eventNode, vNode.d);
		return domNode;
	}

	// at this point `tag` must be 1 or 2

	var domNode = vNode.f
		? _VirtualDom_doc.createElementNS(vNode.f, vNode.c)
		: _VirtualDom_doc.createElement(vNode.c);

	if (_VirtualDom_divertHrefToApp && vNode.c == 'a')
	{
		domNode.addEventListener('click', _VirtualDom_divertHrefToApp(domNode));
	}

	_VirtualDom_applyFacts(domNode, eventNode, vNode.d);

	for (var kids = vNode.e, i = 0; i < kids.length; i++)
	{
		_VirtualDom_appendChild(domNode, _VirtualDom_render(tag === 1 ? kids[i] : kids[i].b, eventNode));
	}

	return domNode;
}



// APPLY FACTS


function _VirtualDom_applyFacts(domNode, eventNode, facts)
{
	for (var key in facts)
	{
		var value = facts[key];

		key === 'a1'
			? _VirtualDom_applyStyles(domNode, value)
			:
		key === 'a0'
			? _VirtualDom_applyEvents(domNode, eventNode, value)
			:
		key === 'a3'
			? _VirtualDom_applyAttrs(domNode, value)
			:
		key === 'a4'
			? _VirtualDom_applyAttrsNS(domNode, value)
			:
		((key !== 'value' && key !== 'checked') || domNode[key] !== value) && (domNode[key] = value);
	}
}



// APPLY STYLES


function _VirtualDom_applyStyles(domNode, styles)
{
	var domNodeStyle = domNode.style;

	for (var key in styles)
	{
		domNodeStyle[key] = styles[key];
	}
}



// APPLY ATTRS


function _VirtualDom_applyAttrs(domNode, attrs)
{
	for (var key in attrs)
	{
		var value = attrs[key];
		typeof value !== 'undefined'
			? domNode.setAttribute(key, value)
			: domNode.removeAttribute(key);
	}
}



// APPLY NAMESPACED ATTRS


function _VirtualDom_applyAttrsNS(domNode, nsAttrs)
{
	for (var key in nsAttrs)
	{
		var pair = nsAttrs[key];
		var namespace = pair.f;
		var value = pair.o;

		typeof value !== 'undefined'
			? domNode.setAttributeNS(namespace, key, value)
			: domNode.removeAttributeNS(namespace, key);
	}
}



// APPLY EVENTS


function _VirtualDom_applyEvents(domNode, eventNode, events)
{
	var allCallbacks = domNode.elmFs || (domNode.elmFs = {});

	for (var key in events)
	{
		var newHandler = events[key];
		var oldCallback = allCallbacks[key];

		if (!newHandler)
		{
			domNode.removeEventListener(key, oldCallback);
			allCallbacks[key] = undefined;
			continue;
		}

		if (oldCallback)
		{
			var oldHandler = oldCallback.q;
			if (oldHandler.$ === newHandler.$)
			{
				oldCallback.q = newHandler;
				continue;
			}
			domNode.removeEventListener(key, oldCallback);
		}

		oldCallback = _VirtualDom_makeCallback(eventNode, newHandler);
		domNode.addEventListener(key, oldCallback,
			_VirtualDom_passiveSupported
			&& { passive: $elm$virtual_dom$VirtualDom$toHandlerInt(newHandler) < 2 }
		);
		allCallbacks[key] = oldCallback;
	}
}



// PASSIVE EVENTS


var _VirtualDom_passiveSupported;

try
{
	window.addEventListener('t', null, Object.defineProperty({}, 'passive', {
		get: function() { _VirtualDom_passiveSupported = true; }
	}));
}
catch(e) {}



// EVENT HANDLERS


function _VirtualDom_makeCallback(eventNode, initialHandler)
{
	function callback(event)
	{
		var handler = callback.q;
		var result = _Json_runHelp(handler.a, event);

		if (!$elm$core$Result$isOk(result))
		{
			return;
		}

		var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

		// 0 = Normal
		// 1 = MayStopPropagation
		// 2 = MayPreventDefault
		// 3 = Custom

		var value = result.a;
		var message = !tag ? value : tag < 3 ? value.a : value.bM;
		var stopPropagation = tag == 1 ? value.b : tag == 3 && value.aW;
		var currentEventNode = (
			stopPropagation && event.stopPropagation(),
			(tag == 2 ? value.b : tag == 3 && value.aQ) && event.preventDefault(),
			eventNode
		);
		var tagger;
		var i;
		while (tagger = currentEventNode.j)
		{
			if (typeof tagger == 'function')
			{
				message = tagger(message);
			}
			else
			{
				for (var i = tagger.length; i--; )
				{
					message = tagger[i](message);
				}
			}
			currentEventNode = currentEventNode.p;
		}
		currentEventNode(message, stopPropagation); // stopPropagation implies isSync
	}

	callback.q = initialHandler;

	return callback;
}

function _VirtualDom_equalEvents(x, y)
{
	return x.$ == y.$ && _Json_equality(x.a, y.a);
}



// DIFF


// TODO: Should we do patches like in iOS?
//
// type Patch
//   = At Int Patch
//   | Batch (List Patch)
//   | Change ...
//
// How could it not be better?
//
function _VirtualDom_diff(x, y)
{
	var patches = [];
	_VirtualDom_diffHelp(x, y, patches, 0);
	return patches;
}


function _VirtualDom_pushPatch(patches, type, index, data)
{
	var patch = {
		$: type,
		r: index,
		s: data,
		t: undefined,
		u: undefined
	};
	patches.push(patch);
	return patch;
}


function _VirtualDom_diffHelp(x, y, patches, index)
{
	if (x === y)
	{
		return;
	}

	var xType = x.$;
	var yType = y.$;

	// Bail if you run into different types of nodes. Implies that the
	// structure has changed significantly and it's not worth a diff.
	if (xType !== yType)
	{
		if (xType === 1 && yType === 2)
		{
			y = _VirtualDom_dekey(y);
			yType = 1;
		}
		else
		{
			_VirtualDom_pushPatch(patches, 0, index, y);
			return;
		}
	}

	// Now we know that both nodes are the same $.
	switch (yType)
	{
		case 5:
			var xRefs = x.l;
			var yRefs = y.l;
			var i = xRefs.length;
			var same = i === yRefs.length;
			while (same && i--)
			{
				same = xRefs[i] === yRefs[i];
			}
			if (same)
			{
				y.k = x.k;
				return;
			}
			y.k = y.m();
			var subPatches = [];
			_VirtualDom_diffHelp(x.k, y.k, subPatches, 0);
			subPatches.length > 0 && _VirtualDom_pushPatch(patches, 1, index, subPatches);
			return;

		case 4:
			// gather nested taggers
			var xTaggers = x.j;
			var yTaggers = y.j;
			var nesting = false;

			var xSubNode = x.k;
			while (xSubNode.$ === 4)
			{
				nesting = true;

				typeof xTaggers !== 'object'
					? xTaggers = [xTaggers, xSubNode.j]
					: xTaggers.push(xSubNode.j);

				xSubNode = xSubNode.k;
			}

			var ySubNode = y.k;
			while (ySubNode.$ === 4)
			{
				nesting = true;

				typeof yTaggers !== 'object'
					? yTaggers = [yTaggers, ySubNode.j]
					: yTaggers.push(ySubNode.j);

				ySubNode = ySubNode.k;
			}

			// Just bail if different numbers of taggers. This implies the
			// structure of the virtual DOM has changed.
			if (nesting && xTaggers.length !== yTaggers.length)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			// check if taggers are "the same"
			if (nesting ? !_VirtualDom_pairwiseRefEqual(xTaggers, yTaggers) : xTaggers !== yTaggers)
			{
				_VirtualDom_pushPatch(patches, 2, index, yTaggers);
			}

			// diff everything below the taggers
			_VirtualDom_diffHelp(xSubNode, ySubNode, patches, index + 1);
			return;

		case 0:
			if (x.a !== y.a)
			{
				_VirtualDom_pushPatch(patches, 3, index, y.a);
			}
			return;

		case 1:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKids);
			return;

		case 2:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKeyedKids);
			return;

		case 3:
			if (x.h !== y.h)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
			factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

			var patch = y.i(x.g, y.g);
			patch && _VirtualDom_pushPatch(patches, 5, index, patch);

			return;
	}
}

// assumes the incoming arrays are the same length
function _VirtualDom_pairwiseRefEqual(as, bs)
{
	for (var i = 0; i < as.length; i++)
	{
		if (as[i] !== bs[i])
		{
			return false;
		}
	}

	return true;
}

function _VirtualDom_diffNodes(x, y, patches, index, diffKids)
{
	// Bail if obvious indicators have changed. Implies more serious
	// structural changes such that it's not worth it to diff.
	if (x.c !== y.c || x.f !== y.f)
	{
		_VirtualDom_pushPatch(patches, 0, index, y);
		return;
	}

	var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
	factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

	diffKids(x, y, patches, index);
}



// DIFF FACTS


// TODO Instead of creating a new diff object, it's possible to just test if
// there *is* a diff. During the actual patch, do the diff again and make the
// modifications directly. This way, there's no new allocations. Worth it?
function _VirtualDom_diffFacts(x, y, category)
{
	var diff;

	// look for changes and removals
	for (var xKey in x)
	{
		if (xKey === 'a1' || xKey === 'a0' || xKey === 'a3' || xKey === 'a4')
		{
			var subDiff = _VirtualDom_diffFacts(x[xKey], y[xKey] || {}, xKey);
			if (subDiff)
			{
				diff = diff || {};
				diff[xKey] = subDiff;
			}
			continue;
		}

		// remove if not in the new facts
		if (!(xKey in y))
		{
			diff = diff || {};
			diff[xKey] =
				!category
					? (typeof x[xKey] === 'string' ? '' : null)
					:
				(category === 'a1')
					? ''
					:
				(category === 'a0' || category === 'a3')
					? undefined
					:
				{ f: x[xKey].f, o: undefined };

			continue;
		}

		var xValue = x[xKey];
		var yValue = y[xKey];

		// reference equal, so don't worry about it
		if (xValue === yValue && xKey !== 'value' && xKey !== 'checked'
			|| category === 'a0' && _VirtualDom_equalEvents(xValue, yValue))
		{
			continue;
		}

		diff = diff || {};
		diff[xKey] = yValue;
	}

	// add new stuff
	for (var yKey in y)
	{
		if (!(yKey in x))
		{
			diff = diff || {};
			diff[yKey] = y[yKey];
		}
	}

	return diff;
}



// DIFF KIDS


function _VirtualDom_diffKids(xParent, yParent, patches, index)
{
	var xKids = xParent.e;
	var yKids = yParent.e;

	var xLen = xKids.length;
	var yLen = yKids.length;

	// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS

	if (xLen > yLen)
	{
		_VirtualDom_pushPatch(patches, 6, index, {
			v: yLen,
			i: xLen - yLen
		});
	}
	else if (xLen < yLen)
	{
		_VirtualDom_pushPatch(patches, 7, index, {
			v: xLen,
			e: yKids
		});
	}

	// PAIRWISE DIFF EVERYTHING ELSE

	for (var minLen = xLen < yLen ? xLen : yLen, i = 0; i < minLen; i++)
	{
		var xKid = xKids[i];
		_VirtualDom_diffHelp(xKid, yKids[i], patches, ++index);
		index += xKid.b || 0;
	}
}



// KEYED DIFF


function _VirtualDom_diffKeyedKids(xParent, yParent, patches, rootIndex)
{
	var localPatches = [];

	var changes = {}; // Dict String Entry
	var inserts = []; // Array { index : Int, entry : Entry }
	// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }

	var xKids = xParent.e;
	var yKids = yParent.e;
	var xLen = xKids.length;
	var yLen = yKids.length;
	var xIndex = 0;
	var yIndex = 0;

	var index = rootIndex;

	while (xIndex < xLen && yIndex < yLen)
	{
		var x = xKids[xIndex];
		var y = yKids[yIndex];

		var xKey = x.a;
		var yKey = y.a;
		var xNode = x.b;
		var yNode = y.b;

		var newMatch = undefined;
		var oldMatch = undefined;

		// check if keys match

		if (xKey === yKey)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNode, localPatches, index);
			index += xNode.b || 0;

			xIndex++;
			yIndex++;
			continue;
		}

		// look ahead 1 to detect insertions and removals.

		var xNext = xKids[xIndex + 1];
		var yNext = yKids[yIndex + 1];

		if (xNext)
		{
			var xNextKey = xNext.a;
			var xNextNode = xNext.b;
			oldMatch = yKey === xNextKey;
		}

		if (yNext)
		{
			var yNextKey = yNext.a;
			var yNextNode = yNext.b;
			newMatch = xKey === yNextKey;
		}


		// swap x and y
		if (newMatch && oldMatch)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			_VirtualDom_insertNode(changes, localPatches, xKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNextNode, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		// insert y
		if (newMatch)
		{
			index++;
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			index += xNode.b || 0;

			xIndex += 1;
			yIndex += 2;
			continue;
		}

		// remove x
		if (oldMatch)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 1;
			continue;
		}

		// remove x, insert y
		if (xNext && xNextKey === yNextKey)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNextNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		break;
	}

	// eat up any remaining nodes with removeNode and insertNode

	while (xIndex < xLen)
	{
		index++;
		var x = xKids[xIndex];
		var xNode = x.b;
		_VirtualDom_removeNode(changes, localPatches, x.a, xNode, index);
		index += xNode.b || 0;
		xIndex++;
	}

	while (yIndex < yLen)
	{
		var endInserts = endInserts || [];
		var y = yKids[yIndex];
		_VirtualDom_insertNode(changes, localPatches, y.a, y.b, undefined, endInserts);
		yIndex++;
	}

	if (localPatches.length > 0 || inserts.length > 0 || endInserts)
	{
		_VirtualDom_pushPatch(patches, 8, rootIndex, {
			w: localPatches,
			x: inserts,
			y: endInserts
		});
	}
}



// CHANGES FROM KEYED DIFF


var _VirtualDom_POSTFIX = '_elmW6BL';


function _VirtualDom_insertNode(changes, localPatches, key, vnode, yIndex, inserts)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		entry = {
			c: 0,
			z: vnode,
			r: yIndex,
			s: undefined
		};

		inserts.push({ r: yIndex, A: entry });
		changes[key] = entry;

		return;
	}

	// this key was removed earlier, a match!
	if (entry.c === 1)
	{
		inserts.push({ r: yIndex, A: entry });

		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(entry.z, vnode, subPatches, entry.r);
		entry.r = yIndex;
		entry.s.s = {
			w: subPatches,
			A: entry
		};

		return;
	}

	// this key has already been inserted or moved, a duplicate!
	_VirtualDom_insertNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, yIndex, inserts);
}


function _VirtualDom_removeNode(changes, localPatches, key, vnode, index)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		var patch = _VirtualDom_pushPatch(localPatches, 9, index, undefined);

		changes[key] = {
			c: 1,
			z: vnode,
			r: index,
			s: patch
		};

		return;
	}

	// this key was inserted earlier, a match!
	if (entry.c === 0)
	{
		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(vnode, entry.z, subPatches, index);

		_VirtualDom_pushPatch(localPatches, 9, index, {
			w: subPatches,
			A: entry
		});

		return;
	}

	// this key has already been removed or moved, a duplicate!
	_VirtualDom_removeNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, index);
}



// ADD DOM NODES
//
// Each DOM node has an "index" assigned in order of traversal. It is important
// to minimize our crawl over the actual DOM, so these indexes (along with the
// descendantsCount of virtual nodes) let us skip touching entire subtrees of
// the DOM if we know there are no patches there.


function _VirtualDom_addDomNodes(domNode, vNode, patches, eventNode)
{
	_VirtualDom_addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.b, eventNode);
}


// assumes `patches` is non-empty and indexes increase monotonically.
function _VirtualDom_addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
{
	var patch = patches[i];
	var index = patch.r;

	while (index === low)
	{
		var patchType = patch.$;

		if (patchType === 1)
		{
			_VirtualDom_addDomNodes(domNode, vNode.k, patch.s, eventNode);
		}
		else if (patchType === 8)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var subPatches = patch.s.w;
			if (subPatches.length > 0)
			{
				_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
			}
		}
		else if (patchType === 9)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var data = patch.s;
			if (data)
			{
				data.A.s = domNode;
				var subPatches = data.w;
				if (subPatches.length > 0)
				{
					_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
		}
		else
		{
			patch.t = domNode;
			patch.u = eventNode;
		}

		i++;

		if (!(patch = patches[i]) || (index = patch.r) > high)
		{
			return i;
		}
	}

	var tag = vNode.$;

	if (tag === 4)
	{
		var subNode = vNode.k;

		while (subNode.$ === 4)
		{
			subNode = subNode.k;
		}

		return _VirtualDom_addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	}

	// tag must be 1 or 2 at this point

	var vKids = vNode.e;
	var childNodes = domNode.childNodes;
	for (var j = 0; j < vKids.length; j++)
	{
		low++;
		var vKid = tag === 1 ? vKids[j] : vKids[j].b;
		var nextLow = low + (vKid.b || 0);
		if (low <= index && index <= nextLow)
		{
			i = _VirtualDom_addDomNodesHelp(childNodes[j], vKid, patches, i, low, nextLow, eventNode);
			if (!(patch = patches[i]) || (index = patch.r) > high)
			{
				return i;
			}
		}
		low = nextLow;
	}
	return i;
}



// APPLY PATCHES


function _VirtualDom_applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
{
	if (patches.length === 0)
	{
		return rootDomNode;
	}

	_VirtualDom_addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
	return _VirtualDom_applyPatchesHelp(rootDomNode, patches);
}

function _VirtualDom_applyPatchesHelp(rootDomNode, patches)
{
	for (var i = 0; i < patches.length; i++)
	{
		var patch = patches[i];
		var localDomNode = patch.t
		var newNode = _VirtualDom_applyPatch(localDomNode, patch);
		if (localDomNode === rootDomNode)
		{
			rootDomNode = newNode;
		}
	}
	return rootDomNode;
}

function _VirtualDom_applyPatch(domNode, patch)
{
	switch (patch.$)
	{
		case 0:
			return _VirtualDom_applyPatchRedraw(domNode, patch.s, patch.u);

		case 4:
			_VirtualDom_applyFacts(domNode, patch.u, patch.s);
			return domNode;

		case 3:
			domNode.replaceData(0, domNode.length, patch.s);
			return domNode;

		case 1:
			return _VirtualDom_applyPatchesHelp(domNode, patch.s);

		case 2:
			if (domNode.elm_event_node_ref)
			{
				domNode.elm_event_node_ref.j = patch.s;
			}
			else
			{
				domNode.elm_event_node_ref = { j: patch.s, p: patch.u };
			}
			return domNode;

		case 6:
			var data = patch.s;
			for (var i = 0; i < data.i; i++)
			{
				domNode.removeChild(domNode.childNodes[data.v]);
			}
			return domNode;

		case 7:
			var data = patch.s;
			var kids = data.e;
			var i = data.v;
			var theEnd = domNode.childNodes[i];
			for (; i < kids.length; i++)
			{
				domNode.insertBefore(_VirtualDom_render(kids[i], patch.u), theEnd);
			}
			return domNode;

		case 9:
			var data = patch.s;
			if (!data)
			{
				domNode.parentNode.removeChild(domNode);
				return domNode;
			}
			var entry = data.A;
			if (typeof entry.r !== 'undefined')
			{
				domNode.parentNode.removeChild(domNode);
			}
			entry.s = _VirtualDom_applyPatchesHelp(domNode, data.w);
			return domNode;

		case 8:
			return _VirtualDom_applyPatchReorder(domNode, patch);

		case 5:
			return patch.s(domNode);

		default:
			_Debug_crash(10); // 'Ran into an unknown patch!'
	}
}


function _VirtualDom_applyPatchRedraw(domNode, vNode, eventNode)
{
	var parentNode = domNode.parentNode;
	var newNode = _VirtualDom_render(vNode, eventNode);

	if (!newNode.elm_event_node_ref)
	{
		newNode.elm_event_node_ref = domNode.elm_event_node_ref;
	}

	if (parentNode && newNode !== domNode)
	{
		parentNode.replaceChild(newNode, domNode);
	}
	return newNode;
}


function _VirtualDom_applyPatchReorder(domNode, patch)
{
	var data = patch.s;

	// remove end inserts
	var frag = _VirtualDom_applyPatchReorderEndInsertsHelp(data.y, patch);

	// removals
	domNode = _VirtualDom_applyPatchesHelp(domNode, data.w);

	// inserts
	var inserts = data.x;
	for (var i = 0; i < inserts.length; i++)
	{
		var insert = inserts[i];
		var entry = insert.A;
		var node = entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u);
		domNode.insertBefore(node, domNode.childNodes[insert.r]);
	}

	// add end inserts
	if (frag)
	{
		_VirtualDom_appendChild(domNode, frag);
	}

	return domNode;
}


function _VirtualDom_applyPatchReorderEndInsertsHelp(endInserts, patch)
{
	if (!endInserts)
	{
		return;
	}

	var frag = _VirtualDom_doc.createDocumentFragment();
	for (var i = 0; i < endInserts.length; i++)
	{
		var insert = endInserts[i];
		var entry = insert.A;
		_VirtualDom_appendChild(frag, entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u)
		);
	}
	return frag;
}


function _VirtualDom_virtualize(node)
{
	// TEXT NODES

	if (node.nodeType === 3)
	{
		return _VirtualDom_text(node.textContent);
	}


	// WEIRD NODES

	if (node.nodeType !== 1)
	{
		return _VirtualDom_text('');
	}


	// ELEMENT NODES

	var attrList = _List_Nil;
	var attrs = node.attributes;
	for (var i = attrs.length; i--; )
	{
		var attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		attrList = _List_Cons( A2(_VirtualDom_attribute, name, value), attrList );
	}

	var tag = node.tagName.toLowerCase();
	var kidList = _List_Nil;
	var kids = node.childNodes;

	for (var i = kids.length; i--; )
	{
		kidList = _List_Cons(_VirtualDom_virtualize(kids[i]), kidList);
	}
	return A3(_VirtualDom_node, tag, attrList, kidList);
}

function _VirtualDom_dekey(keyedNode)
{
	var keyedKids = keyedNode.e;
	var len = keyedKids.length;
	var kids = new Array(len);
	for (var i = 0; i < len; i++)
	{
		kids[i] = keyedKids[i].b;
	}

	return {
		$: 1,
		c: keyedNode.c,
		d: keyedNode.d,
		e: kids,
		f: keyedNode.f,
		b: keyedNode.b
	};
}




// ELEMENT


var _Debugger_element;

var _Browser_element = _Debugger_element || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.dO,
		impl.fk,
		impl.e8,
		function(sendToApp, initialModel) {
			var view = impl.fI;
			/**/
			var domNode = args['node'];
			//*/
			/**_UNUSED/
			var domNode = args && args['node'] ? args['node'] : _Debug_crash(0);
			//*/
			var currNode = _VirtualDom_virtualize(domNode);

			return _Browser_makeAnimator(initialModel, function(model)
			{
				var nextNode = view(model);
				var patches = _VirtualDom_diff(currNode, nextNode);
				domNode = _VirtualDom_applyPatches(domNode, currNode, patches, sendToApp);
				currNode = nextNode;
			});
		}
	);
});



// DOCUMENT


var _Debugger_document;

var _Browser_document = _Debugger_document || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.dO,
		impl.fk,
		impl.e8,
		function(sendToApp, initialModel) {
			var divertHrefToApp = impl.aU && impl.aU(sendToApp)
			var view = impl.fI;
			var title = _VirtualDom_doc.title;
			var bodyNode = _VirtualDom_doc.body;
			var currNode = _VirtualDom_virtualize(bodyNode);
			return _Browser_makeAnimator(initialModel, function(model)
			{
				_VirtualDom_divertHrefToApp = divertHrefToApp;
				var doc = view(model);
				var nextNode = _VirtualDom_node('body')(_List_Nil)(doc.c5);
				var patches = _VirtualDom_diff(currNode, nextNode);
				bodyNode = _VirtualDom_applyPatches(bodyNode, currNode, patches, sendToApp);
				currNode = nextNode;
				_VirtualDom_divertHrefToApp = 0;
				(title !== doc.ff) && (_VirtualDom_doc.title = title = doc.ff);
			});
		}
	);
});



// ANIMATION


var _Browser_cancelAnimationFrame =
	typeof cancelAnimationFrame !== 'undefined'
		? cancelAnimationFrame
		: function(id) { clearTimeout(id); };

var _Browser_requestAnimationFrame =
	typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { return setTimeout(callback, 1000 / 60); };


function _Browser_makeAnimator(model, draw)
{
	draw(model);

	var state = 0;

	function updateIfNeeded()
	{
		state = state === 1
			? 0
			: ( _Browser_requestAnimationFrame(updateIfNeeded), draw(model), 1 );
	}

	return function(nextModel, isSync)
	{
		model = nextModel;

		isSync
			? ( draw(model),
				state === 2 && (state = 1)
				)
			: ( state === 0 && _Browser_requestAnimationFrame(updateIfNeeded),
				state = 2
				);
	};
}



// APPLICATION


function _Browser_application(impl)
{
	var onUrlChange = impl.en;
	var onUrlRequest = impl.eo;
	var key = function() { key.a(onUrlChange(_Browser_getUrl())); };

	return _Browser_document({
		aU: function(sendToApp)
		{
			key.a = sendToApp;
			_Browser_window.addEventListener('popstate', key);
			_Browser_window.navigator.userAgent.indexOf('Trident') < 0 || _Browser_window.addEventListener('hashchange', key);

			return F2(function(domNode, event)
			{
				if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button < 1 && !domNode.target && !domNode.hasAttribute('download'))
				{
					event.preventDefault();
					var href = domNode.href;
					var curr = _Browser_getUrl();
					var next = $elm$url$Url$fromString(href).a;
					sendToApp(onUrlRequest(
						(next
							&& curr.cb === next.cb
							&& curr.bA === next.bA
							&& curr.b8.a === next.b8.a
						)
							? $elm$browser$Browser$Internal(next)
							: $elm$browser$Browser$External(href)
					));
				}
			});
		},
		dO: function(flags)
		{
			return A3(impl.dO, flags, _Browser_getUrl(), key);
		},
		fI: impl.fI,
		fk: impl.fk,
		e8: impl.e8
	});
}

function _Browser_getUrl()
{
	return $elm$url$Url$fromString(_VirtualDom_doc.location.href).a || _Debug_crash(1);
}

var _Browser_go = F2(function(key, n)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		n && history.go(n);
		key();
	}));
});

var _Browser_pushUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.pushState({}, '', url);
		key();
	}));
});

var _Browser_replaceUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.replaceState({}, '', url);
		key();
	}));
});



// GLOBAL EVENTS


var _Browser_fakeNode = { addEventListener: function() {}, removeEventListener: function() {} };
var _Browser_doc = typeof document !== 'undefined' ? document : _Browser_fakeNode;
var _Browser_window = typeof window !== 'undefined' ? window : _Browser_fakeNode;

var _Browser_on = F3(function(node, eventName, sendToSelf)
{
	return _Scheduler_spawn(_Scheduler_binding(function(callback)
	{
		function handler(event)	{ _Scheduler_rawSpawn(sendToSelf(event)); }
		node.addEventListener(eventName, handler, _VirtualDom_passiveSupported && { passive: true });
		return function() { node.removeEventListener(eventName, handler); };
	}));
});

var _Browser_decodeEvent = F2(function(decoder, event)
{
	var result = _Json_runHelp(decoder, event);
	return $elm$core$Result$isOk(result) ? $elm$core$Maybe$Just(result.a) : $elm$core$Maybe$Nothing;
});



// PAGE VISIBILITY


function _Browser_visibilityInfo()
{
	return (typeof _VirtualDom_doc.hidden !== 'undefined')
		? { dJ: 'hidden', c8: 'visibilitychange' }
		:
	(typeof _VirtualDom_doc.mozHidden !== 'undefined')
		? { dJ: 'mozHidden', c8: 'mozvisibilitychange' }
		:
	(typeof _VirtualDom_doc.msHidden !== 'undefined')
		? { dJ: 'msHidden', c8: 'msvisibilitychange' }
		:
	(typeof _VirtualDom_doc.webkitHidden !== 'undefined')
		? { dJ: 'webkitHidden', c8: 'webkitvisibilitychange' }
		: { dJ: 'hidden', c8: 'visibilitychange' };
}



// ANIMATION FRAMES


function _Browser_rAF()
{
	return _Scheduler_binding(function(callback)
	{
		var id = _Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(Date.now()));
		});

		return function() {
			_Browser_cancelAnimationFrame(id);
		};
	});
}


function _Browser_now()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(Date.now()));
	});
}



// DOM STUFF


function _Browser_withNode(id, doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			var node = document.getElementById(id);
			callback(node
				? _Scheduler_succeed(doStuff(node))
				: _Scheduler_fail($elm$browser$Browser$Dom$NotFound(id))
			);
		});
	});
}


function _Browser_withWindow(doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(doStuff()));
		});
	});
}


// FOCUS and BLUR


var _Browser_call = F2(function(functionName, id)
{
	return _Browser_withNode(id, function(node) {
		node[functionName]();
		return _Utils_Tuple0;
	});
});



// WINDOW VIEWPORT


function _Browser_getViewport()
{
	return {
		co: _Browser_getScene(),
		cV: {
			fM: _Browser_window.pageXOffset,
			fN: _Browser_window.pageYOffset,
			fJ: _Browser_doc.documentElement.clientWidth,
			dH: _Browser_doc.documentElement.clientHeight
		}
	};
}

function _Browser_getScene()
{
	var body = _Browser_doc.body;
	var elem = _Browser_doc.documentElement;
	return {
		fJ: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
		dH: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight)
	};
}

var _Browser_setViewport = F2(function(x, y)
{
	return _Browser_withWindow(function()
	{
		_Browser_window.scroll(x, y);
		return _Utils_Tuple0;
	});
});



// ELEMENT VIEWPORT


function _Browser_getViewportOf(id)
{
	return _Browser_withNode(id, function(node)
	{
		return {
			co: {
				fJ: node.scrollWidth,
				dH: node.scrollHeight
			},
			cV: {
				fM: node.scrollLeft,
				fN: node.scrollTop,
				fJ: node.clientWidth,
				dH: node.clientHeight
			}
		};
	});
}


var _Browser_setViewportOf = F3(function(id, x, y)
{
	return _Browser_withNode(id, function(node)
	{
		node.scrollLeft = x;
		node.scrollTop = y;
		return _Utils_Tuple0;
	});
});



// ELEMENT


function _Browser_getElement(id)
{
	return _Browser_withNode(id, function(node)
	{
		var rect = node.getBoundingClientRect();
		var x = _Browser_window.pageXOffset;
		var y = _Browser_window.pageYOffset;
		return {
			co: _Browser_getScene(),
			cV: {
				fM: x,
				fN: y,
				fJ: _Browser_doc.documentElement.clientWidth,
				dH: _Browser_doc.documentElement.clientHeight
			},
			$7: {
				fM: x + rect.left,
				fN: y + rect.top,
				fJ: rect.width,
				dH: rect.height
			}
		};
	});
}



// LOAD and RELOAD


function _Browser_reload(skipCache)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		_VirtualDom_doc.location.reload(skipCache);
	}));
}

function _Browser_load(url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		try
		{
			_Browser_window.location = url;
		}
		catch(err)
		{
			// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
			// Other browsers reload the page, so let's be consistent about that.
			_VirtualDom_doc.location.reload(false);
		}
	}));
}



function _Time_now(millisToPosix)
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(millisToPosix(Date.now())));
	});
}

var _Time_setInterval = F2(function(interval, task)
{
	return _Scheduler_binding(function(callback)
	{
		var id = setInterval(function() { _Scheduler_rawSpawn(task); }, interval);
		return function() { clearInterval(id); };
	});
});

function _Time_here()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(
			A2($elm$time$Time$customZone, -(new Date().getTimezoneOffset()), _List_Nil)
		));
	});
}


function _Time_getZoneName()
{
	return _Scheduler_binding(function(callback)
	{
		try
		{
			var name = $elm$time$Time$Name(Intl.DateTimeFormat().resolvedOptions().timeZone);
		}
		catch (e)
		{
			var name = $elm$time$Time$Offset(new Date().getTimezoneOffset());
		}
		callback(_Scheduler_succeed(name));
	});
}



var _Bitwise_and = F2(function(a, b)
{
	return a & b;
});

var _Bitwise_or = F2(function(a, b)
{
	return a | b;
});

var _Bitwise_xor = F2(function(a, b)
{
	return a ^ b;
});

function _Bitwise_complement(a)
{
	return ~a;
};

var _Bitwise_shiftLeftBy = F2(function(offset, a)
{
	return a << offset;
});

var _Bitwise_shiftRightBy = F2(function(offset, a)
{
	return a >> offset;
});

var _Bitwise_shiftRightZfBy = F2(function(offset, a)
{
	return a >>> offset;
});
var $elm$core$Basics$EQ = 1;
var $elm$core$Basics$GT = 2;
var $elm$core$Basics$LT = 0;
var $elm$core$List$cons = _List_cons;
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === -2) {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (!node.$) {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Result$Err = function (a) {
	return {$: 1, a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 0, a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 2, a: a};
};
var $elm$core$Basics$False = 1;
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Maybe$Nothing = {$: 1};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\n    ',
		A2($elm$core$String$split, '\n', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\n\n(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 0:
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 1) {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\'' + (f + '\']'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 1:
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 2:
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\n\n',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\n\n';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\n\n    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\n\n' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 0, a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 1, a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.g) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.k),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.k);
		} else {
			var treeLen = builder.g * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.l) : builder.l;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.g);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.k) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.k);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{l: nodeList, g: (len / $elm$core$Array$branchFactor) | 0, k: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = 0;
var $elm$core$Result$isOk = function (result) {
	if (!result.$) {
		return true;
	} else {
		return false;
	}
};
var $elm$json$Json$Decode$map = _Json_map1;
var $elm$json$Json$Decode$map2 = _Json_map2;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $elm$virtual_dom$VirtualDom$toHandlerInt = function (handler) {
	switch (handler.$) {
		case 0:
			return 0;
		case 1:
			return 1;
		case 2:
			return 2;
		default:
			return 3;
	}
};
var $elm$browser$Browser$External = function (a) {
	return {$: 1, a: a};
};
var $elm$browser$Browser$Internal = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $elm$browser$Browser$Dom$NotFound = $elm$core$Basics$identity;
var $elm$url$Url$Http = 0;
var $elm$url$Url$Https = 1;
var $elm$url$Url$Url = F6(
	function (protocol, host, port_, path, query, fragment) {
		return {bp: fragment, bA: host, b0: path, b8: port_, cb: protocol, cd: query};
	});
var $elm$core$String$contains = _String_contains;
var $elm$core$String$length = _String_length;
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$indexes = _String_indexes;
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$String$left = F2(
	function (n, string) {
		return (n < 1) ? '' : A3($elm$core$String$slice, 0, n, string);
	});
var $elm$core$String$toInt = _String_toInt;
var $elm$url$Url$chompBeforePath = F5(
	function (protocol, path, params, frag, str) {
		if ($elm$core$String$isEmpty(str) || A2($elm$core$String$contains, '@', str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, ':', str);
			if (!_v0.b) {
				return $elm$core$Maybe$Just(
					A6($elm$url$Url$Url, protocol, str, $elm$core$Maybe$Nothing, path, params, frag));
			} else {
				if (!_v0.b.b) {
					var i = _v0.a;
					var _v1 = $elm$core$String$toInt(
						A2($elm$core$String$dropLeft, i + 1, str));
					if (_v1.$ === 1) {
						return $elm$core$Maybe$Nothing;
					} else {
						var port_ = _v1;
						return $elm$core$Maybe$Just(
							A6(
								$elm$url$Url$Url,
								protocol,
								A2($elm$core$String$left, i, str),
								port_,
								path,
								params,
								frag));
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}
		}
	});
var $elm$url$Url$chompBeforeQuery = F4(
	function (protocol, params, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '/', str);
			if (!_v0.b) {
				return A5($elm$url$Url$chompBeforePath, protocol, '/', params, frag, str);
			} else {
				var i = _v0.a;
				return A5(
					$elm$url$Url$chompBeforePath,
					protocol,
					A2($elm$core$String$dropLeft, i, str),
					params,
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompBeforeFragment = F3(
	function (protocol, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '?', str);
			if (!_v0.b) {
				return A4($elm$url$Url$chompBeforeQuery, protocol, $elm$core$Maybe$Nothing, frag, str);
			} else {
				var i = _v0.a;
				return A4(
					$elm$url$Url$chompBeforeQuery,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompAfterProtocol = F2(
	function (protocol, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '#', str);
			if (!_v0.b) {
				return A3($elm$url$Url$chompBeforeFragment, protocol, $elm$core$Maybe$Nothing, str);
			} else {
				var i = _v0.a;
				return A3(
					$elm$url$Url$chompBeforeFragment,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$core$String$startsWith = _String_startsWith;
var $elm$url$Url$fromString = function (str) {
	return A2($elm$core$String$startsWith, 'http://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		0,
		A2($elm$core$String$dropLeft, 7, str)) : (A2($elm$core$String$startsWith, 'https://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		1,
		A2($elm$core$String$dropLeft, 8, str)) : $elm$core$Maybe$Nothing);
};
var $elm$core$Basics$never = function (_v0) {
	never:
	while (true) {
		var nvr = _v0;
		var $temp$_v0 = nvr;
		_v0 = $temp$_v0;
		continue never;
	}
};
var $elm$core$Task$Perform = $elm$core$Basics$identity;
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$core$Task$init = $elm$core$Task$succeed(0);
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return 0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0;
		return A2($elm$core$Task$map, tagger, task);
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			A2($elm$core$Task$map, toMessage, task));
	});
var $elm$browser$Browser$element = _Browser_element;
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $elm$json$Json$Encode$null = _Json_encodeNull;
var $author$project$Ports$getServers = _Platform_outgoingPort(
	'getServers',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Model$AllSessions = 0;
var $elm$core$Dict$RBEmpty_elm_builtin = {$: -2};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $author$project$Model$init = function (_v0) {
	return _Utils_Tuple2(
		{a2: $elm$core$Maybe$Nothing, a8: $elm$core$Maybe$Nothing, bg: $elm$core$Maybe$Nothing, bh: $elm$core$Maybe$Nothing, c: $elm$core$Maybe$Nothing, I: true, bU: false, bV: $elm$core$Maybe$Nothing, b4: $elm$core$Maybe$Nothing, aS: $elm$core$Maybe$Nothing, cr: $elm$core$Maybe$Nothing, aT: $elm$core$Dict$empty, cv: $elm$core$Maybe$Nothing, cw: _List_Nil, cx: $elm$core$Maybe$Nothing, cy: 0, cF: false, cH: $elm$core$Maybe$Nothing, cY: false, cZ: $elm$core$Maybe$Nothing},
		$elm$core$Platform$Cmd$none);
};
var $author$project$Main$init = function (flags) {
	var _v0 = $author$project$Model$init(flags);
	var model = _v0.a;
	var cmd = _v0.b;
	return _Utils_Tuple2(
		model,
		$elm$core$Platform$Cmd$batch(
			_List_fromArray(
				[
					cmd,
					$author$project$Ports$getServers(0)
				])));
};
var $author$project$Msg$AutoDownloadStarsSet = function (a) {
	return {$: 206, a: a};
};
var $author$project$Msg$ChangeApikeyResult = function (a) {
	return {$: 245, a: a};
};
var $author$project$Msg$EscapePressed = {$: 280};
var $author$project$Msg$GameStarted = F2(
	function (a, b) {
		return {$: 137, a: a, b: b};
	});
var $author$project$Msg$GotApiKey = F2(
	function (a, b) {
		return {$: 256, a: a, b: b};
	});
var $author$project$Msg$GotAppSettings = function (a) {
	return {$: 203, a: a};
};
var $author$project$Msg$GotHasStarsExe = function (a) {
	return {$: 195, a: a};
};
var $author$project$Msg$GotRaces = F2(
	function (a, b) {
		return {$: 72, a: a, b: b};
	});
var $author$project$Msg$GotServers = function (a) {
	return {$: 1, a: a};
};
var $author$project$Msg$GotUserProfiles = F2(
	function (a, b) {
		return {$: 55, a: a, b: b};
	});
var $author$project$Msg$HabButtonTick = {$: 112};
var $author$project$Msg$HistoricBackupDownloaded = F2(
	function (a, b) {
		return {$: 199, a: a, b: b};
	});
var $author$project$Msg$InvitationAccepted = F2(
	function (a, b) {
		return {$: 66, a: a, b: b};
	});
var $author$project$Msg$InvitationDeclined = F2(
	function (a, b) {
		return {$: 68, a: a, b: b};
	});
var $author$project$Msg$InviteResult = F2(
	function (a, b) {
		return {$: 60, a: a, b: b};
	});
var $author$project$Msg$LaunchStarsResult = function (a) {
	return {$: 193, a: a};
};
var $author$project$Msg$MapGenerated = function (a) {
	return {$: 275, a: a};
};
var $author$project$Msg$MapSaved = function (a) {
	return {$: 277, a: a};
};
var $author$project$Msg$MemberPromoted = F2(
	function (a, b) {
		return {$: 51, a: a, b: b};
	});
var $author$project$Msg$MouseMoveWhileDragging = F2(
	function (a, b) {
		return {$: 139, a: a, b: b};
	});
var $author$project$Msg$MouseUpEndDrag = {$: 142};
var $author$project$Msg$NotificationInvitation = F3(
	function (a, b, c) {
		return {$: 247, a: a, b: b, c: c};
	});
var $author$project$Msg$NotificationOrderStatus = F3(
	function (a, b, c) {
		return {$: 251, a: a, b: b, c: c};
	});
var $author$project$Msg$NotificationPendingRegistration = F3(
	function (a, b, c) {
		return {$: 252, a: a, b: b, c: c};
	});
var $author$project$Msg$NotificationPlayerRace = F3(
	function (a, b, c) {
		return {$: 250, a: a, b: b, c: c};
	});
var $author$project$Msg$NotificationRace = F3(
	function (a, b, c) {
		return {$: 248, a: a, b: b, c: c};
	});
var $author$project$Msg$NotificationRuleset = F3(
	function (a, b, c) {
		return {$: 249, a: a, b: b, c: c};
	});
var $author$project$Msg$NotificationSession = F3(
	function (a, b, c) {
		return {$: 246, a: a, b: b, c: c};
	});
var $author$project$Msg$NtvdmChecked = function (a) {
	return {$: 214, a: a};
};
var $author$project$Msg$PlayerReadyResult = F2(
	function (a, b) {
		return {$: 135, a: a, b: b};
	});
var $author$project$Msg$PlayersReordered = F2(
	function (a, b) {
		return {$: 143, a: a, b: b};
	});
var $author$project$Msg$RaceBuilderSaved = function (a) {
	return {$: 133, a: a};
};
var $author$project$Msg$RaceBuilderValidationReceived = function (a) {
	return {$: 128, a: a};
};
var $author$project$Msg$RaceDeleted = F2(
	function (a, b) {
		return {$: 78, a: a, b: b};
	});
var $author$project$Msg$RaceDownloaded = function (a) {
	return {$: 76, a: a};
};
var $author$project$Msg$RaceFileLoaded = function (a) {
	return {$: 130, a: a};
};
var $author$project$Msg$RaceTemplateLoaded = function (a) {
	return {$: 88, a: a};
};
var $author$project$Msg$RaceUploaded = F2(
	function (a, b) {
		return {$: 74, a: a, b: b};
	});
var $author$project$Msg$ResetApikeyResult = function (a) {
	return {$: 229, a: a};
};
var $author$project$Msg$RulesSet = F2(
	function (a, b) {
		return {$: 183, a: a, b: b};
	});
var $author$project$Msg$SentInvitationCanceled = F2(
	function (a, b) {
		return {$: 70, a: a, b: b};
	});
var $author$project$Msg$ServerAdded = function (a) {
	return {$: 3, a: a};
};
var $author$project$Msg$ServerDragEnd = {$: 148};
var $author$project$Msg$ServerDragMove = function (a) {
	return {$: 145, a: a};
};
var $author$project$Msg$ServerRemoved = function (a) {
	return {$: 5, a: a};
};
var $author$project$Msg$ServerUpdated = function (a) {
	return {$: 4, a: a};
};
var $author$project$Msg$ServersDirSelected = function (a) {
	return {$: 204, a: a};
};
var $author$project$Msg$ServersReordered = function (a) {
	return {$: 149, a: a};
};
var $author$project$Msg$SessionBackupDownloaded = F2(
	function (a, b) {
		return {$: 197, a: a, b: b};
	});
var $author$project$Msg$SessionCreated = F2(
	function (a, b) {
		return {$: 43, a: a, b: b};
	});
var $author$project$Msg$SessionDeleted = F2(
	function (a, b) {
		return {$: 47, a: a, b: b};
	});
var $author$project$Msg$SessionJoined = F2(
	function (a, b) {
		return {$: 45, a: a, b: b};
	});
var $author$project$Msg$SessionQuitResult = F2(
	function (a, b) {
		return {$: 49, a: a, b: b};
	});
var $author$project$Msg$SessionsUpdated = function (a) {
	return {$: 184, a: a};
};
var $author$project$Msg$SetupRaceResult = F2(
	function (a, b) {
		return {$: 82, a: a, b: b};
	});
var $author$project$Msg$UseWineSet = function (a) {
	return {$: 208, a: a};
};
var $author$project$Msg$WineInstallChecked = function (a) {
	return {$: 212, a: a};
};
var $author$project$Msg$WinePrefixesDirSelected = function (a) {
	return {$: 210, a: a};
};
var $author$project$Msg$ZoomLevelSet = function (a) {
	return {$: 262, a: a};
};
var $elm$json$Json$Decode$value = _Json_decodeValue;
var $author$project$Ports$apiKeyReceived = _Platform_incomingPort('apiKeyReceived', $elm$json$Json$Decode$value);
var $elm$json$Json$Decode$bool = _Json_decodeBool;
var $elm$json$Json$Decode$field = _Json_decodeField;
var $elm$json$Json$Decode$int = _Json_decodeInt;
var $elm$json$Json$Decode$map6 = _Json_map6;
var $elm$json$Json$Decode$oneOf = _Json_oneOf;
var $elm$json$Json$Decode$string = _Json_decodeString;
var $author$project$Api$Decode$appSettings = A7(
	$elm$json$Json$Decode$map6,
	F6(
		function (sd, ads, zl, uw, wpd, vwi) {
			return {c1: ads, eT: sd, fm: uw, fq: vwi, fK: wpd, fP: zl};
		}),
	A2($elm$json$Json$Decode$field, 'serversDir', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'autoDownloadStars', $elm$json$Json$Decode$bool),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$field, 'zoomLevel', $elm$json$Json$Decode$int),
				$elm$json$Json$Decode$succeed(100)
			])),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$field, 'useWine', $elm$json$Json$Decode$bool),
				$elm$json$Json$Decode$succeed(false)
			])),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$field, 'winePrefixesDir', $elm$json$Json$Decode$string),
				$elm$json$Json$Decode$succeed('~/.config/astrum/wine_prefixes')
			])),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$field, 'validWineInstall', $elm$json$Json$Decode$bool),
				$elm$json$Json$Decode$succeed(false)
			])));
var $author$project$Ports$appSettingsReceived = _Platform_incomingPort('appSettingsReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$approveRegistrationResult = _Platform_incomingPort('approveRegistrationResult', $elm$json$Json$Decode$value);
var $author$project$Ports$autoDownloadStarsSet = _Platform_incomingPort('autoDownloadStarsSet', $elm$json$Json$Decode$value);
var $elm$core$Platform$Sub$batch = _Platform_batch;
var $author$project$Ports$changeApikeyResult = _Platform_incomingPort('changeApikeyResult', $elm$json$Json$Decode$value);
var $author$project$Ports$connectResult = _Platform_incomingPort('connectResult', $elm$json$Json$Decode$value);
var $author$project$Ports$connectionChanged = _Platform_incomingPort('connectionChanged', $elm$json$Json$Decode$value);
var $author$project$Ports$createUserResult = _Platform_incomingPort('createUserResult', $elm$json$Json$Decode$value);
var $author$project$Msg$ApproveRegistrationResult = F2(
	function (a, b) {
		return {$: 237, a: a, b: b};
	});
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $elm$core$Tuple$pair = F2(
	function (a, b) {
		return _Utils_Tuple2(a, b);
	});
var $author$project$Subscriptions$decodeApproveRegistrationResult = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $elm$json$Json$Decode$string)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$ApproveRegistrationResult, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$ApproveRegistrationResult,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$ConnectResult = F2(
	function (a, b) {
		return {$: 28, a: a, b: b};
	});
var $elm$json$Json$Decode$map4 = _Json_map4;
var $author$project$Subscriptions$decodeConnectResult = function (value) {
	var connectInfoDecoder = A5(
		$elm$json$Json$Decode$map4,
		F4(
			function (u, i, m, s) {
				return {dW: m, eR: s, fn: i, aZ: u};
			}),
		A2($elm$json$Json$Decode$field, 'username', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'userId', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2($elm$json$Json$Decode$field, 'isManager', $elm$json$Json$Decode$bool),
					$elm$json$Json$Decode$succeed(false)
				])),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2($elm$json$Json$Decode$field, 'serialKey', $elm$json$Json$Decode$string),
					$elm$json$Json$Decode$succeed('')
				])));
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', connectInfoDecoder)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$ConnectResult, serverUrl, result);
	} else {
		var err = _v0.a;
		var _v2 = A2(
			$elm$json$Json$Decode$decodeValue,
			A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string),
			value);
		if (!_v2.$) {
			var errorMsg = _v2.a;
			return A2(
				$author$project$Msg$ConnectResult,
				'',
				$elm$core$Result$Err(errorMsg));
		} else {
			return A2(
				$author$project$Msg$ConnectResult,
				'',
				$elm$core$Result$Err(
					$elm$json$Json$Decode$errorToString(err)));
		}
	}
};
var $author$project$Msg$ConnectionChanged = F2(
	function (a, b) {
		return {$: 185, a: a, b: b};
	});
var $author$project$Msg$NoOp = {$: 0};
var $author$project$Subscriptions$decodeConnectionChanged = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$author$project$Msg$ConnectionChanged,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'connected', $elm$json$Json$Decode$bool));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var msg = _v0.a;
		return msg;
	} else {
		return $author$project$Msg$NoOp;
	}
};
var $author$project$Msg$CreateUserResult = F2(
	function (a, b) {
		return {$: 221, a: a, b: b};
	});
var $elm$json$Json$Decode$map3 = _Json_map3;
var $author$project$Subscriptions$decodeCreateUserResult = function (value) {
	var userDecoder = A4(
		$elm$json$Json$Decode$map3,
		F3(
			function (id, nickname, email) {
				return {dp: email, dM: id, ee: nickname};
			}),
		A2($elm$json$Json$Decode$field, 'id', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'nickname', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'email', $elm$json$Json$Decode$string));
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', userDecoder)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$CreateUserResult, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$CreateUserResult,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$DeleteUserResult = F2(
	function (a, b) {
		return {$: 225, a: a, b: b};
	});
var $author$project$Subscriptions$decodeDeleteUserResult = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2(
						$elm$json$Json$Decode$field,
						'ok',
						$elm$json$Json$Decode$succeed(0))),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$DeleteUserResult, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$DeleteUserResult,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$DisconnectResult = F2(
	function (a, b) {
		return {$: 31, a: a, b: b};
	});
var $author$project$Subscriptions$decodeDisconnectResult = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2(
						$elm$json$Json$Decode$field,
						'ok',
						$elm$json$Json$Decode$succeed(0))),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$DisconnectResult, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$DisconnectResult,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotInvitations = F2(
	function (a, b) {
		return {$: 63, a: a, b: b};
	});
var $author$project$Api$Invitation$Invitation = F7(
	function (id, sessionId, sessionName, userProfileId, inviterId, inviterNickname, inviteeNickname) {
		return {dM: id, dP: inviteeNickname, dQ: inviterId, dR: inviterNickname, eV: sessionId, eW: sessionName, fo: userProfileId};
	});
var $NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$custom = $elm$json$Json$Decode$map2($elm$core$Basics$apR);
var $NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required = F3(
	function (key, valDecoder, decoder) {
		return A2(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$custom,
			A2($elm$json$Json$Decode$field, key, valDecoder),
			decoder);
	});
var $author$project$Api$Decode$invitation = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'inviteeNickname',
	$elm$json$Json$Decode$string,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'inviterNickname',
		$elm$json$Json$Decode$string,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'inviterId',
			$elm$json$Json$Decode$string,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'userProfileId',
				$elm$json$Json$Decode$string,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'sessionName',
					$elm$json$Json$Decode$string,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'sessionId',
						$elm$json$Json$Decode$string,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'id',
							$elm$json$Json$Decode$string,
							$elm$json$Json$Decode$succeed($author$project$Api$Invitation$Invitation))))))));
var $elm$json$Json$Decode$list = _Json_decodeList;
var $elm$json$Json$Decode$null = _Json_decodeNull;
var $author$project$Api$Decode$invitationList = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			$elm$json$Json$Decode$list($author$project$Api$Decode$invitation),
			$elm$json$Json$Decode$null(_List_Nil)
		]));
var $author$project$Subscriptions$decodeInvitationsReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$invitationList)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotInvitations, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotInvitations,
			'',
			$elm$core$Result$Err(
				'Failed to decode invitations response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotLatestTurn = F2(
	function (a, b) {
		return {$: 189, a: a, b: b};
	});
var $author$project$Api$TurnFiles$TurnFiles = F4(
	function (sessionId, year, universe, turn) {
		return {eV: sessionId, fg: turn, fi: universe, fO: year};
	});
var $author$project$Api$Decode$turnFiles = A5(
	$elm$json$Json$Decode$map4,
	$author$project$Api$TurnFiles$TurnFiles,
	A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'year', $elm$json$Json$Decode$int),
	A2($elm$json$Json$Decode$field, 'universe', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'turn', $elm$json$Json$Decode$string));
var $author$project$Subscriptions$decodeLatestTurnReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$turnFiles)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotLatestTurn, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotLatestTurn,
			'',
			$elm$core$Result$Err(
				'Failed to decode latest turn response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Subscriptions$decodeNotification = F2(
	function (toMsg, value) {
		var decoder = A4(
			$elm$json$Json$Decode$map3,
			toMsg,
			A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
			A2($elm$json$Json$Decode$field, 'id', $elm$json$Json$Decode$string),
			A2($elm$json$Json$Decode$field, 'action', $elm$json$Json$Decode$string));
		var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
		if (!_v0.$) {
			var msg = _v0.a;
			return msg;
		} else {
			return $author$project$Msg$NoOp;
		}
	});
var $author$project$Msg$OrderConflictReceived = F3(
	function (a, b, c) {
		return {$: 186, a: a, b: b, c: c};
	});
var $author$project$Subscriptions$decodeOrderConflict = function (value) {
	var decoder = A4(
		$elm$json$Json$Decode$map3,
		$author$project$Msg$OrderConflictReceived,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'year', $elm$json$Json$Decode$int));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var msg = _v0.a;
		return msg;
	} else {
		return $author$project$Msg$NoOp;
	}
};
var $author$project$Msg$GotOrdersStatus = F2(
	function (a, b) {
		return {$: 200, a: a, b: b};
	});
var $author$project$Api$OrdersStatus$OrdersStatus = F3(
	function (sessionId, pendingYear, players) {
		return {et: pendingYear, ev: players, eV: sessionId};
	});
var $author$project$Api$OrdersStatus$PlayerOrderStatus = F4(
	function (playerOrder, nickname, isBot, submitted) {
		return {dU: isBot, ee: nickname, eu: playerOrder, e7: submitted};
	});
var $author$project$Api$Decode$playerOrderStatus = A5(
	$elm$json$Json$Decode$map4,
	$author$project$Api$OrdersStatus$PlayerOrderStatus,
	A2($elm$json$Json$Decode$field, 'playerOrder', $elm$json$Json$Decode$int),
	A2($elm$json$Json$Decode$field, 'nickname', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'isBot', $elm$json$Json$Decode$bool),
	A2($elm$json$Json$Decode$field, 'submitted', $elm$json$Json$Decode$bool));
var $author$project$Api$Decode$ordersStatus = A4(
	$elm$json$Json$Decode$map3,
	$author$project$Api$OrdersStatus$OrdersStatus,
	A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'pendingYear', $elm$json$Json$Decode$int),
	A2(
		$elm$json$Json$Decode$field,
		'players',
		$elm$json$Json$Decode$list($author$project$Api$Decode$playerOrderStatus)));
var $author$project$Subscriptions$decodeOrdersStatusReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$ordersStatus)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotOrdersStatus, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotOrdersStatus,
			'',
			$elm$core$Result$Err(
				'Failed to decode orders status response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotPendingRegistrations = F2(
	function (a, b) {
		return {$: 231, a: a, b: b};
	});
var $elm$json$Json$Decode$maybe = function (decoder) {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$map, $elm$core$Maybe$Just, decoder),
				$elm$json$Json$Decode$succeed($elm$core$Maybe$Nothing)
			]));
};
var $author$project$Subscriptions$decodePendingRegistrationsReceived = function (value) {
	var userDecoder = A5(
		$elm$json$Json$Decode$map4,
		F4(
			function (id, nickname, email, message) {
				return {dp: email, dM: id, bM: message, ee: nickname};
			}),
		A2($elm$json$Json$Decode$field, 'id', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'nickname', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'email', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$maybe(
			A2($elm$json$Json$Decode$field, 'message', $elm$json$Json$Decode$string)));
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2(
						$elm$json$Json$Decode$field,
						'ok',
						$elm$json$Json$Decode$list(userDecoder))),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotPendingRegistrations, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotPendingRegistrations,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$RegisterResult = F2(
	function (a, b) {
		return {$: 29, a: a, b: b};
	});
var $author$project$Subscriptions$decodeRegisterResult = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2(
						$elm$json$Json$Decode$field,
						'ok',
						$elm$json$Json$Decode$succeed(0))),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$RegisterResult, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$RegisterResult,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$RejectRegistrationResult = F2(
	function (a, b) {
		return {$: 241, a: a, b: b};
	});
var $author$project$Subscriptions$decodeRejectRegistrationResult = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2(
						$elm$json$Json$Decode$field,
						'ok',
						$elm$json$Json$Decode$succeed(0))),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$RejectRegistrationResult, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$RejectRegistrationResult,
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Subscriptions$decodeResult = F3(
	function (valueDecoder, toMsg, value) {
		var resultDecoder = $elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', valueDecoder)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				]));
		var _v0 = A2($elm$json$Json$Decode$decodeValue, resultDecoder, value);
		if (!_v0.$) {
			var result = _v0.a;
			return toMsg(result);
		} else {
			var err = _v0.a;
			return toMsg(
				$elm$core$Result$Err(
					$elm$json$Json$Decode$errorToString(err)));
		}
	});
var $author$project$Subscriptions$decodeResultWithServerUrl = F3(
	function (valueDecoder, toMsg, value) {
		var decoder = A3(
			$elm$json$Json$Decode$map2,
			$elm$core$Tuple$pair,
			A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
			$elm$json$Json$Decode$oneOf(
				_List_fromArray(
					[
						A2(
						$elm$json$Json$Decode$map,
						$elm$core$Result$Ok,
						A2($elm$json$Json$Decode$field, 'ok', valueDecoder)),
						A2(
						$elm$json$Json$Decode$map,
						$elm$core$Result$Err,
						A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
					])));
		var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
		if (!_v0.$) {
			var _v1 = _v0.a;
			var serverUrl = _v1.a;
			var result = _v1.b;
			return A2(toMsg, serverUrl, result);
		} else {
			var err = _v0.a;
			return A2(
				toMsg,
				'',
				$elm$core$Result$Err(
					$elm$json$Json$Decode$errorToString(err)));
		}
	});
var $author$project$Msg$GotRules = F3(
	function (a, b, c) {
		return {$: 153, a: a, b: b, c: c};
	});
var $author$project$Api$Rules$Rules = function (universeSize) {
	return function (density) {
		return function (startingDistance) {
			return function (randomSeed) {
				return function (maximumMinerals) {
					return function (slowerTechAdvances) {
						return function (acceleratedBbsPlay) {
							return function (noRandomEvents) {
								return function (computerPlayersFormAlliances) {
									return function (publicPlayerScores) {
										return function (galaxyClumping) {
											return function (vcOwnsPercentOfPlanets) {
												return function (vcOwnsPercentOfPlanetsValue) {
													return function (vcAttainTechInFields) {
														return function (vcAttainTechInFieldsTechValue) {
															return function (vcAttainTechInFieldsFieldsValue) {
																return function (vcExceedScoreOf) {
																	return function (vcExceedScoreOfValue) {
																		return function (vcExceedNextPlayerScoreBy) {
																			return function (vcExceedNextPlayerScoreByValue) {
																				return function (vcHasProductionCapacityOf) {
																					return function (vcHasProductionCapacityOfValue) {
																						return function (vcOwnsCapitalShips) {
																							return function (vcOwnsCapitalShipsValue) {
																								return function (vcHaveHighestScoreAfterYears) {
																									return function (vcHaveHighestScoreAfterYearsValue) {
																										return function (vcWinnerMustMeet) {
																											return function (vcMinYearsBeforeWinner) {
																												return {c_: acceleratedBbsPlay, db: computerPlayersFormAlliances, de: density, dA: galaxyClumping, d2: maximumMinerals, ef: noRandomEvents, ey: publicPlayerScores, eD: randomSeed, e4: slowerTechAdvances, e6: startingDistance, fj: universeSize, fr: vcAttainTechInFields, fs: vcAttainTechInFieldsFieldsValue, ft: vcAttainTechInFieldsTechValue, fu: vcExceedNextPlayerScoreBy, fv: vcExceedNextPlayerScoreByValue, fw: vcExceedScoreOf, fx: vcExceedScoreOfValue, fy: vcHasProductionCapacityOf, fz: vcHasProductionCapacityOfValue, fA: vcHaveHighestScoreAfterYears, fB: vcHaveHighestScoreAfterYearsValue, fC: vcMinYearsBeforeWinner, fD: vcOwnsCapitalShips, fE: vcOwnsCapitalShipsValue, fF: vcOwnsPercentOfPlanets, fG: vcOwnsPercentOfPlanetsValue, fH: vcWinnerMustMeet};
																											};
																										};
																									};
																								};
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
};
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $elm$json$Json$Decode$at = F2(
	function (fields, decoder) {
		return A3($elm$core$List$foldr, $elm$json$Json$Decode$field, decoder, fields);
	});
var $NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optionalDecoder = F3(
	function (path, valDecoder, fallback) {
		var nullOr = function (decoder) {
			return $elm$json$Json$Decode$oneOf(
				_List_fromArray(
					[
						decoder,
						$elm$json$Json$Decode$null(fallback)
					]));
		};
		var handleResult = function (input) {
			var _v0 = A2(
				$elm$json$Json$Decode$decodeValue,
				A2($elm$json$Json$Decode$at, path, $elm$json$Json$Decode$value),
				input);
			if (!_v0.$) {
				var rawValue = _v0.a;
				var _v1 = A2(
					$elm$json$Json$Decode$decodeValue,
					nullOr(valDecoder),
					rawValue);
				if (!_v1.$) {
					var finalResult = _v1.a;
					return $elm$json$Json$Decode$succeed(finalResult);
				} else {
					return A2(
						$elm$json$Json$Decode$at,
						path,
						nullOr(valDecoder));
				}
			} else {
				return $elm$json$Json$Decode$succeed(fallback);
			}
		};
		return A2($elm$json$Json$Decode$andThen, handleResult, $elm$json$Json$Decode$value);
	});
var $NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional = F4(
	function (key, valDecoder, fallback, decoder) {
		return A2(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$custom,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optionalDecoder,
				_List_fromArray(
					[key]),
				valDecoder,
				fallback),
			decoder);
	});
var $author$project$Api$Decode$rules = A4(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
	'vcMinYearsBeforeWinner',
	$elm$json$Json$Decode$int,
	50,
	A4(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
		'vcWinnerMustMeet',
		$elm$json$Json$Decode$int,
		1,
		A4(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
			'vcHaveHighestScoreAfterYearsValue',
			$elm$json$Json$Decode$int,
			100,
			A4(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
				'vcHaveHighestScoreAfterYears',
				$elm$json$Json$Decode$bool,
				false,
				A4(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
					'vcOwnsCapitalShipsValue',
					$elm$json$Json$Decode$int,
					100,
					A4(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
						'vcOwnsCapitalShips',
						$elm$json$Json$Decode$bool,
						false,
						A4(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
							'vcHasProductionCapacityOfValue',
							$elm$json$Json$Decode$int,
							100,
							A4(
								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
								'vcHasProductionCapacityOf',
								$elm$json$Json$Decode$bool,
								false,
								A4(
									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
									'vcExceedNextPlayerScoreByValue',
									$elm$json$Json$Decode$int,
									100,
									A4(
										$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
										'vcExceedNextPlayerScoreBy',
										$elm$json$Json$Decode$bool,
										true,
										A4(
											$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
											'vcExceedScoreOfValue',
											$elm$json$Json$Decode$int,
											11000,
											A4(
												$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
												'vcExceedScoreOf',
												$elm$json$Json$Decode$bool,
												false,
												A4(
													$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
													'vcAttainTechInFieldsFieldsValue',
													$elm$json$Json$Decode$int,
													4,
													A4(
														$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
														'vcAttainTechInFieldsTechValue',
														$elm$json$Json$Decode$int,
														22,
														A4(
															$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
															'vcAttainTechInFields',
															$elm$json$Json$Decode$bool,
															true,
															A4(
																$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																'vcOwnsPercentOfPlanetsValue',
																$elm$json$Json$Decode$int,
																60,
																A4(
																	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																	'vcOwnsPercentOfPlanets',
																	$elm$json$Json$Decode$bool,
																	true,
																	A4(
																		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																		'galaxyClumping',
																		$elm$json$Json$Decode$bool,
																		false,
																		A4(
																			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																			'publicPlayerScores',
																			$elm$json$Json$Decode$bool,
																			false,
																			A4(
																				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																				'computerPlayersFormAlliances',
																				$elm$json$Json$Decode$bool,
																				false,
																				A4(
																					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																					'noRandomEvents',
																					$elm$json$Json$Decode$bool,
																					false,
																					A4(
																						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																						'acceleratedBbsPlay',
																						$elm$json$Json$Decode$bool,
																						false,
																						A4(
																							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																							'slowerTechAdvances',
																							$elm$json$Json$Decode$bool,
																							false,
																							A4(
																								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																								'maximumMinerals',
																								$elm$json$Json$Decode$bool,
																								false,
																								A4(
																									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																									'randomSeed',
																									$elm$json$Json$Decode$maybe($elm$json$Json$Decode$int),
																									$elm$core$Maybe$Nothing,
																									A4(
																										$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																										'startingDistance',
																										$elm$json$Json$Decode$int,
																										1,
																										A4(
																											$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																											'density',
																											$elm$json$Json$Decode$int,
																											1,
																											A4(
																												$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																												'universeSize',
																												$elm$json$Json$Decode$int,
																												1,
																												$elm$json$Json$Decode$succeed($author$project$Api$Rules$Rules)))))))))))))))))))))))))))));
var $author$project$Subscriptions$decodeRulesReceived = function (value) {
	var decoder = A4(
		$elm$json$Json$Decode$map3,
		F3(
			function (serverUrl, sessionId, result) {
				return _Utils_Tuple3(serverUrl, sessionId, result);
			}),
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$rules)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var sessionId = _v1.b;
		var result = _v1.c;
		return A3($author$project$Msg$GotRules, serverUrl, sessionId, result);
	} else {
		var err = _v0.a;
		return A3(
			$author$project$Msg$GotRules,
			'',
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotSentInvitations = F2(
	function (a, b) {
		return {$: 64, a: a, b: b};
	});
var $author$project$Subscriptions$decodeSentInvitationsReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$invitationList)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotSentInvitations, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotSentInvitations,
			'',
			$elm$core$Result$Err(
				'Failed to decode sent invitations response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotSessionPlayerRace = F3(
	function (a, b, c) {
		return {$: 84, a: a, b: b, c: c};
	});
var $author$project$Api$Race$Race = F4(
	function (id, userId, nameSingular, namePlural) {
		return {dM: id, eb: namePlural, ec: nameSingular, fn: userId};
	});
var $author$project$Api$Decode$race = A5(
	$elm$json$Json$Decode$map4,
	$author$project$Api$Race$Race,
	A2($elm$json$Json$Decode$field, 'id', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'userId', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'nameSingular', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'namePlural', $elm$json$Json$Decode$string));
var $author$project$Subscriptions$decodeSessionPlayerRace = function (value) {
	var decoder = A4(
		$elm$json$Json$Decode$map3,
		F3(
			function (serverUrl, sessionId, result) {
				return _Utils_Tuple3(serverUrl, sessionId, result);
			}),
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$race)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var sessionId = _v1.b;
		var result = _v1.c;
		return A3($author$project$Msg$GotSessionPlayerRace, serverUrl, sessionId, result);
	} else {
		var err = _v0.a;
		return A3(
			$author$project$Msg$GotSessionPlayerRace,
			'',
			'',
			$elm$core$Result$Err(
				$elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotSession = F2(
	function (a, b) {
		return {$: 38, a: a, b: b};
	});
var $author$project$Api$Session$Session = F9(
	function (id, name, isPublic, members, managers, started, rulesIsSet, players, pendingInvitation) {
		return {dM: id, dX: isPublic, d1: managers, d3: members, ea: name, es: pendingInvitation, ev: players, eQ: rulesIsSet, e5: started};
	});
var $author$project$Api$Session$SessionPlayer = F3(
	function (userProfileId, ready, playerOrder) {
		return {eu: playerOrder, eE: ready, fo: userProfileId};
	});
var $author$project$Api$Decode$sessionPlayer = A4(
	$elm$json$Json$Decode$map3,
	$author$project$Api$Session$SessionPlayer,
	A2($elm$json$Json$Decode$field, 'userProfileId', $elm$json$Json$Decode$string),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$field, 'ready', $elm$json$Json$Decode$bool),
				$elm$json$Json$Decode$succeed(false)
			])),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$field, 'playerOrder', $elm$json$Json$Decode$int),
				$elm$json$Json$Decode$succeed(0)
			])));
var $author$project$Api$Decode$session = A4(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
	'pending_invitation',
	$elm$json$Json$Decode$bool,
	false,
	A4(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
		'players',
		$elm$json$Json$Decode$list($author$project$Api$Decode$sessionPlayer),
		_List_Nil,
		A4(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
			'rulesIsSet',
			$elm$json$Json$Decode$bool,
			false,
			A4(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
				'started',
				$elm$json$Json$Decode$bool,
				false,
				A4(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
					'managers',
					$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
					_List_Nil,
					A4(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
						'members',
						$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
						_List_Nil,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'isPublic',
							$elm$json$Json$Decode$bool,
							A3(
								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
								'name',
								$elm$json$Json$Decode$string,
								A3(
									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
									'id',
									$elm$json$Json$Decode$string,
									$elm$json$Json$Decode$succeed($author$project$Api$Session$Session))))))))));
var $author$project$Subscriptions$decodeSessionReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$session)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotSession, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotSession,
			'',
			$elm$core$Result$Err(
				'Failed to decode session response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$NotificationSessionTurn = F4(
	function (a, b, c, d) {
		return {$: 190, a: a, b: b, c: c, d: d};
	});
var $elm$json$Json$Decode$nullable = function (decoder) {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				$elm$json$Json$Decode$null($elm$core$Maybe$Nothing),
				A2($elm$json$Json$Decode$map, $elm$core$Maybe$Just, decoder)
			]));
};
var $author$project$Subscriptions$decodeSessionTurnNotification = function (value) {
	var decoder = A5(
		$elm$json$Json$Decode$map4,
		$author$project$Msg$NotificationSessionTurn,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$field, 'action', $elm$json$Json$Decode$string),
		A2(
			$elm$json$Json$Decode$field,
			'year',
			$elm$json$Json$Decode$nullable($elm$json$Json$Decode$int)));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var msg = _v0.a;
		return msg;
	} else {
		return $author$project$Msg$NoOp;
	}
};
var $author$project$Msg$GotSessions = F2(
	function (a, b) {
		return {$: 32, a: a, b: b};
	});
var $author$project$Api$Decode$sessionList = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			$elm$json$Json$Decode$list($author$project$Api$Decode$session),
			$elm$json$Json$Decode$null(_List_Nil)
		]));
var $author$project$Subscriptions$decodeSessionsReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$sessionList)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotSessions, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotSessions,
			'',
			$elm$core$Result$Err(
				'Failed to decode sessions response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$GotTurnFiles = F2(
	function (a, b) {
		return {$: 188, a: a, b: b};
	});
var $author$project$Subscriptions$decodeTurnReceived = function (value) {
	var decoder = A3(
		$elm$json$Json$Decode$map2,
		$elm$core$Tuple$pair,
		A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Ok,
					A2($elm$json$Json$Decode$field, 'ok', $author$project$Api$Decode$turnFiles)),
					A2(
					$elm$json$Json$Decode$map,
					$elm$core$Result$Err,
					A2($elm$json$Json$Decode$field, 'error', $elm$json$Json$Decode$string))
				])));
	var _v0 = A2($elm$json$Json$Decode$decodeValue, decoder, value);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var serverUrl = _v1.a;
		var result = _v1.b;
		return A2($author$project$Msg$GotTurnFiles, serverUrl, result);
	} else {
		var err = _v0.a;
		return A2(
			$author$project$Msg$GotTurnFiles,
			'',
			$elm$core$Result$Err(
				'Failed to decode turn files response: ' + $elm$json$Json$Decode$errorToString(err)));
	}
};
var $author$project$Msg$ZoomIn = {$: 259};
var $author$project$Msg$ZoomOut = {$: 260};
var $author$project$Msg$ZoomReset = {$: 261};
var $author$project$Subscriptions$decodeZoomKey = function (key) {
	switch (key) {
		case 'in':
			return $author$project$Msg$ZoomIn;
		case 'out':
			return $author$project$Msg$ZoomOut;
		case 'reset':
			return $author$project$Msg$ZoomReset;
		default:
			return $author$project$Msg$NoOp;
	}
};
var $author$project$Ports$deleteUserResult = _Platform_incomingPort('deleteUserResult', $elm$json$Json$Decode$value);
var $author$project$Ports$disconnectResult = _Platform_incomingPort('disconnectResult', $elm$json$Json$Decode$value);
var $author$project$Ports$escapePressed = _Platform_incomingPort(
	'escapePressed',
	$elm$json$Json$Decode$null(0));
var $elm$time$Time$Every = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $elm$time$Time$State = F2(
	function (taggers, processes) {
		return {ca: processes, cM: taggers};
	});
var $elm$time$Time$init = $elm$core$Task$succeed(
	A2($elm$time$Time$State, $elm$core$Dict$empty, $elm$core$Dict$empty));
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === -2) {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1) {
					case 0:
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 1:
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $elm$core$Dict$Black = 1;
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: -1, a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = 0;
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === -1) && (!right.a)) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === -1) && (!left.a)) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					0,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, 1, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 1, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === -1) && (!left.a)) && (left.d.$ === -1)) && (!left.d.a)) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					0,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, 1, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 1, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === -2) {
			return A5($elm$core$Dict$RBNode_elm_builtin, 0, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1) {
				case 0:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 1:
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === -1) && (!_v0.a)) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, 1, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$time$Time$addMySub = F2(
	function (_v0, state) {
		var interval = _v0.a;
		var tagger = _v0.b;
		var _v1 = A2($elm$core$Dict$get, interval, state);
		if (_v1.$ === 1) {
			return A3(
				$elm$core$Dict$insert,
				interval,
				_List_fromArray(
					[tagger]),
				state);
		} else {
			var taggers = _v1.a;
			return A3(
				$elm$core$Dict$insert,
				interval,
				A2($elm$core$List$cons, tagger, taggers),
				state);
		}
	});
var $elm$core$Process$kill = _Scheduler_kill;
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === -2) {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$core$Dict$merge = F6(
	function (leftStep, bothStep, rightStep, leftDict, rightDict, initialResult) {
		var stepState = F3(
			function (rKey, rValue, _v0) {
				stepState:
				while (true) {
					var list = _v0.a;
					var result = _v0.b;
					if (!list.b) {
						return _Utils_Tuple2(
							list,
							A3(rightStep, rKey, rValue, result));
					} else {
						var _v2 = list.a;
						var lKey = _v2.a;
						var lValue = _v2.b;
						var rest = list.b;
						if (_Utils_cmp(lKey, rKey) < 0) {
							var $temp$rKey = rKey,
								$temp$rValue = rValue,
								$temp$_v0 = _Utils_Tuple2(
								rest,
								A3(leftStep, lKey, lValue, result));
							rKey = $temp$rKey;
							rValue = $temp$rValue;
							_v0 = $temp$_v0;
							continue stepState;
						} else {
							if (_Utils_cmp(lKey, rKey) > 0) {
								return _Utils_Tuple2(
									list,
									A3(rightStep, rKey, rValue, result));
							} else {
								return _Utils_Tuple2(
									rest,
									A4(bothStep, lKey, lValue, rValue, result));
							}
						}
					}
				}
			});
		var _v3 = A3(
			$elm$core$Dict$foldl,
			stepState,
			_Utils_Tuple2(
				$elm$core$Dict$toList(leftDict),
				initialResult),
			rightDict);
		var leftovers = _v3.a;
		var intermediateResult = _v3.b;
		return A3(
			$elm$core$List$foldl,
			F2(
				function (_v4, result) {
					var k = _v4.a;
					var v = _v4.b;
					return A3(leftStep, k, v, result);
				}),
			intermediateResult,
			leftovers);
	});
var $elm$core$Platform$sendToSelf = _Platform_sendToSelf;
var $elm$time$Time$Name = function (a) {
	return {$: 0, a: a};
};
var $elm$time$Time$Offset = function (a) {
	return {$: 1, a: a};
};
var $elm$time$Time$Zone = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $elm$time$Time$customZone = $elm$time$Time$Zone;
var $elm$time$Time$setInterval = _Time_setInterval;
var $elm$core$Process$spawn = _Scheduler_spawn;
var $elm$time$Time$spawnHelp = F3(
	function (router, intervals, processes) {
		if (!intervals.b) {
			return $elm$core$Task$succeed(processes);
		} else {
			var interval = intervals.a;
			var rest = intervals.b;
			var spawnTimer = $elm$core$Process$spawn(
				A2(
					$elm$time$Time$setInterval,
					interval,
					A2($elm$core$Platform$sendToSelf, router, interval)));
			var spawnRest = function (id) {
				return A3(
					$elm$time$Time$spawnHelp,
					router,
					rest,
					A3($elm$core$Dict$insert, interval, id, processes));
			};
			return A2($elm$core$Task$andThen, spawnRest, spawnTimer);
		}
	});
var $elm$time$Time$onEffects = F3(
	function (router, subs, _v0) {
		var processes = _v0.ca;
		var rightStep = F3(
			function (_v6, id, _v7) {
				var spawns = _v7.a;
				var existing = _v7.b;
				var kills = _v7.c;
				return _Utils_Tuple3(
					spawns,
					existing,
					A2(
						$elm$core$Task$andThen,
						function (_v5) {
							return kills;
						},
						$elm$core$Process$kill(id)));
			});
		var newTaggers = A3($elm$core$List$foldl, $elm$time$Time$addMySub, $elm$core$Dict$empty, subs);
		var leftStep = F3(
			function (interval, taggers, _v4) {
				var spawns = _v4.a;
				var existing = _v4.b;
				var kills = _v4.c;
				return _Utils_Tuple3(
					A2($elm$core$List$cons, interval, spawns),
					existing,
					kills);
			});
		var bothStep = F4(
			function (interval, taggers, id, _v3) {
				var spawns = _v3.a;
				var existing = _v3.b;
				var kills = _v3.c;
				return _Utils_Tuple3(
					spawns,
					A3($elm$core$Dict$insert, interval, id, existing),
					kills);
			});
		var _v1 = A6(
			$elm$core$Dict$merge,
			leftStep,
			bothStep,
			rightStep,
			newTaggers,
			processes,
			_Utils_Tuple3(
				_List_Nil,
				$elm$core$Dict$empty,
				$elm$core$Task$succeed(0)));
		var spawnList = _v1.a;
		var existingDict = _v1.b;
		var killTask = _v1.c;
		return A2(
			$elm$core$Task$andThen,
			function (newProcesses) {
				return $elm$core$Task$succeed(
					A2($elm$time$Time$State, newTaggers, newProcesses));
			},
			A2(
				$elm$core$Task$andThen,
				function (_v2) {
					return A3($elm$time$Time$spawnHelp, router, spawnList, existingDict);
				},
				killTask));
	});
var $elm$time$Time$Posix = $elm$core$Basics$identity;
var $elm$time$Time$millisToPosix = $elm$core$Basics$identity;
var $elm$time$Time$now = _Time_now($elm$time$Time$millisToPosix);
var $elm$time$Time$onSelfMsg = F3(
	function (router, interval, state) {
		var _v0 = A2($elm$core$Dict$get, interval, state.cM);
		if (_v0.$ === 1) {
			return $elm$core$Task$succeed(state);
		} else {
			var taggers = _v0.a;
			var tellTaggers = function (time) {
				return $elm$core$Task$sequence(
					A2(
						$elm$core$List$map,
						function (tagger) {
							return A2(
								$elm$core$Platform$sendToApp,
								router,
								tagger(time));
						},
						taggers));
			};
			return A2(
				$elm$core$Task$andThen,
				function (_v1) {
					return $elm$core$Task$succeed(state);
				},
				A2($elm$core$Task$andThen, tellTaggers, $elm$time$Time$now));
		}
	});
var $elm$core$Basics$composeL = F3(
	function (g, f, x) {
		return g(
			f(x));
	});
var $elm$time$Time$subMap = F2(
	function (f, _v0) {
		var interval = _v0.a;
		var tagger = _v0.b;
		return A2(
			$elm$time$Time$Every,
			interval,
			A2($elm$core$Basics$composeL, f, tagger));
	});
_Platform_effectManagers['Time'] = _Platform_createManager($elm$time$Time$init, $elm$time$Time$onEffects, $elm$time$Time$onSelfMsg, 0, $elm$time$Time$subMap);
var $elm$time$Time$subscription = _Platform_leaf('Time');
var $elm$time$Time$every = F2(
	function (interval, tagger) {
		return $elm$time$Time$subscription(
			A2($elm$time$Time$Every, interval, tagger));
	});
var $elm$json$Json$Decode$float = _Json_decodeFloat;
var $author$project$Ports$gameStarted = _Platform_incomingPort('gameStarted', $elm$json$Json$Decode$value);
var $author$project$Ports$hasStarsExeResult = _Platform_incomingPort('hasStarsExeResult', $elm$json$Json$Decode$value);
var $author$project$Ports$historicBackupDownloaded = _Platform_incomingPort('historicBackupDownloaded', $elm$json$Json$Decode$value);
var $author$project$Ports$invitationAccepted = _Platform_incomingPort('invitationAccepted', $elm$json$Json$Decode$value);
var $author$project$Ports$invitationDeclined = _Platform_incomingPort('invitationDeclined', $elm$json$Json$Decode$value);
var $author$project$Ports$invitationsReceived = _Platform_incomingPort('invitationsReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$inviteResult = _Platform_incomingPort('inviteResult', $elm$json$Json$Decode$value);
var $author$project$Ports$latestTurnReceived = _Platform_incomingPort('latestTurnReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$launchStarsResult = _Platform_incomingPort('launchStarsResult', $elm$json$Json$Decode$value);
var $author$project$Ports$mapGenerated = _Platform_incomingPort('mapGenerated', $elm$json$Json$Decode$value);
var $author$project$Ports$mapSaved = _Platform_incomingPort('mapSaved', $elm$json$Json$Decode$value);
var $author$project$Ports$memberPromoted = _Platform_incomingPort('memberPromoted', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationInvitation = _Platform_incomingPort('notificationInvitation', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationOrderStatus = _Platform_incomingPort('notificationOrderStatus', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationPendingRegistration = _Platform_incomingPort('notificationPendingRegistration', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationPlayerRace = _Platform_incomingPort('notificationPlayerRace', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationRace = _Platform_incomingPort('notificationRace', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationRuleset = _Platform_incomingPort('notificationRuleset', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationSession = _Platform_incomingPort('notificationSession', $elm$json$Json$Decode$value);
var $author$project$Ports$notificationSessionTurn = _Platform_incomingPort('notificationSessionTurn', $elm$json$Json$Decode$value);
var $author$project$Api$Decode$ntvdmCheckResult = A5(
	$elm$json$Json$Decode$map4,
	F4(
		function (a, i, m, h) {
			return {c2: a, dI: h, dS: i, bM: m};
		}),
	A2($elm$json$Json$Decode$field, 'available', $elm$json$Json$Decode$bool),
	A2($elm$json$Json$Decode$field, 'is64Bit', $elm$json$Json$Decode$bool),
	A2($elm$json$Json$Decode$field, 'message', $elm$json$Json$Decode$string),
	$elm$json$Json$Decode$maybe(
		A2($elm$json$Json$Decode$field, 'helpUrl', $elm$json$Json$Decode$string)));
var $author$project$Ports$ntvdmChecked = _Platform_incomingPort('ntvdmChecked', $elm$json$Json$Decode$value);
var $elm$browser$Browser$Events$Document = 0;
var $elm$browser$Browser$Events$MySub = F3(
	function (a, b, c) {
		return {$: 0, a: a, b: b, c: c};
	});
var $elm$browser$Browser$Events$State = F2(
	function (subs, pids) {
		return {b5: pids, cK: subs};
	});
var $elm$browser$Browser$Events$init = $elm$core$Task$succeed(
	A2($elm$browser$Browser$Events$State, _List_Nil, $elm$core$Dict$empty));
var $elm$browser$Browser$Events$nodeToKey = function (node) {
	if (!node) {
		return 'd_';
	} else {
		return 'w_';
	}
};
var $elm$browser$Browser$Events$addKey = function (sub) {
	var node = sub.a;
	var name = sub.b;
	return _Utils_Tuple2(
		_Utils_ap(
			$elm$browser$Browser$Events$nodeToKey(node),
			name),
		sub);
};
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $elm$browser$Browser$Events$Event = F2(
	function (key, event) {
		return {bl: event, bG: key};
	});
var $elm$browser$Browser$Events$spawn = F3(
	function (router, key, _v0) {
		var node = _v0.a;
		var name = _v0.b;
		var actualNode = function () {
			if (!node) {
				return _Browser_doc;
			} else {
				return _Browser_window;
			}
		}();
		return A2(
			$elm$core$Task$map,
			function (value) {
				return _Utils_Tuple2(key, value);
			},
			A3(
				_Browser_on,
				actualNode,
				name,
				function (event) {
					return A2(
						$elm$core$Platform$sendToSelf,
						router,
						A2($elm$browser$Browser$Events$Event, key, event));
				}));
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $elm$browser$Browser$Events$onEffects = F3(
	function (router, subs, state) {
		var stepRight = F3(
			function (key, sub, _v6) {
				var deads = _v6.a;
				var lives = _v6.b;
				var news = _v6.c;
				return _Utils_Tuple3(
					deads,
					lives,
					A2(
						$elm$core$List$cons,
						A3($elm$browser$Browser$Events$spawn, router, key, sub),
						news));
			});
		var stepLeft = F3(
			function (_v4, pid, _v5) {
				var deads = _v5.a;
				var lives = _v5.b;
				var news = _v5.c;
				return _Utils_Tuple3(
					A2($elm$core$List$cons, pid, deads),
					lives,
					news);
			});
		var stepBoth = F4(
			function (key, pid, _v2, _v3) {
				var deads = _v3.a;
				var lives = _v3.b;
				var news = _v3.c;
				return _Utils_Tuple3(
					deads,
					A3($elm$core$Dict$insert, key, pid, lives),
					news);
			});
		var newSubs = A2($elm$core$List$map, $elm$browser$Browser$Events$addKey, subs);
		var _v0 = A6(
			$elm$core$Dict$merge,
			stepLeft,
			stepBoth,
			stepRight,
			state.b5,
			$elm$core$Dict$fromList(newSubs),
			_Utils_Tuple3(_List_Nil, $elm$core$Dict$empty, _List_Nil));
		var deadPids = _v0.a;
		var livePids = _v0.b;
		var makeNewPids = _v0.c;
		return A2(
			$elm$core$Task$andThen,
			function (pids) {
				return $elm$core$Task$succeed(
					A2(
						$elm$browser$Browser$Events$State,
						newSubs,
						A2(
							$elm$core$Dict$union,
							livePids,
							$elm$core$Dict$fromList(pids))));
			},
			A2(
				$elm$core$Task$andThen,
				function (_v1) {
					return $elm$core$Task$sequence(makeNewPids);
				},
				$elm$core$Task$sequence(
					A2($elm$core$List$map, $elm$core$Process$kill, deadPids))));
	});
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (!_v0.$) {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $elm$browser$Browser$Events$onSelfMsg = F3(
	function (router, _v0, state) {
		var key = _v0.bG;
		var event = _v0.bl;
		var toMessage = function (_v2) {
			var subKey = _v2.a;
			var _v3 = _v2.b;
			var node = _v3.a;
			var name = _v3.b;
			var decoder = _v3.c;
			return _Utils_eq(subKey, key) ? A2(_Browser_decodeEvent, decoder, event) : $elm$core$Maybe$Nothing;
		};
		var messages = A2($elm$core$List$filterMap, toMessage, state.cK);
		return A2(
			$elm$core$Task$andThen,
			function (_v1) {
				return $elm$core$Task$succeed(state);
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Platform$sendToApp(router),
					messages)));
	});
var $elm$browser$Browser$Events$subMap = F2(
	function (func, _v0) {
		var node = _v0.a;
		var name = _v0.b;
		var decoder = _v0.c;
		return A3(
			$elm$browser$Browser$Events$MySub,
			node,
			name,
			A2($elm$json$Json$Decode$map, func, decoder));
	});
_Platform_effectManagers['Browser.Events'] = _Platform_createManager($elm$browser$Browser$Events$init, $elm$browser$Browser$Events$onEffects, $elm$browser$Browser$Events$onSelfMsg, 0, $elm$browser$Browser$Events$subMap);
var $elm$browser$Browser$Events$subscription = _Platform_leaf('Browser.Events');
var $elm$browser$Browser$Events$on = F3(
	function (node, name, decoder) {
		return $elm$browser$Browser$Events$subscription(
			A3($elm$browser$Browser$Events$MySub, node, name, decoder));
	});
var $elm$browser$Browser$Events$onMouseMove = A2($elm$browser$Browser$Events$on, 0, 'mousemove');
var $elm$browser$Browser$Events$onMouseUp = A2($elm$browser$Browser$Events$on, 0, 'mouseup');
var $author$project$Ports$orderConflictReceived = _Platform_incomingPort('orderConflictReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$ordersStatusReceived = _Platform_incomingPort('ordersStatusReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$pendingRegistrationsReceived = _Platform_incomingPort('pendingRegistrationsReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$playerReadyResult = _Platform_incomingPort('playerReadyResult', $elm$json$Json$Decode$value);
var $author$project$Ports$playersReordered = _Platform_incomingPort('playersReordered', $elm$json$Json$Decode$value);
var $author$project$Ports$raceBuilderSaved = _Platform_incomingPort('raceBuilderSaved', $elm$json$Json$Decode$value);
var $author$project$Ports$raceBuilderValidation = _Platform_incomingPort('raceBuilderValidation', $elm$json$Json$Decode$value);
var $author$project$Model$RaceConfig = function (singularName) {
	return function (pluralName) {
		return function (password) {
			return function (icon) {
				return function (prt) {
					return function (lrt) {
						return function (gravityCenter) {
							return function (gravityWidth) {
								return function (gravityImmune) {
									return function (temperatureCenter) {
										return function (temperatureWidth) {
											return function (temperatureImmune) {
												return function (radiationCenter) {
													return function (radiationWidth) {
														return function (radiationImmune) {
															return function (growthRate) {
																return function (colonistsPerResource) {
																	return function (factoryOutput) {
																		return function (factoryCost) {
																			return function (factoryCount) {
																				return function (factoriesUseLessGerm) {
																					return function (mineOutput) {
																						return function (mineCost) {
																							return function (mineCount) {
																								return function (researchEnergy) {
																									return function (researchWeapons) {
																										return function (researchPropulsion) {
																											return function (researchConstruction) {
																												return function (researchElectronics) {
																													return function (researchBiotech) {
																														return function (techsStartHigh) {
																															return function (leftoverPointsOn) {
																																return {da: colonistsPerResource, du: factoriesUseLessGerm, dv: factoryCost, dw: factoryCount, dx: factoryOutput, dB: gravityCenter, dC: gravityImmune, dD: gravityWidth, dE: growthRate, dK: icon, d$: leftoverPointsOn, d0: lrt, d5: mineCost, d6: mineCount, d7: mineOutput, er: password, ew: pluralName, ex: prt, eA: radiationCenter, eB: radiationImmune, eC: radiationWidth, eH: researchBiotech, eI: researchConstruction, eJ: researchElectronics, eK: researchEnergy, eL: researchPropulsion, eM: researchWeapons, e3: singularName, fb: techsStartHigh, fc: temperatureCenter, fd: temperatureImmune, fe: temperatureWidth};
																															};
																														};
																													};
																												};
																											};
																										};
																									};
																								};
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
};
var $author$project$Api$Decode$raceConfig = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'leftoverPointsOn',
	$elm$json$Json$Decode$int,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'techsStartHigh',
		$elm$json$Json$Decode$bool,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'researchBiotech',
			$elm$json$Json$Decode$int,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'researchElectronics',
				$elm$json$Json$Decode$int,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'researchConstruction',
					$elm$json$Json$Decode$int,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'researchPropulsion',
						$elm$json$Json$Decode$int,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'researchWeapons',
							$elm$json$Json$Decode$int,
							A3(
								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
								'researchEnergy',
								$elm$json$Json$Decode$int,
								A3(
									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
									'mineCount',
									$elm$json$Json$Decode$int,
									A3(
										$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
										'mineCost',
										$elm$json$Json$Decode$int,
										A3(
											$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
											'mineOutput',
											$elm$json$Json$Decode$int,
											A3(
												$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
												'factoriesUseLessGerm',
												$elm$json$Json$Decode$bool,
												A3(
													$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
													'factoryCount',
													$elm$json$Json$Decode$int,
													A3(
														$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
														'factoryCost',
														$elm$json$Json$Decode$int,
														A3(
															$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
															'factoryOutput',
															$elm$json$Json$Decode$int,
															A3(
																$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																'colonistsPerResource',
																$elm$json$Json$Decode$int,
																A3(
																	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																	'growthRate',
																	$elm$json$Json$Decode$int,
																	A3(
																		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																		'radiationImmune',
																		$elm$json$Json$Decode$bool,
																		A3(
																			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																			'radiationWidth',
																			$elm$json$Json$Decode$int,
																			A3(
																				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																				'radiationCenter',
																				$elm$json$Json$Decode$int,
																				A3(
																					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																					'temperatureImmune',
																					$elm$json$Json$Decode$bool,
																					A3(
																						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																						'temperatureWidth',
																						$elm$json$Json$Decode$int,
																						A3(
																							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																							'temperatureCenter',
																							$elm$json$Json$Decode$int,
																							A3(
																								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																								'gravityImmune',
																								$elm$json$Json$Decode$bool,
																								A3(
																									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																									'gravityWidth',
																									$elm$json$Json$Decode$int,
																									A3(
																										$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																										'gravityCenter',
																										$elm$json$Json$Decode$int,
																										A4(
																											$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																											'lrt',
																											$elm$json$Json$Decode$list($elm$json$Json$Decode$int),
																											_List_Nil,
																											A3(
																												$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																												'prt',
																												$elm$json$Json$Decode$int,
																												A3(
																													$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																													'icon',
																													$elm$json$Json$Decode$int,
																													A4(
																														$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
																														'password',
																														$elm$json$Json$Decode$string,
																														'',
																														A3(
																															$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																															'pluralName',
																															$elm$json$Json$Decode$string,
																															A3(
																																$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
																																'singularName',
																																$elm$json$Json$Decode$string,
																																$elm$json$Json$Decode$succeed($author$project$Model$RaceConfig)))))))))))))))))))))))))))))))));
var $author$project$Ports$raceDeleted = _Platform_incomingPort('raceDeleted', $elm$json$Json$Decode$value);
var $author$project$Ports$raceDownloaded = _Platform_incomingPort('raceDownloaded', $elm$json$Json$Decode$value);
var $author$project$Ports$raceFileConfigLoaded = _Platform_incomingPort('raceFileConfigLoaded', $elm$json$Json$Decode$value);
var $author$project$Api$Decode$raceList = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			$elm$json$Json$Decode$list($author$project$Api$Decode$race),
			$elm$json$Json$Decode$null(_List_Nil)
		]));
var $author$project$Ports$raceTemplateReceived = _Platform_incomingPort('raceTemplateReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$raceUploaded = _Platform_incomingPort('raceUploaded', $elm$json$Json$Decode$value);
var $author$project$Model$RaceValidation = F7(
	function (points, isValid, errors, warnings, habitability, prtInfos, lrtInfos) {
		return {bk: errors, by: habitability, bF: isValid, bL: lrtInfos, b7: points, cc: prtInfos, cW: warnings};
	});
var $author$project$Model$HabitabilityDisplay = function (gravityMin) {
	return function (gravityMax) {
		return function (gravityRange) {
			return function (gravityImmune) {
				return function (temperatureMin) {
					return function (temperatureMax) {
						return function (temperatureRange) {
							return function (temperatureImmune) {
								return function (radiationMin) {
									return function (radiationMax) {
										return function (radiationRange) {
											return function (radiationImmune) {
												return {dC: gravityImmune, bv: gravityMax, bw: gravityMin, bx: gravityRange, eB: radiationImmune, cf: radiationMax, cg: radiationMin, ch: radiationRange, fd: temperatureImmune, cN: temperatureMax, cO: temperatureMin, cP: temperatureRange};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
};
var $author$project$Api$Decode$habitabilityDisplay = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'radiationImmune',
	$elm$json$Json$Decode$bool,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'radiationRange',
		$elm$json$Json$Decode$string,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'radiationMax',
			$elm$json$Json$Decode$string,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'radiationMin',
				$elm$json$Json$Decode$string,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'temperatureImmune',
					$elm$json$Json$Decode$bool,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'temperatureRange',
						$elm$json$Json$Decode$string,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'temperatureMax',
							$elm$json$Json$Decode$string,
							A3(
								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
								'temperatureMin',
								$elm$json$Json$Decode$string,
								A3(
									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
									'gravityImmune',
									$elm$json$Json$Decode$bool,
									A3(
										$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
										'gravityRange',
										$elm$json$Json$Decode$string,
										A3(
											$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
											'gravityMax',
											$elm$json$Json$Decode$string,
											A3(
												$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
												'gravityMin',
												$elm$json$Json$Decode$string,
												$elm$json$Json$Decode$succeed($author$project$Model$HabitabilityDisplay)))))))))))));
var $author$project$Model$LRTInfo = F5(
	function (index, code, name, desc, pointCost) {
		return {a6: code, bf: desc, bB: index, ea: name, b6: pointCost};
	});
var $author$project$Api$Decode$lrtInfo = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'pointCost',
	$elm$json$Json$Decode$int,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'desc',
		$elm$json$Json$Decode$string,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'name',
			$elm$json$Json$Decode$string,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'code',
				$elm$json$Json$Decode$string,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'index',
					$elm$json$Json$Decode$int,
					$elm$json$Json$Decode$succeed($author$project$Model$LRTInfo))))));
var $author$project$Model$PRTInfo = F5(
	function (index, code, name, desc, pointCost) {
		return {a6: code, bf: desc, bB: index, ea: name, b6: pointCost};
	});
var $author$project$Api$Decode$prtInfo = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'pointCost',
	$elm$json$Json$Decode$int,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'desc',
		$elm$json$Json$Decode$string,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'name',
			$elm$json$Json$Decode$string,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'code',
				$elm$json$Json$Decode$string,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'index',
					$elm$json$Json$Decode$int,
					$elm$json$Json$Decode$succeed($author$project$Model$PRTInfo))))));
var $author$project$Model$RaceValidationError = F2(
	function (field, message) {
		return {dz: field, bM: message};
	});
var $author$project$Api$Decode$raceValidationError = A3(
	$elm$json$Json$Decode$map2,
	$author$project$Model$RaceValidationError,
	A2($elm$json$Json$Decode$field, 'field', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'message', $elm$json$Json$Decode$string));
var $author$project$Api$Decode$raceValidation = A4(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
	'lrtInfos',
	$elm$json$Json$Decode$list($author$project$Api$Decode$lrtInfo),
	_List_Nil,
	A4(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
		'prtInfos',
		$elm$json$Json$Decode$list($author$project$Api$Decode$prtInfo),
		_List_Nil,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'habitability',
			$author$project$Api$Decode$habitabilityDisplay,
			A4(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
				'warnings',
				$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
				_List_Nil,
				A4(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
					'errors',
					$elm$json$Json$Decode$list($author$project$Api$Decode$raceValidationError),
					_List_Nil,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'isValid',
						$elm$json$Json$Decode$bool,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'points',
							$elm$json$Json$Decode$int,
							$elm$json$Json$Decode$succeed($author$project$Model$RaceValidation))))))));
var $author$project$Ports$racesReceived = _Platform_incomingPort('racesReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$registerResult = _Platform_incomingPort('registerResult', $elm$json$Json$Decode$value);
var $author$project$Ports$rejectRegistrationResult = _Platform_incomingPort('rejectRegistrationResult', $elm$json$Json$Decode$value);
var $author$project$Ports$resetApikeyResult = _Platform_incomingPort('resetApikeyResult', $elm$json$Json$Decode$value);
var $author$project$Ports$rulesReceived = _Platform_incomingPort('rulesReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$rulesSet = _Platform_incomingPort('rulesSet', $elm$json$Json$Decode$value);
var $author$project$Ports$sentInvitationCanceled = _Platform_incomingPort('sentInvitationCanceled', $elm$json$Json$Decode$value);
var $author$project$Ports$sentInvitationsReceived = _Platform_incomingPort('sentInvitationsReceived', $elm$json$Json$Decode$value);
var $author$project$Api$Server$Server = F7(
	function (url, name, iconUrl, hasCredentials, defaultUsername, isConnected, order) {
		return {dd: defaultUsername, dF: hasCredentials, dL: iconUrl, dV: isConnected, ea: name, eq: order, fl: url};
	});
var $author$project$Api$Decode$server = A4(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
	'order',
	$elm$json$Json$Decode$int,
	0,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'isConnected',
		$elm$json$Json$Decode$bool,
		A4(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
			'defaultUsername',
			$elm$json$Json$Decode$maybe($elm$json$Json$Decode$string),
			$elm$core$Maybe$Nothing,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'hasCredentials',
				$elm$json$Json$Decode$bool,
				A4(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
					'iconUrl',
					$elm$json$Json$Decode$maybe($elm$json$Json$Decode$string),
					$elm$core$Maybe$Nothing,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'name',
						$elm$json$Json$Decode$string,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'url',
							$elm$json$Json$Decode$string,
							$elm$json$Json$Decode$succeed($author$project$Api$Server$Server))))))));
var $author$project$Ports$serverAdded = _Platform_incomingPort('serverAdded', $elm$json$Json$Decode$value);
var $author$project$Api$Decode$serverList = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			$elm$json$Json$Decode$list($author$project$Api$Decode$server),
			$elm$json$Json$Decode$null(_List_Nil)
		]));
var $author$project$Ports$serverRemoved = _Platform_incomingPort('serverRemoved', $elm$json$Json$Decode$value);
var $author$project$Ports$serverUpdated = _Platform_incomingPort('serverUpdated', $elm$json$Json$Decode$value);
var $author$project$Ports$serversDirSelected = _Platform_incomingPort('serversDirSelected', $elm$json$Json$Decode$value);
var $author$project$Ports$serversReceived = _Platform_incomingPort('serversReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$serversReordered = _Platform_incomingPort('serversReordered', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionBackupDownloaded = _Platform_incomingPort('sessionBackupDownloaded', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionCreated = _Platform_incomingPort('sessionCreated', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionDeleted = _Platform_incomingPort('sessionDeleted', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionJoined = _Platform_incomingPort('sessionJoined', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionPlayerRaceReceived = _Platform_incomingPort('sessionPlayerRaceReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionQuit = _Platform_incomingPort('sessionQuit', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionRaceSet = _Platform_incomingPort('sessionRaceSet', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionReceived = _Platform_incomingPort('sessionReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionsReceived = _Platform_incomingPort('sessionsReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$sessionsUpdated = _Platform_incomingPort('sessionsUpdated', $elm$json$Json$Decode$string);
var $author$project$Ports$turnReceived = _Platform_incomingPort('turnReceived', $elm$json$Json$Decode$value);
var $author$project$Ports$uploadAndSetSessionRaceResult = _Platform_incomingPort('uploadAndSetSessionRaceResult', $elm$json$Json$Decode$value);
var $author$project$Ports$useWineSet = _Platform_incomingPort('useWineSet', $elm$json$Json$Decode$value);
var $author$project$Api$UserProfile$UserProfile = F6(
	function (id, nickname, email, isActive, isManager, message) {
		return {dp: email, dM: id, dT: isActive, dW: isManager, bM: message, ee: nickname};
	});
var $author$project$Api$Decode$userProfile = A4(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
	'message',
	$elm$json$Json$Decode$maybe($elm$json$Json$Decode$string),
	$elm$core$Maybe$Nothing,
	A4(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
		'isManager',
		$elm$json$Json$Decode$bool,
		false,
		A4(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$optional,
			'isActive',
			$elm$json$Json$Decode$bool,
			true,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'email',
				$elm$json$Json$Decode$string,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'nickname',
					$elm$json$Json$Decode$string,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'id',
						$elm$json$Json$Decode$string,
						$elm$json$Json$Decode$succeed($author$project$Api$UserProfile$UserProfile)))))));
var $author$project$Api$Decode$userProfileList = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			$elm$json$Json$Decode$list($author$project$Api$Decode$userProfile),
			$elm$json$Json$Decode$null(_List_Nil)
		]));
var $author$project$Ports$userProfilesReceived = _Platform_incomingPort('userProfilesReceived', $elm$json$Json$Decode$value);
var $author$project$Api$Decode$wineCheckResult = A3(
	$elm$json$Json$Decode$map2,
	F2(
		function (v, m) {
			return {bM: m, fp: v};
		}),
	A2($elm$json$Json$Decode$field, 'valid', $elm$json$Json$Decode$bool),
	A2($elm$json$Json$Decode$field, 'message', $elm$json$Json$Decode$string));
var $author$project$Ports$wineInstallChecked = _Platform_incomingPort('wineInstallChecked', $elm$json$Json$Decode$value);
var $author$project$Ports$winePrefixesDirSelected = _Platform_incomingPort('winePrefixesDirSelected', $elm$json$Json$Decode$value);
var $author$project$Ports$zoomKeyPressed = _Platform_incomingPort('zoomKeyPressed', $elm$json$Json$Decode$string);
var $author$project$Ports$zoomLevelSet = _Platform_incomingPort('zoomLevelSet', $elm$json$Json$Decode$value);
var $author$project$Subscriptions$subscriptions = function (model) {
	var serverDragSubs = function () {
		var _v6 = model.cv;
		if (!_v6.$) {
			return _List_fromArray(
				[
					$elm$browser$Browser$Events$onMouseMove(
					A2(
						$elm$json$Json$Decode$map,
						$author$project$Msg$ServerDragMove,
						A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float))),
					$elm$browser$Browser$Events$onMouseUp(
					$elm$json$Json$Decode$succeed($author$project$Msg$ServerDragEnd))
				]);
		} else {
			return _List_Nil;
		}
	}();
	var playerDragSubs = function () {
		var _v4 = model.cx;
		if (!_v4.$) {
			var detail = _v4.a;
			var _v5 = detail.dj;
			if (!_v5.$) {
				return _List_fromArray(
					[
						$elm$browser$Browser$Events$onMouseMove(
						A3(
							$elm$json$Json$Decode$map2,
							$author$project$Msg$MouseMoveWhileDragging,
							A2($elm$json$Json$Decode$field, 'clientX', $elm$json$Json$Decode$float),
							A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float))),
						$elm$browser$Browser$Events$onMouseUp(
						$elm$json$Json$Decode$succeed($author$project$Msg$MouseUpEndDrag))
					]);
			} else {
				return _List_Nil;
			}
		} else {
			return _List_Nil;
		}
	}();
	var habButtonSubs = function () {
		var _v1 = model.bg;
		if ((!_v1.$) && (_v1.a.$ === 10)) {
			var form = _v1.a.a;
			var _v2 = form.bz;
			if (!_v2.$) {
				return _List_fromArray(
					[
						A2(
						$elm$time$Time$every,
						100,
						function (_v3) {
							return $author$project$Msg$HabButtonTick;
						})
					]);
			} else {
				return _List_Nil;
			}
		} else {
			return _List_Nil;
		}
	}();
	return $elm$core$Platform$Sub$batch(
		_Utils_ap(
			playerDragSubs,
			_Utils_ap(
				serverDragSubs,
				_Utils_ap(
					habButtonSubs,
					_List_fromArray(
						[
							$author$project$Ports$serversReceived(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$serverList, $author$project$Msg$GotServers)),
							$author$project$Ports$serverAdded(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$server, $author$project$Msg$ServerAdded)),
							$author$project$Ports$serverUpdated(
							A2(
								$author$project$Subscriptions$decodeResult,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$ServerUpdated)),
							$author$project$Ports$serverRemoved(
							A2(
								$author$project$Subscriptions$decodeResult,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$ServerRemoved)),
							$author$project$Ports$connectResult($author$project$Subscriptions$decodeConnectResult),
							$author$project$Ports$disconnectResult($author$project$Subscriptions$decodeDisconnectResult),
							$author$project$Ports$registerResult($author$project$Subscriptions$decodeRegisterResult),
							$author$project$Ports$createUserResult($author$project$Subscriptions$decodeCreateUserResult),
							$author$project$Ports$deleteUserResult($author$project$Subscriptions$decodeDeleteUserResult),
							$author$project$Ports$pendingRegistrationsReceived($author$project$Subscriptions$decodePendingRegistrationsReceived),
							$author$project$Ports$approveRegistrationResult($author$project$Subscriptions$decodeApproveRegistrationResult),
							$author$project$Ports$rejectRegistrationResult($author$project$Subscriptions$decodeRejectRegistrationResult),
							$author$project$Ports$sessionsReceived($author$project$Subscriptions$decodeSessionsReceived),
							$author$project$Ports$sessionReceived($author$project$Subscriptions$decodeSessionReceived),
							$author$project$Ports$sessionCreated(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$session, $author$project$Msg$SessionCreated)),
							$author$project$Ports$sessionJoined(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$session, $author$project$Msg$SessionJoined)),
							$author$project$Ports$sessionDeleted(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$SessionDeleted)),
							$author$project$Ports$sessionQuit(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$SessionQuitResult)),
							$author$project$Ports$memberPromoted(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$MemberPromoted)),
							$author$project$Ports$userProfilesReceived(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$userProfileList, $author$project$Msg$GotUserProfiles)),
							$author$project$Ports$inviteResult(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$InviteResult)),
							$author$project$Ports$invitationsReceived($author$project$Subscriptions$decodeInvitationsReceived),
							$author$project$Ports$sentInvitationsReceived($author$project$Subscriptions$decodeSentInvitationsReceived),
							$author$project$Ports$invitationAccepted(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$session, $author$project$Msg$InvitationAccepted)),
							$author$project$Ports$invitationDeclined(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$InvitationDeclined)),
							$author$project$Ports$sentInvitationCanceled(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$SentInvitationCanceled)),
							$author$project$Ports$racesReceived(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$raceList, $author$project$Msg$GotRaces)),
							$author$project$Ports$raceUploaded(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$race, $author$project$Msg$RaceUploaded)),
							$author$project$Ports$raceDownloaded(
							A2(
								$author$project$Subscriptions$decodeResult,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$RaceDownloaded)),
							$author$project$Ports$raceDeleted(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$RaceDeleted)),
							$author$project$Ports$sessionRaceSet(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$SetupRaceResult)),
							$author$project$Ports$uploadAndSetSessionRaceResult(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$SetupRaceResult)),
							$author$project$Ports$playerReadyResult(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$PlayerReadyResult)),
							$author$project$Ports$sessionPlayerRaceReceived($author$project$Subscriptions$decodeSessionPlayerRace),
							$author$project$Ports$raceBuilderValidation(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$raceValidation, $author$project$Msg$RaceBuilderValidationReceived)),
							$author$project$Ports$raceTemplateReceived(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$raceConfig, $author$project$Msg$RaceTemplateLoaded)),
							$author$project$Ports$raceBuilderSaved(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$race, $author$project$Msg$RaceBuilderSaved)),
							$author$project$Ports$raceFileConfigLoaded(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$raceConfig, $author$project$Msg$RaceFileLoaded)),
							$author$project$Ports$rulesReceived($author$project$Subscriptions$decodeRulesReceived),
							$author$project$Ports$rulesSet(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $author$project$Api$Decode$rules, $author$project$Msg$RulesSet)),
							$author$project$Ports$gameStarted(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$GameStarted)),
							$author$project$Ports$playersReordered(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$PlayersReordered)),
							$author$project$Ports$serversReordered(
							A2(
								$author$project$Subscriptions$decodeResult,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$ServersReordered)),
							$author$project$Ports$sessionsUpdated($author$project$Msg$SessionsUpdated),
							$author$project$Ports$connectionChanged($author$project$Subscriptions$decodeConnectionChanged),
							$author$project$Ports$orderConflictReceived($author$project$Subscriptions$decodeOrderConflict),
							$author$project$Ports$notificationSession(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationSession)),
							$author$project$Ports$notificationInvitation(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationInvitation)),
							$author$project$Ports$notificationRace(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationRace)),
							$author$project$Ports$notificationRuleset(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationRuleset)),
							$author$project$Ports$notificationPlayerRace(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationPlayerRace)),
							$author$project$Ports$notificationSessionTurn($author$project$Subscriptions$decodeSessionTurnNotification),
							$author$project$Ports$notificationOrderStatus(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationOrderStatus)),
							$author$project$Ports$notificationPendingRegistration(
							$author$project$Subscriptions$decodeNotification($author$project$Msg$NotificationPendingRegistration)),
							$author$project$Ports$turnReceived($author$project$Subscriptions$decodeTurnReceived),
							$author$project$Ports$latestTurnReceived($author$project$Subscriptions$decodeLatestTurnReceived),
							$author$project$Ports$ordersStatusReceived($author$project$Subscriptions$decodeOrdersStatusReceived),
							$author$project$Ports$appSettingsReceived(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$appSettings, $author$project$Msg$GotAppSettings)),
							$author$project$Ports$serversDirSelected(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$appSettings, $author$project$Msg$ServersDirSelected)),
							$author$project$Ports$autoDownloadStarsSet(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$appSettings, $author$project$Msg$AutoDownloadStarsSet)),
							$author$project$Ports$zoomLevelSet(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$appSettings, $author$project$Msg$ZoomLevelSet)),
							$author$project$Ports$useWineSet(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$appSettings, $author$project$Msg$UseWineSet)),
							$author$project$Ports$winePrefixesDirSelected(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$appSettings, $author$project$Msg$WinePrefixesDirSelected)),
							$author$project$Ports$wineInstallChecked(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$wineCheckResult, $author$project$Msg$WineInstallChecked)),
							$author$project$Ports$ntvdmChecked(
							A2($author$project$Subscriptions$decodeResult, $author$project$Api$Decode$ntvdmCheckResult, $author$project$Msg$NtvdmChecked)),
							$author$project$Ports$mapGenerated(
							A2($author$project$Subscriptions$decodeResult, $elm$json$Json$Decode$string, $author$project$Msg$MapGenerated)),
							$author$project$Ports$mapSaved(
							A2(
								$author$project$Subscriptions$decodeResult,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$MapSaved)),
							$author$project$Ports$zoomKeyPressed($author$project$Subscriptions$decodeZoomKey),
							$author$project$Ports$resetApikeyResult(
							A2($author$project$Subscriptions$decodeResult, $elm$json$Json$Decode$string, $author$project$Msg$ResetApikeyResult)),
							$author$project$Ports$changeApikeyResult(
							A2($author$project$Subscriptions$decodeResult, $elm$json$Json$Decode$string, $author$project$Msg$ChangeApikeyResult)),
							$author$project$Ports$apiKeyReceived(
							A2($author$project$Subscriptions$decodeResultWithServerUrl, $elm$json$Json$Decode$string, $author$project$Msg$GotApiKey)),
							$author$project$Ports$launchStarsResult(
							A2(
								$author$project$Subscriptions$decodeResult,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$LaunchStarsResult)),
							$author$project$Ports$hasStarsExeResult(
							A2(
								$author$project$Subscriptions$decodeResult,
								A4(
									$elm$json$Json$Decode$map3,
									F3(
										function (serverUrl, sessionId, hasStarsExe) {
											return {dG: hasStarsExe, eS: serverUrl, eV: sessionId};
										}),
									A2($elm$json$Json$Decode$field, 'serverUrl', $elm$json$Json$Decode$string),
									A2($elm$json$Json$Decode$field, 'sessionId', $elm$json$Json$Decode$string),
									A2($elm$json$Json$Decode$field, 'hasStarsExe', $elm$json$Json$Decode$bool)),
								$author$project$Msg$GotHasStarsExe)),
							$author$project$Ports$sessionBackupDownloaded(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$SessionBackupDownloaded)),
							$author$project$Ports$historicBackupDownloaded(
							A2(
								$author$project$Subscriptions$decodeResultWithServerUrl,
								$elm$json$Json$Decode$succeed(0),
								$author$project$Msg$HistoricBackupDownloaded)),
							$author$project$Ports$escapePressed(
							function (_v0) {
								return $author$project$Msg$EscapePressed;
							})
						])))));
};
var $author$project$Model$AddServerDialog = function (a) {
	return {$: 0, a: a};
};
var $author$project$Model$ApproveComplete = F2(
	function (a, b) {
		return {$: 4, a: a, b: b};
	});
var $author$project$Model$ApproveError = F2(
	function (a, b) {
		return {$: 5, a: a, b: b};
	});
var $author$project$Model$ApprovingUser = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$Model$ChangeApikeyDialog = function (a) {
	return {$: 16, a: a};
};
var $author$project$Model$ChangeComplete = function (a) {
	return {$: 2, a: a};
};
var $author$project$Model$ChangingApikey = {$: 1};
var $author$project$Model$ConfirmingApprove = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$ConfirmingChange = {$: 0};
var $author$project$Model$ConfirmingDelete = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Model$ConfirmingReject = F2(
	function (a, b) {
		return {$: 6, a: a, b: b};
	});
var $author$project$Model$ConfirmingReset = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Model$ConnectDialog = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$Model$Connected = function (a) {
	return {$: 2, a: a};
};
var $author$project$Model$Connecting = {$: 1};
var $author$project$Model$ConnectionError = function (a) {
	return {$: 3, a: a};
};
var $author$project$Model$CreateSessionDialog = function (a) {
	return {$: 5, a: a};
};
var $author$project$Model$CreateUserDialog = function (a) {
	return {$: 15, a: a};
};
var $author$project$Model$DeleteError = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$Model$DeletingUser = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$Disconnected = {$: 0};
var $author$project$Model$EditMode = {$: 0};
var $author$project$Model$EditServerDialog = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Model$FromRacesDialog = {$: 0};
var $author$project$Msg$GotFetchEndTime = F3(
	function (a, b, c) {
		return {$: 34, a: a, b: b, c: c};
	});
var $author$project$Msg$GotFetchStartTime = F2(
	function (a, b) {
		return {$: 33, a: a, b: b};
	});
var $author$project$Model$IdentityTab = 0;
var $author$project$Model$InvitationsDialog = {$: 7};
var $author$project$Model$InviteUserDialog = function (a) {
	return {$: 6, a: a};
};
var $author$project$Model$MapViewerDialog = function (a) {
	return {$: 17, a: a};
};
var $author$project$Model$NoDelete = {$: 0};
var $author$project$Model$NoPendingAction = {$: 0};
var $author$project$Model$NoReset = {$: 0};
var $author$project$Model$PendingPane = 1;
var $author$project$Model$RaceBuilderDialog = function (a) {
	return {$: 10, a: a};
};
var $author$project$Model$RacesDialog = function (a) {
	return {$: 8, a: a};
};
var $author$project$Model$RegisterDialog = F2(
	function (a, b) {
		return {$: 4, a: a, b: b};
	});
var $author$project$Model$RejectError = F2(
	function (a, b) {
		return {$: 8, a: a, b: b};
	});
var $author$project$Model$RejectingUser = F2(
	function (a, b) {
		return {$: 7, a: a, b: b};
	});
var $author$project$Model$RemoveServerDialog = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$ResetComplete = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$Model$ResettingApikey = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$RulesDialog = function (a) {
	return {$: 11, a: a};
};
var $author$project$Model$SettingsDialog = {$: 13};
var $author$project$Model$SetupRaceDialog = function (a) {
	return {$: 9, a: a};
};
var $author$project$Model$TurnFilesDialog = function (a) {
	return {$: 12, a: a};
};
var $author$project$Model$UsersListDialog = function (a) {
	return {$: 14, a: a};
};
var $author$project$Model$UsersPane = 0;
var $author$project$Model$ViewMode = function (a) {
	return {$: 1, a: a};
};
var $author$project$Model$ViewingMessage = F3(
	function (a, b, c) {
		return {$: 1, a: a, b: b, c: c};
	});
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(0),
			pairs));
};
var $elm$json$Json$Encode$string = _Json_wrap;
var $author$project$Api$Encode$acceptInvitation = F2(
	function (serverUrl, invitationId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'invitationId',
					$elm$json$Json$Encode$string(invitationId))
				]));
	});
var $author$project$Ports$acceptInvitation = _Platform_outgoingPort('acceptInvitation', $elm$core$Basics$identity);
var $author$project$Api$Encode$addServer = F2(
	function (name, url) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'name',
					$elm$json$Json$Encode$string(name)),
					_Utils_Tuple2(
					'url',
					$elm$json$Json$Encode$string(url))
				]));
	});
var $author$project$Ports$addServer = _Platform_outgoingPort('addServer', $elm$core$Basics$identity);
var $elm$core$Maybe$andThen = F2(
	function (callback, maybeValue) {
		if (!maybeValue.$) {
			var value = maybeValue.a;
			return callback(value);
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $author$project$Api$Encode$approveRegistration = F2(
	function (serverUrl, userId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'userId',
					$elm$json$Json$Encode$string(userId))
				]));
	});
var $author$project$Ports$approveRegistration = _Platform_outgoingPort('approveRegistration', $elm$core$Basics$identity);
var $author$project$Ports$autoConnect = _Platform_outgoingPort('autoConnect', $elm$json$Json$Encode$string);
var $elm$json$Json$Encode$bool = _Json_wrap;
var $elm$json$Json$Encode$int = _Json_wrap;
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(0),
				entries));
	});
var $author$project$Api$Encode$encodeRaceConfig = function (config) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'singularName',
				$elm$json$Json$Encode$string(config.e3)),
				_Utils_Tuple2(
				'pluralName',
				$elm$json$Json$Encode$string(config.ew)),
				_Utils_Tuple2(
				'password',
				$elm$json$Json$Encode$string(config.er)),
				_Utils_Tuple2(
				'icon',
				$elm$json$Json$Encode$int(config.dK)),
				_Utils_Tuple2(
				'prt',
				$elm$json$Json$Encode$int(config.ex)),
				_Utils_Tuple2(
				'lrt',
				A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$int, config.d0)),
				_Utils_Tuple2(
				'gravityCenter',
				$elm$json$Json$Encode$int(config.dB)),
				_Utils_Tuple2(
				'gravityWidth',
				$elm$json$Json$Encode$int(config.dD)),
				_Utils_Tuple2(
				'gravityImmune',
				$elm$json$Json$Encode$bool(config.dC)),
				_Utils_Tuple2(
				'temperatureCenter',
				$elm$json$Json$Encode$int(config.fc)),
				_Utils_Tuple2(
				'temperatureWidth',
				$elm$json$Json$Encode$int(config.fe)),
				_Utils_Tuple2(
				'temperatureImmune',
				$elm$json$Json$Encode$bool(config.fd)),
				_Utils_Tuple2(
				'radiationCenter',
				$elm$json$Json$Encode$int(config.eA)),
				_Utils_Tuple2(
				'radiationWidth',
				$elm$json$Json$Encode$int(config.eC)),
				_Utils_Tuple2(
				'radiationImmune',
				$elm$json$Json$Encode$bool(config.eB)),
				_Utils_Tuple2(
				'growthRate',
				$elm$json$Json$Encode$int(config.dE)),
				_Utils_Tuple2(
				'colonistsPerResource',
				$elm$json$Json$Encode$int(config.da)),
				_Utils_Tuple2(
				'factoryOutput',
				$elm$json$Json$Encode$int(config.dx)),
				_Utils_Tuple2(
				'factoryCost',
				$elm$json$Json$Encode$int(config.dv)),
				_Utils_Tuple2(
				'factoryCount',
				$elm$json$Json$Encode$int(config.dw)),
				_Utils_Tuple2(
				'factoriesUseLessGerm',
				$elm$json$Json$Encode$bool(config.du)),
				_Utils_Tuple2(
				'mineOutput',
				$elm$json$Json$Encode$int(config.d7)),
				_Utils_Tuple2(
				'mineCost',
				$elm$json$Json$Encode$int(config.d5)),
				_Utils_Tuple2(
				'mineCount',
				$elm$json$Json$Encode$int(config.d6)),
				_Utils_Tuple2(
				'researchEnergy',
				$elm$json$Json$Encode$int(config.eK)),
				_Utils_Tuple2(
				'researchWeapons',
				$elm$json$Json$Encode$int(config.eM)),
				_Utils_Tuple2(
				'researchPropulsion',
				$elm$json$Json$Encode$int(config.eL)),
				_Utils_Tuple2(
				'researchConstruction',
				$elm$json$Json$Encode$int(config.eI)),
				_Utils_Tuple2(
				'researchElectronics',
				$elm$json$Json$Encode$int(config.eJ)),
				_Utils_Tuple2(
				'researchBiotech',
				$elm$json$Json$Encode$int(config.eH)),
				_Utils_Tuple2(
				'techsStartHigh',
				$elm$json$Json$Encode$bool(config.fb)),
				_Utils_Tuple2(
				'leftoverPointsOn',
				$elm$json$Json$Encode$int(config.d$))
			]));
};
var $author$project$Api$Encode$buildAndSaveRace = F3(
	function (serverUrl, config, maybeSessionId) {
		return $elm$json$Json$Encode$object(
			_Utils_ap(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'serverUrl',
						$elm$json$Json$Encode$string(serverUrl)),
						_Utils_Tuple2(
						'config',
						$author$project$Api$Encode$encodeRaceConfig(config))
					]),
				function () {
					if (!maybeSessionId.$) {
						var sessionId = maybeSessionId.a;
						return _List_fromArray(
							[
								_Utils_Tuple2(
								'sessionId',
								$elm$json$Json$Encode$string(sessionId))
							]);
					} else {
						return _List_Nil;
					}
				}()));
	});
var $author$project$Ports$buildAndSaveRace = _Platform_outgoingPort('buildAndSaveRace', $elm$core$Basics$identity);
var $author$project$Api$Encode$cancelSentInvitation = F2(
	function (serverUrl, invitationId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'invitationId',
					$elm$json$Json$Encode$string(invitationId))
				]));
	});
var $author$project$Ports$cancelSentInvitation = _Platform_outgoingPort('cancelSentInvitation', $elm$core$Basics$identity);
var $author$project$Ports$changeMyApikey = _Platform_outgoingPort('changeMyApikey', $elm$json$Json$Encode$string);
var $author$project$Api$Encode$checkHasStarsExe = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$checkHasStarsExe = _Platform_outgoingPort('checkHasStarsExe', $elm$core$Basics$identity);
var $author$project$Ports$checkNtvdmSupport = _Platform_outgoingPort(
	'checkNtvdmSupport',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Ports$checkWineInstall = _Platform_outgoingPort(
	'checkWineInstall',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $elm$core$Basics$clamp = F3(
	function (low, high, number) {
		return (_Utils_cmp(number, low) < 0) ? low : ((_Utils_cmp(number, high) > 0) ? high : number);
	});
var $author$project$Ports$clearSelection = _Platform_outgoingPort(
	'clearSelection',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Api$Encode$connect = F3(
	function (serverUrl, username, password) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'username',
					$elm$json$Json$Encode$string(username)),
					_Utils_Tuple2(
					'password',
					$elm$json$Json$Encode$string(password))
				]));
	});
var $author$project$Ports$connect = _Platform_outgoingPort('connect', $elm$core$Basics$identity);
var $author$project$Ports$copyToClipboard = _Platform_outgoingPort('copyToClipboard', $elm$json$Json$Encode$string);
var $author$project$Api$Encode$createSession = F3(
	function (serverUrl, name, isPublic) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'name',
					$elm$json$Json$Encode$string(name)),
					_Utils_Tuple2(
					'isPublic',
					$elm$json$Json$Encode$bool(isPublic))
				]));
	});
var $author$project$Ports$createSession = _Platform_outgoingPort('createSession', $elm$core$Basics$identity);
var $author$project$Api$Encode$createUser = F3(
	function (serverUrl, nickname, email) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'nickname',
					$elm$json$Json$Encode$string(nickname)),
					_Utils_Tuple2(
					'email',
					$elm$json$Json$Encode$string(email))
				]));
	});
var $author$project$Ports$createUser = _Platform_outgoingPort('createUser', $elm$core$Basics$identity);
var $author$project$Api$Encode$declineInvitation = F2(
	function (serverUrl, invitationId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'invitationId',
					$elm$json$Json$Encode$string(invitationId))
				]));
	});
var $author$project$Ports$declineInvitation = _Platform_outgoingPort('declineInvitation', $elm$core$Basics$identity);
var $author$project$Model$defaultRaceConfig = {da: 1000, du: false, dv: 10, dw: 10, dx: 10, dB: 50, dC: false, dD: 35, dE: 15, dK: 1, d$: 0, d0: _List_Nil, d5: 5, d6: 10, d7: 10, er: '', ew: 'Humanoids', ex: 9, eA: 50, eB: false, eC: 35, eH: 1, eI: 1, eJ: 1, eK: 1, eL: 1, eM: 1, e3: 'Humanoid', fb: false, fc: 50, fd: false, fe: 35};
var $author$project$Api$Rules$defaultRules = {c_: false, db: false, de: 1, dA: false, d2: false, ef: false, ey: false, eD: $elm$core$Maybe$Nothing, e4: false, e6: 1, fj: 1, fr: true, fs: 4, ft: 22, fu: true, fv: 100, fw: false, fx: 11000, fy: false, fz: 100, fA: false, fB: 100, fC: 50, fD: false, fE: 100, fF: true, fG: 60, fH: 1};
var $author$project$Ports$deleteRace = _Platform_outgoingPort('deleteRace', $elm$core$Basics$identity);
var $author$project$Ports$deleteSession = _Platform_outgoingPort('deleteSession', $elm$core$Basics$identity);
var $author$project$Api$Encode$deleteUser = F2(
	function (serverUrl, userId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'userId',
					$elm$json$Json$Encode$string(userId))
				]));
	});
var $author$project$Ports$deleteUser = _Platform_outgoingPort('deleteUser', $elm$core$Basics$identity);
var $author$project$Ports$disconnect = _Platform_outgoingPort('disconnect', $elm$json$Json$Encode$string);
var $author$project$Ports$downloadHistoricBackup = _Platform_outgoingPort('downloadHistoricBackup', $elm$core$Basics$identity);
var $author$project$Ports$downloadRace = _Platform_outgoingPort('downloadRace', $elm$core$Basics$identity);
var $author$project$Ports$downloadSessionBackup = _Platform_outgoingPort('downloadSessionBackup', $elm$core$Basics$identity);
var $elm$core$Set$Set_elm_builtin = $elm$core$Basics$identity;
var $elm$core$Set$empty = $elm$core$Dict$empty;
var $author$project$Model$emptyConnectForm = {c: $elm$core$Maybe$Nothing, er: '', j: false, aZ: ''};
var $author$project$Model$emptyCreateUserForm = {ba: $elm$core$Maybe$Nothing, dp: '', c: $elm$core$Maybe$Nothing, ee: '', j: false};
var $author$project$Model$emptyHabitabilityDisplay = {dC: false, bv: '', bw: '', bx: '', eB: false, cf: '', cg: '', ch: '', fd: false, cN: '', cO: '', cP: ''};
var $author$project$Model$emptyInviteForm = function (sessionId) {
	return {c: $elm$core$Maybe$Nothing, ct: $elm$core$Maybe$Nothing, eV: sessionId, j: false};
};
var $author$project$Model$defaultMapOptions = {dH: 768, eX: 4, eY: true, e_: true, e$: true, e0: false, e1: true, e2: true, fJ: 1024};
var $author$project$Model$emptyMapViewerForm = F4(
	function (sessionId, year, raceName, playerNumber) {
		return {c: $elm$core$Maybe$Nothing, bq: $elm$core$Maybe$Nothing, br: false, bX: $author$project$Model$defaultMapOptions, ay: playerNumber, az: raceName, cn: false, eV: sessionId, fO: year};
	});
var $author$project$Model$emptyRaceBuilderForm = function (origin) {
	return {
		a$: 0,
		a7: $author$project$Model$defaultRaceConfig,
		c: $elm$core$Maybe$Nothing,
		bz: $elm$core$Maybe$Nothing,
		I: false,
		bN: $author$project$Model$EditMode,
		b_: origin,
		cs: 'humanoid',
		j: false,
		cU: {bk: _List_Nil, by: $author$project$Model$emptyHabitabilityDisplay, bF: false, bL: _List_Nil, b7: 0, cc: _List_Nil, cW: _List_Nil}
	};
};
var $author$project$Model$emptyRegisterForm = {dp: '', c: $elm$core$Maybe$Nothing, bM: '', ee: '', j: false, cL: false};
var $author$project$Model$emptyServerData = {aH: $author$project$Model$Disconnected, bm: $elm$core$Maybe$Nothing, bn: false, bD: _List_Nil, bJ: $elm$core$Maybe$Nothing, bK: $elm$core$Maybe$Nothing, bY: $elm$core$Dict$empty, b2: 0, ce: _List_Nil, cu: _List_Nil, cz: $elm$core$Dict$empty, cA: $elm$core$Dict$empty, cB: $elm$core$Dict$empty, cC: $elm$core$Dict$empty, cD: $elm$core$Dict$empty, cE: _List_Nil, cS: _List_Nil};
var $author$project$Model$emptyServerForm = {c: $elm$core$Maybe$Nothing, ea: '', b$: $elm$core$Maybe$Nothing, j: false, fl: ''};
var $author$project$Model$emptySetupRaceForm = function (sessionId) {
	return {c: $elm$core$Maybe$Nothing, cq: $elm$core$Maybe$Nothing, eV: sessionId, j: false};
};
var $author$project$Model$emptyTurnFilesForm = F5(
	function (sessionId, year, raceName, playerNumber, isLatest) {
		return {c: $elm$core$Maybe$Nothing, bE: isLatest, I: true, bZ: $elm$core$Maybe$Nothing, ay: playerNumber, az: raceName, eV: sessionId, cR: $elm$core$Maybe$Nothing, fO: year};
	});
var $author$project$Model$emptyUsersListState = F2(
	function (currentUserId, users) {
		return {a_: 0, bb: currentUserId, be: $author$project$Model$NoDelete, bo: '', b1: $author$project$Model$NoPendingAction, b3: _List_Nil, ck: $author$project$Model$NoReset, cT: users};
	});
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $author$project$Api$Encode$encodeMapOptions = function (options) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'width',
				$elm$json$Json$Encode$int(options.fJ)),
				_Utils_Tuple2(
				'height',
				$elm$json$Json$Encode$int(options.dH)),
				_Utils_Tuple2(
				'showNames',
				$elm$json$Json$Encode$bool(options.e0)),
				_Utils_Tuple2(
				'showFleets',
				$elm$json$Json$Encode$bool(options.eY)),
				_Utils_Tuple2(
				'showFleetPaths',
				$elm$json$Json$Encode$int(options.eX)),
				_Utils_Tuple2(
				'showMines',
				$elm$json$Json$Encode$bool(options.e$)),
				_Utils_Tuple2(
				'showWormholes',
				$elm$json$Json$Encode$bool(options.e2)),
				_Utils_Tuple2(
				'showLegend',
				$elm$json$Json$Encode$bool(options.e_)),
				_Utils_Tuple2(
				'showScannerCoverage',
				$elm$json$Json$Encode$bool(options.e1))
			]));
};
var $author$project$Api$Encode$generateMap = F5(
	function (serverUrl, sessionId, year, options, turnFiles) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId)),
					_Utils_Tuple2(
					'year',
					$elm$json$Json$Encode$int(year)),
					_Utils_Tuple2(
					'options',
					$author$project$Api$Encode$encodeMapOptions(options)),
					_Utils_Tuple2(
					'universeB64',
					$elm$json$Json$Encode$string(turnFiles.fi)),
					_Utils_Tuple2(
					'turnB64',
					$elm$json$Json$Encode$string(turnFiles.fg))
				]));
	});
var $author$project$Ports$generateMap = _Platform_outgoingPort('generateMap', $elm$core$Basics$identity);
var $author$project$Ports$getApiKey = _Platform_outgoingPort('getApiKey', $elm$json$Json$Encode$string);
var $author$project$Ports$getAppSettings = _Platform_outgoingPort(
	'getAppSettings',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (!maybe.$) {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $author$project$Model$getServerData = F2(
	function (serverUrl, data) {
		return A2(
			$elm$core$Maybe$withDefault,
			$author$project$Model$emptyServerData,
			A2($elm$core$Dict$get, serverUrl, data));
	});
var $author$project$Model$getConnectionState = F2(
	function (serverUrl, data) {
		return A2($author$project$Model$getServerData, serverUrl, data).aH;
	});
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (!maybe.$) {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Model$getCurrentServerData = function (model) {
	return A2(
		$elm$core$Maybe$withDefault,
		$author$project$Model$emptyServerData,
		A2(
			$elm$core$Maybe$map,
			function (url) {
				return A2($author$project$Model$getServerData, url, model.aT);
			},
			model.aS));
};
var $author$project$Ports$getInvitations = _Platform_outgoingPort('getInvitations', $elm$json$Json$Encode$string);
var $author$project$Api$Encode$getLatestTurn = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$getLatestTurn = _Platform_outgoingPort('getLatestTurn', $elm$core$Basics$identity);
var $author$project$Api$Encode$getOrdersStatus = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$getOrdersStatus = _Platform_outgoingPort('getOrdersStatus', $elm$core$Basics$identity);
var $author$project$Ports$getPendingRegistrations = _Platform_outgoingPort('getPendingRegistrations', $elm$json$Json$Encode$string);
var $author$project$Api$Encode$getRaceTemplate = F2(
	function (serverUrl, templateName) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'templateName',
					$elm$json$Json$Encode$string(templateName))
				]));
	});
var $author$project$Ports$getRaceTemplate = _Platform_outgoingPort('getRaceTemplate', $elm$core$Basics$identity);
var $author$project$Ports$getRaces = _Platform_outgoingPort('getRaces', $elm$json$Json$Encode$string);
var $author$project$Api$Encode$getRules = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$getRules = _Platform_outgoingPort('getRules', $elm$core$Basics$identity);
var $author$project$Ports$getSentInvitations = _Platform_outgoingPort('getSentInvitations', $elm$json$Json$Encode$string);
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Model$getServerByUrl = F2(
	function (url, servers) {
		return $elm$core$List$head(
			A2(
				$elm$core$List$filter,
				function (s) {
					return _Utils_eq(s.fl, url);
				},
				servers));
	});
var $author$project$Api$Encode$getSession = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$getSession = _Platform_outgoingPort('getSession', $elm$core$Basics$identity);
var $author$project$Model$getSessionById = F2(
	function (id, sessions) {
		return $elm$core$List$head(
			A2(
				$elm$core$List$filter,
				function (s) {
					return _Utils_eq(s.dM, id);
				},
				sessions));
	});
var $author$project$Api$Encode$getSessionPlayerRace = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$getSessionPlayerRace = _Platform_outgoingPort('getSessionPlayerRace', $elm$core$Basics$identity);
var $author$project$Ports$getSessions = _Platform_outgoingPort('getSessions', $elm$json$Json$Encode$string);
var $author$project$Api$Encode$getTurn = F4(
	function (serverUrl, sessionId, year, saveToGameDir) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId)),
					_Utils_Tuple2(
					'year',
					$elm$json$Json$Encode$int(year)),
					_Utils_Tuple2(
					'saveToGameDir',
					$elm$json$Json$Encode$bool(saveToGameDir))
				]));
	});
var $author$project$Ports$getTurn = _Platform_outgoingPort('getTurn', $elm$core$Basics$identity);
var $author$project$Ports$getUserProfiles = _Platform_outgoingPort('getUserProfiles', $elm$json$Json$Encode$string);
var $elm$core$Set$insert = F2(
	function (key, _v0) {
		var dict = _v0;
		return A3($elm$core$Dict$insert, key, 0, dict);
	});
var $author$project$Ports$inviteUser = _Platform_outgoingPort('inviteUser', $elm$core$Basics$identity);
var $author$project$Model$isConnected = F2(
	function (serverUrl, data) {
		var _v0 = A2($author$project$Model$getConnectionState, serverUrl, data);
		if (_v0.$ === 2) {
			return true;
		} else {
			return false;
		}
	});
var $author$project$Api$Encode$joinSession = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$joinSession = _Platform_outgoingPort('joinSession', $elm$core$Basics$identity);
var $author$project$Api$Encode$launchStars = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$launchStars = _Platform_outgoingPort('launchStars', $elm$core$Basics$identity);
var $author$project$Api$Encode$loadRaceFileConfig = F2(
	function (serverUrl, raceId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'raceId',
					$elm$json$Json$Encode$string(raceId))
				]));
	});
var $author$project$Ports$loadRaceFileConfig = _Platform_outgoingPort('loadRaceFileConfig', $elm$core$Basics$identity);
var $elm$core$Dict$member = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$get, key, dict);
		if (!_v0.$) {
			return true;
		} else {
			return false;
		}
	});
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $elm$core$Basics$min = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) < 0) ? x : y;
	});
var $elm$core$List$drop = F2(
	function (n, list) {
		drop:
		while (true) {
			if (n <= 0) {
				return list;
			} else {
				if (!list.b) {
					return list;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs;
					n = $temp$n;
					list = $temp$list;
					continue drop;
				}
			}
		}
	});
var $elm$core$List$takeReverse = F3(
	function (n, list, kept) {
		takeReverse:
		while (true) {
			if (n <= 0) {
				return kept;
			} else {
				if (!list.b) {
					return kept;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs,
						$temp$kept = A2($elm$core$List$cons, x, kept);
					n = $temp$n;
					list = $temp$list;
					kept = $temp$kept;
					continue takeReverse;
				}
			}
		}
	});
var $elm$core$List$takeTailRec = F2(
	function (n, list) {
		return $elm$core$List$reverse(
			A3($elm$core$List$takeReverse, n, list, _List_Nil));
	});
var $elm$core$List$takeFast = F3(
	function (ctr, n, list) {
		if (n <= 0) {
			return _List_Nil;
		} else {
			var _v0 = _Utils_Tuple2(n, list);
			_v0$1:
			while (true) {
				_v0$5:
				while (true) {
					if (!_v0.b.b) {
						return list;
					} else {
						if (_v0.b.b.b) {
							switch (_v0.a) {
								case 1:
									break _v0$1;
								case 2:
									var _v2 = _v0.b;
									var x = _v2.a;
									var _v3 = _v2.b;
									var y = _v3.a;
									return _List_fromArray(
										[x, y]);
								case 3:
									if (_v0.b.b.b.b) {
										var _v4 = _v0.b;
										var x = _v4.a;
										var _v5 = _v4.b;
										var y = _v5.a;
										var _v6 = _v5.b;
										var z = _v6.a;
										return _List_fromArray(
											[x, y, z]);
									} else {
										break _v0$5;
									}
								default:
									if (_v0.b.b.b.b && _v0.b.b.b.b.b) {
										var _v7 = _v0.b;
										var x = _v7.a;
										var _v8 = _v7.b;
										var y = _v8.a;
										var _v9 = _v8.b;
										var z = _v9.a;
										var _v10 = _v9.b;
										var w = _v10.a;
										var tl = _v10.b;
										return (ctr > 1000) ? A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A2($elm$core$List$takeTailRec, n - 4, tl))))) : A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A3($elm$core$List$takeFast, ctr + 1, n - 4, tl)))));
									} else {
										break _v0$5;
									}
							}
						} else {
							if (_v0.a === 1) {
								break _v0$1;
							} else {
								break _v0$5;
							}
						}
					}
				}
				return list;
			}
			var _v1 = _v0.b;
			var x = _v1.a;
			return _List_fromArray(
				[x]);
		}
	});
var $elm$core$List$take = F2(
	function (n, list) {
		return A3($elm$core$List$takeFast, 0, n, list);
	});
var $author$project$Update$insertAt = F3(
	function (index, item, list) {
		return _Utils_ap(
			A2($elm$core$List$take, index, list),
			_Utils_ap(
				_List_fromArray(
					[item]),
				A2($elm$core$List$drop, index, list)));
	});
var $elm$core$Basics$neq = _Utils_notEqual;
var $elm$core$Tuple$second = function (_v0) {
	var y = _v0.b;
	return y;
};
var $author$project$Update$moveItem = F3(
	function (fromIndex, toIndex, list) {
		var item = $elm$core$List$head(
			A2($elm$core$List$drop, fromIndex, list));
		if (!item.$) {
			var movedItem = item.a;
			return A3(
				$author$project$Update$insertAt,
				toIndex,
				movedItem,
				A2(
					$elm$core$List$map,
					$elm$core$Tuple$second,
					A2(
						$elm$core$List$filter,
						function (_v1) {
							var i = _v1.a;
							return !_Utils_eq(i, fromIndex);
						},
						A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, list))));
		} else {
			return list;
		}
	});
var $elm$core$Basics$not = _Basics_not;
var $author$project$Api$Encode$openGameDir = F2(
	function (serverUrl, sessionId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId))
				]));
	});
var $author$project$Ports$openGameDir = _Platform_outgoingPort('openGameDir', $elm$core$Basics$identity);
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $author$project$Api$Encode$validateRaceConfig = F2(
	function (serverUrl, config) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'config',
					$author$project$Api$Encode$encodeRaceConfig(config))
				]));
	});
var $author$project$Ports$validateRaceConfig = _Platform_outgoingPort('validateRaceConfig', $elm$core$Basics$identity);
var $author$project$Update$updateRaceConfigAndValidate = F2(
	function (model, configUpdater) {
		var _v0 = _Utils_Tuple2(model.bg, model.aS);
		if (((!_v0.a.$) && (_v0.a.a.$ === 10)) && (!_v0.b.$)) {
			var form = _v0.a.a.a;
			var serverUrl = _v0.b.a;
			var newConfig = configUpdater(form.a7);
			var newForm = _Utils_update(
				form,
				{a7: newConfig, cs: 'custom'});
			return _Utils_Tuple2(
				_Utils_update(
					model,
					{
						bg: $elm$core$Maybe$Just(
							$author$project$Model$RaceBuilderDialog(newForm))
					}),
				$author$project$Ports$validateRaceConfig(
					A2($author$project$Api$Encode$validateRaceConfig, serverUrl, newConfig)));
		} else {
			return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
		}
	});
var $author$project$Update$performHabButtonAction = F2(
	function (model, btn) {
		var minWidth = 10;
		var maxWidth = 50;
		var clampCenter = F2(
			function (center, width) {
				return A3($elm$core$Basics$clamp, width, 100 - width, center);
			});
		var adjustWidth = F2(
			function (current, delta) {
				return A3($elm$core$Basics$clamp, minWidth, maxWidth, current + delta);
			});
		var adjustCenter = F3(
			function (center, width, delta) {
				return A2(clampCenter, center + delta, width);
			});
		switch (btn) {
			case 0:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						var newWidth = A2(adjustWidth, c.dD, 1);
						var newCenter = A2(clampCenter, c.dB, newWidth);
						return _Utils_update(
							c,
							{dB: newCenter, dD: newWidth});
					});
			case 1:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								dD: A2(adjustWidth, c.dD, -1)
							});
					});
			case 2:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								dB: A3(adjustCenter, c.dB, c.dD, -1)
							});
					});
			case 3:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								dB: A3(adjustCenter, c.dB, c.dD, 1)
							});
					});
			case 4:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						var newWidth = A2(adjustWidth, c.fe, 1);
						var newCenter = A2(clampCenter, c.fc, newWidth);
						return _Utils_update(
							c,
							{fc: newCenter, fe: newWidth});
					});
			case 5:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								fe: A2(adjustWidth, c.fe, -1)
							});
					});
			case 6:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								fc: A3(adjustCenter, c.fc, c.fe, -1)
							});
					});
			case 7:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								fc: A3(adjustCenter, c.fc, c.fe, 1)
							});
					});
			case 8:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						var newWidth = A2(adjustWidth, c.eC, 1);
						var newCenter = A2(clampCenter, c.eA, newWidth);
						return _Utils_update(
							c,
							{eA: newCenter, eC: newWidth});
					});
			case 9:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								eC: A2(adjustWidth, c.eC, -1)
							});
					});
			case 10:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								eA: A3(adjustCenter, c.eA, c.eC, -1)
							});
					});
			default:
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{
								eA: A3(adjustCenter, c.eA, c.eC, 1)
							});
					});
		}
	});
var $elm$time$Time$posixToMillis = function (_v0) {
	var millis = _v0;
	return millis;
};
var $author$project$Ports$promoteMember = _Platform_outgoingPort('promoteMember', $elm$core$Basics$identity);
var $author$project$Ports$quitSession = _Platform_outgoingPort('quitSession', $elm$core$Basics$identity);
var $author$project$Api$Encode$register = F4(
	function (serverUrl, nickname, email, message) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'nickname',
					$elm$json$Json$Encode$string(nickname)),
					_Utils_Tuple2(
					'email',
					$elm$json$Json$Encode$string(email)),
					_Utils_Tuple2(
					'message',
					$elm$json$Json$Encode$string(message))
				]));
	});
var $author$project$Ports$register = _Platform_outgoingPort('register', $elm$core$Basics$identity);
var $author$project$Api$Encode$rejectRegistration = F2(
	function (serverUrl, userId) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'userId',
					$elm$json$Json$Encode$string(userId))
				]));
	});
var $author$project$Ports$rejectRegistration = _Platform_outgoingPort('rejectRegistration', $elm$core$Basics$identity);
var $elm$core$Dict$getMin = function (dict) {
	getMin:
	while (true) {
		if ((dict.$ === -1) && (dict.d.$ === -1)) {
			var left = dict.d;
			var $temp$dict = left;
			dict = $temp$dict;
			continue getMin;
		} else {
			return dict;
		}
	}
};
var $elm$core$Dict$moveRedLeft = function (dict) {
	if (((dict.$ === -1) && (dict.d.$ === -1)) && (dict.e.$ === -1)) {
		if ((dict.e.d.$ === -1) && (!dict.e.d.a)) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var lLeft = _v1.d;
			var lRight = _v1.e;
			var _v2 = dict.e;
			var rClr = _v2.a;
			var rK = _v2.b;
			var rV = _v2.c;
			var rLeft = _v2.d;
			var _v3 = rLeft.a;
			var rlK = rLeft.b;
			var rlV = rLeft.c;
			var rlL = rLeft.d;
			var rlR = rLeft.e;
			var rRight = _v2.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				0,
				rlK,
				rlV,
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					rlL),
				A5($elm$core$Dict$RBNode_elm_builtin, 1, rK, rV, rlR, rRight));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v4 = dict.d;
			var lClr = _v4.a;
			var lK = _v4.b;
			var lV = _v4.c;
			var lLeft = _v4.d;
			var lRight = _v4.e;
			var _v5 = dict.e;
			var rClr = _v5.a;
			var rK = _v5.b;
			var rV = _v5.c;
			var rLeft = _v5.d;
			var rRight = _v5.e;
			if (clr === 1) {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$moveRedRight = function (dict) {
	if (((dict.$ === -1) && (dict.d.$ === -1)) && (dict.e.$ === -1)) {
		if ((dict.d.d.$ === -1) && (!dict.d.d.a)) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var _v2 = _v1.d;
			var _v3 = _v2.a;
			var llK = _v2.b;
			var llV = _v2.c;
			var llLeft = _v2.d;
			var llRight = _v2.e;
			var lRight = _v1.e;
			var _v4 = dict.e;
			var rClr = _v4.a;
			var rK = _v4.b;
			var rV = _v4.c;
			var rLeft = _v4.d;
			var rRight = _v4.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				0,
				lK,
				lV,
				A5($elm$core$Dict$RBNode_elm_builtin, 1, llK, llV, llLeft, llRight),
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					lRight,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight)));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v5 = dict.d;
			var lClr = _v5.a;
			var lK = _v5.b;
			var lV = _v5.c;
			var lLeft = _v5.d;
			var lRight = _v5.e;
			var _v6 = dict.e;
			var rClr = _v6.a;
			var rK = _v6.b;
			var rV = _v6.c;
			var rLeft = _v6.d;
			var rRight = _v6.e;
			if (clr === 1) {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$removeHelpPrepEQGT = F7(
	function (targetKey, dict, color, key, value, left, right) {
		if ((left.$ === -1) && (!left.a)) {
			var _v1 = left.a;
			var lK = left.b;
			var lV = left.c;
			var lLeft = left.d;
			var lRight = left.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				lK,
				lV,
				lLeft,
				A5($elm$core$Dict$RBNode_elm_builtin, 0, key, value, lRight, right));
		} else {
			_v2$2:
			while (true) {
				if ((right.$ === -1) && (right.a === 1)) {
					if (right.d.$ === -1) {
						if (right.d.a === 1) {
							var _v3 = right.a;
							var _v4 = right.d;
							var _v5 = _v4.a;
							return $elm$core$Dict$moveRedRight(dict);
						} else {
							break _v2$2;
						}
					} else {
						var _v6 = right.a;
						var _v7 = right.d;
						return $elm$core$Dict$moveRedRight(dict);
					}
				} else {
					break _v2$2;
				}
			}
			return dict;
		}
	});
var $elm$core$Dict$removeMin = function (dict) {
	if ((dict.$ === -1) && (dict.d.$ === -1)) {
		var color = dict.a;
		var key = dict.b;
		var value = dict.c;
		var left = dict.d;
		var lColor = left.a;
		var lLeft = left.d;
		var right = dict.e;
		if (lColor === 1) {
			if ((lLeft.$ === -1) && (!lLeft.a)) {
				var _v3 = lLeft.a;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					key,
					value,
					$elm$core$Dict$removeMin(left),
					right);
			} else {
				var _v4 = $elm$core$Dict$moveRedLeft(dict);
				if (_v4.$ === -1) {
					var nColor = _v4.a;
					var nKey = _v4.b;
					var nValue = _v4.c;
					var nLeft = _v4.d;
					var nRight = _v4.e;
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						$elm$core$Dict$removeMin(nLeft),
						nRight);
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			}
		} else {
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				value,
				$elm$core$Dict$removeMin(left),
				right);
		}
	} else {
		return $elm$core$Dict$RBEmpty_elm_builtin;
	}
};
var $elm$core$Dict$removeHelp = F2(
	function (targetKey, dict) {
		if (dict.$ === -2) {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_cmp(targetKey, key) < 0) {
				if ((left.$ === -1) && (left.a === 1)) {
					var _v4 = left.a;
					var lLeft = left.d;
					if ((lLeft.$ === -1) && (!lLeft.a)) {
						var _v6 = lLeft.a;
						return A5(
							$elm$core$Dict$RBNode_elm_builtin,
							color,
							key,
							value,
							A2($elm$core$Dict$removeHelp, targetKey, left),
							right);
					} else {
						var _v7 = $elm$core$Dict$moveRedLeft(dict);
						if (_v7.$ === -1) {
							var nColor = _v7.a;
							var nKey = _v7.b;
							var nValue = _v7.c;
							var nLeft = _v7.d;
							var nRight = _v7.e;
							return A5(
								$elm$core$Dict$balance,
								nColor,
								nKey,
								nValue,
								A2($elm$core$Dict$removeHelp, targetKey, nLeft),
								nRight);
						} else {
							return $elm$core$Dict$RBEmpty_elm_builtin;
						}
					}
				} else {
					return A5(
						$elm$core$Dict$RBNode_elm_builtin,
						color,
						key,
						value,
						A2($elm$core$Dict$removeHelp, targetKey, left),
						right);
				}
			} else {
				return A2(
					$elm$core$Dict$removeHelpEQGT,
					targetKey,
					A7($elm$core$Dict$removeHelpPrepEQGT, targetKey, dict, color, key, value, left, right));
			}
		}
	});
var $elm$core$Dict$removeHelpEQGT = F2(
	function (targetKey, dict) {
		if (dict.$ === -1) {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_eq(targetKey, key)) {
				var _v1 = $elm$core$Dict$getMin(right);
				if (_v1.$ === -1) {
					var minKey = _v1.b;
					var minValue = _v1.c;
					return A5(
						$elm$core$Dict$balance,
						color,
						minKey,
						minValue,
						left,
						$elm$core$Dict$removeMin(right));
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			} else {
				return A5(
					$elm$core$Dict$balance,
					color,
					key,
					value,
					left,
					A2($elm$core$Dict$removeHelp, targetKey, right));
			}
		} else {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		}
	});
var $elm$core$Dict$remove = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$removeHelp, key, dict);
		if ((_v0.$ === -1) && (!_v0.a)) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, 1, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $author$project$Ports$removeServer = _Platform_outgoingPort('removeServer', $elm$json$Json$Encode$string);
var $author$project$Model$updateServerData = F3(
	function (serverUrl, updater, data) {
		var current = A2($author$project$Model$getServerData, serverUrl, data);
		return A3(
			$elm$core$Dict$insert,
			serverUrl,
			updater(current),
			data);
	});
var $author$project$Update$removeSessionTurn = F4(
	function (serverUrl, sessionId, year, model) {
		return _Utils_update(
			model,
			{
				aT: A3(
					$author$project$Model$updateServerData,
					serverUrl,
					function (sd) {
						var currentTurns = A2(
							$elm$core$Maybe$withDefault,
							$elm$core$Dict$empty,
							A2($elm$core$Dict$get, sessionId, sd.cD));
						var newTurns = A2($elm$core$Dict$remove, year, currentTurns);
						return _Utils_update(
							sd,
							{
								cD: A3($elm$core$Dict$insert, sessionId, newTurns, sd.cD)
							});
					},
					model.aT)
			});
	});
var $author$project$Ports$reorderPlayers = _Platform_outgoingPort('reorderPlayers', $elm$core$Basics$identity);
var $author$project$Ports$reorderServers = _Platform_outgoingPort('reorderServers', $elm$core$Basics$identity);
var $author$project$Ports$requestFullscreen = _Platform_outgoingPort('requestFullscreen', $elm$json$Json$Encode$string);
var $author$project$Ports$resetUserApikey = _Platform_outgoingPort('resetUserApikey', $elm$core$Basics$identity);
var $author$project$Api$Encode$saveMap = F6(
	function (serverUrl, sessionId, year, raceName, playerNumber, svgContent) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId)),
					_Utils_Tuple2(
					'year',
					$elm$json$Json$Encode$int(year)),
					_Utils_Tuple2(
					'raceName',
					$elm$json$Json$Encode$string(raceName)),
					_Utils_Tuple2(
					'playerNumber',
					$elm$json$Json$Encode$int(playerNumber)),
					_Utils_Tuple2(
					'svgContent',
					$elm$json$Json$Encode$string(svgContent))
				]));
	});
var $author$project$Ports$saveMap = _Platform_outgoingPort('saveMap', $elm$core$Basics$identity);
var $author$project$Ports$selectServersDir = _Platform_outgoingPort(
	'selectServersDir',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Ports$selectWinePrefixesDir = _Platform_outgoingPort(
	'selectWinePrefixesDir',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Ports$setAutoDownloadStars = _Platform_outgoingPort('setAutoDownloadStars', $elm$json$Json$Encode$bool);
var $author$project$Update$setConnectionState = F3(
	function (serverUrl, state, model) {
		return _Utils_update(
			model,
			{
				aT: A3(
					$author$project$Model$updateServerData,
					serverUrl,
					function (sd) {
						return _Utils_update(
							sd,
							{aH: state});
					},
					model.aT)
			});
	});
var $author$project$Ports$setPlayerReady = _Platform_outgoingPort('setPlayerReady', $elm$core$Basics$identity);
var $author$project$Api$Encode$encodeMaybeInt = F2(
	function (key, maybeVal) {
		if (!maybeVal.$) {
			var val = maybeVal.a;
			return _List_fromArray(
				[
					_Utils_Tuple2(
					key,
					$elm$json$Json$Encode$int(val))
				]);
		} else {
			return _List_Nil;
		}
	});
var $author$project$Api$Encode$encodeRules = function (r) {
	return $elm$json$Json$Encode$object(
		_Utils_ap(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'universeSize',
					$elm$json$Json$Encode$int(r.fj)),
					_Utils_Tuple2(
					'density',
					$elm$json$Json$Encode$int(r.de)),
					_Utils_Tuple2(
					'startingDistance',
					$elm$json$Json$Encode$int(r.e6))
				]),
			_Utils_ap(
				A2($author$project$Api$Encode$encodeMaybeInt, 'randomSeed', r.eD),
				_List_fromArray(
					[
						_Utils_Tuple2(
						'maximumMinerals',
						$elm$json$Json$Encode$bool(r.d2)),
						_Utils_Tuple2(
						'slowerTechAdvances',
						$elm$json$Json$Encode$bool(r.e4)),
						_Utils_Tuple2(
						'acceleratedBbsPlay',
						$elm$json$Json$Encode$bool(r.c_)),
						_Utils_Tuple2(
						'noRandomEvents',
						$elm$json$Json$Encode$bool(r.ef)),
						_Utils_Tuple2(
						'computerPlayersFormAlliances',
						$elm$json$Json$Encode$bool(r.db)),
						_Utils_Tuple2(
						'publicPlayerScores',
						$elm$json$Json$Encode$bool(r.ey)),
						_Utils_Tuple2(
						'galaxyClumping',
						$elm$json$Json$Encode$bool(r.dA)),
						_Utils_Tuple2(
						'vcOwnsPercentOfPlanets',
						$elm$json$Json$Encode$bool(r.fF)),
						_Utils_Tuple2(
						'vcOwnsPercentOfPlanetsValue',
						$elm$json$Json$Encode$int(r.fG)),
						_Utils_Tuple2(
						'vcAttainTechInFields',
						$elm$json$Json$Encode$bool(r.fr)),
						_Utils_Tuple2(
						'vcAttainTechInFieldsTechValue',
						$elm$json$Json$Encode$int(r.ft)),
						_Utils_Tuple2(
						'vcAttainTechInFieldsFieldsValue',
						$elm$json$Json$Encode$int(r.fs)),
						_Utils_Tuple2(
						'vcExceedScoreOf',
						$elm$json$Json$Encode$bool(r.fw)),
						_Utils_Tuple2(
						'vcExceedScoreOfValue',
						$elm$json$Json$Encode$int(r.fx)),
						_Utils_Tuple2(
						'vcExceedNextPlayerScoreBy',
						$elm$json$Json$Encode$bool(r.fu)),
						_Utils_Tuple2(
						'vcExceedNextPlayerScoreByValue',
						$elm$json$Json$Encode$int(r.fv)),
						_Utils_Tuple2(
						'vcHasProductionCapacityOf',
						$elm$json$Json$Encode$bool(r.fy)),
						_Utils_Tuple2(
						'vcHasProductionCapacityOfValue',
						$elm$json$Json$Encode$int(r.fz)),
						_Utils_Tuple2(
						'vcOwnsCapitalShips',
						$elm$json$Json$Encode$bool(r.fD)),
						_Utils_Tuple2(
						'vcOwnsCapitalShipsValue',
						$elm$json$Json$Encode$int(r.fE)),
						_Utils_Tuple2(
						'vcHaveHighestScoreAfterYears',
						$elm$json$Json$Encode$bool(r.fA)),
						_Utils_Tuple2(
						'vcHaveHighestScoreAfterYearsValue',
						$elm$json$Json$Encode$int(r.fB)),
						_Utils_Tuple2(
						'vcWinnerMustMeet',
						$elm$json$Json$Encode$int(r.fH)),
						_Utils_Tuple2(
						'vcMinYearsBeforeWinner',
						$elm$json$Json$Encode$int(r.fC))
					]))));
};
var $author$project$Api$Encode$setRules = F3(
	function (serverUrl, sessionId, rulesData) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'serverUrl',
					$elm$json$Json$Encode$string(serverUrl)),
					_Utils_Tuple2(
					'sessionId',
					$elm$json$Json$Encode$string(sessionId)),
					_Utils_Tuple2(
					'rules',
					$author$project$Api$Encode$encodeRules(rulesData))
				]));
	});
var $author$project$Ports$setRules = _Platform_outgoingPort('setRules', $elm$core$Basics$identity);
var $author$project$Ports$setSessionRace = _Platform_outgoingPort('setSessionRace', $elm$core$Basics$identity);
var $author$project$Ports$setUseWine = _Platform_outgoingPort('setUseWine', $elm$json$Json$Encode$bool);
var $author$project$Ports$setZoomLevel = _Platform_outgoingPort('setZoomLevel', $elm$json$Json$Encode$int);
var $author$project$Ports$startGame = _Platform_outgoingPort('startGame', $elm$core$Basics$identity);
var $author$project$Update$storeSessionTurn = F4(
	function (serverUrl, sessionId, maybeTurnFiles, model) {
		return _Utils_update(
			model,
			{
				aT: A3(
					$author$project$Model$updateServerData,
					serverUrl,
					function (sd) {
						var currentTurns = A2(
							$elm$core$Maybe$withDefault,
							$elm$core$Dict$empty,
							A2($elm$core$Dict$get, sessionId, sd.cD));
						var newTurns = function () {
							if (!maybeTurnFiles.$) {
								var turnFiles = maybeTurnFiles.a;
								return A3($elm$core$Dict$insert, turnFiles.fO, turnFiles, currentTurns);
							} else {
								return currentTurns;
							}
						}();
						return _Utils_update(
							sd,
							{
								cD: A3($elm$core$Dict$insert, sessionId, newTurns, sd.cD)
							});
					},
					model.aT)
			});
	});
var $author$project$Update$updateConnectForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 3)) {
			var _v1 = _v0.a;
			var url = _v1.a;
			var form = _v1.b;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						A2(
							$author$project$Model$ConnectDialog,
							url,
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateCreateSessionForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 5)) {
			var form = _v0.a.a;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						$author$project$Model$CreateSessionDialog(
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateDialogError = F2(
	function (model, err) {
		var _v0 = model.bg;
		_v0$8:
		while (true) {
			if (!_v0.$) {
				switch (_v0.a.$) {
					case 0:
						var form = _v0.a.a;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$AddServerDialog(
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 1:
						var _v1 = _v0.a;
						var url = _v1.a;
						var form = _v1.b;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									A2(
										$author$project$Model$EditServerDialog,
										url,
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 3:
						var _v2 = _v0.a;
						var url = _v2.a;
						var form = _v2.b;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									A2(
										$author$project$Model$ConnectDialog,
										url,
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 4:
						var _v3 = _v0.a;
						var url = _v3.a;
						var form = _v3.b;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									A2(
										$author$project$Model$RegisterDialog,
										url,
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 5:
						var form = _v0.a.a;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$CreateSessionDialog(
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 6:
						var form = _v0.a.a;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$InviteUserDialog(
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 9:
						var form = _v0.a.a;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$SetupRaceDialog(
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					case 11:
						var form = _v0.a.a;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RulesDialog(
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											})))
							});
					default:
						break _v0$8;
				}
			} else {
				break _v0$8;
			}
		}
		return model;
	});
var $author$project$Update$updateInviteForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 6)) {
			var form = _v0.a.a;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						$author$project$Model$InviteUserDialog(
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateMapViewerForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 17)) {
			var form = _v0.a.a;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						$author$project$Model$MapViewerDialog(
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateMapOptions = F2(
	function (model, optionsUpdater) {
		return A2(
			$author$project$Update$updateMapViewerForm,
			model,
			function (form) {
				return _Utils_update(
					form,
					{
						bX: optionsUpdater(form.bX)
					});
			});
	});
var $author$project$Update$updateRaceBuilderForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 10)) {
			var form = _v0.a.a;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						$author$project$Model$RaceBuilderDialog(
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateRegisterForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 4)) {
			var _v1 = _v0.a;
			var url = _v1.a;
			var form = _v1.b;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						A2(
							$author$project$Model$RegisterDialog,
							url,
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateRulesForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 11)) {
			var form = _v0.a.a;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						$author$project$Model$RulesDialog(
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Update$updateRules = F2(
	function (model, rulesUpdater) {
		return A2(
			$author$project$Update$updateRulesForm,
			model,
			function (form) {
				return _Utils_update(
					form,
					{
						cl: rulesUpdater(form.cl)
					});
			});
	});
var $author$project$Api$Encode$updateServer = F3(
	function (oldUrl, name, newUrl) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'oldUrl',
					$elm$json$Json$Encode$string(oldUrl)),
					_Utils_Tuple2(
					'name',
					$elm$json$Json$Encode$string(name)),
					_Utils_Tuple2(
					'url',
					$elm$json$Json$Encode$string(newUrl))
				]));
	});
var $author$project$Ports$updateServer = _Platform_outgoingPort('updateServer', $elm$core$Basics$identity);
var $author$project$Update$updateServerForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		_v0$2:
		while (true) {
			if (!_v0.$) {
				switch (_v0.a.$) {
					case 0:
						var form = _v0.a.a;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$AddServerDialog(
										updater(form)))
							});
					case 1:
						var _v1 = _v0.a;
						var url = _v1.a;
						var form = _v1.b;
						return _Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									A2(
										$author$project$Model$EditServerDialog,
										url,
										updater(form)))
							});
					default:
						break _v0$2;
				}
			} else {
				break _v0$2;
			}
		}
		return model;
	});
var $author$project$Update$updateSetupRaceForm = F2(
	function (model, updater) {
		var _v0 = model.bg;
		if ((!_v0.$) && (_v0.a.$ === 9)) {
			var form = _v0.a.a;
			return _Utils_update(
				model,
				{
					bg: $elm$core$Maybe$Just(
						$author$project$Model$SetupRaceDialog(
							updater(form)))
				});
		} else {
			return model;
		}
	});
var $author$project$Ports$uploadAndSetSessionRace = _Platform_outgoingPort('uploadAndSetSessionRace', $elm$core$Basics$identity);
var $author$project$Ports$uploadRace = _Platform_outgoingPort('uploadRace', $elm$core$Basics$identity);
var $author$project$Update$update = F2(
	function (msg, model) {
		switch (msg.$) {
			case 0:
				return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
			case 1:
				var result = msg.a;
				if (!result.$) {
					var servers = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{c: $elm$core$Maybe$Nothing, I: false, cw: servers}),
						$author$project$Ports$getAppSettings(0));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err),
								I: false
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 2:
				var serverUrl = msg.a;
				var serverDataWithSavedView = function () {
					var _v7 = _Utils_Tuple2(model.aS, model.cx);
					if (!_v7.a.$) {
						if (!_v7.b.$) {
							var prevServerUrl = _v7.a.a;
							var detail = _v7.b.a;
							return A3(
								$author$project$Model$updateServerData,
								prevServerUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{
											bK: $elm$core$Maybe$Just(detail.eV)
										});
								},
								model.aT);
						} else {
							var prevServerUrl = _v7.a.a;
							var _v8 = _v7.b;
							return A3(
								$author$project$Model$updateServerData,
								prevServerUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{bK: $elm$core$Maybe$Nothing});
								},
								model.aT);
						}
					} else {
						return model.aT;
					}
				}();
				var newServerData = A2($author$project$Model$getServerData, serverUrl, serverDataWithSavedView);
				var maybeServer = A2($author$project$Model$getServerByUrl, serverUrl, model.cw);
				var _v2 = function () {
					var _v3 = newServerData.bK;
					if (!_v3.$) {
						var sessionId = _v3.a;
						return A2(
							$elm$core$List$any,
							function (s) {
								return _Utils_eq(s.dM, sessionId);
							},
							newServerData.cE) ? _Utils_Tuple2(
							$elm$core$Maybe$Just(
								{dj: $elm$core$Maybe$Nothing, eV: sessionId, eZ: false}),
							$elm$core$Maybe$Just(sessionId)) : _Utils_Tuple2($elm$core$Maybe$Nothing, $elm$core$Maybe$Nothing);
					} else {
						return _Utils_Tuple2($elm$core$Maybe$Nothing, $elm$core$Maybe$Nothing);
					}
				}();
				var restoredSessionDetail = _v2.a;
				var restoredSelectedSessionId = _v2.b;
				var finalServerData = function () {
					var _v5 = _Utils_Tuple2(newServerData.bK, restoredSessionDetail);
					if ((!_v5.a.$) && (_v5.b.$ === 1)) {
						var _v6 = _v5.b;
						return A3(
							$author$project$Model$updateServerData,
							serverUrl,
							function (sd) {
								return _Utils_update(
									sd,
									{bK: $elm$core$Maybe$Nothing});
							},
							serverDataWithSavedView);
					} else {
						return serverDataWithSavedView;
					}
				}();
				var newModel = _Utils_update(
					model,
					{
						a8: $elm$core$Maybe$Nothing,
						aS: $elm$core$Maybe$Just(serverUrl),
						cr: restoredSelectedSessionId,
						aT: finalServerData,
						cx: restoredSessionDetail
					});
				if (A2($author$project$Model$isConnected, serverUrl, model.aT)) {
					return _Utils_Tuple2(newModel, $elm$core$Platform$Cmd$none);
				} else {
					if (!maybeServer.$) {
						var server = maybeServer.a;
						return server.dF ? _Utils_Tuple2(
							_Utils_update(
								newModel,
								{
									aT: A3(
										$author$project$Model$updateServerData,
										serverUrl,
										function (sd) {
											return _Utils_update(
												sd,
												{aH: $author$project$Model$Connecting});
										},
										newModel.aT)
								}),
							$author$project$Ports$autoConnect(serverUrl)) : _Utils_Tuple2(
							_Utils_update(
								newModel,
								{
									bg: $elm$core$Maybe$Just(
										A2($author$project$Model$ConnectDialog, serverUrl, $author$project$Model$emptyConnectForm))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								newModel,
								{
									bg: $elm$core$Maybe$Just(
										A2($author$project$Model$ConnectDialog, serverUrl, $author$project$Model$emptyConnectForm))
								}),
							$elm$core$Platform$Cmd$none);
					}
				}
			case 3:
				var result = msg.a;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getServers(0));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, err),
						$elm$core$Platform$Cmd$none);
				}
			case 4:
				var result = msg.a;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getServers(0));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, err),
						$elm$core$Platform$Cmd$none);
				}
			case 5:
				var result = msg.a;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: $elm$core$Maybe$Nothing, aS: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getServers(0));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 6:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just(
								$author$project$Model$AddServerDialog($author$project$Model$emptyServerForm))
						}),
					$elm$core$Platform$Cmd$none);
			case 7:
				var serverUrl = msg.a;
				var _v12 = A2($author$project$Model$getServerByUrl, serverUrl, model.cw);
				if (!_v12.$) {
					var server = _v12.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a8: $elm$core$Maybe$Nothing,
								bg: $elm$core$Maybe$Just(
									A2(
										$author$project$Model$EditServerDialog,
										serverUrl,
										{
											c: $elm$core$Maybe$Nothing,
											ea: server.ea,
											b$: $elm$core$Maybe$Just(server.ea),
											j: false,
											fl: server.fl
										}))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 8:
				var serverUrl = msg.a;
				var serverName = msg.b;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							a8: $elm$core$Maybe$Nothing,
							bg: $elm$core$Maybe$Just(
								A2($author$project$Model$RemoveServerDialog, serverUrl, serverName))
						}),
					$elm$core$Platform$Cmd$none);
			case 9:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bg: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 10:
				var name = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateServerForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{ea: name});
						}),
					$elm$core$Platform$Cmd$none);
			case 11:
				var url = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateServerForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{fl: url});
						}),
					$elm$core$Platform$Cmd$none);
			case 12:
				var _v13 = model.bg;
				if ((!_v13.$) && (!_v13.a.$)) {
					var form = _v13.a.a;
					return ($elm$core$String$isEmpty(form.ea) || $elm$core$String$isEmpty(form.fl)) ? _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, 'Name and URL are required'),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(
						A2(
							$author$project$Update$updateServerForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{c: $elm$core$Maybe$Nothing, j: true});
							}),
						$author$project$Ports$addServer(
							A2($author$project$Api$Encode$addServer, form.ea, form.fl)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 13:
				var oldUrl = msg.a;
				var _v14 = model.bg;
				if ((!_v14.$) && (_v14.a.$ === 1)) {
					var _v15 = _v14.a;
					var form = _v15.b;
					return ($elm$core$String$isEmpty(form.ea) || $elm$core$String$isEmpty(form.fl)) ? _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, 'Name and URL are required'),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(
						A2(
							$author$project$Update$updateServerForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{c: $elm$core$Maybe$Nothing, j: true});
							}),
						$author$project$Ports$updateServer(
							A3($author$project$Api$Encode$updateServer, oldUrl, form.ea, form.fl)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 14:
				var serverUrl = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bg: $elm$core$Maybe$Nothing}),
					$author$project$Ports$removeServer(serverUrl));
			case 15:
				var serverUrl = msg.a;
				var x = msg.b;
				var y = msg.c;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							a8: $elm$core$Maybe$Just(
								{eS: serverUrl, fM: x, fN: y})
						}),
					$elm$core$Platform$Cmd$none);
			case 16:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{a8: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 17:
				var serverUrl = msg.a;
				var form = function () {
					var _v16 = A2($author$project$Model$getServerByUrl, serverUrl, model.cw);
					if (!_v16.$) {
						var server = _v16.a;
						return _Utils_update(
							$author$project$Model$emptyConnectForm,
							{
								aZ: A2($elm$core$Maybe$withDefault, '', server.dd)
							});
					} else {
						return $author$project$Model$emptyConnectForm;
					}
				}();
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							a8: $elm$core$Maybe$Nothing,
							bg: $elm$core$Maybe$Just(
								A2($author$project$Model$ConnectDialog, serverUrl, form))
						}),
					$elm$core$Platform$Cmd$none);
			case 18:
				var serverUrl = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							a8: $elm$core$Maybe$Nothing,
							bg: $elm$core$Maybe$Just(
								A2($author$project$Model$RegisterDialog, serverUrl, $author$project$Model$emptyRegisterForm))
						}),
					$elm$core$Platform$Cmd$none);
			case 19:
				var _v17 = model.bg;
				if ((!_v17.$) && (_v17.a.$ === 3)) {
					var _v18 = _v17.a;
					var serverUrl = _v18.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									A2($author$project$Model$RegisterDialog, serverUrl, $author$project$Model$emptyRegisterForm))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 20:
				var _v19 = model.bg;
				if ((!_v19.$) && (_v19.a.$ === 4)) {
					var _v20 = _v19.a;
					var serverUrl = _v20.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									A2($author$project$Model$ConnectDialog, serverUrl, $author$project$Model$emptyConnectForm))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 21:
				var username = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateConnectForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{aZ: username});
						}),
					$elm$core$Platform$Cmd$none);
			case 22:
				var password = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateConnectForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{er: password});
						}),
					$elm$core$Platform$Cmd$none);
			case 23:
				var nickname = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRegisterForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{ee: nickname});
						}),
					$elm$core$Platform$Cmd$none);
			case 24:
				var email = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRegisterForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{dp: email});
						}),
					$elm$core$Platform$Cmd$none);
			case 25:
				var message = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRegisterForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{bM: message});
						}),
					$elm$core$Platform$Cmd$none);
			case 26:
				var serverUrl = msg.a;
				var _v21 = model.bg;
				if ((!_v21.$) && (_v21.a.$ === 3)) {
					var _v22 = _v21.a;
					var form = _v22.b;
					return ($elm$core$String$isEmpty(form.aZ) || $elm$core$String$isEmpty(form.er)) ? _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, 'Username and password are required'),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(
						A2(
							$author$project$Update$updateConnectForm,
							A3($author$project$Update$setConnectionState, serverUrl, $author$project$Model$Connecting, model),
							function (f) {
								return _Utils_update(
									f,
									{c: $elm$core$Maybe$Nothing, j: true});
							}),
						$author$project$Ports$connect(
							A3($author$project$Api$Encode$connect, serverUrl, form.aZ, form.er)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 27:
				var serverUrl = msg.a;
				var _v23 = model.bg;
				if ((!_v23.$) && (_v23.a.$ === 4)) {
					var _v24 = _v23.a;
					var form = _v24.b;
					return ($elm$core$String$isEmpty(form.ee) || $elm$core$String$isEmpty(form.dp)) ? _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, 'Nickname and email are required'),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(
						A2(
							$author$project$Update$updateRegisterForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{c: $elm$core$Maybe$Nothing, j: true});
							}),
						$author$project$Ports$register(
							A4($author$project$Api$Encode$register, serverUrl, form.ee, form.dp, form.bM)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 28:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var info = result.a;
					var baseCmds = _List_fromArray(
						[
							$author$project$Ports$getSessions(serverUrl),
							$author$project$Ports$getInvitations(serverUrl),
							$author$project$Ports$getSentInvitations(serverUrl),
							$author$project$Ports$getUserProfiles(serverUrl)
						]);
					var allCmds = info.dW ? _Utils_ap(
						baseCmds,
						_List_fromArray(
							[
								$author$project$Ports$getPendingRegistrations(serverUrl)
							])) : baseCmds;
					return _Utils_Tuple2(
						A3(
							$author$project$Update$setConnectionState,
							serverUrl,
							$author$project$Model$Connected(
								{dW: info.dW, eR: info.eR, fn: info.fn, aZ: info.aZ}),
							_Utils_update(
								model,
								{bg: $elm$core$Maybe$Nothing})),
						$elm$core$Platform$Cmd$batch(allCmds));
				} else {
					var err = result.a;
					var modelWithError = A3(
						$author$project$Update$setConnectionState,
						serverUrl,
						$author$project$Model$ConnectionError(err),
						model);
					var _v26 = model.bg;
					if (!_v26.$) {
						if (_v26.a.$ === 3) {
							var _v27 = _v26.a;
							return _Utils_Tuple2(
								A2(
									$author$project$Update$updateConnectForm,
									modelWithError,
									function (f) {
										return _Utils_update(
											f,
											{
												c: $elm$core$Maybe$Just(err),
												j: false
											});
									}),
								$elm$core$Platform$Cmd$none);
						} else {
							return _Utils_Tuple2(modelWithError, $elm$core$Platform$Cmd$none);
						}
					} else {
						var form = function () {
							var _v28 = A2($author$project$Model$getServerByUrl, serverUrl, model.cw);
							if (!_v28.$) {
								var server = _v28.a;
								return _Utils_update(
									$author$project$Model$emptyConnectForm,
									{
										c: $elm$core$Maybe$Just(err),
										aZ: A2($elm$core$Maybe$withDefault, '', server.dd)
									});
							} else {
								return _Utils_update(
									$author$project$Model$emptyConnectForm,
									{
										c: $elm$core$Maybe$Just(err)
									});
							}
						}();
						return _Utils_Tuple2(
							_Utils_update(
								modelWithError,
								{
									bg: $elm$core$Maybe$Just(
										A2($author$project$Model$ConnectDialog, serverUrl, form))
								}),
							$elm$core$Platform$Cmd$none);
					}
				}
			case 29:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRegisterForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{j: false, cL: true});
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRegisterForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										j: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 30:
				var serverUrl = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{a8: $elm$core$Maybe$Nothing, cF: false}),
					$author$project$Ports$disconnect(serverUrl));
			case 31:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cr: $elm$core$Maybe$Nothing,
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (_v31) {
										return $author$project$Model$emptyServerData;
									},
									model.aT),
								cx: $elm$core$Maybe$Nothing,
								cF: false
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 32:
				var serverUrl = msg.a;
				var result = msg.b;
				return _Utils_Tuple2(
					model,
					A2(
						$elm$core$Task$perform,
						A2($author$project$Msg$GotFetchEndTime, serverUrl, result),
						$elm$time$Time$now));
			case 33:
				var serverUrl = msg.a;
				var startTime = msg.b;
				var startMs = $elm$time$Time$posixToMillis(startTime);
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							aT: A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{
											bm: $elm$core$Maybe$Just(startMs)
										});
								},
								model.aT)
						}),
					$author$project$Ports$getSessions(serverUrl));
			case 34:
				var serverUrl = msg.a;
				var result = msg.b;
				var endTime = msg.c;
				if (!result.$) {
					var sessions = result.a;
					var sessionDetailStillExists = function () {
						var _v37 = model.cx;
						if (!_v37.$) {
							var detail = _v37.a;
							return A2(
								$elm$core$List$any,
								function (s) {
									return _Utils_eq(s.dM, detail.eV);
								},
								sessions);
						} else {
							return true;
						}
					}();
					var isUserInSession = F2(
						function (userId, session) {
							return A2($elm$core$List$member, userId, session.d3) || A2($elm$core$List$member, userId, session.d1);
						});
					var isSelectedServer = _Utils_eq(
						model.aS,
						$elm$core$Maybe$Just(serverUrl));
					var endMs = $elm$time$Time$posixToMillis(endTime);
					var currentData = A2($author$project$Model$getServerData, serverUrl, model.aT);
					var fetchResult = function () {
						var _v36 = currentData.bm;
						if (!_v36.$) {
							var startMs = _v36.a;
							return $elm$core$Maybe$Just(
								{
									dn: endMs - startMs,
									eU: $elm$core$List$length(sessions)
								});
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}();
					var maybeUserId = function () {
						var _v35 = currentData.aH;
						if (_v35.$ === 2) {
							var info = _v35.a;
							return $elm$core$Maybe$Just(info.fn);
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}();
					var sessionsNeedingOrders = A2(
						$elm$core$List$filter,
						function (s) {
							return s.e5 && (!A2($elm$core$Dict$member, s.dM, currentData.cA));
						},
						sessions);
					var ordersFetchCmds = A2(
						$elm$core$List$map,
						function (s) {
							return $author$project$Ports$getOrdersStatus(
								A2($author$project$Api$Encode$getOrdersStatus, serverUrl, s.dM));
						},
						sessionsNeedingOrders);
					var sessionsNeedingRules = A2(
						$elm$core$List$filter,
						function (s) {
							return s.eQ && (!A2($elm$core$Dict$member, s.dM, currentData.cC));
						},
						sessions);
					var rulesFetchCmds = A2(
						$elm$core$List$map,
						function (s) {
							return $author$project$Ports$getRules(
								A2($author$project$Api$Encode$getRules, serverUrl, s.dM));
						},
						sessionsNeedingRules);
					var sessionsNeedingTurns = function () {
						if (!maybeUserId.$) {
							var userId = maybeUserId.a;
							return A2(
								$elm$core$List$filter,
								function (s) {
									return s.e5 && (A2(isUserInSession, userId, s) && (!A2($elm$core$Dict$member, s.dM, currentData.cD)));
								},
								sessions);
						} else {
							return _List_Nil;
						}
					}();
					var turnsFetchCmds = A2(
						$elm$core$List$map,
						function (s) {
							return $author$project$Ports$getLatestTurn(
								A2($author$project$Api$Encode$getLatestTurn, serverUrl, s.dM));
						},
						sessionsNeedingTurns);
					var _v33 = (!isSelectedServer) ? _Utils_Tuple2(
						model.cx,
						A3(
							$author$project$Model$updateServerData,
							serverUrl,
							function (sd) {
								return _Utils_update(
									sd,
									{bm: $elm$core$Maybe$Nothing, bn: false, bJ: fetchResult, cE: sessions});
							},
							model.aT)) : (sessionDetailStillExists ? _Utils_Tuple2(
						model.cx,
						A3(
							$author$project$Model$updateServerData,
							serverUrl,
							function (sd) {
								return _Utils_update(
									sd,
									{bm: $elm$core$Maybe$Nothing, bn: false, bJ: fetchResult, cE: sessions});
							},
							model.aT)) : _Utils_Tuple2(
						$elm$core$Maybe$Nothing,
						A3(
							$author$project$Model$updateServerData,
							serverUrl,
							function (sd) {
								return _Utils_update(
									sd,
									{bm: $elm$core$Maybe$Nothing, bn: false, bJ: fetchResult, bK: $elm$core$Maybe$Nothing, cE: sessions});
							},
							model.aT)));
					var updatedSessionDetail = _v33.a;
					var baseServerData = _v33.b;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{aT: baseServerData, cx: updatedSessionDetail}),
						$elm$core$Platform$Cmd$batch(
							_Utils_ap(
								rulesFetchCmds,
								_Utils_ap(ordersFetchCmds, turnsFetchCmds))));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err),
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{bm: $elm$core$Maybe$Nothing, bn: false});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 35:
				var sessionId = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							cr: $elm$core$Maybe$Just(sessionId)
						}),
					function () {
						var _v38 = model.aS;
						if (!_v38.$) {
							var serverUrl = _v38.a;
							return $author$project$Ports$getSession(
								A2($author$project$Api$Encode$getSession, serverUrl, sessionId));
						} else {
							return $elm$core$Platform$Cmd$none;
						}
					}());
			case 36:
				var filter = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{cy: filter}),
					$elm$core$Platform$Cmd$none);
			case 37:
				var _v39 = model.aS;
				if (!_v39.$) {
					var serverUrl = _v39.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{bn: true});
									},
									model.aT)
							}),
						A2(
							$elm$core$Task$perform,
							$author$project$Msg$GotFetchStartTime(serverUrl),
							$elm$time$Time$now));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 38:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var session = result.a;
					var shouldOpenDetail = _Utils_eq(
						model.b4,
						$elm$core$Maybe$Just(session.dM)) && _Utils_eq(
						model.aS,
						$elm$core$Maybe$Just(serverUrl));
					var currentData = A2($author$project$Model$getServerData, serverUrl, model.aT);
					var sessionExists = A2(
						$elm$core$List$any,
						function (s) {
							return _Utils_eq(s.dM, session.dM);
						},
						currentData.cE);
					var updatedSessions = sessionExists ? A2(
						$elm$core$List$map,
						function (s) {
							return _Utils_eq(s.dM, session.dM) ? session : s;
						},
						currentData.cE) : A2($elm$core$List$cons, session, currentData.cE);
					var updatedModel = _Utils_update(
						model,
						{
							b4: shouldOpenDetail ? $elm$core$Maybe$Nothing : model.b4,
							aT: A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{cE: updatedSessions});
								},
								model.aT)
						});
					return shouldOpenDetail ? _Utils_Tuple2(
						_Utils_update(
							updatedModel,
							{
								cx: $elm$core$Maybe$Just(
									{dj: $elm$core$Maybe$Nothing, eV: session.dM, eZ: false})
							}),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(updatedModel, $elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{b4: $elm$core$Maybe$Nothing}),
						$elm$core$Platform$Cmd$none);
				}
			case 39:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just(
								$author$project$Model$CreateSessionDialog(
									{c: $elm$core$Maybe$Nothing, dX: true, ea: '', j: false}))
						}),
					$elm$core$Platform$Cmd$none);
			case 40:
				var name = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateCreateSessionForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{ea: name});
						}),
					$elm$core$Platform$Cmd$none);
			case 41:
				var isPublic = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateCreateSessionForm,
						model,
						function (form) {
							return _Utils_update(
								form,
								{dX: isPublic});
						}),
					$elm$core$Platform$Cmd$none);
			case 42:
				var _v41 = _Utils_Tuple2(model.bg, model.aS);
				if (((!_v41.a.$) && (_v41.a.a.$ === 5)) && (!_v41.b.$)) {
					var form = _v41.a.a.a;
					var serverUrl = _v41.b.a;
					return $elm$core$String$isEmpty(form.ea) ? _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, 'Session name is required'),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(
						A2(
							$author$project$Update$updateCreateSessionForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{c: $elm$core$Maybe$Nothing, j: true});
							}),
						$author$project$Ports$createSession(
							A3($author$project$Api$Encode$createSession, serverUrl, form.ea, form.dX)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 43:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getSessions(serverUrl));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2($author$project$Update$updateDialogError, model, err),
						$elm$core$Platform$Cmd$none);
				}
			case 44:
				var sessionId = msg.a;
				return _Utils_Tuple2(
					model,
					function () {
						var _v43 = model.aS;
						if (!_v43.$) {
							var serverUrl = _v43.a;
							return $author$project$Ports$joinSession(
								A2($author$project$Api$Encode$joinSession, serverUrl, sessionId));
						} else {
							return $elm$core$Platform$Cmd$none;
						}
					}());
			case 45:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						model,
						$author$project$Ports$getSessions(serverUrl));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 46:
				var sessionId = msg.a;
				var _v45 = model.aS;
				if (!_v45.$) {
					var serverUrl = _v45.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$deleteSession(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 47:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var maybeSessionId = A2(
						$elm$core$Maybe$map,
						function ($) {
							return $.eV;
						},
						model.cx);
					var cleanedServerData = function () {
						if (!maybeSessionId.$) {
							var sessionId = maybeSessionId.a;
							return A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{
											cC: A2($elm$core$Dict$remove, sessionId, sd.cC),
											cD: A2($elm$core$Dict$remove, sessionId, sd.cD)
										});
								},
								model.aT);
						} else {
							return model.aT;
						}
					}();
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{aT: cleanedServerData, cx: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getSessions(serverUrl));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 48:
				var sessionId = msg.a;
				var _v48 = model.aS;
				if (!_v48.$) {
					var serverUrl = _v48.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$quitSession(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 49:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var maybeSessionId = A2(
						$elm$core$Maybe$map,
						function ($) {
							return $.eV;
						},
						model.cx);
					var cleanedServerData = function () {
						if (!maybeSessionId.$) {
							var sessionId = maybeSessionId.a;
							return A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{
											cC: A2($elm$core$Dict$remove, sessionId, sd.cC),
											cD: A2($elm$core$Dict$remove, sessionId, sd.cD)
										});
								},
								model.aT);
						} else {
							return model.aT;
						}
					}();
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{aT: cleanedServerData, cx: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getSessions(serverUrl));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 50:
				var sessionId = msg.a;
				var memberId = msg.b;
				var _v51 = model.aS;
				if (!_v51.$) {
					var serverUrl = _v51.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$promoteMember(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId)),
										_Utils_Tuple2(
										'memberId',
										$elm$json$Json$Encode$string(memberId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 51:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var _v53 = model.cx;
					if (!_v53.$) {
						var detail = _v53.a;
						return _Utils_Tuple2(
							model,
							$author$project$Ports$getSession(
								A2($author$project$Api$Encode$getSession, serverUrl, detail.eV)));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 52:
				var sessionId = msg.a;
				var updatedServerData = function () {
					var _v55 = model.aS;
					if (!_v55.$) {
						var serverUrl = _v55.a;
						return A3(
							$author$project$Model$updateServerData,
							serverUrl,
							function (sd) {
								return _Utils_update(
									sd,
									{
										bK: $elm$core$Maybe$Just(sessionId)
									});
							},
							model.aT);
					} else {
						return model.aT;
					}
				}();
				var serverData = $author$project$Model$getCurrentServerData(model);
				var maybeSession = $elm$core$List$head(
					A2(
						$elm$core$List$filter,
						function (s) {
							return _Utils_eq(s.dM, sessionId);
						},
						serverData.cE));
				var cmds = function () {
					var _v54 = _Utils_Tuple2(maybeSession, model.aS);
					if ((!_v54.a.$) && (!_v54.b.$)) {
						var session = _v54.a.a;
						var serverUrl = _v54.b.a;
						var turnCmds = session.e5 ? _List_fromArray(
							[
								$author$project$Ports$getLatestTurn(
								A2($author$project$Api$Encode$getLatestTurn, serverUrl, sessionId)),
								$author$project$Ports$checkHasStarsExe(
								A2($author$project$Api$Encode$checkHasStarsExe, serverUrl, sessionId))
							]) : _List_Nil;
						var baseCmds = _List_fromArray(
							[
								$author$project$Ports$getSessionPlayerRace(
								A2($author$project$Api$Encode$getSessionPlayerRace, serverUrl, sessionId))
							]);
						return _Utils_ap(baseCmds, turnCmds);
					} else {
						return _List_Nil;
					}
				}();
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							aT: updatedServerData,
							cx: $elm$core$Maybe$Just(
								{dj: $elm$core$Maybe$Nothing, eV: sessionId, eZ: false})
						}),
					$elm$core$Platform$Cmd$batch(cmds));
			case 53:
				var updatedServerData = function () {
					var _v56 = model.aS;
					if (!_v56.$) {
						var serverUrl = _v56.a;
						return A3(
							$author$project$Model$updateServerData,
							serverUrl,
							function (sd) {
								return _Utils_update(
									sd,
									{bK: $elm$core$Maybe$Nothing});
							},
							model.aT);
					} else {
						return model.aT;
					}
				}();
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{aT: updatedServerData, cx: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 54:
				return _Utils_Tuple2(
					model,
					function () {
						var _v57 = model.aS;
						if (!_v57.$) {
							var serverUrl = _v57.a;
							return $author$project$Ports$getUserProfiles(serverUrl);
						} else {
							return $elm$core$Platform$Cmd$none;
						}
					}());
			case 55:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var profiles = result.a;
					var updatedModel = _Utils_update(
						model,
						{
							aT: A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{cS: profiles});
								},
								model.aT)
						});
					var finalModel = function () {
						var _v59 = model.bg;
						if ((!_v59.$) && (_v59.a.$ === 14)) {
							var state = _v59.a.a;
							return _Utils_update(
								updatedModel,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{cT: profiles})))
								});
						} else {
							return updatedModel;
						}
					}();
					return _Utils_Tuple2(finalModel, $elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 56:
				var _v60 = model.cx;
				if (!_v60.$) {
					var detail = _v60.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$InviteUserDialog(
										$author$project$Model$emptyInviteForm(detail.eV)))
							}),
						function () {
							var _v61 = model.aS;
							if (!_v61.$) {
								var serverUrl = _v61.a;
								return $author$project$Ports$getUserProfiles(serverUrl);
							} else {
								return $elm$core$Platform$Cmd$none;
							}
						}());
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 57:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bg: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 58:
				var userId = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateInviteForm,
						model,
						function (f) {
							return _Utils_update(
								f,
								{
									ct: $elm$core$Maybe$Just(userId)
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 59:
				var _v62 = model.bg;
				if ((!_v62.$) && (_v62.a.$ === 6)) {
					var form = _v62.a.a;
					var _v63 = _Utils_Tuple2(model.aS, form.ct);
					if ((!_v63.a.$) && (!_v63.b.$)) {
						var serverUrl = _v63.a.a;
						var userId = _v63.b.a;
						return _Utils_Tuple2(
							A2(
								$author$project$Update$updateInviteForm,
								model,
								function (f) {
									return _Utils_update(
										f,
										{c: $elm$core$Maybe$Nothing, j: true});
								}),
							$author$project$Ports$inviteUser(
								$elm$json$Json$Encode$object(
									_List_fromArray(
										[
											_Utils_Tuple2(
											'serverUrl',
											$elm$json$Json$Encode$string(serverUrl)),
											_Utils_Tuple2(
											'sessionId',
											$elm$json$Json$Encode$string(form.eV)),
											_Utils_Tuple2(
											'userProfileId',
											$elm$json$Json$Encode$string(userId))
										]))));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 60:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: $elm$core$Maybe$Nothing}),
						$author$project$Ports$getSentInvitations(serverUrl));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateInviteForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										j: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 61:
				var _v65 = model.aS;
				if (!_v65.$) {
					var serverUrl = _v65.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just($author$project$Model$InvitationsDialog),
								cF: false
							}),
						$elm$core$Platform$Cmd$batch(
							_List_fromArray(
								[
									$author$project$Ports$getInvitations(serverUrl),
									$author$project$Ports$getSentInvitations(serverUrl)
								])));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 62:
				var sessionId = msg.a;
				var _v66 = model.aS;
				if (!_v66.$) {
					var serverUrl = _v66.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Nothing,
								b4: $elm$core$Maybe$Just(sessionId)
							}),
						$author$project$Ports$getSession(
							A2($author$project$Api$Encode$getSession, serverUrl, sessionId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 63:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var invitations = result.a;
					var fetchSessionCmds = $elm$core$Platform$Cmd$batch(
						A2(
							$elm$core$List$map,
							function (inv) {
								return $author$project$Ports$getSession(
									A2($author$project$Api$Encode$getSession, serverUrl, inv.eV));
							},
							invitations));
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{bD: invitations});
									},
									model.aT)
							}),
						fetchSessionCmds);
				} else {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{bD: _List_Nil});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 64:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var invitations = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{cu: invitations});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{cu: _List_Nil});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 65:
				var invitationId = msg.a;
				var _v69 = model.aS;
				if (!_v69.$) {
					var serverUrl = _v69.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$acceptInvitation(
							A2($author$project$Api$Encode$acceptInvitation, serverUrl, invitationId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 66:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Nothing,
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{bD: _List_Nil});
									},
									model.aT)
							}),
						$author$project$Ports$getSessions(serverUrl));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 67:
				var invitationId = msg.a;
				var _v71 = model.aS;
				if (!_v71.$) {
					var serverUrl = _v71.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$declineInvitation(
							A2($author$project$Api$Encode$declineInvitation, serverUrl, invitationId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 68:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						model,
						$author$project$Ports$getInvitations(serverUrl));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 69:
				var invitationId = msg.a;
				var _v73 = model.aS;
				if (!_v73.$) {
					var serverUrl = _v73.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$cancelSentInvitation(
							A2($author$project$Api$Encode$cancelSentInvitation, serverUrl, invitationId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 70:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						model,
						$author$project$Ports$getSentInvitations(serverUrl));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 71:
				var _v75 = model.aS;
				if (!_v75.$) {
					var serverUrl = _v75.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RacesDialog($elm$core$Maybe$Nothing)),
								cF: false
							}),
						$author$project$Ports$getRaces(serverUrl));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 72:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var races = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{ce: races});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{ce: _List_Nil});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 73:
				var _v77 = model.aS;
				if (!_v77.$) {
					var serverUrl = _v77.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$uploadRace(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 74:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var newRace = result.a;
					var currentData = A2($author$project$Model$getServerData, serverUrl, model.aT);
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{
												ce: A2($elm$core$List$cons, newRace, currentData.ce)
											});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 75:
				var raceId = msg.a;
				var _v79 = model.aS;
				if (!_v79.$) {
					var serverUrl = _v79.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$downloadRace(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'raceId',
										$elm$json$Json$Encode$string(raceId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 76:
				var result = msg.a;
				if (!result.$) {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 77:
				var raceId = msg.a;
				var _v81 = model.aS;
				if (!_v81.$) {
					var serverUrl = _v81.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$deleteRace(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'raceId',
										$elm$json$Json$Encode$string(raceId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 78:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RacesDialog($elm$core$Maybe$Nothing))
							}),
						$author$project$Ports$getRaces(serverUrl));
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RacesDialog(
										$elm$core$Maybe$Just(err)))
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 79:
				var sessionId = msg.a;
				var _v83 = model.aS;
				if (!_v83.$) {
					var serverUrl = _v83.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$SetupRaceDialog(
										$author$project$Model$emptySetupRaceForm(sessionId)))
							}),
						$author$project$Ports$getRaces(serverUrl));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 80:
				var raceId = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateSetupRaceForm,
						model,
						function (f) {
							return _Utils_update(
								f,
								{
									cq: $elm$core$Maybe$Just(raceId)
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 81:
				var _v84 = model.bg;
				if ((!_v84.$) && (_v84.a.$ === 9)) {
					var form = _v84.a.a;
					var _v85 = _Utils_Tuple2(model.aS, form.cq);
					if ((!_v85.a.$) && (!_v85.b.$)) {
						var serverUrl = _v85.a.a;
						var raceId = _v85.b.a;
						return _Utils_Tuple2(
							A2(
								$author$project$Update$updateSetupRaceForm,
								model,
								function (f) {
									return _Utils_update(
										f,
										{c: $elm$core$Maybe$Nothing, j: true});
								}),
							$author$project$Ports$setSessionRace(
								$elm$json$Json$Encode$object(
									_List_fromArray(
										[
											_Utils_Tuple2(
											'serverUrl',
											$elm$json$Json$Encode$string(serverUrl)),
											_Utils_Tuple2(
											'sessionId',
											$elm$json$Json$Encode$string(form.eV)),
											_Utils_Tuple2(
											'raceId',
											$elm$json$Json$Encode$string(raceId))
										]))));
					} else {
						return _Utils_Tuple2(
							A2($author$project$Update$updateDialogError, model, 'Please select a race'),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 82:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var sessionId = function () {
						var _v88 = model.bg;
						if ((!_v88.$) && (_v88.a.$ === 9)) {
							var form = _v88.a.a;
							return $elm$core$Maybe$Just(form.eV);
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}();
					var cmds = function () {
						if (!sessionId.$) {
							var sid = sessionId.a;
							return $elm$core$Platform$Cmd$batch(
								_List_fromArray(
									[
										$author$project$Ports$getSessions(serverUrl),
										$author$project$Ports$getSessionPlayerRace(
										A2($author$project$Api$Encode$getSessionPlayerRace, serverUrl, sid))
									]));
						} else {
							return $author$project$Ports$getSessions(serverUrl);
						}
					}();
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: $elm$core$Maybe$Nothing}),
						cmds);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateSetupRaceForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										j: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 84:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var result = msg.c;
				if (!result.$) {
					var race = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{
												cB: A3($elm$core$Dict$insert, sessionId, race, sd.cB)
											});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 83:
				var _v90 = model.bg;
				if ((!_v90.$) && (_v90.a.$ === 9)) {
					var form = _v90.a.a;
					var _v91 = model.aS;
					if (!_v91.$) {
						var serverUrl = _v91.a;
						return _Utils_Tuple2(
							model,
							$author$project$Ports$uploadAndSetSessionRace(
								$elm$json$Json$Encode$object(
									_List_fromArray(
										[
											_Utils_Tuple2(
											'serverUrl',
											$elm$json$Json$Encode$string(serverUrl)),
											_Utils_Tuple2(
											'sessionId',
											$elm$json$Json$Encode$string(form.eV))
										]))));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 85:
				var origin = msg.a;
				var _v92 = model.aS;
				if (!_v92.$) {
					var serverUrl = _v92.a;
					var form = $author$project$Model$emptyRaceBuilderForm(origin);
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RaceBuilderDialog(form))
							}),
						$author$project$Ports$getRaceTemplate(
							A2($author$project$Api$Encode$getRaceTemplate, serverUrl, 'humanoid')));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 86:
				var tab = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRaceBuilderForm,
						model,
						function (f) {
							return _Utils_update(
								f,
								{a$: tab});
						}),
					$elm$core$Platform$Cmd$none);
			case 87:
				var templateName = msg.a;
				var _v93 = model.aS;
				if (!_v93.$) {
					var serverUrl = _v93.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRaceBuilderForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{cs: templateName});
							}),
						$author$project$Ports$getRaceTemplate(
							A2($author$project$Api$Encode$getRaceTemplate, serverUrl, templateName)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 88:
				var result = msg.a;
				if (!result.$) {
					var config = result.a;
					var newModel = A2(
						$author$project$Update$updateRaceBuilderForm,
						model,
						function (f) {
							return _Utils_update(
								f,
								{a7: config});
						});
					var _v95 = model.aS;
					if (!_v95.$) {
						var serverUrl = _v95.a;
						return _Utils_Tuple2(
							newModel,
							$author$project$Ports$validateRaceConfig(
								A2($author$project$Api$Encode$validateRaceConfig, serverUrl, config)));
					} else {
						return _Utils_Tuple2(newModel, $elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRaceBuilderForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										cs: 'custom'
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 89:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRaceBuilderForm,
						model,
						function (f) {
							return _Utils_update(
								f,
								{cs: 'custom'});
						}),
					$elm$core$Platform$Cmd$none);
			case 90:
				var name = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{e3: name});
					});
			case 91:
				var name = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{ew: name});
					});
			case 92:
				var password = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{er: password});
					});
			case 93:
				var icon = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dK: icon});
					});
			case 94:
				var option = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{d$: option});
					});
			case 95:
				var prt = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{ex: prt});
					});
			case 96:
				var lrtIndex = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return A2($elm$core$List$member, lrtIndex, c.d0) ? _Utils_update(
							c,
							{
								d0: A2(
									$elm$core$List$filter,
									function (i) {
										return !_Utils_eq(i, lrtIndex);
									},
									c.d0)
							}) : _Utils_update(
							c,
							{
								d0: A2($elm$core$List$cons, lrtIndex, c.d0)
							});
					});
			case 97:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dB: val});
					});
			case 98:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dD: val});
					});
			case 99:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dC: val});
					});
			case 100:
				var minVal = msg.a;
				var maxVal = msg.b;
				var newWidth = ((maxVal - minVal) / 2) | 0;
				var newCenter = ((minVal + maxVal) / 2) | 0;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dB: newCenter, dD: newWidth});
					});
			case 101:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{fc: val});
					});
			case 102:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{fe: val});
					});
			case 103:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{fd: val});
					});
			case 104:
				var minVal = msg.a;
				var maxVal = msg.b;
				var newWidth = ((maxVal - minVal) / 2) | 0;
				var newCenter = ((minVal + maxVal) / 2) | 0;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{fc: newCenter, fe: newWidth});
					});
			case 105:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eA: val});
					});
			case 106:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eC: val});
					});
			case 107:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eB: val});
					});
			case 108:
				var minVal = msg.a;
				var maxVal = msg.b;
				var newWidth = ((maxVal - minVal) / 2) | 0;
				var newCenter = ((minVal + maxVal) / 2) | 0;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eA: newCenter, eC: newWidth});
					});
			case 109:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dE: val});
					});
			case 110:
				var btn = msg.a;
				var _v96 = model.bg;
				if ((!_v96.$) && (_v96.a.$ === 10)) {
					var form = _v96.a.a;
					var newForm = _Utils_update(
						form,
						{
							bz: $elm$core$Maybe$Just(btn)
						});
					var modelWithHeld = _Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just(
								$author$project$Model$RaceBuilderDialog(newForm))
						});
					return A2($author$project$Update$performHabButtonAction, modelWithHeld, btn);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 111:
				var _v97 = model.bg;
				if ((!_v97.$) && (_v97.a.$ === 10)) {
					var form = _v97.a.a;
					var newForm = _Utils_update(
						form,
						{bz: $elm$core$Maybe$Nothing});
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RaceBuilderDialog(newForm))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 112:
				var _v98 = model.bg;
				if ((!_v98.$) && (_v98.a.$ === 10)) {
					var form = _v98.a.a;
					var _v99 = form.bz;
					if (!_v99.$) {
						var btn = _v99.a;
						return A2($author$project$Update$performHabButtonAction, model, btn);
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 113:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{da: val});
					});
			case 114:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dx: val});
					});
			case 115:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dv: val});
					});
			case 116:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{dw: val});
					});
			case 117:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{du: val});
					});
			case 118:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{d7: val});
					});
			case 119:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{d5: val});
					});
			case 120:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{d6: val});
					});
			case 121:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eK: val});
					});
			case 122:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eM: val});
					});
			case 123:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eL: val});
					});
			case 124:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eI: val});
					});
			case 125:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eJ: val});
					});
			case 126:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{eH: val});
					});
			case 127:
				var val = msg.a;
				return A2(
					$author$project$Update$updateRaceConfigAndValidate,
					model,
					function (c) {
						return _Utils_update(
							c,
							{fb: val});
					});
			case 128:
				var result = msg.a;
				if (!result.$) {
					var validation = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRaceBuilderForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{cU: validation});
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRaceBuilderForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err)
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 132:
				var _v101 = _Utils_Tuple2(model.bg, model.aS);
				if (((!_v101.a.$) && (_v101.a.a.$ === 10)) && (!_v101.b.$)) {
					var form = _v101.a.a.a;
					var serverUrl = _v101.b.a;
					if (form.cU.bF) {
						var maybeSessionId = function () {
							var _v102 = form.b_;
							if (_v102.$ === 1) {
								var sessionId = _v102.a;
								return $elm$core$Maybe$Just(sessionId);
							} else {
								return $elm$core$Maybe$Nothing;
							}
						}();
						return _Utils_Tuple2(
							A2(
								$author$project$Update$updateRaceBuilderForm,
								model,
								function (f) {
									return _Utils_update(
										f,
										{c: $elm$core$Maybe$Nothing, j: true});
								}),
							$author$project$Ports$buildAndSaveRace(
								A3($author$project$Api$Encode$buildAndSaveRace, serverUrl, form.a7, maybeSessionId)));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 133:
				var result = msg.a;
				if (!result.$) {
					var _v104 = _Utils_Tuple2(model.bg, model.aS);
					if (((!_v104.a.$) && (_v104.a.a.$ === 10)) && (!_v104.b.$)) {
						var form = _v104.a.a.a;
						var serverUrl = _v104.b.a;
						var baseCmds = _List_fromArray(
							[
								$author$project$Ports$getRaces(serverUrl)
							]);
						var allCmds = function () {
							var _v105 = form.b_;
							if (_v105.$ === 1) {
								var sessionId = _v105.a;
								return _Utils_ap(
									baseCmds,
									_List_fromArray(
										[
											$author$project$Ports$getSessions(serverUrl),
											$author$project$Ports$getSessionPlayerRace(
											A2($author$project$Api$Encode$getSessionPlayerRace, serverUrl, sessionId))
										]));
							} else {
								return baseCmds;
							}
						}();
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{bg: $elm$core$Maybe$Nothing}),
							$elm$core$Platform$Cmd$batch(allCmds));
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{bg: $elm$core$Maybe$Nothing}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRaceBuilderForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										j: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 129:
				var raceId = msg.a;
				var raceName = msg.b;
				var _v106 = model.aS;
				if (!_v106.$) {
					var serverUrl = _v106.a;
					var form = {
						a$: 0,
						a7: $author$project$Model$defaultRaceConfig,
						c: $elm$core$Maybe$Nothing,
						bz: $elm$core$Maybe$Nothing,
						I: true,
						bN: $author$project$Model$ViewMode(
							{ez: raceId, az: raceName}),
						b_: $author$project$Model$FromRacesDialog,
						cs: 'custom',
						j: false,
						cU: {bk: _List_Nil, by: $author$project$Model$emptyHabitabilityDisplay, bF: false, bL: _List_Nil, b7: 0, cc: _List_Nil, cW: _List_Nil}
					};
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RaceBuilderDialog(form))
							}),
						$author$project$Ports$loadRaceFileConfig(
							A2($author$project$Api$Encode$loadRaceFileConfig, serverUrl, raceId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 130:
				var result = msg.a;
				if (!result.$) {
					var config = result.a;
					var _v108 = model.aS;
					if (!_v108.$) {
						var serverUrl = _v108.a;
						return _Utils_Tuple2(
							A2(
								$author$project$Update$updateRaceBuilderForm,
								model,
								function (f) {
									return _Utils_update(
										f,
										{a7: config, I: false});
								}),
							$author$project$Ports$validateRaceConfig(
								A2($author$project$Api$Encode$validateRaceConfig, serverUrl, config)));
					} else {
						return _Utils_Tuple2(
							A2(
								$author$project$Update$updateRaceBuilderForm,
								model,
								function (f) {
									return _Utils_update(
										f,
										{a7: config, I: false});
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRaceBuilderForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										I: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 131:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRaceBuilderForm,
						model,
						function (f) {
							return _Utils_update(
								f,
								{bN: $author$project$Model$EditMode});
						}),
					$elm$core$Platform$Cmd$none);
			case 134:
				var sessionId = msg.a;
				var ready = msg.b;
				var _v109 = model.aS;
				if (!_v109.$) {
					var serverUrl = _v109.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$setPlayerReady(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId)),
										_Utils_Tuple2(
										'ready',
										$elm$json$Json$Encode$bool(ready))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 135:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var _v111 = model.cx;
					if (!_v111.$) {
						var detail = _v111.a;
						return _Utils_Tuple2(
							model,
							$author$project$Ports$getSession(
								A2($author$project$Api$Encode$getSession, serverUrl, detail.eV)));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 136:
				var sessionId = msg.a;
				var _v112 = model.aS;
				if (!_v112.$) {
					var serverUrl = _v112.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cH: $elm$core$Maybe$Just(sessionId)
							}),
						$author$project$Ports$startGame(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 137:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var _v114 = model.cx;
					if (!_v114.$) {
						var detail = _v114.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{cH: $elm$core$Maybe$Nothing}),
							$author$project$Ports$getSession(
								A2($author$project$Api$Encode$getSession, serverUrl, detail.eV)));
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{cH: $elm$core$Maybe$Nothing}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err),
								cH: $elm$core$Maybe$Nothing
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 138:
				var playerId = msg.a;
				var playerName = msg.b;
				var mouseX = msg.c;
				var mouseY = msg.d;
				var _v115 = model.cx;
				if (!_v115.$) {
					var detail = _v115.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cx: $elm$core$Maybe$Just(
									_Utils_update(
										detail,
										{
											dj: $elm$core$Maybe$Just(
												{dh: $elm$core$Maybe$Nothing, dk: playerId, dl: playerName, d9: mouseX, bP: mouseY})
										}))
							}),
						$author$project$Ports$clearSelection(0));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 139:
				var mouseX = msg.a;
				var mouseY = msg.b;
				var _v116 = model.cx;
				if (!_v116.$) {
					var detail = _v116.a;
					var _v117 = detail.dj;
					if (!_v117.$) {
						var dragState = _v117.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									cx: $elm$core$Maybe$Just(
										_Utils_update(
											detail,
											{
												dj: $elm$core$Maybe$Just(
													_Utils_update(
														dragState,
														{d9: mouseX, bP: mouseY}))
											}))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 140:
				var playerId = msg.a;
				var _v118 = model.cx;
				if (!_v118.$) {
					var detail = _v118.a;
					var _v119 = detail.dj;
					if (!_v119.$) {
						var dragState = _v119.a;
						return (!_Utils_eq(dragState.dk, playerId)) ? _Utils_Tuple2(
							_Utils_update(
								model,
								{
									cx: $elm$core$Maybe$Just(
										_Utils_update(
											detail,
											{
												dj: $elm$core$Maybe$Just(
													_Utils_update(
														dragState,
														{
															dh: $elm$core$Maybe$Just(playerId)
														}))
											}))
								}),
							$elm$core$Platform$Cmd$none) : _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 141:
				var _v120 = model.cx;
				if (!_v120.$) {
					var detail = _v120.a;
					var _v121 = detail.dj;
					if (!_v121.$) {
						var dragState = _v121.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									cx: $elm$core$Maybe$Just(
										_Utils_update(
											detail,
											{
												dj: $elm$core$Maybe$Just(
													_Utils_update(
														dragState,
														{dh: $elm$core$Maybe$Nothing}))
											}))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 142:
				var _v122 = _Utils_Tuple2(model.aS, model.cx);
				if ((!_v122.a.$) && (!_v122.b.$)) {
					var serverUrl = _v122.a.a;
					var detail = _v122.b.a;
					var _v123 = detail.dj;
					if (!_v123.$) {
						var dragState = _v123.a;
						var _v124 = dragState.dh;
						if (!_v124.$) {
							var targetPlayerId = _v124.a;
							var currentData = A2($author$project$Model$getServerData, serverUrl, model.aT);
							var maybeSession = A2($author$project$Model$getSessionById, detail.eV, currentData.cE);
							if (!maybeSession.$) {
								var session = maybeSession.a;
								var targetIndex = A2(
									$elm$core$Maybe$map,
									$elm$core$Tuple$first,
									$elm$core$List$head(
										A2(
											$elm$core$List$filter,
											function (_v128) {
												var p = _v128.b;
												return _Utils_eq(p.fo, targetPlayerId);
											},
											A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, session.ev))));
								var draggedIndex = A2(
									$elm$core$Maybe$map,
									$elm$core$Tuple$first,
									$elm$core$List$head(
										A2(
											$elm$core$List$filter,
											function (_v127) {
												var p = _v127.b;
												return _Utils_eq(p.fo, dragState.dk);
											},
											A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, session.ev))));
								var _v126 = _Utils_Tuple2(draggedIndex, targetIndex);
								if ((!_v126.a.$) && (!_v126.b.$)) {
									var fromIdx = _v126.a.a;
									var toIdx = _v126.b.a;
									if (!_Utils_eq(fromIdx, toIdx)) {
										var reorderedPlayers = A3($author$project$Update$moveItem, fromIdx, toIdx, session.ev);
										var playerOrders = A2(
											$elm$core$List$indexedMap,
											F2(
												function (idx, p) {
													return $elm$json$Json$Encode$object(
														_List_fromArray(
															[
																_Utils_Tuple2(
																'userProfileId',
																$elm$json$Json$Encode$string(p.fo)),
																_Utils_Tuple2(
																'playerOrder',
																$elm$json$Json$Encode$int(idx))
															]));
												}),
											reorderedPlayers);
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													cx: $elm$core$Maybe$Just(
														_Utils_update(
															detail,
															{dj: $elm$core$Maybe$Nothing}))
												}),
											$author$project$Ports$reorderPlayers(
												$elm$json$Json$Encode$object(
													_List_fromArray(
														[
															_Utils_Tuple2(
															'serverUrl',
															$elm$json$Json$Encode$string(serverUrl)),
															_Utils_Tuple2(
															'sessionId',
															$elm$json$Json$Encode$string(detail.eV)),
															_Utils_Tuple2(
															'playerOrders',
															A2($elm$json$Json$Encode$list, $elm$core$Basics$identity, playerOrders))
														]))));
									} else {
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													cx: $elm$core$Maybe$Just(
														_Utils_update(
															detail,
															{dj: $elm$core$Maybe$Nothing}))
												}),
											$elm$core$Platform$Cmd$none);
									}
								} else {
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												cx: $elm$core$Maybe$Just(
													_Utils_update(
														detail,
														{dj: $elm$core$Maybe$Nothing}))
											}),
										$elm$core$Platform$Cmd$none);
								}
							} else {
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{
											cx: $elm$core$Maybe$Just(
												_Utils_update(
													detail,
													{dj: $elm$core$Maybe$Nothing}))
										}),
									$elm$core$Platform$Cmd$none);
							}
						} else {
							return _Utils_Tuple2(
								_Utils_update(
									model,
									{
										cx: $elm$core$Maybe$Just(
											_Utils_update(
												detail,
												{dj: $elm$core$Maybe$Nothing}))
									}),
								$elm$core$Platform$Cmd$none);
						}
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 143:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var _v130 = model.cx;
					if (!_v130.$) {
						var detail = _v130.a;
						return _Utils_Tuple2(
							model,
							$author$project$Ports$getSession(
								A2($author$project$Api$Encode$getSession, serverUrl, detail.eV)));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 144:
				var serverUrl = msg.a;
				var mouseY = msg.b;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							cv: $elm$core$Maybe$Just(
								{di: $elm$core$Maybe$Nothing, dm: serverUrl, bP: mouseY})
						}),
					$author$project$Ports$clearSelection(0));
			case 145:
				var mouseY = msg.a;
				var _v131 = model.cv;
				if (!_v131.$) {
					var dragState = _v131.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cv: $elm$core$Maybe$Just(
									_Utils_update(
										dragState,
										{bP: mouseY}))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 146:
				var serverUrl = msg.a;
				var _v132 = model.cv;
				if (!_v132.$) {
					var dragState = _v132.a;
					return (!_Utils_eq(dragState.dm, serverUrl)) ? _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cv: $elm$core$Maybe$Just(
									_Utils_update(
										dragState,
										{
											di: $elm$core$Maybe$Just(serverUrl)
										}))
							}),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 147:
				var _v133 = model.cv;
				if (!_v133.$) {
					var dragState = _v133.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cv: $elm$core$Maybe$Just(
									_Utils_update(
										dragState,
										{di: $elm$core$Maybe$Nothing}))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 148:
				var _v134 = model.cv;
				if (!_v134.$) {
					var dragState = _v134.a;
					var _v135 = dragState.di;
					if (!_v135.$) {
						var targetUrl = _v135.a;
						var targetIndex = A2(
							$elm$core$Maybe$map,
							$elm$core$Tuple$first,
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (_v138) {
										var s = _v138.b;
										return _Utils_eq(s.fl, targetUrl);
									},
									A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, model.cw))));
						var draggedIndex = A2(
							$elm$core$Maybe$map,
							$elm$core$Tuple$first,
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (_v137) {
										var s = _v137.b;
										return _Utils_eq(s.fl, dragState.dm);
									},
									A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, model.cw))));
						var _v136 = _Utils_Tuple2(draggedIndex, targetIndex);
						if ((!_v136.a.$) && (!_v136.b.$)) {
							var fromIdx = _v136.a.a;
							var toIdx = _v136.b.a;
							if (!_Utils_eq(fromIdx, toIdx)) {
								var reorderedServers = A3($author$project$Update$moveItem, fromIdx, toIdx, model.cw);
								var serverOrders = A2(
									$elm$core$List$indexedMap,
									F2(
										function (idx, s) {
											return $elm$json$Json$Encode$object(
												_List_fromArray(
													[
														_Utils_Tuple2(
														'url',
														$elm$json$Json$Encode$string(s.fl)),
														_Utils_Tuple2(
														'order',
														$elm$json$Json$Encode$int(idx))
													]));
										}),
									reorderedServers);
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{cv: $elm$core$Maybe$Nothing, cw: reorderedServers}),
									$author$project$Ports$reorderServers(
										$elm$json$Json$Encode$object(
											_List_fromArray(
												[
													_Utils_Tuple2(
													'serverOrders',
													A2($elm$json$Json$Encode$list, $elm$core$Basics$identity, serverOrders))
												]))));
							} else {
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{cv: $elm$core$Maybe$Nothing}),
									$elm$core$Platform$Cmd$none);
							}
						} else {
							return _Utils_Tuple2(
								_Utils_update(
									model,
									{cv: $elm$core$Maybe$Nothing}),
								$elm$core$Platform$Cmd$none);
						}
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{cv: $elm$core$Maybe$Nothing}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 149:
				var result = msg.a;
				if (!result.$) {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$author$project$Ports$getServers(0));
				}
			case 152:
				var sessionId = msg.a;
				var rulesIsSet = msg.b;
				var _v140 = model.aS;
				if (!_v140.$) {
					var serverUrl = _v140.a;
					var currentData = A2($author$project$Model$getServerData, serverUrl, model.aT);
					var currentUserId = function () {
						var _v145 = currentData.aH;
						if (_v145.$ === 2) {
							var info = _v145.a;
							return $elm$core$Maybe$Just(info.fn);
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}();
					var isManager = function () {
						var _v144 = _Utils_Tuple2(
							currentUserId,
							A2($author$project$Model$getSessionById, sessionId, currentData.cE));
						if ((!_v144.a.$) && (!_v144.b.$)) {
							var userId = _v144.a.a;
							var session = _v144.b.a;
							return A2($elm$core$List$member, userId, session.d1);
						} else {
							return false;
						}
					}();
					var cachedRules = A2($elm$core$Dict$get, sessionId, currentData.cC);
					var _v141 = function () {
						var _v142 = _Utils_Tuple2(rulesIsSet, cachedRules);
						if (_v142.a) {
							if (!_v142.b.$) {
								var rules = _v142.b.a;
								return _Utils_Tuple2(
									{c: $elm$core$Maybe$Nothing, dW: isManager, I: false, cl: rules, eV: sessionId, j: false},
									$elm$core$Platform$Cmd$none);
							} else {
								var _v143 = _v142.b;
								return _Utils_Tuple2(
									{c: $elm$core$Maybe$Nothing, dW: isManager, I: true, cl: $author$project$Api$Rules$defaultRules, eV: sessionId, j: false},
									$author$project$Ports$getRules(
										A2($author$project$Api$Encode$getRules, serverUrl, sessionId)));
							}
						} else {
							return _Utils_Tuple2(
								{c: $elm$core$Maybe$Nothing, dW: isManager, I: false, cl: $author$project$Api$Rules$defaultRules, eV: sessionId, j: false},
								$elm$core$Platform$Cmd$none);
						}
					}();
					var initialForm = _v141.a;
					var cmd = _v141.b;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$RulesDialog(initialForm))
							}),
						cmd);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 153:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var result = msg.c;
				if (!result.$) {
					var rules = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: function () {
									var _v147 = model.bg;
									if ((!_v147.$) && (_v147.a.$ === 11)) {
										var form = _v147.a.a;
										return $elm$core$Maybe$Just(
											$author$project$Model$RulesDialog(
												_Utils_update(
													form,
													{I: false, cl: rules})));
									} else {
										var other = _v147;
										return other;
									}
								}(),
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{
												cC: A3($elm$core$Dict$insert, sessionId, rules, sd.cC)
											});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRulesForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										I: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 154:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fj: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 155:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{de: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 156:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{e6: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 157:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									eD: $elm$core$String$toInt(val)
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 158:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{d2: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 159:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{e4: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 160:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{c_: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 161:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{ef: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 162:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{db: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 163:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{ey: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 164:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{dA: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 165:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fF: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 166:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fG: A2(
										$elm$core$Maybe$withDefault,
										r.fG,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 167:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fr: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 168:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									ft: A2(
										$elm$core$Maybe$withDefault,
										r.ft,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 169:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fs: A2(
										$elm$core$Maybe$withDefault,
										r.fs,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 170:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fw: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 171:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fx: A2(
										$elm$core$Maybe$withDefault,
										r.fx,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 172:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fu: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 173:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fv: A2(
										$elm$core$Maybe$withDefault,
										r.fv,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 174:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fy: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 175:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fz: A2(
										$elm$core$Maybe$withDefault,
										r.fz,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 176:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fD: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 177:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fE: A2(
										$elm$core$Maybe$withDefault,
										r.fE,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 178:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{fA: val});
						}),
					$elm$core$Platform$Cmd$none);
			case 179:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fB: A2(
										$elm$core$Maybe$withDefault,
										r.fB,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 180:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fH: A2(
										$elm$core$Maybe$withDefault,
										r.fH,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 181:
				var val = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateRules,
						model,
						function (r) {
							return _Utils_update(
								r,
								{
									fC: A2(
										$elm$core$Maybe$withDefault,
										r.fC,
										$elm$core$String$toInt(val))
								});
						}),
					$elm$core$Platform$Cmd$none);
			case 182:
				var _v148 = model.bg;
				if ((!_v148.$) && (_v148.a.$ === 11)) {
					var form = _v148.a.a;
					var _v149 = model.aS;
					if (!_v149.$) {
						var serverUrl = _v149.a;
						return _Utils_Tuple2(
							A2(
								$author$project$Update$updateRulesForm,
								model,
								function (f) {
									return _Utils_update(
										f,
										{c: $elm$core$Maybe$Nothing, j: true});
								}),
							$author$project$Ports$setRules(
								A3($author$project$Api$Encode$setRules, serverUrl, form.eV, form.cl)));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 183:
				var serverUrl = msg.a;
				var result = msg.b;
				var _v150 = _Utils_Tuple2(result, model.bg);
				if (!_v150.a.$) {
					if ((!_v150.b.$) && (_v150.b.a.$ === 11)) {
						var rules = _v150.a.a;
						var form = _v150.b.a.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Nothing,
									aT: A3(
										$author$project$Model$updateServerData,
										serverUrl,
										function (sd) {
											return _Utils_update(
												sd,
												{
													cC: A3($elm$core$Dict$insert, form.eV, rules, sd.cC)
												});
										},
										model.aT)
								}),
							$author$project$Ports$getSession(
								A2($author$project$Api$Encode$getSession, serverUrl, form.eV)));
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{bg: $elm$core$Maybe$Nothing}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					var err = _v150.a.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateRulesForm,
							model,
							function (f) {
								return _Utils_update(
									f,
									{
										c: $elm$core$Maybe$Just(err),
										j: false
									});
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 150:
				var sessionId = msg.a;
				var _v151 = model.aS;
				if (!_v151.$) {
					var serverUrl = _v151.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$getRules(
							A2($author$project$Api$Encode$getRules, serverUrl, sessionId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 151:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var result = msg.c;
				if (!result.$) {
					var rules = result.a;
					var modelWithCachedRules = _Utils_update(
						model,
						{
							aT: A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{
											cC: A3($elm$core$Dict$insert, sessionId, rules, sd.cC)
										});
								},
								model.aT)
						});
					var _v153 = model.bg;
					if ((!_v153.$) && (_v153.a.$ === 11)) {
						var form = _v153.a.a;
						return _Utils_eq(form.eV, sessionId) ? _Utils_Tuple2(
							_Utils_update(
								modelWithCachedRules,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$RulesDialog(
											_Utils_update(
												form,
												{I: false, cl: rules})))
								}),
							$elm$core$Platform$Cmd$none) : _Utils_Tuple2(modelWithCachedRules, $elm$core$Platform$Cmd$none);
					} else {
						return _Utils_Tuple2(modelWithCachedRules, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 184:
				var serverUrl = msg.a;
				return _Utils_eq(
					model.aS,
					$elm$core$Maybe$Just(serverUrl)) ? _Utils_Tuple2(
					model,
					$author$project$Ports$getSessions(serverUrl)) : _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
			case 185:
				var serverUrl = msg.a;
				var isConnected_ = msg.b;
				var currentState = A2($author$project$Model$getConnectionState, serverUrl, model.aT);
				var newState = function () {
					if (isConnected_) {
						if (currentState.$ === 2) {
							var info = currentState.a;
							return $author$project$Model$Connected(info);
						} else {
							return $author$project$Model$Connecting;
						}
					} else {
						return $author$project$Model$Disconnected;
					}
				}();
				return _Utils_Tuple2(
					A3($author$project$Update$setConnectionState, serverUrl, newState, model),
					$elm$core$Platform$Cmd$none);
			case 186:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var year = msg.c;
				var updateConflicts = function (data) {
					var sessionConflicts = A2(
						$elm$core$Set$insert,
						year,
						A2(
							$elm$core$Maybe$withDefault,
							$elm$core$Set$empty,
							A2($elm$core$Dict$get, sessionId, data.bY)));
					return _Utils_update(
						data,
						{
							bY: A3($elm$core$Dict$insert, sessionId, sessionConflicts, data.bY)
						});
				};
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							aT: A3($author$project$Model$updateServerData, serverUrl, updateConflicts, model.aT)
						}),
					$elm$core$Platform$Cmd$none);
			case 246:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var action = msg.c;
				var isSelectedServer = _Utils_eq(
					model.aS,
					$elm$core$Maybe$Just(serverUrl));
				if (action === 'deleted') {
					var updatedServerData = A3(
						$author$project$Model$updateServerData,
						serverUrl,
						function (sd) {
							return _Utils_eq(
								sd.bK,
								$elm$core$Maybe$Just(sessionId)) ? _Utils_update(
								sd,
								{bK: $elm$core$Maybe$Nothing}) : sd;
						},
						model.aT);
					var closeDetail = isSelectedServer && function () {
						var _v156 = model.cx;
						if (!_v156.$) {
							var detail = _v156.a;
							return _Utils_eq(detail.eV, sessionId);
						} else {
							return false;
						}
					}();
					return _Utils_Tuple2(
						closeDetail ? _Utils_update(
							model,
							{aT: updatedServerData, cx: $elm$core$Maybe$Nothing}) : _Utils_update(
							model,
							{aT: updatedServerData}),
						$author$project$Ports$getSessions(serverUrl));
				} else {
					return _Utils_Tuple2(
						model,
						$elm$core$Platform$Cmd$batch(
							_List_fromArray(
								[
									$author$project$Ports$getSessions(serverUrl),
									function () {
									if (isSelectedServer) {
										var _v157 = model.cx;
										if (!_v157.$) {
											var detail = _v157.a;
											return _Utils_eq(detail.eV, sessionId) ? $author$project$Ports$getSession(
												A2($author$project$Api$Encode$getSession, serverUrl, sessionId)) : $elm$core$Platform$Cmd$none;
										} else {
											return $elm$core$Platform$Cmd$none;
										}
									} else {
										return $elm$core$Platform$Cmd$none;
									}
								}()
								])));
				}
			case 247:
				var serverUrl = msg.a;
				var invitationId = msg.b;
				var action = msg.c;
				if (action === 'deleted') {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (sd) {
										return _Utils_update(
											sd,
											{
												bD: A2(
													$elm$core$List$filter,
													function (inv) {
														return !_Utils_eq(inv.dM, invitationId);
													},
													sd.bD),
												cu: A2(
													$elm$core$List$filter,
													function (inv) {
														return !_Utils_eq(inv.dM, invitationId);
													},
													sd.cu)
											});
									},
									model.aT)
							}),
						$author$project$Ports$getSessions(serverUrl));
				} else {
					return _Utils_Tuple2(
						model,
						$elm$core$Platform$Cmd$batch(
							_List_fromArray(
								[
									$author$project$Ports$getInvitations(serverUrl),
									$author$project$Ports$getSentInvitations(serverUrl)
								])));
				}
			case 248:
				var serverUrl = msg.a;
				return _Utils_Tuple2(
					model,
					$author$project$Ports$getRaces(serverUrl));
			case 249:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var isSelectedServer = _Utils_eq(
					model.aS,
					$elm$core$Maybe$Just(serverUrl));
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							aT: A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									return _Utils_update(
										sd,
										{
											cC: A2($elm$core$Dict$remove, sessionId, sd.cC)
										});
								},
								model.aT)
						}),
					function () {
						if (isSelectedServer) {
							var _v159 = model.bg;
							if ((!_v159.$) && (_v159.a.$ === 11)) {
								var form = _v159.a.a;
								return _Utils_eq(form.eV, sessionId) ? $author$project$Ports$getRules(
									A2($author$project$Api$Encode$getRules, serverUrl, sessionId)) : $elm$core$Platform$Cmd$none;
							} else {
								return $elm$core$Platform$Cmd$none;
							}
						} else {
							return $elm$core$Platform$Cmd$none;
						}
					}());
			case 250:
				var serverUrl = msg.a;
				var isSelectedServer = _Utils_eq(
					model.aS,
					$elm$core$Maybe$Just(serverUrl));
				return _Utils_Tuple2(
					model,
					$elm$core$Platform$Cmd$batch(
						_List_fromArray(
							[
								$author$project$Ports$getSessions(serverUrl),
								function () {
								if (isSelectedServer) {
									var _v160 = model.cx;
									if (!_v160.$) {
										var detail = _v160.a;
										return $author$project$Ports$getSession(
											A2($author$project$Api$Encode$getSession, serverUrl, detail.eV));
									} else {
										return $elm$core$Platform$Cmd$none;
									}
								} else {
									return $elm$core$Platform$Cmd$none;
								}
							}()
							])));
			case 190:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var action = msg.c;
				var maybeYear = msg.d;
				var _v161 = _Utils_Tuple2(action, maybeYear);
				if (!_v161.b.$) {
					if (_v161.a === 'deleted') {
						var year = _v161.b.a;
						return _Utils_Tuple2(
							A4($author$project$Update$removeSessionTurn, serverUrl, sessionId, year, model),
							$elm$core$Platform$Cmd$none);
					} else {
						var year = _v161.b.a;
						return _Utils_Tuple2(
							model,
							$elm$core$Platform$Cmd$batch(
								_List_fromArray(
									[
										$author$project$Ports$getTurn(
										A4($author$project$Api$Encode$getTurn, serverUrl, sessionId, year, true)),
										$author$project$Ports$getSession(
										A2($author$project$Api$Encode$getSession, serverUrl, sessionId)),
										$author$project$Ports$getOrdersStatus(
										A2($author$project$Api$Encode$getOrdersStatus, serverUrl, sessionId))
									])));
					}
				} else {
					if (_v161.a === 'ready') {
						var _v162 = _v161.b;
						return _Utils_Tuple2(
							model,
							$elm$core$Platform$Cmd$batch(
								_List_fromArray(
									[
										$author$project$Ports$getLatestTurn(
										A2($author$project$Api$Encode$getLatestTurn, serverUrl, sessionId)),
										$author$project$Ports$getSession(
										A2($author$project$Api$Encode$getSession, serverUrl, sessionId)),
										$author$project$Ports$getOrdersStatus(
										A2($author$project$Api$Encode$getOrdersStatus, serverUrl, sessionId))
									])));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				}
			case 251:
				var serverUrl = msg.a;
				var sessionId = msg.b;
				var action = msg.c;
				return (action === 'updated') ? _Utils_Tuple2(
					model,
					$author$project$Ports$getOrdersStatus(
						A2($author$project$Api$Encode$getOrdersStatus, serverUrl, sessionId))) : _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
			case 252:
				var serverUrl = msg.a;
				return _Utils_Tuple2(
					model,
					$author$project$Ports$getPendingRegistrations(serverUrl));
			case 187:
				var sessionId = msg.a;
				var year = msg.b;
				var isLatestYear = msg.c;
				var _v163 = model.aS;
				if (!_v163.$) {
					var serverUrl = _v163.a;
					var serverData = A2($author$project$Model$getServerData, serverUrl, model.aT);
					var raceName = A2(
						$elm$core$Maybe$withDefault,
						'Player',
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.ec;
							},
							A2($elm$core$Dict$get, sessionId, serverData.cB)));
					var currentUserId = function () {
						var _v170 = serverData.aH;
						if (_v170.$ === 2) {
							var info = _v170.a;
							return $elm$core$Maybe$Just(info.fn);
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}();
					var playerNumber = function () {
						var _v166 = $elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (s) {
									return _Utils_eq(s.dM, sessionId);
								},
								serverData.cE));
						if (!_v166.$) {
							var session = _v166.a;
							if (!currentUserId.$) {
								var userId = currentUserId.a;
								return A2(
									$elm$core$Maybe$withDefault,
									1,
									A2(
										$elm$core$Maybe$map,
										function (_v169) {
											var idx = _v169.a;
											return idx + 1;
										},
										$elm$core$List$head(
											A2(
												$elm$core$List$filter,
												function (_v168) {
													var p = _v168.b;
													return _Utils_eq(p.fo, userId);
												},
												A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, session.ev)))));
							} else {
								return 1;
							}
						} else {
							return 1;
						}
					}();
					var cachedTurnFiles = A2(
						$elm$core$Maybe$andThen,
						$elm$core$Dict$get(year),
						A2($elm$core$Dict$get, sessionId, serverData.cD));
					var turnCmd = function () {
						if (!cachedTurnFiles.$) {
							return $elm$core$Platform$Cmd$none;
						} else {
							return $author$project$Ports$getTurn(
								A4($author$project$Api$Encode$getTurn, serverUrl, sessionId, year, isLatestYear));
						}
					}();
					var cachedOrdersStatus = A2(
						$elm$core$Maybe$andThen,
						$elm$core$Dict$get(year),
						A2($elm$core$Dict$get, sessionId, serverData.cA));
					var form = function () {
						if (!cachedTurnFiles.$) {
							var turnFiles = cachedTurnFiles.a;
							return {
								c: $elm$core$Maybe$Nothing,
								bE: isLatestYear,
								I: false,
								bZ: cachedOrdersStatus,
								ay: playerNumber,
								az: raceName,
								eV: sessionId,
								cR: $elm$core$Maybe$Just(turnFiles),
								fO: year
							};
						} else {
							var emptyForm = A5($author$project$Model$emptyTurnFilesForm, sessionId, year, raceName, playerNumber, isLatestYear);
							return _Utils_update(
								emptyForm,
								{bZ: cachedOrdersStatus});
						}
					}();
					var ordersCmd = (isLatestYear && _Utils_eq(cachedOrdersStatus, $elm$core$Maybe$Nothing)) ? $author$project$Ports$getOrdersStatus(
						A2($author$project$Api$Encode$getOrdersStatus, serverUrl, sessionId)) : $elm$core$Platform$Cmd$none;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$TurnFilesDialog(form))
							}),
						$elm$core$Platform$Cmd$batch(
							_List_fromArray(
								[turnCmd, ordersCmd])));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 188:
				var serverUrl = msg.a;
				var result = msg.b;
				var isSelectedServer = _Utils_eq(
					model.aS,
					$elm$core$Maybe$Just(serverUrl));
				var cachedModel = function () {
					if (!result.$) {
						var turnFiles = result.a;
						return A4(
							$author$project$Update$storeSessionTurn,
							serverUrl,
							turnFiles.eV,
							$elm$core$Maybe$Just(turnFiles),
							model);
					} else {
						return model;
					}
				}();
				var _v171 = _Utils_Tuple2(model.bg, isSelectedServer);
				if (((!_v171.a.$) && (_v171.a.a.$ === 12)) && _v171.b) {
					var form = _v171.a.a.a;
					if (!result.$) {
						var turnFiles = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								cachedModel,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$TurnFilesDialog(
											_Utils_update(
												form,
												{
													c: $elm$core$Maybe$Nothing,
													I: false,
													cR: $elm$core$Maybe$Just(turnFiles)
												})))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						var err = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								cachedModel,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$TurnFilesDialog(
											_Utils_update(
												form,
												{
													c: $elm$core$Maybe$Just(err),
													I: false
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(cachedModel, $elm$core$Platform$Cmd$none);
				}
			case 189:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var turnFiles = result.a;
					return _Utils_Tuple2(
						A4(
							$author$project$Update$storeSessionTurn,
							serverUrl,
							turnFiles.eV,
							$elm$core$Maybe$Just(turnFiles),
							model),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 200:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var ordersStatus = result.a;
					var updatedModel = _Utils_update(
						model,
						{
							aT: A3(
								$author$project$Model$updateServerData,
								serverUrl,
								function (sd) {
									var existingYears = A2(
										$elm$core$Maybe$withDefault,
										$elm$core$Dict$empty,
										A2($elm$core$Dict$get, ordersStatus.eV, sd.cA));
									var updatedYears = A3($elm$core$Dict$insert, ordersStatus.et, ordersStatus, existingYears);
									return _Utils_update(
										sd,
										{
											cA: A3($elm$core$Dict$insert, ordersStatus.eV, updatedYears, sd.cA)
										});
								},
								model.aT)
						});
					var isSelectedServer = _Utils_eq(
						model.aS,
						$elm$core$Maybe$Just(serverUrl));
					var finalModel = function () {
						var _v176 = _Utils_Tuple2(model.bg, isSelectedServer);
						if (((!_v176.a.$) && (_v176.a.a.$ === 12)) && _v176.b) {
							var form = _v176.a.a.a;
							return (_Utils_eq(form.eV, ordersStatus.eV) && _Utils_eq(form.fO, ordersStatus.et)) ? _Utils_update(
								updatedModel,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$TurnFilesDialog(
											_Utils_update(
												form,
												{
													bZ: $elm$core$Maybe$Just(ordersStatus)
												})))
								}) : updatedModel;
						} else {
							return updatedModel;
						}
					}();
					return _Utils_Tuple2(finalModel, $elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 191:
				var sessionId = msg.a;
				var _v177 = model.aS;
				if (!_v177.$) {
					var serverUrl = _v177.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$openGameDir(
							A2($author$project$Api$Encode$openGameDir, serverUrl, sessionId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 192:
				var sessionId = msg.a;
				var _v178 = model.aS;
				if (!_v178.$) {
					var serverUrl = _v178.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$launchStars(
							A2($author$project$Api$Encode$launchStars, serverUrl, sessionId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 193:
				var result = msg.a;
				if (!result.$) {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				} else {
					var errMsg = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(errMsg)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 194:
				var sessionId = msg.a;
				var _v180 = model.aS;
				if (!_v180.$) {
					var serverUrl = _v180.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$checkHasStarsExe(
							A2($author$project$Api$Encode$checkHasStarsExe, serverUrl, sessionId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 195:
				var result = msg.a;
				if (!result.$) {
					var serverUrl = result.a.eS;
					var sessionId = result.a.eV;
					var hasStarsExe = result.a.dG;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								aT: A3(
									$author$project$Model$updateServerData,
									serverUrl,
									function (data) {
										return _Utils_update(
											data,
											{
												cz: A3($elm$core$Dict$insert, sessionId, hasStarsExe, data.cz)
											});
									},
									model.aT)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 196:
				var sessionId = msg.a;
				var _v182 = model.aS;
				if (!_v182.$) {
					var serverUrl = _v182.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$downloadSessionBackup(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 197:
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 198:
				var sessionId = msg.a;
				var _v184 = model.aS;
				if (!_v184.$) {
					var serverUrl = _v184.a;
					return _Utils_Tuple2(
						model,
						$author$project$Ports$downloadHistoricBackup(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'sessionId',
										$elm$json$Json$Encode$string(sessionId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 199:
				var result = msg.b;
				if (!result.$) {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 201:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just($author$project$Model$SettingsDialog)
						}),
					$author$project$Ports$getAppSettings(0));
			case 202:
				return _Utils_Tuple2(
					model,
					$author$project$Ports$selectServersDir(0));
			case 203:
				var result = msg.a;
				if (!result.$) {
					var settings = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: $elm$core$Maybe$Just(
									{c1: settings.c1, eT: settings.eT, fm: settings.fm, fq: settings.fq, fK: settings.fK, fP: settings.fP})
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 204:
				var result = msg.a;
				if (!result.$) {
					var settings = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: $elm$core$Maybe$Just(
									{c1: settings.c1, eT: settings.eT, fm: settings.fm, fq: settings.fq, fK: settings.fK, fP: settings.fP})
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 205:
				var enabled = msg.a;
				return _Utils_Tuple2(
					model,
					$author$project$Ports$setAutoDownloadStars(enabled));
			case 206:
				var result = msg.a;
				if (!result.$) {
					var settings = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: $elm$core$Maybe$Just(
									{c1: settings.c1, eT: settings.eT, fm: settings.fm, fq: settings.fq, fK: settings.fK, fP: settings.fP})
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 207:
				var enabled = msg.a;
				return _Utils_Tuple2(
					model,
					$author$project$Ports$setUseWine(enabled));
			case 208:
				var result = msg.a;
				if (!result.$) {
					var settings = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: $elm$core$Maybe$Just(
									{c1: settings.c1, eT: settings.eT, fm: settings.fm, fq: settings.fq, fK: settings.fK, fP: settings.fP}),
								cZ: $elm$core$Maybe$Nothing
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 209:
				return _Utils_Tuple2(
					model,
					$author$project$Ports$selectWinePrefixesDir(0));
			case 210:
				var result = msg.a;
				if (!result.$) {
					var settings = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: $elm$core$Maybe$Just(
									{c1: settings.c1, eT: settings.eT, fm: settings.fm, fq: settings.fq, fK: settings.fK, fP: settings.fP})
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 211:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{cY: true, cZ: $elm$core$Maybe$Nothing}),
					$author$project$Ports$checkWineInstall(0));
			case 212:
				var result = msg.a;
				if (!result.$) {
					var checkResult = result.a;
					var updatedSettings = A2(
						$elm$core$Maybe$map,
						function (s) {
							return _Utils_update(
								s,
								{fq: checkResult.fp});
						},
						model.a2);
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: updatedSettings,
								cY: false,
								cZ: $elm$core$Maybe$Just(checkResult.bM)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var errMsg = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								cY: false,
								cZ: $elm$core$Maybe$Just('Check failed: ' + errMsg)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 213:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bU: true}),
					$author$project$Ports$checkNtvdmSupport(0));
			case 214:
				var result = msg.a;
				if (!result.$) {
					var checkResult = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bU: false,
								bV: $elm$core$Maybe$Just(checkResult)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var errMsg = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bU: false,
								bV: $elm$core$Maybe$Just(
									{c2: false, dI: $elm$core$Maybe$Nothing, dS: false, bM: 'Check failed: ' + errMsg})
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 263:
				var sessionId = msg.a;
				var year = msg.b;
				var raceName = msg.c;
				var playerNumber = msg.d;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just(
								$author$project$Model$MapViewerDialog(
									A4($author$project$Model$emptyMapViewerForm, sessionId, year, raceName, playerNumber)))
						}),
					$elm$core$Platform$Cmd$none);
			case 264:
				var widthStr = msg.a;
				var _v193 = $elm$core$String$toInt(widthStr);
				if (!_v193.$) {
					var width = _v193.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateMapOptions,
							model,
							function (opts) {
								return _Utils_update(
									opts,
									{
										fJ: A3($elm$core$Basics$clamp, 400, 4096, width)
									});
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 265:
				var heightStr = msg.a;
				var _v194 = $elm$core$String$toInt(heightStr);
				if (!_v194.$) {
					var height = _v194.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateMapOptions,
							model,
							function (opts) {
								return _Utils_update(
									opts,
									{
										dH: A3($elm$core$Basics$clamp, 300, 4096, height)
									});
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 266:
				var preset = msg.a;
				var _v195 = function () {
					switch (preset) {
						case '800x600':
							return _Utils_Tuple2(800, 600);
						case '1024x768':
							return _Utils_Tuple2(1024, 768);
						case '1920x1080':
							return _Utils_Tuple2(1920, 1080);
						case '2560x1440':
							return _Utils_Tuple2(2560, 1440);
						default:
							return _Utils_Tuple2(1024, 768);
					}
				}();
				var width = _v195.a;
				var height = _v195.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{dH: height, fJ: width});
						}),
					$elm$core$Platform$Cmd$none);
			case 267:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{e0: !opts.e0});
						}),
					$elm$core$Platform$Cmd$none);
			case 268:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{eY: !opts.eY});
						}),
					$elm$core$Platform$Cmd$none);
			case 269:
				var yearsStr = msg.a;
				var _v197 = $elm$core$String$toInt(yearsStr);
				if (!_v197.$) {
					var years = _v197.a;
					return _Utils_Tuple2(
						A2(
							$author$project$Update$updateMapOptions,
							model,
							function (opts) {
								return _Utils_update(
									opts,
									{
										eX: A3($elm$core$Basics$clamp, 0, 10, years)
									});
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 270:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{e$: !opts.e$});
						}),
					$elm$core$Platform$Cmd$none);
			case 271:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{e2: !opts.e2});
						}),
					$elm$core$Platform$Cmd$none);
			case 272:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{e_: !opts.e_});
						}),
					$elm$core$Platform$Cmd$none);
			case 273:
				return _Utils_Tuple2(
					A2(
						$author$project$Update$updateMapOptions,
						model,
						function (opts) {
							return _Utils_update(
								opts,
								{e1: !opts.e1});
						}),
					$elm$core$Platform$Cmd$none);
			case 274:
				var _v198 = model.bg;
				if ((!_v198.$) && (_v198.a.$ === 17)) {
					var form = _v198.a.a;
					var _v199 = model.aS;
					if (!_v199.$) {
						var serverUrl = _v199.a;
						var serverData = A2($author$project$Model$getServerData, serverUrl, model.aT);
						var maybeTurnFiles = A2(
							$elm$core$Maybe$andThen,
							$elm$core$Dict$get(form.fO),
							A2($elm$core$Dict$get, form.eV, serverData.cD));
						if (!maybeTurnFiles.$) {
							var turnFiles = maybeTurnFiles.a;
							return _Utils_Tuple2(
								_Utils_update(
									model,
									{
										bg: $elm$core$Maybe$Just(
											$author$project$Model$MapViewerDialog(
												_Utils_update(
													form,
													{c: $elm$core$Maybe$Nothing, br: true})))
									}),
								$author$project$Ports$generateMap(
									A5($author$project$Api$Encode$generateMap, serverUrl, form.eV, form.fO, form.bX, turnFiles)));
						} else {
							return _Utils_Tuple2(
								_Utils_update(
									model,
									{
										bg: $elm$core$Maybe$Just(
											$author$project$Model$MapViewerDialog(
												_Utils_update(
													form,
													{
														c: $elm$core$Maybe$Just('Turn files not available. Please open the Turn Files dialog first.')
													})))
									}),
								$elm$core$Platform$Cmd$none);
						}
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 275:
				var result = msg.a;
				var _v201 = model.bg;
				if ((!_v201.$) && (_v201.a.$ === 17)) {
					var form = _v201.a.a;
					if (!result.$) {
						var svg = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$MapViewerDialog(
											_Utils_update(
												form,
												{
													bq: $elm$core$Maybe$Just(svg),
													br: false
												})))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						var err = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$MapViewerDialog(
											_Utils_update(
												form,
												{
													c: $elm$core$Maybe$Just(err),
													br: false
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 276:
				var _v203 = model.bg;
				if ((!_v203.$) && (_v203.a.$ === 17)) {
					var form = _v203.a.a;
					var _v204 = _Utils_Tuple2(model.aS, form.bq);
					if ((!_v204.a.$) && (!_v204.b.$)) {
						var serverUrl = _v204.a.a;
						var svg = _v204.b.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$MapViewerDialog(
											_Utils_update(
												form,
												{cn: true})))
								}),
							$author$project$Ports$saveMap(
								A6($author$project$Api$Encode$saveMap, serverUrl, form.eV, form.fO, form.az, form.ay, svg)));
					} else {
						return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 277:
				var result = msg.a;
				var _v205 = model.bg;
				if ((!_v205.$) && (_v205.a.$ === 17)) {
					var form = _v205.a.a;
					if (!result.$) {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$MapViewerDialog(
											_Utils_update(
												form,
												{cn: false})))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						var err = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$MapViewerDialog(
											_Utils_update(
												form,
												{
													c: $elm$core$Maybe$Just(err),
													cn: false
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 278:
				return _Utils_Tuple2(
					model,
					$author$project$Ports$requestFullscreen('map-viewer-frame'));
			case 215:
				var _v207 = model.aS;
				if (!_v207.$) {
					var serverUrl = _v207.a;
					var serverData = A2($author$project$Model$getServerData, serverUrl, model.aT);
					var currentUserId = function () {
						var _v208 = serverData.aH;
						if (_v208.$ === 2) {
							var info = _v208.a;
							return info.fn;
						} else {
							return '';
						}
					}();
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										A2($author$project$Model$emptyUsersListState, currentUserId, serverData.cS)))
							}),
						$elm$core$Platform$Cmd$batch(
							_List_fromArray(
								[
									$author$project$Ports$getUserProfiles(serverUrl),
									$author$project$Ports$getPendingRegistrations(serverUrl)
								])));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 216:
				var query = msg.a;
				var _v209 = model.bg;
				if ((!_v209.$) && (_v209.a.$ === 14)) {
					var state = _v209.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{bo: query})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 217:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just(
								$author$project$Model$CreateUserDialog($author$project$Model$emptyCreateUserForm))
						}),
					$elm$core$Platform$Cmd$none);
			case 218:
				var nickname = msg.a;
				var _v210 = model.bg;
				if ((!_v210.$) && (_v210.a.$ === 15)) {
					var form = _v210.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$CreateUserDialog(
										_Utils_update(
											form,
											{ee: nickname})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 219:
				var email = msg.a;
				var _v211 = model.bg;
				if ((!_v211.$) && (_v211.a.$ === 15)) {
					var form = _v211.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$CreateUserDialog(
										_Utils_update(
											form,
											{dp: email})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 220:
				var _v212 = _Utils_Tuple2(model.bg, model.aS);
				if (((!_v212.a.$) && (_v212.a.a.$ === 15)) && (!_v212.b.$)) {
					var form = _v212.a.a.a;
					var serverUrl = _v212.b.a;
					return ($elm$core$String$isEmpty(form.ee) || $elm$core$String$isEmpty(form.dp)) ? _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$CreateUserDialog(
										_Utils_update(
											form,
											{
												c: $elm$core$Maybe$Just('Nickname and email are required')
											})))
							}),
						$elm$core$Platform$Cmd$none) : _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$CreateUserDialog(
										_Utils_update(
											form,
											{c: $elm$core$Maybe$Nothing, j: true})))
							}),
						$author$project$Ports$createUser(
							A3($author$project$Api$Encode$createUser, serverUrl, form.ee, form.dp)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 221:
				var serverUrl = msg.a;
				var result = msg.b;
				var _v213 = model.bg;
				if ((!_v213.$) && (_v213.a.$ === 15)) {
					var form = _v213.a.a;
					if (!result.$) {
						var user = result.a;
						var createdProfile = {dp: user.dp, dM: user.dM, dT: false, dW: false, bM: $elm$core$Maybe$Nothing, ee: user.ee};
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$CreateUserDialog(
											_Utils_update(
												form,
												{
													ba: $elm$core$Maybe$Just(createdProfile),
													j: false
												})))
								}),
							$author$project$Ports$getUserProfiles(serverUrl));
					} else {
						var err = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$CreateUserDialog(
											_Utils_update(
												form,
												{
													c: $elm$core$Maybe$Just(err),
													j: false
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 222:
				var userId = msg.a;
				var nickname = msg.b;
				var _v215 = model.bg;
				if ((!_v215.$) && (_v215.a.$ === 14)) {
					var state = _v215.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												be: A2($author$project$Model$ConfirmingDelete, userId, nickname)
											})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 223:
				var _v216 = model.bg;
				if ((!_v216.$) && (_v216.a.$ === 14)) {
					var state = _v216.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{be: $author$project$Model$NoDelete})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 224:
				var userId = msg.a;
				var _v217 = _Utils_Tuple2(model.aS, model.bg);
				if (((!_v217.a.$) && (!_v217.b.$)) && (_v217.b.a.$ === 14)) {
					var serverUrl = _v217.a.a;
					var state = _v217.b.a.a;
					var nickname = A2(
						$elm$core$Maybe$withDefault,
						userId,
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.ee;
							},
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (u) {
										return _Utils_eq(u.dM, userId);
									},
									state.cT))));
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												be: A2($author$project$Model$DeletingUser, userId, nickname)
											})))
							}),
						$author$project$Ports$deleteUser(
							A2($author$project$Api$Encode$deleteUser, serverUrl, userId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 225:
				var serverUrl = msg.a;
				var result = msg.b;
				var _v218 = model.bg;
				if ((!_v218.$) && (_v218.a.$ === 14)) {
					var state = _v218.a.a;
					if (!result.$) {
						var deletedUserId = function () {
							var _v220 = state.be;
							if (_v220.$ === 2) {
								var uid = _v220.a;
								return uid;
							} else {
								return '';
							}
						}();
						var updatedUsers = A2(
							$elm$core$List$filter,
							function (u) {
								return !_Utils_eq(u.dM, deletedUserId);
							},
							state.cT);
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{be: $author$project$Model$NoDelete, cT: updatedUsers})))
								}),
							$author$project$Ports$getUserProfiles(serverUrl));
					} else {
						var err = result.a;
						var nickname = function () {
							var _v221 = state.be;
							if (_v221.$ === 2) {
								var n = _v221.b;
								return n;
							} else {
								return 'User';
							}
						}();
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{
													be: A2($author$project$Model$DeleteError, nickname, err)
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 226:
				var userId = msg.a;
				var _v222 = model.bg;
				if ((!_v222.$) && (_v222.a.$ === 14)) {
					var state = _v222.a.a;
					var nickname = A2(
						$elm$core$Maybe$withDefault,
						userId,
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.ee;
							},
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (u) {
										return _Utils_eq(u.dM, userId);
									},
									state.cT))));
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												ck: A2($author$project$Model$ConfirmingReset, userId, nickname)
											})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 227:
				var _v223 = model.bg;
				if ((!_v223.$) && (_v223.a.$ === 14)) {
					var state = _v223.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{ck: $author$project$Model$NoReset})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 228:
				var userId = msg.a;
				var _v224 = _Utils_Tuple2(model.bg, model.aS);
				if (((!_v224.a.$) && (_v224.a.a.$ === 14)) && (!_v224.b.$)) {
					var state = _v224.a.a.a;
					var serverUrl = _v224.b.a;
					var nickname = A2(
						$elm$core$Maybe$withDefault,
						userId,
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.ee;
							},
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (u) {
										return _Utils_eq(u.dM, userId);
									},
									state.cT))));
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												ck: A2($author$project$Model$ResettingApikey, userId, nickname)
											})))
							}),
						$author$project$Ports$resetUserApikey(
							$elm$json$Json$Encode$object(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'serverUrl',
										$elm$json$Json$Encode$string(serverUrl)),
										_Utils_Tuple2(
										'userId',
										$elm$json$Json$Encode$string(userId))
									]))));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 229:
				var result = msg.a;
				var _v225 = model.bg;
				if ((!_v225.$) && (_v225.a.$ === 14)) {
					var state = _v225.a.a;
					if (!result.$) {
						var newApikey = result.a;
						var nickname = function () {
							var _v227 = state.ck;
							switch (_v227.$) {
								case 2:
									var n = _v227.b;
									return n;
								case 1:
									var n = _v227.b;
									return n;
								default:
									return 'User';
							}
						}();
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{
													ck: A2($author$project$Model$ResetComplete, nickname, newApikey)
												})))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						var err = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{ck: $author$project$Model$NoReset}))),
									c: $elm$core$Maybe$Just(err)
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 230:
				var _v228 = model.bg;
				if ((!_v228.$) && (_v228.a.$ === 14)) {
					var state = _v228.a.a;
					var newPane = function () {
						var _v231 = state.a_;
						if (!_v231) {
							return 1;
						} else {
							return 0;
						}
					}();
					var cmd = function () {
						var _v229 = _Utils_Tuple2(newPane, model.aS);
						if ((_v229.a === 1) && (!_v229.b.$)) {
							var _v230 = _v229.a;
							var serverUrl = _v229.b.a;
							return $author$project$Ports$getPendingRegistrations(serverUrl);
						} else {
							return $elm$core$Platform$Cmd$none;
						}
					}();
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{a_: newPane})))
							}),
						cmd);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 231:
				var serverUrl = msg.a;
				var result = msg.b;
				if (!result.$) {
					var pendingList = result.a;
					var updatedServerData = A3(
						$author$project$Model$updateServerData,
						serverUrl,
						function (sd) {
							return _Utils_update(
								sd,
								{
									b2: $elm$core$List$length(pendingList)
								});
						},
						model.aT);
					var pendingProfiles = A2(
						$elm$core$List$map,
						function (p) {
							return {dp: p.dp, dM: p.dM, dT: false, dW: false, bM: p.bM, ee: p.ee};
						},
						pendingList);
					var updatedDialog = function () {
						var _v233 = model.bg;
						if ((!_v233.$) && (_v233.a.$ === 14)) {
							var state = _v233.a.a;
							return $elm$core$Maybe$Just(
								$author$project$Model$UsersListDialog(
									_Utils_update(
										state,
										{b3: pendingProfiles})));
						} else {
							var other = _v233;
							return other;
						}
					}();
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{bg: updatedDialog, aT: updatedServerData}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 232:
				var userId = msg.a;
				var nickname = msg.b;
				var message = msg.c;
				var _v234 = model.bg;
				if ((!_v234.$) && (_v234.a.$ === 14)) {
					var state = _v234.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												b1: A3($author$project$Model$ViewingMessage, userId, nickname, message)
											})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 233:
				var _v235 = model.bg;
				if ((!_v235.$) && (_v235.a.$ === 14)) {
					var state = _v235.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{b1: $author$project$Model$NoPendingAction})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 234:
				var userId = msg.a;
				var nickname = msg.b;
				var _v236 = model.bg;
				if ((!_v236.$) && (_v236.a.$ === 14)) {
					var state = _v236.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												b1: A2($author$project$Model$ConfirmingApprove, userId, nickname)
											})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 235:
				var _v237 = model.bg;
				if ((!_v237.$) && (_v237.a.$ === 14)) {
					var state = _v237.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{b1: $author$project$Model$NoPendingAction})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 236:
				var userId = msg.a;
				var _v238 = _Utils_Tuple2(model.aS, model.bg);
				if (((!_v238.a.$) && (!_v238.b.$)) && (_v238.b.a.$ === 14)) {
					var serverUrl = _v238.a.a;
					var state = _v238.b.a.a;
					var nickname = A2(
						$elm$core$Maybe$withDefault,
						userId,
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.ee;
							},
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (u) {
										return _Utils_eq(u.dM, userId);
									},
									state.b3))));
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												b1: A2($author$project$Model$ApprovingUser, userId, nickname)
											})))
							}),
						$author$project$Ports$approveRegistration(
							A2($author$project$Api$Encode$approveRegistration, serverUrl, userId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 237:
				var serverUrl = msg.a;
				var result = msg.b;
				var _v239 = model.bg;
				if ((!_v239.$) && (_v239.a.$ === 14)) {
					var state = _v239.a.a;
					if (!result.$) {
						var apikey = result.a;
						var nickname = function () {
							var _v242 = state.b1;
							if (_v242.$ === 3) {
								var n = _v242.b;
								return n;
							} else {
								return 'User';
							}
						}();
						var approvedUserId = function () {
							var _v241 = state.b1;
							if (_v241.$ === 3) {
								var uid = _v241.a;
								return uid;
							} else {
								return '';
							}
						}();
						var updatedPending = A2(
							$elm$core$List$filter,
							function (u) {
								return !_Utils_eq(u.dM, approvedUserId);
							},
							state.b3);
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{
													b1: A2($author$project$Model$ApproveComplete, nickname, apikey),
													b3: updatedPending
												})))
								}),
							$author$project$Ports$getUserProfiles(serverUrl));
					} else {
						var err = result.a;
						var nickname = function () {
							var _v243 = state.b1;
							if (_v243.$ === 3) {
								var n = _v243.b;
								return n;
							} else {
								return 'User';
							}
						}();
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{
													b1: A2($author$project$Model$ApproveError, nickname, err)
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 238:
				var userId = msg.a;
				var nickname = msg.b;
				var _v244 = model.bg;
				if ((!_v244.$) && (_v244.a.$ === 14)) {
					var state = _v244.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												b1: A2($author$project$Model$ConfirmingReject, userId, nickname)
											})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 239:
				var _v245 = model.bg;
				if ((!_v245.$) && (_v245.a.$ === 14)) {
					var state = _v245.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{b1: $author$project$Model$NoPendingAction})))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 240:
				var userId = msg.a;
				var _v246 = _Utils_Tuple2(model.aS, model.bg);
				if (((!_v246.a.$) && (!_v246.b.$)) && (_v246.b.a.$ === 14)) {
					var serverUrl = _v246.a.a;
					var state = _v246.b.a.a;
					var nickname = A2(
						$elm$core$Maybe$withDefault,
						userId,
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.ee;
							},
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									function (u) {
										return _Utils_eq(u.dM, userId);
									},
									state.b3))));
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$UsersListDialog(
										_Utils_update(
											state,
											{
												b1: A2($author$project$Model$RejectingUser, userId, nickname)
											})))
							}),
						$author$project$Ports$rejectRegistration(
							A2($author$project$Api$Encode$rejectRegistration, serverUrl, userId)));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 241:
				var result = msg.b;
				var _v247 = model.bg;
				if ((!_v247.$) && (_v247.a.$ === 14)) {
					var state = _v247.a.a;
					if (!result.$) {
						var rejectedUserId = function () {
							var _v249 = state.b1;
							if (_v249.$ === 7) {
								var uid = _v249.a;
								return uid;
							} else {
								return '';
							}
						}();
						var updatedPending = A2(
							$elm$core$List$filter,
							function (u) {
								return !_Utils_eq(u.dM, rejectedUserId);
							},
							state.b3);
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{b1: $author$project$Model$NoPendingAction, b3: updatedPending})))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						var err = result.a;
						var nickname = function () {
							var _v250 = state.b1;
							if (_v250.$ === 7) {
								var n = _v250.b;
								return n;
							} else {
								return 'User';
							}
						}();
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$UsersListDialog(
											_Utils_update(
												state,
												{
													b1: A2($author$project$Model$RejectError, nickname, err)
												})))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 242:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							bg: $elm$core$Maybe$Just(
								$author$project$Model$ChangeApikeyDialog($author$project$Model$ConfirmingChange)),
							cF: false
						}),
					$elm$core$Platform$Cmd$none);
			case 243:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bg: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 244:
				var _v251 = model.aS;
				if (!_v251.$) {
					var serverUrl = _v251.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bg: $elm$core$Maybe$Just(
									$author$project$Model$ChangeApikeyDialog($author$project$Model$ChangingApikey))
							}),
						$author$project$Ports$changeMyApikey(serverUrl));
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 245:
				var result = msg.a;
				var _v252 = model.bg;
				if ((!_v252.$) && (_v252.a.$ === 16)) {
					if (!result.$) {
						var newApikey = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Just(
										$author$project$Model$ChangeApikeyDialog(
											$author$project$Model$ChangeComplete(newApikey)))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						var err = result.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									bg: $elm$core$Maybe$Nothing,
									c: $elm$core$Maybe$Just(err)
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 253:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{cF: !model.cF}),
					$elm$core$Platform$Cmd$none);
			case 254:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bh: $elm$core$Maybe$Nothing, cF: false}),
					$elm$core$Platform$Cmd$none);
			case 255:
				var serverUrl = msg.a;
				return _Utils_Tuple2(
					model,
					$author$project$Ports$getApiKey(serverUrl));
			case 256:
				var result = msg.b;
				if (!result.$) {
					var apiKey = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								bh: $elm$core$Maybe$Just(apiKey)
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					var err = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								c: $elm$core$Maybe$Just(err)
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 257:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{bh: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 258:
				var text = msg.a;
				return _Utils_Tuple2(
					model,
					$author$project$Ports$copyToClipboard(text));
			case 279:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{c: $elm$core$Maybe$Nothing}),
					$elm$core$Platform$Cmd$none);
			case 280:
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{a8: $elm$core$Maybe$Nothing, bg: $elm$core$Maybe$Nothing, cF: false}),
					$elm$core$Platform$Cmd$none);
			case 259:
				var currentLevel = A2(
					$elm$core$Maybe$withDefault,
					100,
					A2(
						$elm$core$Maybe$map,
						function ($) {
							return $.fP;
						},
						model.a2));
				var newLevel = A2($elm$core$Basics$min, 200, currentLevel + 10);
				return _Utils_Tuple2(
					model,
					$author$project$Ports$setZoomLevel(newLevel));
			case 260:
				var currentLevel = A2(
					$elm$core$Maybe$withDefault,
					100,
					A2(
						$elm$core$Maybe$map,
						function ($) {
							return $.fP;
						},
						model.a2));
				var newLevel = A2($elm$core$Basics$max, 50, currentLevel - 10);
				return _Utils_Tuple2(
					model,
					$author$project$Ports$setZoomLevel(newLevel));
			case 261:
				return _Utils_Tuple2(
					model,
					$author$project$Ports$setZoomLevel(100));
			default:
				var result = msg.a;
				if (!result.$) {
					var settings = result.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								a2: $elm$core$Maybe$Just(
									{c1: settings.c1, eT: settings.eT, fm: settings.fm, fq: settings.fq, fK: settings.fK, fP: settings.fP})
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
		}
	});
var $elm$html$Html$Attributes$stringProperty = F2(
	function (key, string) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$string(string));
	});
var $elm$html$Html$Attributes$class = $elm$html$Html$Attributes$stringProperty('className');
var $elm$html$Html$Attributes$classList = function (classes) {
	return $elm$html$Html$Attributes$class(
		A2(
			$elm$core$String$join,
			' ',
			A2(
				$elm$core$List$map,
				$elm$core$Tuple$first,
				A2($elm$core$List$filter, $elm$core$Tuple$second, classes))));
};
var $elm$html$Html$div = _VirtualDom_node('div');
var $author$project$Msg$Disconnect = function (a) {
	return {$: 30, a: a};
};
var $author$project$Msg$HideContextMenu = {$: 16};
var $author$project$Msg$OpenEditServerDialog = function (a) {
	return {$: 7, a: a};
};
var $author$project$Msg$OpenRemoveServerDialog = F2(
	function (a, b) {
		return {$: 8, a: a, b: b};
	});
var $elm$virtual_dom$VirtualDom$attribute = F2(
	function (key, value) {
		return A2(
			_VirtualDom_attribute,
			_VirtualDom_noOnOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $elm$html$Html$Attributes$attribute = $elm$virtual_dom$VirtualDom$attribute;
var $elm$core$String$fromFloat = _String_fromNumber;
var $elm$virtual_dom$VirtualDom$Normal = function (a) {
	return {$: 0, a: a};
};
var $elm$virtual_dom$VirtualDom$on = _VirtualDom_on;
var $elm$html$Html$Events$on = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $elm$html$Html$Events$onClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $elm$virtual_dom$VirtualDom$style = _VirtualDom_style;
var $elm$html$Html$Attributes$style = $elm$virtual_dom$VirtualDom$style;
var $elm$virtual_dom$VirtualDom$text = _VirtualDom_text;
var $elm$html$Html$text = $elm$virtual_dom$VirtualDom$text;
var $author$project$View$Menus$viewContextMenu = F2(
	function (maybeMenu, serverData) {
		if (maybeMenu.$ === 1) {
			return $elm$html$Html$text('');
		} else {
			var menu = maybeMenu.a;
			var isServerConnected = A2($author$project$Model$isConnected, menu.eS, serverData);
			return A2(
				$elm$html$Html$div,
				_List_Nil,
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('context-menu-backdrop'),
								$elm$html$Html$Events$onClick($author$project$Msg$HideContextMenu)
							]),
						_List_Nil),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('context-menu'),
								A2(
								$elm$html$Html$Attributes$style,
								'left',
								$elm$core$String$fromFloat(menu.fM) + 'px'),
								A2(
								$elm$html$Html$Attributes$style,
								'top',
								$elm$core$String$fromFloat(menu.fN) + 'px')
							]),
						_Utils_ap(
							_List_fromArray(
								[
									isServerConnected ? A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('context-menu__item is-disabled'),
											A2($elm$html$Html$Attributes$attribute, 'title', 'Disconnect before editing')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Edit Server')
										])) : A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('context-menu__item'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$OpenEditServerDialog(menu.eS))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Edit Server')
										]))
								]),
							_Utils_ap(
								isServerConnected ? _List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('context-menu__separator')
											]),
										_List_Nil),
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('context-menu__item'),
												$elm$html$Html$Events$onClick(
												$author$project$Msg$Disconnect(menu.eS))
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('Disconnect')
											]))
									]) : _List_Nil,
								_List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('context-menu__separator')
											]),
										_List_Nil),
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('context-menu__item is-danger'),
												$elm$html$Html$Events$onClick(
												A2($author$project$Msg$OpenRemoveServerDialog, menu.eS, ''))
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('Remove Server')
											]))
									]))))
					]));
		}
	});
var $author$project$Msg$CloseDialog = {$: 9};
var $elm$core$Set$member = F2(
	function (key, _v0) {
		var dict = _v0;
		return A2($elm$core$Dict$member, key, dict);
	});
var $elm$json$Json$Decode$fail = _Json_fail;
var $author$project$View$Helpers$onClickTarget = F2(
	function (targetClass, msg) {
		return A2(
			$elm$html$Html$Events$on,
			'click',
			A2(
				$elm$json$Json$Decode$andThen,
				function (className) {
					return A2($elm$core$String$contains, targetClass, className) ? $elm$json$Json$Decode$succeed(msg) : $elm$json$Json$Decode$fail('not target');
				},
				A2(
					$elm$json$Json$Decode$field,
					'target',
					A2($elm$json$Json$Decode$field, 'className', $elm$json$Json$Decode$string))));
	});
var $author$project$Msg$SubmitAddServer = {$: 12};
var $author$project$Msg$UpdateServerFormName = function (a) {
	return {$: 10, a: a};
};
var $author$project$Msg$UpdateServerFormUrl = function (a) {
	return {$: 11, a: a};
};
var $elm$html$Html$button = _VirtualDom_node('button');
var $elm$html$Html$Attributes$boolProperty = F2(
	function (key, bool) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$bool(bool));
	});
var $elm$html$Html$Attributes$disabled = $elm$html$Html$Attributes$boolProperty('disabled');
var $elm$html$Html$h2 = _VirtualDom_node('h2');
var $elm$html$Html$input = _VirtualDom_node('input');
var $elm$html$Html$label = _VirtualDom_node('label');
var $elm$html$Html$Events$alwaysStop = function (x) {
	return _Utils_Tuple2(x, true);
};
var $elm$virtual_dom$VirtualDom$MayStopPropagation = function (a) {
	return {$: 1, a: a};
};
var $elm$html$Html$Events$stopPropagationOn = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$MayStopPropagation(decoder));
	});
var $elm$html$Html$Events$targetValue = A2(
	$elm$json$Json$Decode$at,
	_List_fromArray(
		['target', 'value']),
	$elm$json$Json$Decode$string);
var $elm$html$Html$Events$onInput = function (tagger) {
	return A2(
		$elm$html$Html$Events$stopPropagationOn,
		'input',
		A2(
			$elm$json$Json$Decode$map,
			$elm$html$Html$Events$alwaysStop,
			A2($elm$json$Json$Decode$map, tagger, $elm$html$Html$Events$targetValue)));
};
var $elm$html$Html$Attributes$placeholder = $elm$html$Html$Attributes$stringProperty('placeholder');
var $elm$html$Html$Attributes$type_ = $elm$html$Html$Attributes$stringProperty('type');
var $elm$html$Html$Attributes$value = $elm$html$Html$Attributes$stringProperty('value');
var $author$project$View$Helpers$viewFormError = function (maybeError) {
	if (maybeError.$ === 1) {
		return $elm$html$Html$text('');
	} else {
		var error = maybeError.a;
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('connect-dialog__error')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(error)
				]));
	}
};
var $author$project$View$Dialog$Server$viewAddServerDialog = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_Nil,
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Add Server')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__close'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('x')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__body')
					]),
				_List_fromArray(
					[
						$author$project$View$Helpers$viewFormError(form.c),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-group')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$label,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-label')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Server Name')
									])),
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-input'),
										$elm$html$Html$Attributes$type_('text'),
										$elm$html$Html$Attributes$placeholder('My Server'),
										$elm$html$Html$Attributes$value(form.ea),
										$elm$html$Html$Events$onInput($author$project$Msg$UpdateServerFormName)
									]),
								_List_Nil)
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-group')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$label,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-label')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Server URL')
									])),
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-input'),
										$elm$html$Html$Attributes$type_('url'),
										$elm$html$Html$Attributes$placeholder('https://neper.example.com'),
										$elm$html$Html$Attributes$value(form.fl),
										$elm$html$Html$Events$onInput($author$project$Msg$UpdateServerFormUrl)
									]),
								_List_Nil)
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn-secondary'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Cancel')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn-primary'),
								$elm$html$Html$Attributes$classList(
								_List_fromArray(
									[
										_Utils_Tuple2('btn-loading', form.j)
									])),
								$elm$html$Html$Events$onClick($author$project$Msg$SubmitAddServer),
								$elm$html$Html$Attributes$disabled(form.j)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Add Server')
							]))
					]))
			]));
};
var $author$project$Msg$CancelChangeApikey = {$: 243};
var $elm$html$Html$h3 = _VirtualDom_node('h3');
var $elm$html$Html$p = _VirtualDom_node('p');
var $author$project$View$Dialog$ApiKey$viewChangeApikeyComplete = function (newApikey) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('change-apikey-dialog__result')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('change-apikey-dialog__result-icon')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('\u2713')
					])),
				A2(
				$elm$html$Html$h3,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('change-apikey-dialog__result-title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('API Key Changed Successfully')
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('change-apikey-dialog__result-warning')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Please save this key. The server will not show it again:')
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('change-apikey-dialog__result-key')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(newApikey)
					])),
				A2(
				$elm$html$Html$p,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('change-apikey-dialog__result-note')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Your stored credentials have been updated automatically.')
					])),
				A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('btn btn--primary'),
						$elm$html$Html$Events$onClick($author$project$Msg$CancelChangeApikey)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Done')
					]))
			]));
};
var $author$project$View$Dialog$ApiKey$viewChangingApikey = A2(
	$elm$html$Html$div,
	_List_fromArray(
		[
			$elm$html$Html$Attributes$class('change-apikey-dialog__loading')
		]),
	_List_fromArray(
		[
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('spinner')
				]),
			_List_Nil),
			$elm$html$Html$text('Changing your API key...')
		]));
var $author$project$Msg$SubmitChangeApikey = {$: 244};
var $elm$html$Html$br = _VirtualDom_node('br');
var $author$project$View$Dialog$ApiKey$viewConfirmChangeApikey = A2(
	$elm$html$Html$div,
	_List_fromArray(
		[
			$elm$html$Html$Attributes$class('confirm-dialog')
		]),
	_List_fromArray(
		[
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('confirm-dialog__icon is-warning')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('!')
				])),
			A2(
			$elm$html$Html$h3,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('confirm-dialog__title')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('Change Your API Key?')
				])),
			A2(
			$elm$html$Html$p,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('confirm-dialog__message')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('This will generate a new API key and invalidate your current one.'),
					A2($elm$html$Html$br, _List_Nil, _List_Nil),
					$elm$html$Html$text('You will need to update any other applications using your API key.')
				])),
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('confirm-dialog__actions')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$button,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('btn btn--secondary'),
							$elm$html$Html$Events$onClick($author$project$Msg$CancelChangeApikey)
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Cancel')
						])),
					A2(
					$elm$html$Html$button,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('btn btn--warning'),
							$elm$html$Html$Events$onClick($author$project$Msg$SubmitChangeApikey)
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Change API Key')
						]))
				]))
		]));
var $author$project$View$Dialog$ApiKey$viewChangeApikeyDialog = function (state) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('dialog change-apikey-dialog')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Change API Key')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__close'),
								$elm$html$Html$Events$onClick($author$project$Msg$CancelChangeApikey)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('\u00D7')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__body')
					]),
				_List_fromArray(
					[
						function () {
						switch (state.$) {
							case 0:
								return $author$project$View$Dialog$ApiKey$viewConfirmChangeApikey;
							case 1:
								return $author$project$View$Dialog$ApiKey$viewChangingApikey;
							default:
								var newApikey = state.a;
								return $author$project$View$Dialog$ApiKey$viewChangeApikeyComplete(newApikey);
						}
					}()
					]))
			]));
};
var $author$project$Msg$SubmitConnect = function (a) {
	return {$: 26, a: a};
};
var $author$project$Msg$SwitchToRegister = {$: 19};
var $author$project$Msg$UpdateConnectPassword = function (a) {
	return {$: 22, a: a};
};
var $author$project$Msg$UpdateConnectUsername = function (a) {
	return {$: 21, a: a};
};
var $author$project$View$Dialog$Auth$viewConnectDialog = F2(
	function (serverUrl, form) {
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Connect to Server')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('connect-dialog__tabs')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('connect-dialog__tab is-active')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Login')
										])),
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('connect-dialog__tab'),
											$elm$html$Html$Events$onClick($author$project$Msg$SwitchToRegister)
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Register')
										]))
								])),
							$author$project$View$Helpers$viewFormError(form.c),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Username')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$type_('text'),
											$elm$html$Html$Attributes$placeholder('Your nickname'),
											$elm$html$Html$Attributes$value(form.aZ),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateConnectUsername)
										]),
									_List_Nil)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('API Key')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$type_('password'),
											$elm$html$Html$Attributes$placeholder('Your API key'),
											$elm$html$Html$Attributes$value(form.er),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateConnectPassword)
										]),
									_List_Nil)
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-primary'),
									$elm$html$Html$Attributes$classList(
									_List_fromArray(
										[
											_Utils_Tuple2('btn-loading', form.j)
										])),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitConnect(serverUrl)),
									$elm$html$Html$Attributes$disabled(form.j)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Connect')
								]))
						]))
				]));
	});
var $author$project$Msg$SubmitCreateSession = {$: 42};
var $author$project$Msg$UpdateCreateSessionName = function (a) {
	return {$: 40, a: a};
};
var $author$project$Msg$UpdateCreateSessionPublic = function (a) {
	return {$: 41, a: a};
};
var $elm$html$Html$Attributes$checked = $elm$html$Html$Attributes$boolProperty('checked');
var $elm$html$Html$span = _VirtualDom_node('span');
var $author$project$View$Dialog$Session$viewCreateSessionDialog = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_Nil,
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Create Session')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__close'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('x')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__body')
					]),
				_List_fromArray(
					[
						$author$project$View$Helpers$viewFormError(form.c),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-group')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$label,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-label')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Session Name')
									])),
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-input'),
										$elm$html$Html$Attributes$type_('text'),
										$elm$html$Html$Attributes$placeholder('My Game Session'),
										$elm$html$Html$Attributes$value(form.ea),
										$elm$html$Html$Events$onInput($author$project$Msg$UpdateCreateSessionName)
									]),
								_List_Nil)
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-group')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-checkbox'),
										$elm$html$Html$Events$onClick(
										$author$project$Msg$UpdateCreateSessionPublic(!form.dX))
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$input,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$type_('checkbox'),
												$elm$html$Html$Attributes$checked(form.dX)
											]),
										_List_Nil),
										A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('form-checkbox__label')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('Public session')
											]))
									])),
								A2(
								$elm$html$Html$p,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('form-help')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Public sessions can be joined by anyone. Private sessions require an invitation.')
									]))
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn-secondary'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Cancel')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn-primary'),
								$elm$html$Html$Attributes$classList(
								_List_fromArray(
									[
										_Utils_Tuple2('btn-loading', form.j)
									])),
								$elm$html$Html$Events$onClick($author$project$Msg$SubmitCreateSession),
								$elm$html$Html$Attributes$disabled(form.j)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Create Session')
							]))
					]))
			]));
};
var $author$project$Msg$OpenUsersListDialog = {$: 215};
var $author$project$Msg$SubmitCreateUser = {$: 220};
var $author$project$Msg$UpdateCreateUserEmail = function (a) {
	return {$: 219, a: a};
};
var $author$project$Msg$UpdateCreateUserNickname = function (a) {
	return {$: 218, a: a};
};
var $author$project$View$Dialog$Users$viewCreateUserForm = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_Nil,
		_List_fromArray(
			[
				$author$project$View$Helpers$viewFormError(form.c),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('form-group')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$label,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-label')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Nickname')
							])),
						A2(
						$elm$html$Html$input,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-input'),
								$elm$html$Html$Attributes$type_('text'),
								$elm$html$Html$Attributes$placeholder('User\'s nickname'),
								$elm$html$Html$Attributes$value(form.ee),
								$elm$html$Html$Events$onInput($author$project$Msg$UpdateCreateUserNickname)
							]),
						_List_Nil)
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('form-group')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$label,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-label')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Email')
							])),
						A2(
						$elm$html$Html$input,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('form-input'),
								$elm$html$Html$Attributes$type_('email'),
								$elm$html$Html$Attributes$placeholder('user@example.com'),
								$elm$html$Html$Attributes$value(form.dp),
								$elm$html$Html$Events$onInput($author$project$Msg$UpdateCreateUserEmail)
							]),
						_List_Nil)
					]))
			]));
};
var $author$project$View$Dialog$Users$viewCreateUserSuccess = function (user) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('create-user-dialog__success')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('create-user-dialog__success-icon')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('\u2713')
					])),
				A2(
				$elm$html$Html$h3,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('create-user-dialog__success-title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('User Created')
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('create-user-dialog__user-info')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('create-user-dialog__field')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('create-user-dialog__label')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Nickname:')
									])),
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('create-user-dialog__value')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(user.ee)
									]))
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('create-user-dialog__field')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('create-user-dialog__label')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Email:')
									])),
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('create-user-dialog__value')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(user.dp)
									]))
							]))
					])),
				A2(
				$elm$html$Html$p,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('create-user-dialog__note')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Use the \"Reset API Key\" button in the users list to generate an API key for this user.')
					]))
			]));
};
var $author$project$View$Dialog$Users$viewCreateUserDialog = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('create-user-dialog')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Create User')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__close'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('\u00D7')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__body')
					]),
				_List_fromArray(
					[
						function () {
						var _v0 = form.ba;
						if (!_v0.$) {
							var user = _v0.a;
							return $author$project$View$Dialog$Users$viewCreateUserSuccess(user);
						} else {
							return $author$project$View$Dialog$Users$viewCreateUserForm(form);
						}
					}()
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__footer')
					]),
				_List_fromArray(
					[
						function () {
						var _v1 = form.ba;
						if (!_v1.$) {
							return A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn--primary'),
										$elm$html$Html$Events$onClick($author$project$Msg$OpenUsersListDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Back to Users')
									]));
						} else {
							return A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn--secondary'),
										$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Cancel')
									]));
						}
					}(),
						function () {
						var _v2 = form.ba;
						if (!_v2.$) {
							return $elm$html$Html$text('');
						} else {
							return A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn--primary'),
										$elm$html$Html$Attributes$disabled(form.j),
										$elm$html$Html$Events$onClick($author$project$Msg$SubmitCreateUser)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(
										form.j ? 'Creating...' : 'Create User')
									]));
						}
					}()
					]))
			]));
};
var $author$project$Msg$SubmitEditServer = function (a) {
	return {$: 13, a: a};
};
var $author$project$View$Dialog$Server$viewEditServerDialog = F2(
	function (serverUrl, form) {
		var isRenaming = function () {
			var _v0 = form.b$;
			if (!_v0.$) {
				var originalName = _v0.a;
				return !_Utils_eq(form.ea, originalName);
			} else {
				return false;
			}
		}();
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Edit Server')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							$author$project$View$Helpers$viewFormError(form.c),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Server Name')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$type_('text'),
											$elm$html$Html$Attributes$value(form.ea),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateServerFormName)
										]),
									_List_Nil)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Server URL')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$type_('url'),
											$elm$html$Html$Attributes$value(form.fl),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateServerFormUrl)
										]),
									_List_Nil)
								])),
							isRenaming ? A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__warning')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('dialog__warning-icon')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('⚠')
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('dialog__warning-text')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('You are renaming this server. Please close any Stars! games for this server before proceeding. The server\'s game directory will be renamed.')
										]))
								])) : $elm$html$Html$text('')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-primary'),
									$elm$html$Html$Attributes$classList(
									_List_fromArray(
										[
											_Utils_Tuple2('btn-loading', form.j)
										])),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitEditServer(serverUrl)),
									$elm$html$Html$Attributes$disabled(form.j)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Save Changes')
								]))
						]))
				]));
	});
var $elm$core$List$isEmpty = function (xs) {
	if (!xs.b) {
		return true;
	} else {
		return false;
	}
};
var $author$project$Msg$AcceptInvitation = function (a) {
	return {$: 65, a: a};
};
var $author$project$Msg$DeclineInvitation = function (a) {
	return {$: 67, a: a};
};
var $author$project$Msg$ViewInvitedSession = function (a) {
	return {$: 62, a: a};
};
var $author$project$View$Dialog$Users$viewReceivedInvitationCard = function (invitation) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('invitation-card')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('invitation-card__info')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('invitation-card__session')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(invitation.eW)
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('invitation-card__inviter')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Invited by ' + invitation.dR)
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('invitation-card__actions')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$ViewInvitedSession(invitation.eV))
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('View')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$DeclineInvitation(invitation.dM))
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Decline')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--primary btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$AcceptInvitation(invitation.dM))
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Accept')
							]))
					]))
			]));
};
var $author$project$Msg$CancelSentInvitation = function (a) {
	return {$: 69, a: a};
};
var $author$project$View$Dialog$Users$viewSentInvitationCard = function (invitation) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('invitation-card invitation-card--sent')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('invitation-card__info')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('invitation-card__session')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(invitation.eW)
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('invitation-card__invitee')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Sent to ' + invitation.dP)
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('invitation-card__actions')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$ViewInvitedSession(invitation.eV))
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('View')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$CancelSentInvitation(invitation.dM))
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Cancel')
							]))
					]))
			]));
};
var $author$project$View$Dialog$Users$viewInvitationsDialog = F2(
	function (receivedInvitations, sentInvitations) {
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Invitations')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('invitations-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('invitations-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Received')
										])),
									$elm$core$List$isEmpty(receivedInvitations) ? A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('invitations-dialog__empty')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('No pending invitations')
										])) : A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('invitations-dialog__list')
										]),
									A2($elm$core$List$map, $author$project$View$Dialog$Users$viewReceivedInvitationCard, receivedInvitations))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('invitations-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('invitations-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Sent')
										])),
									$elm$core$List$isEmpty(sentInvitations) ? A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('invitations-dialog__empty')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('No sent invitations')
										])) : A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('invitations-dialog__list')
										]),
									A2($elm$core$List$map, $author$project$View$Dialog$Users$viewSentInvitationCard, sentInvitations))
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Close')
								]))
						]))
				]));
	});
var $author$project$Msg$SubmitInvite = {$: 59};
var $author$project$Msg$SelectUserToInvite = function (a) {
	return {$: 58, a: a};
};
var $author$project$View$Dialog$Users$viewUserOption = F2(
	function (selectedUserId, user) {
		var isSelected = _Utils_eq(
			selectedUserId,
			$elm$core$Maybe$Just(user.dM));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('invite-dialog__user'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('is-selected', isSelected)
						])),
					$elm$html$Html$Events$onClick(
					$author$project$Msg$SelectUserToInvite(user.dM))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('invite-dialog__user-name')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(user.ee)
						])),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('invite-dialog__user-email')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(user.dp)
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewInviteUserDialog = F2(
	function (form, userProfiles) {
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Invite User')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							$author$project$View$Helpers$viewFormError(form.c),
							$elm$core$List$isEmpty(userProfiles) ? A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('invite-dialog__loading')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Loading users...')
								])) : A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('invite-dialog__users')
								]),
							A2(
								$elm$core$List$map,
								$author$project$View$Dialog$Users$viewUserOption(form.ct),
								userProfiles))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary'),
									$elm$html$Html$Attributes$disabled(
									_Utils_eq(form.ct, $elm$core$Maybe$Nothing) || form.j),
									$elm$html$Html$Events$onClick($author$project$Msg$SubmitInvite)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									form.j ? 'Inviting...' : 'Send Invite')
								]))
						]))
				]));
	});
var $author$project$Msg$ToggleMapFullscreen = {$: 278};
var $elm$html$Html$Attributes$id = $elm$html$Html$Attributes$stringProperty('id');
var $elm$virtual_dom$VirtualDom$node = function (tag) {
	return _VirtualDom_node(
		_VirtualDom_noScript(tag));
};
var $elm$html$Html$node = $elm$virtual_dom$VirtualDom$node;
var $elm$html$Html$Attributes$title = $elm$html$Html$Attributes$stringProperty('title');
var $author$project$View$Dialog$MapViewer$wrapSvgInHtml = function (svg) {
	return '<!DOCTYPE html>\n<html>\n<head>\n<style>\nhtml, body {\n    margin: 0;\n    padding: 0;\n    width: 100%;\n    height: 100%;\n    background: #1a1a2e;\n}\nbody {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    min-height: 100%;\n}\nsvg {\n    max-width: 100%;\n    max-height: 100%;\n}\n</style>\n</head>\n<body>\n' + (svg + '\n</body>\n</html>');
};
var $author$project$View$Dialog$MapViewer$viewMapDisplay = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('map-viewer-dialog__display')
			]),
		_List_fromArray(
			[
				function () {
				var _v0 = form.c;
				if (!_v0.$) {
					var err = _v0.a;
					return A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__error')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(err)
							]));
				} else {
					return $elm$html$Html$text('');
				}
			}(),
				function () {
				var _v1 = form.bq;
				if (!_v1.$) {
					var svg = _v1.a;
					return A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('map-viewer-dialog__svg-container')
							]),
						_List_fromArray(
							[
								A3(
								$elm$html$Html$node,
								'iframe',
								_List_fromArray(
									[
										$elm$html$Html$Attributes$id('map-viewer-frame'),
										A2(
										$elm$html$Html$Attributes$attribute,
										'srcdoc',
										$author$project$View$Dialog$MapViewer$wrapSvgInHtml(svg)),
										$elm$html$Html$Attributes$class('map-viewer-dialog__svg-frame')
									]),
								_List_Nil),
								A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('map-viewer-dialog__fullscreen-btn'),
										$elm$html$Html$Events$onClick($author$project$Msg$ToggleMapFullscreen),
										$elm$html$Html$Attributes$title('View fullscreen')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('⛶')
									]))
							]));
				} else {
					return A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('map-viewer-dialog__placeholder')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Click \"Generate Map\" to create the map')
							]));
				}
			}()
			]));
};
var $author$project$Msg$ToggleShowFleets = {$: 268};
var $author$project$Msg$ToggleShowLegend = {$: 272};
var $author$project$Msg$ToggleShowMines = {$: 270};
var $author$project$Msg$ToggleShowNames = {$: 267};
var $author$project$Msg$ToggleShowScannerCoverage = {$: 273};
var $author$project$Msg$ToggleShowWormholes = {$: 271};
var $author$project$View$Dialog$MapViewer$viewCheckbox = F3(
	function (labelText, isChecked, msg) {
		return A2(
			$elm$html$Html$label,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('map-viewer-dialog__checkbox')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$input,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$type_('checkbox'),
							$elm$html$Html$Attributes$checked(isChecked),
							$elm$html$Html$Events$onClick(msg)
						]),
					_List_Nil),
					$elm$html$Html$text(labelText)
				]));
	});
var $author$project$Msg$UpdateShowFleetPaths = function (a) {
	return {$: 269, a: a};
};
var $elm$html$Html$Attributes$max = $elm$html$Html$Attributes$stringProperty('max');
var $elm$html$Html$Attributes$min = $elm$html$Html$Attributes$stringProperty('min');
var $author$project$View$Dialog$MapViewer$viewFleetPathsInput = function (years) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('map-viewer-dialog__fleet-paths')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$label,
				_List_Nil,
				_List_fromArray(
					[
						$elm$html$Html$text('Fleet paths (years):')
					])),
				A2(
				$elm$html$Html$input,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$type_('number'),
						$elm$html$Html$Attributes$value(
						$elm$core$String$fromInt(years)),
						$elm$html$Html$Events$onInput($author$project$Msg$UpdateShowFleetPaths),
						$elm$html$Html$Attributes$min('0'),
						$elm$html$Html$Attributes$max('10'),
						$elm$html$Html$Attributes$placeholder('0 = off')
					]),
				_List_Nil)
			]));
};
var $author$project$View$Dialog$MapViewer$viewDisplayOptions = function (options) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('map-viewer-dialog__display-options')
			]),
		_List_fromArray(
			[
				A3($author$project$View$Dialog$MapViewer$viewCheckbox, 'Show planet names', options.e0, $author$project$Msg$ToggleShowNames),
				A3($author$project$View$Dialog$MapViewer$viewCheckbox, 'Show fleets', options.eY, $author$project$Msg$ToggleShowFleets),
				$author$project$View$Dialog$MapViewer$viewFleetPathsInput(options.eX),
				A3($author$project$View$Dialog$MapViewer$viewCheckbox, 'Show minefields', options.e$, $author$project$Msg$ToggleShowMines),
				A3($author$project$View$Dialog$MapViewer$viewCheckbox, 'Show wormholes', options.e2, $author$project$Msg$ToggleShowWormholes),
				A3($author$project$View$Dialog$MapViewer$viewCheckbox, 'Show legend', options.e_, $author$project$Msg$ToggleShowLegend),
				A3($author$project$View$Dialog$MapViewer$viewCheckbox, 'Show scanner coverage', options.e1, $author$project$Msg$ToggleShowScannerCoverage)
			]));
};
var $author$project$Msg$SelectMapPreset = function (a) {
	return {$: 266, a: a};
};
var $author$project$Msg$UpdateMapHeight = function (a) {
	return {$: 265, a: a};
};
var $author$project$Msg$UpdateMapWidth = function (a) {
	return {$: 264, a: a};
};
var $elm$html$Html$option = _VirtualDom_node('option');
var $elm$html$Html$select = _VirtualDom_node('select');
var $elm$html$Html$Attributes$selected = $elm$html$Html$Attributes$boolProperty('selected');
var $author$project$View$Dialog$MapViewer$viewResolutionOptions = function (options) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('map-viewer-dialog__resolution')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('map-viewer-dialog__presets')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$label,
						_List_Nil,
						_List_fromArray(
							[
								$elm$html$Html$text('Preset:')
							])),
						A2(
						$elm$html$Html$select,
						_List_fromArray(
							[
								$elm$html$Html$Events$onInput($author$project$Msg$SelectMapPreset)
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$option,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$value('800x600'),
										$elm$html$Html$Attributes$selected((options.fJ === 800) && (options.dH === 600))
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('800 x 600')
									])),
								A2(
								$elm$html$Html$option,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$value('1024x768'),
										$elm$html$Html$Attributes$selected((options.fJ === 1024) && (options.dH === 768))
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('1024 x 768')
									])),
								A2(
								$elm$html$Html$option,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$value('1920x1080'),
										$elm$html$Html$Attributes$selected((options.fJ === 1920) && (options.dH === 1080))
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('1920 x 1080 (Full HD)')
									])),
								A2(
								$elm$html$Html$option,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$value('2560x1440'),
										$elm$html$Html$Attributes$selected((options.fJ === 2560) && (options.dH === 1440))
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('2560 x 1440 (2K)')
									])),
								A2(
								$elm$html$Html$option,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$value('custom')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Custom')
									]))
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('map-viewer-dialog__custom-size')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$label,
						_List_Nil,
						_List_fromArray(
							[
								$elm$html$Html$text('Width:')
							])),
						A2(
						$elm$html$Html$input,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$type_('number'),
								$elm$html$Html$Attributes$value(
								$elm$core$String$fromInt(options.fJ)),
								$elm$html$Html$Events$onInput($author$project$Msg$UpdateMapWidth),
								$elm$html$Html$Attributes$min('400'),
								$elm$html$Html$Attributes$max('4096')
							]),
						_List_Nil),
						A2(
						$elm$html$Html$label,
						_List_Nil,
						_List_fromArray(
							[
								$elm$html$Html$text('Height:')
							])),
						A2(
						$elm$html$Html$input,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$type_('number'),
								$elm$html$Html$Attributes$value(
								$elm$core$String$fromInt(options.dH)),
								$elm$html$Html$Events$onInput($author$project$Msg$UpdateMapHeight),
								$elm$html$Html$Attributes$min('300'),
								$elm$html$Html$Attributes$max('4096')
							]),
						_List_Nil)
					]))
			]));
};
var $author$project$View$Dialog$MapViewer$viewOptionsPanel = function (options) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('map-viewer-dialog__options')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$h3,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('map-viewer-dialog__section-title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Resolution')
					])),
				$author$project$View$Dialog$MapViewer$viewResolutionOptions(options),
				A2(
				$elm$html$Html$h3,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('map-viewer-dialog__section-title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Display Options')
					])),
				$author$project$View$Dialog$MapViewer$viewDisplayOptions(options)
			]));
};
var $author$project$View$Dialog$MapViewer$viewBody = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('dialog__body map-viewer-dialog__body')
			]),
		_List_fromArray(
			[
				$author$project$View$Dialog$MapViewer$viewOptionsPanel(form.bX),
				$author$project$View$Dialog$MapViewer$viewMapDisplay(form)
			]));
};
var $author$project$Msg$GenerateMap = {$: 274};
var $author$project$Msg$SaveMap = {$: 276};
var $author$project$View$Dialog$MapViewer$viewFooter = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('dialog__footer')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__actions')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--primary'),
								$elm$html$Html$Events$onClick($author$project$Msg$GenerateMap),
								$elm$html$Html$Attributes$disabled(form.br)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								form.br ? 'Generating...' : 'Generate Map')
							])),
						function () {
						var _v0 = form.bq;
						if (!_v0.$) {
							return A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn--secondary'),
										$elm$html$Html$Events$onClick($author$project$Msg$SaveMap),
										$elm$html$Html$Attributes$disabled(form.cn)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(
										form.cn ? 'Saving...' : 'Save SVG')
									]));
						} else {
							return $elm$html$Html$text('');
						}
					}(),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Close')
							]))
					]))
			]));
};
var $author$project$View$Dialog$MapViewer$viewHeader = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('dialog__header')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$h2,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						'Map Viewer - Year ' + $elm$core$String$fromInt(form.fO))
					])),
				A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__close'),
						$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('\u00D7')
					]))
			]));
};
var $author$project$View$Dialog$MapViewer$viewMapViewerDialog = function (form) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('map-viewer-dialog')
			]),
		_List_fromArray(
			[
				$author$project$View$Dialog$MapViewer$viewHeader(form),
				$author$project$View$Dialog$MapViewer$viewBody(form),
				$author$project$View$Dialog$MapViewer$viewFooter(form)
			]));
};
var $author$project$Msg$CreateRaceFromExisting = {$: 131};
var $author$project$Msg$SubmitRaceBuilder = {$: 132};
var $author$project$View$Dialog$RaceBuilder$viewFooter = function (form) {
	var isViewMode = function () {
		var _v1 = form.bN;
		if (_v1.$ === 1) {
			return true;
		} else {
			return false;
		}
	}();
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
			]),
		_List_fromArray(
			[
				function () {
				var _v0 = form.c;
				if (!_v0.$) {
					var err = _v0.a;
					return A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__error')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(err)
							]));
				} else {
					return $elm$html$Html$text('');
				}
			}(),
				A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('btn btn-secondary'),
						$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						isViewMode ? 'Close' : 'Cancel')
					])),
				isViewMode ? A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('btn btn-primary'),
						$elm$html$Html$Events$onClick($author$project$Msg$CreateRaceFromExisting)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Create Race from This')
					])) : A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('btn btn-primary'),
						$elm$html$Html$Attributes$disabled((!form.cU.bF) || form.j),
						$elm$html$Html$Events$onClick($author$project$Msg$SubmitRaceBuilder)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						form.j ? 'Creating...' : 'Create Race')
					]))
			]));
};
var $author$project$View$Dialog$RaceBuilder$viewHeader = function (mode) {
	var title = function () {
		if (!mode.$) {
			return 'Race Builder';
		} else {
			var raceName = mode.a.az;
			return 'View Race: ' + raceName;
		}
	}();
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('dialog__header')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$h2,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(title)
					])),
				A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__close'),
						$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('x')
					]))
			]));
};
var $author$project$View$Dialog$RaceBuilder$viewValidationError = function (err) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-builder__error')
			]),
		_List_fromArray(
			[
				$elm$html$Html$text(err.bM)
			]));
};
var $author$project$View$Dialog$RaceBuilder$viewPointsBar = function (validation) {
	var pointsClass = (validation.b7 < 0) ? 'race-builder__points--negative' : ((!validation.b7) ? 'race-builder__points--zero' : 'race-builder__points--positive');
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-builder__points-bar')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__points ' + pointsClass)
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__points-label')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Advantage Points: ')
							])),
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__points-value')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								$elm$core$String$fromInt(validation.b7))
							]))
					])),
				(!validation.bF) ? A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__errors')
					]),
				A2($elm$core$List$map, $author$project$View$Dialog$RaceBuilder$viewValidationError, validation.bk)) : ((!$elm$core$List$isEmpty(validation.cW)) ? A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__warnings')
					]),
				A2(
					$elm$core$List$map,
					function (w) {
						return A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__warning')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(w)
								]));
					},
					validation.cW)) : $elm$html$Html$text(''))
			]));
};
var $author$project$Msg$UpdateRaceBuilderColonistsPerResource = function (a) {
	return {$: 113, a: a};
};
var $author$project$Msg$UpdateRaceBuilderFactoriesUseLessGerm = function (a) {
	return {$: 117, a: a};
};
var $author$project$Msg$UpdateRaceBuilderFactoryCost = function (a) {
	return {$: 115, a: a};
};
var $author$project$Msg$UpdateRaceBuilderFactoryCount = function (a) {
	return {$: 116, a: a};
};
var $author$project$Msg$UpdateRaceBuilderFactoryOutput = function (a) {
	return {$: 114, a: a};
};
var $author$project$Msg$UpdateRaceBuilderMineCost = function (a) {
	return {$: 119, a: a};
};
var $author$project$Msg$UpdateRaceBuilderMineCount = function (a) {
	return {$: 120, a: a};
};
var $author$project$Msg$UpdateRaceBuilderMineOutput = function (a) {
	return {$: 118, a: a};
};
var $elm$html$Html$h4 = _VirtualDom_node('h4');
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $elm$html$Html$Attributes$step = function (n) {
	return A2($elm$html$Html$Attributes$stringProperty, 'step', n);
};
var $author$project$View$Dialog$RaceBuilder$viewEconomyRow = function (opts) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-builder__economy-row')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__economy-text')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(opts.O)
					])),
				A2(
				$elm$html$Html$input,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$type_('number'),
						$elm$html$Html$Attributes$class('race-builder__economy-input'),
						$elm$html$Html$Attributes$value(
						$elm$core$String$fromInt(opts.G)),
						$elm$html$Html$Attributes$min(
						$elm$core$String$fromInt(opts.L)),
						$elm$html$Html$Attributes$max(
						$elm$core$String$fromInt(opts.K)),
						$elm$html$Html$Attributes$step(
						$elm$core$String$fromInt(opts.P)),
						$elm$html$Html$Events$onInput(
						A2(
							$elm$core$Basics$composeR,
							$elm$core$String$toInt,
							A2(
								$elm$core$Basics$composeR,
								$elm$core$Maybe$withDefault(opts.G),
								opts.M))),
						$elm$html$Html$Attributes$disabled(opts.n)
					]),
				_List_Nil),
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__economy-text')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(opts.Q)
					]))
			]));
};
var $author$project$View$Dialog$RaceBuilder$viewEconomyTab = F2(
	function (config, isReadOnly) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__economy')
				]),
			_List_fromArray(
				[
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 2500, L: 700, M: $author$project$Msg$UpdateRaceBuilderColonistsPerResource, O: 'One resource is generated each year for every ', P: 100, Q: ' colonists.', G: config.da}),
					A2(
					$elm$html$Html$h4,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__section-title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Factories')
						])),
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 15, L: 5, M: $author$project$Msg$UpdateRaceBuilderFactoryOutput, O: 'Every 10 factories produce ', P: 1, Q: ' resources each year.', G: config.dx}),
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 25, L: 5, M: $author$project$Msg$UpdateRaceBuilderFactoryCost, O: 'Factories require ', P: 1, Q: ' resources to build.', G: config.dv}),
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 25, L: 5, M: $author$project$Msg$UpdateRaceBuilderFactoryCount, O: 'Every 10,000 colonists may operate up to ', P: 1, Q: ' factories.', G: config.dw}),
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__checkbox-field')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('checkbox'),
									$elm$html$Html$Attributes$checked(config.du),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$UpdateRaceBuilderFactoriesUseLessGerm(!config.du)),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil),
							$elm$html$Html$text(' Factories cost 1kT less of Germanium to build')
						])),
					A2(
					$elm$html$Html$h4,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__section-title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Mines')
						])),
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 25, L: 5, M: $author$project$Msg$UpdateRaceBuilderMineOutput, O: 'Every 10 mines produce up to ', P: 1, Q: ' kT of each mineral each year.', G: config.d7}),
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 15, L: 2, M: $author$project$Msg$UpdateRaceBuilderMineCost, O: 'Mines require ', P: 1, Q: ' resources to build.', G: config.d5}),
					$author$project$View$Dialog$RaceBuilder$viewEconomyRow(
					{n: isReadOnly, K: 25, L: 5, M: $author$project$Msg$UpdateRaceBuilderMineCount, O: 'Every 10,000 colonists may operate up to ', P: 1, Q: ' mines.', G: config.d6})
				]));
	});
var $author$project$Model$GravityExpandBtn = 0;
var $author$project$Model$GravityLeftBtn = 2;
var $author$project$Model$GravityRightBtn = 3;
var $author$project$Model$GravityShrinkBtn = 1;
var $author$project$Model$RadiationExpandBtn = 8;
var $author$project$Model$RadiationLeftBtn = 10;
var $author$project$Model$RadiationRightBtn = 11;
var $author$project$Model$RadiationShrinkBtn = 9;
var $author$project$Model$TemperatureExpandBtn = 4;
var $author$project$Model$TemperatureLeftBtn = 6;
var $author$project$Model$TemperatureRightBtn = 7;
var $author$project$Model$TemperatureShrinkBtn = 5;
var $author$project$Msg$UpdateRaceBuilderGravityCenter = function (a) {
	return {$: 97, a: a};
};
var $author$project$Msg$UpdateRaceBuilderGravityImmune = function (a) {
	return {$: 99, a: a};
};
var $author$project$Msg$UpdateRaceBuilderGravityWidth = function (a) {
	return {$: 98, a: a};
};
var $author$project$Msg$UpdateRaceBuilderGrowthRate = function (a) {
	return {$: 109, a: a};
};
var $author$project$Msg$UpdateRaceBuilderRadiationCenter = function (a) {
	return {$: 105, a: a};
};
var $author$project$Msg$UpdateRaceBuilderRadiationImmune = function (a) {
	return {$: 107, a: a};
};
var $author$project$Msg$UpdateRaceBuilderRadiationWidth = function (a) {
	return {$: 106, a: a};
};
var $author$project$Msg$UpdateRaceBuilderTemperatureCenter = function (a) {
	return {$: 101, a: a};
};
var $author$project$Msg$UpdateRaceBuilderTemperatureImmune = function (a) {
	return {$: 103, a: a};
};
var $author$project$Msg$UpdateRaceBuilderTemperatureWidth = function (a) {
	return {$: 102, a: a};
};
var $author$project$Msg$HabButtonPressed = function (a) {
	return {$: 110, a: a};
};
var $author$project$Msg$HabButtonReleased = {$: 111};
var $elm$html$Html$Events$onMouseDown = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mousedown',
		$elm$json$Json$Decode$succeed(msg));
};
var $elm$html$Html$Events$onMouseLeave = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mouseleave',
		$elm$json$Json$Decode$succeed(msg));
};
var $elm$html$Html$Events$onMouseUp = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mouseup',
		$elm$json$Json$Decode$succeed(msg));
};
var $author$project$View$Dialog$RaceBuilder$viewHabRange = function (opts) {
	var minVal = A2($elm$core$Basics$max, 0, opts.ah - opts.fJ);
	var maxVal = A2($elm$core$Basics$min, 100, opts.ah + opts.fJ);
	var canShrink = (opts.fJ > 1) && (!opts.n);
	var canMoveRight = (maxVal < 100) && (!opts.n);
	var canMoveLeft = (minVal > 0) && (!opts.n);
	var canExpand = (opts.fJ < 50) && (!opts.n);
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-builder__hab-section')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__hab-row')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-label')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(opts.as)
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-btn race-builder__hab-btn--move'),
								$elm$html$Html$Attributes$disabled((!canMoveLeft) || opts.A),
								$elm$html$Html$Events$onMouseDown(
								$author$project$Msg$HabButtonPressed(opts.at)),
								$elm$html$Html$Events$onMouseUp($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Events$onMouseLeave($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Attributes$title('Move range left (hold to repeat)')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('<')
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-bar')
							]),
						_List_fromArray(
							[
								opts.A ? $elm$html$Html$text('') : A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('race-builder__hab-bar-fill'),
										A2(
										$elm$html$Html$Attributes$style,
										'left',
										$elm$core$String$fromInt(minVal) + '%'),
										A2(
										$elm$html$Html$Attributes$style,
										'width',
										$elm$core$String$fromInt(
											A2($elm$core$Basics$max, 1, maxVal - minVal)) + '%'),
										A2($elm$html$Html$Attributes$style, 'background-color', opts.ap)
									]),
								_List_Nil)
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-btn race-builder__hab-btn--move'),
								$elm$html$Html$Attributes$disabled((!canMoveRight) || opts.A),
								$elm$html$Html$Events$onMouseDown(
								$author$project$Msg$HabButtonPressed(opts.aA)),
								$elm$html$Html$Events$onMouseUp($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Events$onMouseLeave($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Attributes$title('Move range right (hold to repeat)')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('>')
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-range-stack')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('race-builder__hab-range-val')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(opts.aw)
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('race-builder__hab-range-to')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('to')
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('race-builder__hab-range-val')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(opts.av)
									]))
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__hab-controls')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-btn'),
								$elm$html$Html$Attributes$disabled((!canExpand) || opts.A),
								$elm$html$Html$Events$onMouseDown(
								$author$project$Msg$HabButtonPressed(opts.aq)),
								$elm$html$Html$Events$onMouseUp($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Events$onMouseLeave($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Attributes$title('Expand range (hold to repeat)')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('<< >>')
							])),
						A2(
						$elm$html$Html$label,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-immune')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$type_('checkbox'),
										$elm$html$Html$Attributes$checked(opts.A),
										$elm$html$Html$Events$onClick(
										opts.ax(!opts.A)),
										$elm$html$Html$Attributes$disabled(opts.n)
									]),
								_List_Nil),
								$elm$html$Html$text('Immune')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__hab-btn'),
								$elm$html$Html$Attributes$disabled((!canShrink) || opts.A),
								$elm$html$Html$Events$onMouseDown(
								$author$project$Msg$HabButtonPressed(opts.aE)),
								$elm$html$Html$Events$onMouseUp($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Events$onMouseLeave($author$project$Msg$HabButtonReleased),
								$elm$html$Html$Attributes$title('Shrink range (hold to repeat)')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('>> <<')
							]))
					]))
			]));
};
var $author$project$View$Dialog$RaceBuilder$viewHabitabilityTab = F3(
	function (config, habDisplay, isReadOnly) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__habitability')
				]),
			_List_fromArray(
				[
					$author$project$View$Dialog$RaceBuilder$viewHabRange(
					{ap: '#4a9eff', ah: config.dB, aq: 0, A: config.dC, n: isReadOnly, as: 'Gravity', at: 2, av: habDisplay.bv, aw: habDisplay.bw, aO: $author$project$Msg$UpdateRaceBuilderGravityCenter, ax: $author$project$Msg$UpdateRaceBuilderGravityImmune, aP: $author$project$Msg$UpdateRaceBuilderGravityWidth, aR: habDisplay.bx, aA: 3, aE: 1, fJ: config.dD}),
					$author$project$View$Dialog$RaceBuilder$viewHabRange(
					{ap: '#ff6b4a', ah: config.fc, aq: 4, A: config.fd, n: isReadOnly, as: 'Temperature', at: 6, av: habDisplay.cN, aw: habDisplay.cO, aO: $author$project$Msg$UpdateRaceBuilderTemperatureCenter, ax: $author$project$Msg$UpdateRaceBuilderTemperatureImmune, aP: $author$project$Msg$UpdateRaceBuilderTemperatureWidth, aR: habDisplay.cP, aA: 7, aE: 5, fJ: config.fe}),
					$author$project$View$Dialog$RaceBuilder$viewHabRange(
					{ap: '#4aff6b', ah: config.eA, aq: 8, A: config.eB, n: isReadOnly, as: 'Radiation', at: 10, av: habDisplay.cf, aw: habDisplay.cg, aO: $author$project$Msg$UpdateRaceBuilderRadiationCenter, ax: $author$project$Msg$UpdateRaceBuilderRadiationImmune, aP: $author$project$Msg$UpdateRaceBuilderRadiationWidth, aR: habDisplay.ch, aA: 11, aE: 9, fJ: config.eC}),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__hab-section')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__hab-header')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__hab-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Growth Rate')
										])),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__hab-value')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											$elm$core$String$fromInt(config.dE) + '%')
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__growth-slider')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__growth-min')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('1%')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$type_('range'),
											$elm$html$Html$Attributes$class('race-builder__slider'),
											$elm$html$Html$Attributes$min('1'),
											$elm$html$Html$Attributes$max('20'),
											$elm$html$Html$Attributes$value(
											$elm$core$String$fromInt(config.dE)),
											$elm$html$Html$Events$onInput(
											A2(
												$elm$core$Basics$composeR,
												$elm$core$String$toInt,
												A2(
													$elm$core$Basics$composeR,
													$elm$core$Maybe$withDefault(15),
													$author$project$Msg$UpdateRaceBuilderGrowthRate))),
											$elm$html$Html$Attributes$disabled(isReadOnly)
										]),
									_List_Nil),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__growth-max')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('20%')
										]))
								]))
						]))
				]));
	});
var $author$project$Msg$SelectCustomTemplate = {$: 89};
var $author$project$Msg$UpdateRaceBuilderIcon = function (a) {
	return {$: 93, a: a};
};
var $author$project$Msg$UpdateRaceBuilderLeftoverPoints = function (a) {
	return {$: 94, a: a};
};
var $author$project$Msg$UpdateRaceBuilderPassword = function (a) {
	return {$: 92, a: a};
};
var $author$project$Msg$UpdateRaceBuilderPluralName = function (a) {
	return {$: 91, a: a};
};
var $author$project$Msg$UpdateRaceBuilderSingularName = function (a) {
	return {$: 90, a: a};
};
var $elm$html$Html$Attributes$alt = $elm$html$Html$Attributes$stringProperty('alt');
var $elm$html$Html$fieldset = _VirtualDom_node('fieldset');
var $elm$html$Html$Attributes$for = $elm$html$Html$Attributes$stringProperty('htmlFor');
var $elm$html$Html$img = _VirtualDom_node('img');
var $elm$html$Html$legend = _VirtualDom_node('legend');
var $elm$html$Html$Attributes$maxlength = function (n) {
	return A2(
		_VirtualDom_attribute,
		'maxlength',
		$elm$core$String$fromInt(n));
};
var $elm$html$Html$Attributes$name = $elm$html$Html$Attributes$stringProperty('name');
var $elm$core$String$cons = _String_cons;
var $elm$core$String$fromChar = function (_char) {
	return A2($elm$core$String$cons, _char, '');
};
var $elm$core$Bitwise$and = _Bitwise_and;
var $elm$core$Bitwise$shiftRightBy = _Bitwise_shiftRightBy;
var $elm$core$String$repeatHelp = F3(
	function (n, chunk, result) {
		return (n <= 0) ? result : A3(
			$elm$core$String$repeatHelp,
			n >> 1,
			_Utils_ap(chunk, chunk),
			(!(n & 1)) ? result : _Utils_ap(result, chunk));
	});
var $elm$core$String$repeat = F2(
	function (n, chunk) {
		return A3($elm$core$String$repeatHelp, n, chunk, '');
	});
var $elm$core$String$padLeft = F3(
	function (n, _char, string) {
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)),
			string);
	});
var $author$project$View$Dialog$RaceBuilder$raceIconPath = function (iconNum) {
	return '/images/race_icons/' + (A3(
		$elm$core$String$padLeft,
		2,
		'0',
		$elm$core$String$fromInt(iconNum)) + '.png');
};
var $elm$html$Html$Attributes$src = function (url) {
	return A2(
		$elm$html$Html$Attributes$stringProperty,
		'src',
		_VirtualDom_noJavaScriptOrHtmlUri(url));
};
var $author$project$Msg$LoadRaceTemplate = function (a) {
	return {$: 87, a: a};
};
var $author$project$View$Dialog$RaceBuilder$viewTemplateOption = F4(
	function (templateId, displayName, selectedTemplate, isReadOnly) {
		return A2(
			$elm$html$Html$label,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__predefined-option')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$input,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$type_('radio'),
							$elm$html$Html$Attributes$name('template'),
							$elm$html$Html$Attributes$checked(
							_Utils_eq(selectedTemplate, templateId)),
							$elm$html$Html$Events$onClick(
							$author$project$Msg$LoadRaceTemplate(templateId)),
							$elm$html$Html$Attributes$disabled(isReadOnly)
						]),
					_List_Nil),
					$elm$html$Html$text(displayName)
				]));
	});
var $author$project$View$Dialog$RaceBuilder$wrapIcon = function (n) {
	return (n < 1) ? 32 : ((n > 32) ? 1 : n);
};
var $author$project$View$Dialog$RaceBuilder$viewIdentityTab = F3(
	function (config, selectedTemplate, isReadOnly) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__identity')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__identity-row')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$label,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__identity-label'),
									$elm$html$Html$Attributes$for('singularName')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Race Name:')
								])),
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('text'),
									$elm$html$Html$Attributes$class('race-builder__identity-input'),
									$elm$html$Html$Attributes$id('singularName'),
									$elm$html$Html$Attributes$value(config.e3),
									$elm$html$Html$Events$onInput($author$project$Msg$UpdateRaceBuilderSingularName),
									$elm$html$Html$Attributes$maxlength(15),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__identity-row')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$label,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__identity-label'),
									$elm$html$Html$Attributes$for('pluralName')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Plural Race Name:')
								])),
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('text'),
									$elm$html$Html$Attributes$class('race-builder__identity-input'),
									$elm$html$Html$Attributes$id('pluralName'),
									$elm$html$Html$Attributes$value(config.ew),
									$elm$html$Html$Events$onInput($author$project$Msg$UpdateRaceBuilderPluralName),
									$elm$html$Html$Attributes$maxlength(15),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__identity-row')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$label,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__identity-label'),
									$elm$html$Html$Attributes$for('password')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Password:')
								])),
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('password'),
									$elm$html$Html$Attributes$class('race-builder__identity-input race-builder__identity-input--short'),
									$elm$html$Html$Attributes$id('password'),
									$elm$html$Html$Attributes$value(config.er),
									$elm$html$Html$Events$onInput($author$project$Msg$UpdateRaceBuilderPassword),
									$elm$html$Html$Attributes$maxlength(15),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil)
						])),
					A2(
					$elm$html$Html$fieldset,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__predefined')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$legend,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text('Predefined Races')
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__predefined-grid')
								]),
							_List_fromArray(
								[
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'humanoid', 'Humanoid', selectedTemplate, isReadOnly),
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'silicanoid', 'Silicanoid', selectedTemplate, isReadOnly),
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'rabbitoid', 'Rabbitoid', selectedTemplate, isReadOnly),
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'antetheral', 'Antetheral', selectedTemplate, isReadOnly),
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'insectoid', 'Insectoid', selectedTemplate, isReadOnly),
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'random', 'Random', selectedTemplate, isReadOnly),
									A4($author$project$View$Dialog$RaceBuilder$viewTemplateOption, 'nucleotid', 'Nucleotoid', selectedTemplate, isReadOnly),
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__predefined-option')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$input,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$type_('radio'),
													$elm$html$Html$Attributes$name('template'),
													$elm$html$Html$Attributes$checked(selectedTemplate === 'custom'),
													$elm$html$Html$Events$onClick($author$project$Msg$SelectCustomTemplate),
													$elm$html$Html$Attributes$disabled(isReadOnly)
												]),
											_List_Nil),
											$elm$html$Html$text('Custom')
										]))
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__bottom-row')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__leftover-section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$for('leftover')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Spend up to 50 leftover advantage points on:')
										])),
									A2(
									$elm$html$Html$select,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__leftover-select'),
											$elm$html$Html$Attributes$id('leftover'),
											$elm$html$Html$Events$onInput(
											A2(
												$elm$core$Basics$composeR,
												$elm$core$String$toInt,
												A2(
													$elm$core$Basics$composeR,
													$elm$core$Maybe$withDefault(0),
													$author$project$Msg$UpdateRaceBuilderLeftoverPoints))),
											$elm$html$Html$Attributes$disabled(isReadOnly)
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$option,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$value('0'),
													$elm$html$Html$Attributes$selected(!config.d$)
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Surface minerals')
												])),
											A2(
											$elm$html$Html$option,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$value('1'),
													$elm$html$Html$Attributes$selected(config.d$ === 1)
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Mineral concentrations')
												])),
											A2(
											$elm$html$Html$option,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$value('2'),
													$elm$html$Html$Attributes$selected(config.d$ === 2)
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Mines')
												])),
											A2(
											$elm$html$Html$option,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$value('3'),
													$elm$html$Html$Attributes$selected(config.d$ === 3)
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Factories')
												])),
											A2(
											$elm$html$Html$option,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$value('4'),
													$elm$html$Html$Attributes$selected(config.d$ === 4)
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Defenses')
												]))
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__icon-picker')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$img,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$src(
											$author$project$View$Dialog$RaceBuilder$raceIconPath(config.dK)),
											$elm$html$Html$Attributes$alt(
											'Race icon ' + $elm$core$String$fromInt(config.dK)),
											$elm$html$Html$Attributes$class('race-builder__icon-image')
										]),
									_List_Nil),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__icon-nav')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$button,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('race-builder__icon-btn'),
													$elm$html$Html$Events$onClick(
													$author$project$Msg$UpdateRaceBuilderIcon(
														$author$project$View$Dialog$RaceBuilder$wrapIcon(config.dK - 1))),
													$elm$html$Html$Attributes$disabled(isReadOnly),
													$elm$html$Html$Attributes$title('Previous icon')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('<')
												])),
											A2(
											$elm$html$Html$button,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('race-builder__icon-btn'),
													$elm$html$Html$Events$onClick(
													$author$project$Msg$UpdateRaceBuilderIcon(
														$author$project$View$Dialog$RaceBuilder$wrapIcon(config.dK + 1))),
													$elm$html$Html$Attributes$disabled(isReadOnly),
													$elm$html$Html$Attributes$title('Next icon')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('>')
												]))
										]))
								]))
						]))
				]));
	});
var $author$project$View$Dialog$RaceBuilder$lrtAdvancedRemoteMining = 2;
var $author$project$View$Dialog$RaceBuilder$lrtBleedingEdgeTechnology = 12;
var $author$project$View$Dialog$RaceBuilder$lrtCheapEngines = 8;
var $author$project$View$Dialog$RaceBuilder$lrtGeneralizedResearch = 4;
var $author$project$View$Dialog$RaceBuilder$lrtImprovedFuelEfficiency = 0;
var $author$project$View$Dialog$RaceBuilder$lrtImprovedStarbases = 3;
var $author$project$View$Dialog$RaceBuilder$lrtLowStartingPopulation = 11;
var $author$project$View$Dialog$RaceBuilder$lrtMineralAlchemy = 6;
var $author$project$View$Dialog$RaceBuilder$lrtNoAdvancedScanners = 10;
var $author$project$View$Dialog$RaceBuilder$lrtNoRamScoopEngines = 7;
var $author$project$View$Dialog$RaceBuilder$lrtOnlyBasicRemoteMining = 9;
var $author$project$View$Dialog$RaceBuilder$lrtRegeneratingShields = 13;
var $author$project$View$Dialog$RaceBuilder$lrtTotalTerraforming = 1;
var $author$project$View$Dialog$RaceBuilder$lrtUltimateRecycling = 5;
var $author$project$Msg$ToggleRaceBuilderLRT = function (a) {
	return {$: 96, a: a};
};
var $author$project$View$Dialog$RaceBuilder$viewLRTOption = F3(
	function (lrt, selectedLrts, isReadOnly) {
		var isSelected = A2($elm$core$List$member, lrt.bB, selectedLrts);
		return A2(
			$elm$html$Html$label,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__lrt-option'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('is-selected', isSelected)
						]))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$input,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$type_('checkbox'),
							$elm$html$Html$Attributes$class('race-builder__lrt-checkbox'),
							$elm$html$Html$Attributes$checked(isSelected),
							$elm$html$Html$Events$onClick(
							$author$project$Msg$ToggleRaceBuilderLRT(lrt.bB)),
							$elm$html$Html$Attributes$disabled(isReadOnly)
						]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__lrt-name')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(lrt.ea)
						]))
				]));
	});
var $author$project$View$Dialog$RaceBuilder$viewLRTTab = F3(
	function (config, lrtInfos, isReadOnly) {
		var getLRT = function (idx) {
			return $elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (l) {
						return _Utils_eq(l.bB, idx);
					},
					lrtInfos));
		};
		var renderLRT = function (idx) {
			var _v1 = getLRT(idx);
			if (!_v1.$) {
				var lrt = _v1.a;
				return A3($author$project$View$Dialog$RaceBuilder$viewLRTOption, lrt, config.d0, isReadOnly);
			} else {
				return $elm$html$Html$text('');
			}
		};
		var firstSelectedLRT = A2(
			$elm$core$Maybe$andThen,
			getLRT,
			$elm$core$List$head(config.d0));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__lrt')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__lrt-grid')
						]),
					_List_fromArray(
						[
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtImprovedFuelEfficiency),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtNoRamScoopEngines),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtTotalTerraforming),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtCheapEngines),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtAdvancedRemoteMining),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtOnlyBasicRemoteMining),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtImprovedStarbases),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtNoAdvancedScanners),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtGeneralizedResearch),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtLowStartingPopulation),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtUltimateRecycling),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtBleedingEdgeTechnology),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtMineralAlchemy),
							renderLRT($author$project$View$Dialog$RaceBuilder$lrtRegeneratingShields)
						])),
					function () {
					if (!firstSelectedLRT.$) {
						var lrt = firstSelectedLRT.a;
						return A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__trait-description')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__trait-description-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(lrt.ea)
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('race-builder__trait-description-box')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(lrt.bf)
										]))
								]));
					} else {
						return $elm$html$Html$text('');
					}
				}()
				]));
	});
var $author$project$View$Dialog$RaceBuilder$prtAlternateReality = 8;
var $author$project$View$Dialog$RaceBuilder$prtClaimAdjuster = 3;
var $author$project$View$Dialog$RaceBuilder$prtHyperExpansion = 0;
var $author$project$View$Dialog$RaceBuilder$prtInnerStrength = 4;
var $author$project$View$Dialog$RaceBuilder$prtInterstellarTraveler = 7;
var $author$project$View$Dialog$RaceBuilder$prtJackOfAllTrades = 9;
var $author$project$View$Dialog$RaceBuilder$prtPacketPhysics = 6;
var $author$project$View$Dialog$RaceBuilder$prtSpaceDemolition = 5;
var $author$project$View$Dialog$RaceBuilder$prtSuperStealth = 1;
var $author$project$View$Dialog$RaceBuilder$prtWarMonger = 2;
var $author$project$Msg$UpdateRaceBuilderPRT = function (a) {
	return {$: 95, a: a};
};
var $author$project$View$Dialog$RaceBuilder$viewPRTOption = F3(
	function (prt, currentPrt, isReadOnly) {
		return A2(
			$elm$html$Html$label,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__prt-option'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'is-selected',
							_Utils_eq(prt.bB, currentPrt))
						]))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$input,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$type_('radio'),
							$elm$html$Html$Attributes$class('race-builder__prt-radio'),
							$elm$html$Html$Attributes$checked(
							_Utils_eq(prt.bB, currentPrt)),
							$elm$html$Html$Events$onClick(
							$author$project$Msg$UpdateRaceBuilderPRT(prt.bB)),
							$elm$html$Html$Attributes$disabled(isReadOnly)
						]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__prt-name')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(prt.ea)
						]))
				]));
	});
var $author$project$View$Dialog$RaceBuilder$viewPRTTab = F3(
	function (config, prtInfos, isReadOnly) {
		var getPRT = function (idx) {
			return $elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (p) {
						return _Utils_eq(p.bB, idx);
					},
					prtInfos));
		};
		var renderPRT = function (idx) {
			var _v0 = getPRT(idx);
			if (!_v0.$) {
				var prt = _v0.a;
				return A3($author$project$View$Dialog$RaceBuilder$viewPRTOption, prt, config.ex, isReadOnly);
			} else {
				return $elm$html$Html$text('');
			}
		};
		var selectedPRTDesc = A2(
			$elm$core$Maybe$withDefault,
			'',
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.bf;
				},
				getPRT(config.ex)));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__prt')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__prt-grid')
						]),
					_List_fromArray(
						[
							renderPRT($author$project$View$Dialog$RaceBuilder$prtHyperExpansion),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtSpaceDemolition),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtSuperStealth),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtPacketPhysics),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtWarMonger),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtInterstellarTraveler),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtClaimAdjuster),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtAlternateReality),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtInnerStrength),
							renderPRT($author$project$View$Dialog$RaceBuilder$prtJackOfAllTrades)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__trait-description')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__trait-description-label')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Description of Trait')
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('race-builder__trait-description-box')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(selectedPRTDesc)
								]))
						]))
				]));
	});
var $author$project$Msg$UpdateRaceBuilderResearchBiotech = function (a) {
	return {$: 126, a: a};
};
var $author$project$Msg$UpdateRaceBuilderResearchConstruction = function (a) {
	return {$: 124, a: a};
};
var $author$project$Msg$UpdateRaceBuilderResearchElectronics = function (a) {
	return {$: 125, a: a};
};
var $author$project$Msg$UpdateRaceBuilderResearchEnergy = function (a) {
	return {$: 121, a: a};
};
var $author$project$Msg$UpdateRaceBuilderResearchPropulsion = function (a) {
	return {$: 123, a: a};
};
var $author$project$Msg$UpdateRaceBuilderResearchWeapons = function (a) {
	return {$: 122, a: a};
};
var $author$project$Msg$UpdateRaceBuilderTechsStartHigh = function (a) {
	return {$: 127, a: a};
};
var $author$project$View$Dialog$RaceBuilder$viewResearchBox = F4(
	function (fieldName, currentLevel, onChange, isReadOnly) {
		return A2(
			$elm$html$Html$fieldset,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__research-box')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$legend,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__research-title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(fieldName + ' Research')
						])),
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__research-option')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('radio'),
									$elm$html$Html$Attributes$name('research-' + fieldName),
									$elm$html$Html$Attributes$checked(!currentLevel),
									$elm$html$Html$Events$onClick(
									onChange(0)),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil),
							$elm$html$Html$text('Costs 75% extra')
						])),
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__research-option')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('radio'),
									$elm$html$Html$Attributes$name('research-' + fieldName),
									$elm$html$Html$Attributes$checked(currentLevel === 1),
									$elm$html$Html$Events$onClick(
									onChange(1)),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil),
							$elm$html$Html$text('Costs standard amount')
						])),
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__research-option')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('radio'),
									$elm$html$Html$Attributes$name('research-' + fieldName),
									$elm$html$Html$Attributes$checked(currentLevel === 2),
									$elm$html$Html$Events$onClick(
									onChange(2)),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil),
							$elm$html$Html$text('Costs 50% less')
						]))
				]));
	});
var $author$project$View$Dialog$RaceBuilder$viewResearchTab = F2(
	function (config, isReadOnly) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__research')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__research-grid')
						]),
					_List_fromArray(
						[
							A4($author$project$View$Dialog$RaceBuilder$viewResearchBox, 'Energy', config.eK, $author$project$Msg$UpdateRaceBuilderResearchEnergy, isReadOnly),
							A4($author$project$View$Dialog$RaceBuilder$viewResearchBox, 'Construction', config.eI, $author$project$Msg$UpdateRaceBuilderResearchConstruction, isReadOnly),
							A4($author$project$View$Dialog$RaceBuilder$viewResearchBox, 'Weapons', config.eM, $author$project$Msg$UpdateRaceBuilderResearchWeapons, isReadOnly),
							A4($author$project$View$Dialog$RaceBuilder$viewResearchBox, 'Electronics', config.eJ, $author$project$Msg$UpdateRaceBuilderResearchElectronics, isReadOnly),
							A4($author$project$View$Dialog$RaceBuilder$viewResearchBox, 'Propulsion', config.eL, $author$project$Msg$UpdateRaceBuilderResearchPropulsion, isReadOnly),
							A4($author$project$View$Dialog$RaceBuilder$viewResearchBox, 'Biotechnology', config.eH, $author$project$Msg$UpdateRaceBuilderResearchBiotech, isReadOnly)
						])),
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('race-builder__checkbox-field')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('checkbox'),
									$elm$html$Html$Attributes$checked(config.fb),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$UpdateRaceBuilderTechsStartHigh(!config.fb)),
									$elm$html$Html$Attributes$disabled(isReadOnly)
								]),
							_List_Nil),
							$elm$html$Html$text('All \"Costs 75% extra\" research fields start at Tech 4')
						]))
				]));
	});
var $author$project$View$Dialog$RaceBuilder$viewTabContent = F5(
	function (tab, config, validation, selectedTemplate, isReadOnly) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__content')
				]),
			_List_fromArray(
				[
					function () {
					switch (tab) {
						case 0:
							return A3($author$project$View$Dialog$RaceBuilder$viewIdentityTab, config, selectedTemplate, isReadOnly);
						case 1:
							return A3($author$project$View$Dialog$RaceBuilder$viewPRTTab, config, validation.cc, isReadOnly);
						case 2:
							return A3($author$project$View$Dialog$RaceBuilder$viewLRTTab, config, validation.bL, isReadOnly);
						case 3:
							return A3($author$project$View$Dialog$RaceBuilder$viewHabitabilityTab, config, validation.by, isReadOnly);
						case 4:
							return A2($author$project$View$Dialog$RaceBuilder$viewEconomyTab, config, isReadOnly);
						default:
							return A2($author$project$View$Dialog$RaceBuilder$viewResearchTab, config, isReadOnly);
					}
				}()
				]));
	});
var $author$project$Model$EconomyTab = 4;
var $author$project$Model$HabitabilityTab = 3;
var $author$project$Model$LesserTraitsTab = 2;
var $author$project$Model$PrimaryTraitTab = 1;
var $author$project$Model$ResearchTab = 5;
var $author$project$Msg$SelectRaceBuilderTab = function (a) {
	return {$: 86, a: a};
};
var $author$project$View$Dialog$RaceBuilder$viewTab = F3(
	function (tab, label, activeTab) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('race-builder__tab'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'is-active',
							_Utils_eq(tab, activeTab))
						])),
					$elm$html$Html$Events$onClick(
					$author$project$Msg$SelectRaceBuilderTab(tab))
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(label)
				]));
	});
var $author$project$View$Dialog$RaceBuilder$viewTabs = function (activeTab) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-builder__tabs')
			]),
		_List_fromArray(
			[
				A3($author$project$View$Dialog$RaceBuilder$viewTab, 0, 'Identity', activeTab),
				A3($author$project$View$Dialog$RaceBuilder$viewTab, 1, 'Primary Trait', activeTab),
				A3($author$project$View$Dialog$RaceBuilder$viewTab, 2, 'Lesser Traits', activeTab),
				A3($author$project$View$Dialog$RaceBuilder$viewTab, 3, 'Habitability', activeTab),
				A3($author$project$View$Dialog$RaceBuilder$viewTab, 4, 'Economy', activeTab),
				A3($author$project$View$Dialog$RaceBuilder$viewTab, 5, 'Research', activeTab)
			]));
};
var $author$project$View$Dialog$RaceBuilder$viewRaceBuilderDialog = function (form) {
	var isReadOnly = function () {
		var _v0 = form.bN;
		if (!_v0.$) {
			return false;
		} else {
			return true;
		}
	}();
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-builder')
			]),
		_List_fromArray(
			[
				$author$project$View$Dialog$RaceBuilder$viewHeader(form.bN),
				$author$project$View$Dialog$RaceBuilder$viewTabs(form.a$),
				$author$project$View$Dialog$RaceBuilder$viewPointsBar(form.cU),
				form.I ? A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-builder__content race-builder__content--loading')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-builder__loading')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Loading race data...')
							]))
					])) : A5($author$project$View$Dialog$RaceBuilder$viewTabContent, form.a$, form.a7, form.cU, form.cs, isReadOnly),
				$author$project$View$Dialog$RaceBuilder$viewFooter(form)
			]));
};
var $author$project$Msg$OpenRaceBuilder = function (a) {
	return {$: 85, a: a};
};
var $author$project$Msg$UploadRace = {$: 73};
var $author$project$Msg$DeleteRace = function (a) {
	return {$: 77, a: a};
};
var $author$project$Msg$DownloadRace = function (a) {
	return {$: 75, a: a};
};
var $author$project$Msg$ViewRaceInBuilder = F2(
	function (a, b) {
		return {$: 129, a: a, b: b};
	});
var $author$project$View$Dialog$Races$viewRaceCard = function (race) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('race-card')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-card__info')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-card__name')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(race.eb)
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('race-card__singular')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Singular: ' + race.ec)
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('race-card__actions')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
								$elm$html$Html$Events$onClick(
								A2($author$project$Msg$ViewRaceInBuilder, race.dM, race.eb)),
								$elm$html$Html$Attributes$title('View race details')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('View')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$DownloadRace(race.dM)),
								$elm$html$Html$Attributes$title('Download race file')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Download')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--danger btn--sm'),
								$elm$html$Html$Events$onClick(
								$author$project$Msg$DeleteRace(race.dM)),
								$elm$html$Html$Attributes$title('Delete race')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Delete')
							]))
					]))
			]));
};
var $author$project$View$Dialog$Races$viewRacesDialog = F2(
	function (errorMsg, races) {
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('My Races')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							function () {
							if (!errorMsg.$) {
								var err = errorMsg.a;
								return A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('dialog__error')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(err)
										]));
							} else {
								return $elm$html$Html$text('');
							}
						}(),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('races-dialog__actions')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn-primary'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$OpenRaceBuilder($author$project$Model$FromRacesDialog))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Create Race')
										])),
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn-secondary'),
											$elm$html$Html$Events$onClick($author$project$Msg$UploadRace)
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Upload Race')
										]))
								])),
							$elm$core$List$isEmpty(races) ? A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('races-dialog__empty')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('No races uploaded yet')
								])) : A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('races-dialog__list')
								]),
							A2($elm$core$List$map, $author$project$View$Dialog$Races$viewRaceCard, races))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Close')
								]))
						]))
				]));
	});
var $author$project$Msg$SubmitRegister = function (a) {
	return {$: 27, a: a};
};
var $author$project$Msg$SwitchToConnect = {$: 20};
var $author$project$Msg$UpdateRegisterEmail = function (a) {
	return {$: 24, a: a};
};
var $author$project$Msg$UpdateRegisterMessage = function (a) {
	return {$: 25, a: a};
};
var $author$project$Msg$UpdateRegisterNickname = function (a) {
	return {$: 23, a: a};
};
var $elm$html$Html$textarea = _VirtualDom_node('textarea');
var $author$project$View$Dialog$Auth$viewRegisterDialog = F2(
	function (serverUrl, form) {
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Register Account')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					form.cL ? _List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('register-success')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('register-success__icon')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('\u2713')
										])),
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('register-success__title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Registration Submitted')
										])),
									A2(
									$elm$html$Html$p,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('register-success__message')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Your registration request has been submitted.'),
											A2($elm$html$Html$br, _List_Nil, _List_Nil),
											$elm$html$Html$text('A manager will review your request and you will receive your API key once approved.')
										]))
								]))
						]) : _List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('connect-dialog__tabs')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('connect-dialog__tab'),
											$elm$html$Html$Events$onClick($author$project$Msg$SwitchToConnect)
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Login')
										])),
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('connect-dialog__tab is-active')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Register')
										]))
								])),
							$author$project$View$Helpers$viewFormError(form.c),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Nickname')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$type_('text'),
											$elm$html$Html$Attributes$placeholder('Choose a nickname'),
											$elm$html$Html$Attributes$value(form.ee),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateRegisterNickname)
										]),
									_List_Nil)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Email')
										])),
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$type_('email'),
											$elm$html$Html$Attributes$placeholder('your@email.com'),
											$elm$html$Html$Attributes$value(form.dp),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateRegisterEmail)
										]),
									_List_Nil)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('form-group')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$label,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Message (optional)')
										])),
									A2(
									$elm$html$Html$textarea,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('form-input'),
											$elm$html$Html$Attributes$placeholder('Why do you want to join?'),
											$elm$html$Html$Attributes$value(form.bM),
											$elm$html$Html$Events$onInput($author$project$Msg$UpdateRegisterMessage)
										]),
									_List_Nil)
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									form.cL ? 'Close' : 'Cancel')
								])),
							form.cL ? $elm$html$Html$text('') : A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-primary'),
									$elm$html$Html$Attributes$classList(
									_List_fromArray(
										[
											_Utils_Tuple2('btn-loading', form.j)
										])),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitRegister(serverUrl)),
									$elm$html$Html$Attributes$disabled(form.j)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Register')
								]))
						]))
				]));
	});
var $author$project$Msg$ConfirmRemoveServer = function (a) {
	return {$: 14, a: a};
};
var $author$project$View$Dialog$Server$viewRemoveServerDialog = F2(
	function (serverUrl, serverName) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('confirm-dialog')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-danger')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h2,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Remove Server?')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Are you sure you want to remove this server? This action cannot be undone.')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-danger'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$ConfirmRemoveServer(serverUrl))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Remove')
								]))
						]))
				]));
	});
var $author$project$Msg$SubmitRules = {$: 182};
var $author$project$Msg$UpdateRulesAcceleratedBbsPlay = function (a) {
	return {$: 160, a: a};
};
var $author$project$Msg$UpdateRulesComputerPlayersFormAlliances = function (a) {
	return {$: 162, a: a};
};
var $author$project$Msg$UpdateRulesDensity = function (a) {
	return {$: 155, a: a};
};
var $author$project$Msg$UpdateRulesGalaxyClumping = function (a) {
	return {$: 164, a: a};
};
var $author$project$Msg$UpdateRulesMaximumMinerals = function (a) {
	return {$: 158, a: a};
};
var $author$project$Msg$UpdateRulesNoRandomEvents = function (a) {
	return {$: 161, a: a};
};
var $author$project$Msg$UpdateRulesPublicPlayerScores = function (a) {
	return {$: 163, a: a};
};
var $author$project$Msg$UpdateRulesSlowerTechAdvances = function (a) {
	return {$: 159, a: a};
};
var $author$project$Msg$UpdateRulesStartingDistance = function (a) {
	return {$: 156, a: a};
};
var $author$project$Msg$UpdateRulesUniverseSize = function (a) {
	return {$: 154, a: a};
};
var $author$project$Msg$UpdateRulesVcAttainTechInFields = function (a) {
	return {$: 167, a: a};
};
var $author$project$Msg$UpdateRulesVcAttainTechInFieldsFieldsValue = function (a) {
	return {$: 169, a: a};
};
var $author$project$Msg$UpdateRulesVcAttainTechInFieldsTechValue = function (a) {
	return {$: 168, a: a};
};
var $author$project$Msg$UpdateRulesVcExceedNextPlayerScoreBy = function (a) {
	return {$: 172, a: a};
};
var $author$project$Msg$UpdateRulesVcExceedNextPlayerScoreByValue = function (a) {
	return {$: 173, a: a};
};
var $author$project$Msg$UpdateRulesVcExceedScoreOf = function (a) {
	return {$: 170, a: a};
};
var $author$project$Msg$UpdateRulesVcExceedScoreOfValue = function (a) {
	return {$: 171, a: a};
};
var $author$project$Msg$UpdateRulesVcHasProductionCapacityOf = function (a) {
	return {$: 174, a: a};
};
var $author$project$Msg$UpdateRulesVcHasProductionCapacityOfValue = function (a) {
	return {$: 175, a: a};
};
var $author$project$Msg$UpdateRulesVcHaveHighestScoreAfterYears = function (a) {
	return {$: 178, a: a};
};
var $author$project$Msg$UpdateRulesVcHaveHighestScoreAfterYearsValue = function (a) {
	return {$: 179, a: a};
};
var $author$project$Msg$UpdateRulesVcMinYearsBeforeWinner = function (a) {
	return {$: 181, a: a};
};
var $author$project$Msg$UpdateRulesVcOwnsCapitalShips = function (a) {
	return {$: 176, a: a};
};
var $author$project$Msg$UpdateRulesVcOwnsCapitalShipsValue = function (a) {
	return {$: 177, a: a};
};
var $author$project$Msg$UpdateRulesVcOwnsPercentOfPlanets = function (a) {
	return {$: 165, a: a};
};
var $author$project$Msg$UpdateRulesVcOwnsPercentOfPlanetsValue = function (a) {
	return {$: 166, a: a};
};
var $author$project$Msg$UpdateRulesVcWinnerMustMeet = function (a) {
	return {$: 180, a: a};
};
var $elm$html$Html$Events$targetChecked = A2(
	$elm$json$Json$Decode$at,
	_List_fromArray(
		['target', 'checked']),
	$elm$json$Json$Decode$bool);
var $elm$html$Html$Events$onCheck = function (tagger) {
	return A2(
		$elm$html$Html$Events$on,
		'change',
		A2($elm$json$Json$Decode$map, tagger, $elm$html$Html$Events$targetChecked));
};
var $author$project$View$Dialog$Rules$viewRulesCheckbox = F5(
	function (isEditable, labelText, description, currentValue, toMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('rules-dialog__field rules-dialog__field--checkbox')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__checkbox-label')
						]),
					_List_fromArray(
						[
							isEditable ? A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('checkbox'),
									$elm$html$Html$Attributes$checked(currentValue),
									$elm$html$Html$Events$onCheck(toMsg)
								]),
							_List_Nil) : A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__checkbox-indicator')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									currentValue ? '[x]' : '[ ]')
								])),
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__checkbox-text')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(labelText)
								]))
						])),
					(!$elm$core$String$isEmpty(description)) ? A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__field-description')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(description)
						])) : $elm$html$Html$text('')
				]));
	});
var $author$project$View$Dialog$Rules$viewRulesSection = F2(
	function (title, content) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('rules-dialog__section')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__section-title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(title)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__section-content')
						]),
					content)
				]));
	});
var $author$project$View$Dialog$Rules$viewRulesSelect = F5(
	function (isEditable, labelText, currentValue, options, toMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('rules-dialog__field')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__label')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(labelText)
						])),
					isEditable ? A2(
					$elm$html$Html$select,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__select'),
							$elm$html$Html$Events$onInput(
							function (s) {
								return toMsg(
									A2(
										$elm$core$Maybe$withDefault,
										currentValue,
										$elm$core$String$toInt(s)));
							})
						]),
					A2(
						$elm$core$List$map,
						function (_v0) {
							var val = _v0.a;
							var txt = _v0.b;
							return A2(
								$elm$html$Html$option,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$value(
										$elm$core$String$fromInt(val)),
										$elm$html$Html$Attributes$selected(
										_Utils_eq(val, currentValue))
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(txt)
									]));
						},
						options)) : A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__value')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(
							A2(
								$elm$core$Maybe$withDefault,
								'Unknown',
								$elm$core$List$head(
									A2(
										$elm$core$List$filterMap,
										function (_v1) {
											var val = _v1.a;
											var txt = _v1.b;
											return _Utils_eq(val, currentValue) ? $elm$core$Maybe$Just(txt) : $elm$core$Maybe$Nothing;
										},
										options))))
						]))
				]));
	});
var $author$project$View$Dialog$Rules$viewRulesVictoryCondition = F7(
	function (isEditable, prefix, enabled, valueStr, suffix, toggleMsg, valueMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('rules-dialog__field rules-dialog__field--victory')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__checkbox-label')
						]),
					_List_fromArray(
						[
							isEditable ? A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('checkbox'),
									$elm$html$Html$Attributes$checked(enabled),
									$elm$html$Html$Events$onCheck(toggleMsg)
								]),
							_List_Nil) : A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__checkbox-indicator')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									enabled ? '[x]' : '[ ]')
								])),
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(prefix + ' ')
								])),
							isEditable ? A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('number'),
									$elm$html$Html$Attributes$class('rules-dialog__input rules-dialog__input--inline'),
									$elm$html$Html$Attributes$value(valueStr),
									$elm$html$Html$Events$onInput(valueMsg),
									$elm$html$Html$Attributes$disabled(!enabled)
								]),
							_List_Nil) : A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__value rules-dialog__value--inline')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(valueStr)
								])),
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(' ' + suffix)
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Rules$viewRulesVictoryConditionTech = F8(
	function (isEditable, prefix, enabled, techValueStr, fieldsValueStr, toggleMsg, techMsg, fieldsMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('rules-dialog__field rules-dialog__field--victory')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('rules-dialog__checkbox-label')
						]),
					_List_fromArray(
						[
							isEditable ? A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('checkbox'),
									$elm$html$Html$Attributes$checked(enabled),
									$elm$html$Html$Events$onCheck(toggleMsg)
								]),
							_List_Nil) : A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__checkbox-indicator')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									enabled ? '[x]' : '[ ]')
								])),
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(prefix + ' ')
								])),
							isEditable ? A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('number'),
									$elm$html$Html$Attributes$class('rules-dialog__input rules-dialog__input--inline'),
									$elm$html$Html$Attributes$value(techValueStr),
									$elm$html$Html$Events$onInput(techMsg),
									$elm$html$Html$Attributes$disabled(!enabled)
								]),
							_List_Nil) : A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__value rules-dialog__value--inline')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(techValueStr)
								])),
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(' in ')
								])),
							isEditable ? A2(
							$elm$html$Html$input,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('number'),
									$elm$html$Html$Attributes$class('rules-dialog__input rules-dialog__input--inline'),
									$elm$html$Html$Attributes$value(fieldsValueStr),
									$elm$html$Html$Events$onInput(fieldsMsg),
									$elm$html$Html$Attributes$disabled(!enabled)
								]),
							_List_Nil) : A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rules-dialog__value rules-dialog__value--inline')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(fieldsValueStr)
								])),
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(' fields')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Rules$viewRulesDialog = function (form) {
	var r = form.cl;
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('rules-dialog')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								form.dW ? 'Configure Game Rules' : 'Game Rules')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__close'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('x')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__body rules-dialog__body')
					]),
				_List_fromArray(
					[
						$author$project$View$Helpers$viewFormError(form.c),
						form.I ? A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('loading')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('spinner')
									]),
								_List_Nil),
								$elm$html$Html$text('Loading rules...')
							])) : A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('rules-dialog__content')
							]),
						_List_fromArray(
							[
								A2(
								$author$project$View$Dialog$Rules$viewRulesSection,
								'Universe Settings',
								_List_fromArray(
									[
										A5(
										$author$project$View$Dialog$Rules$viewRulesSelect,
										form.dW,
										'Universe Size',
										r.fj,
										_List_fromArray(
											[
												_Utils_Tuple2(0, 'Tiny (400 ly)'),
												_Utils_Tuple2(1, 'Small (800 ly)'),
												_Utils_Tuple2(2, 'Medium (1200 ly)'),
												_Utils_Tuple2(3, 'Large (1600 ly)'),
												_Utils_Tuple2(4, 'Huge (2000 ly)')
											]),
										$author$project$Msg$UpdateRulesUniverseSize),
										A5(
										$author$project$View$Dialog$Rules$viewRulesSelect,
										form.dW,
										'Density',
										r.de,
										_List_fromArray(
											[
												_Utils_Tuple2(0, 'Sparse'),
												_Utils_Tuple2(1, 'Normal'),
												_Utils_Tuple2(2, 'Dense'),
												_Utils_Tuple2(3, 'Packed')
											]),
										$author$project$Msg$UpdateRulesDensity),
										A5(
										$author$project$View$Dialog$Rules$viewRulesSelect,
										form.dW,
										'Starting Distance',
										r.e6,
										_List_fromArray(
											[
												_Utils_Tuple2(0, 'Close'),
												_Utils_Tuple2(1, 'Moderate'),
												_Utils_Tuple2(2, 'Farther'),
												_Utils_Tuple2(3, 'Distant')
											]),
										$author$project$Msg$UpdateRulesStartingDistance)
									])),
								A2(
								$author$project$View$Dialog$Rules$viewRulesSection,
								'Game Options',
								_List_fromArray(
									[
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'Maximum Minerals', 'Start with maximum mineral concentrations', r.d2, $author$project$Msg$UpdateRulesMaximumMinerals),
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'Slower Tech Advances', 'Technology costs 2x more to research', r.e4, $author$project$Msg$UpdateRulesSlowerTechAdvances),
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'Accelerated BBS Play', 'Faster game progression for play-by-post', r.c_, $author$project$Msg$UpdateRulesAcceleratedBbsPlay),
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'No Random Events', 'Disable mystery traders, comets, etc.', r.ef, $author$project$Msg$UpdateRulesNoRandomEvents),
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'Computer Players Form Alliances', 'AI players can ally with each other', r.db, $author$project$Msg$UpdateRulesComputerPlayersFormAlliances),
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'Public Player Scores', 'All players can see everyone\'s scores', r.ey, $author$project$Msg$UpdateRulesPublicPlayerScores),
										A5($author$project$View$Dialog$Rules$viewRulesCheckbox, form.dW, 'Galaxy Clumping', 'Stars cluster together in the galaxy', r.dA, $author$project$Msg$UpdateRulesGalaxyClumping)
									])),
								A2(
								$author$project$View$Dialog$Rules$viewRulesSection,
								'Victory Conditions',
								_List_fromArray(
									[
										A7(
										$author$project$View$Dialog$Rules$viewRulesVictoryCondition,
										form.dW,
										'Owns',
										r.fF,
										$elm$core$String$fromInt(r.fG),
										'% of all planets',
										$author$project$Msg$UpdateRulesVcOwnsPercentOfPlanets,
										$author$project$Msg$UpdateRulesVcOwnsPercentOfPlanetsValue),
										A8(
										$author$project$View$Dialog$Rules$viewRulesVictoryConditionTech,
										form.dW,
										'Attain tech level',
										r.fr,
										$elm$core$String$fromInt(r.ft),
										$elm$core$String$fromInt(r.fs),
										$author$project$Msg$UpdateRulesVcAttainTechInFields,
										$author$project$Msg$UpdateRulesVcAttainTechInFieldsTechValue,
										$author$project$Msg$UpdateRulesVcAttainTechInFieldsFieldsValue),
										A7(
										$author$project$View$Dialog$Rules$viewRulesVictoryCondition,
										form.dW,
										'Exceed score of',
										r.fw,
										$elm$core$String$fromInt(r.fx),
										'',
										$author$project$Msg$UpdateRulesVcExceedScoreOf,
										$author$project$Msg$UpdateRulesVcExceedScoreOfValue),
										A7(
										$author$project$View$Dialog$Rules$viewRulesVictoryCondition,
										form.dW,
										'Exceed second place score by',
										r.fu,
										$elm$core$String$fromInt(r.fv),
										'%',
										$author$project$Msg$UpdateRulesVcExceedNextPlayerScoreBy,
										$author$project$Msg$UpdateRulesVcExceedNextPlayerScoreByValue),
										A7(
										$author$project$View$Dialog$Rules$viewRulesVictoryCondition,
										form.dW,
										'Production capacity of',
										r.fy,
										$elm$core$String$fromInt(r.fz),
										'k resources',
										$author$project$Msg$UpdateRulesVcHasProductionCapacityOf,
										$author$project$Msg$UpdateRulesVcHasProductionCapacityOfValue),
										A7(
										$author$project$View$Dialog$Rules$viewRulesVictoryCondition,
										form.dW,
										'Owns',
										r.fD,
										$elm$core$String$fromInt(r.fE),
										'capital ships',
										$author$project$Msg$UpdateRulesVcOwnsCapitalShips,
										$author$project$Msg$UpdateRulesVcOwnsCapitalShipsValue),
										A7(
										$author$project$View$Dialog$Rules$viewRulesVictoryCondition,
										form.dW,
										'Highest score after',
										r.fA,
										$elm$core$String$fromInt(r.fB),
										'years',
										$author$project$Msg$UpdateRulesVcHaveHighestScoreAfterYears,
										$author$project$Msg$UpdateRulesVcHaveHighestScoreAfterYearsValue)
									])),
								A2(
								$author$project$View$Dialog$Rules$viewRulesSection,
								'Victory Requirements',
								_List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('rules-dialog__field')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$label,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('rules-dialog__label')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('Winner must meet')
													])),
												form.dW ? A2(
												$elm$html$Html$input,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$type_('number'),
														$elm$html$Html$Attributes$class('rules-dialog__input rules-dialog__input--small'),
														$elm$html$Html$Attributes$value(
														$elm$core$String$fromInt(r.fH)),
														$elm$html$Html$Attributes$min('0'),
														$elm$html$Html$Attributes$max('7'),
														$elm$html$Html$Events$onInput($author$project$Msg$UpdateRulesVcWinnerMustMeet)
													]),
												_List_Nil) : A2(
												$elm$html$Html$span,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('rules-dialog__value')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														$elm$core$String$fromInt(r.fH))
													])),
												A2(
												$elm$html$Html$span,
												_List_Nil,
												_List_fromArray(
													[
														$elm$html$Html$text(' of the above conditions')
													]))
											])),
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('rules-dialog__field')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$label,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('rules-dialog__label')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('Minimum years before winner declared')
													])),
												form.dW ? A2(
												$elm$html$Html$input,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$type_('number'),
														$elm$html$Html$Attributes$class('rules-dialog__input rules-dialog__input--small'),
														$elm$html$Html$Attributes$value(
														$elm$core$String$fromInt(r.fC)),
														$elm$html$Html$Attributes$min('30'),
														$elm$html$Html$Attributes$max('500'),
														$elm$html$Html$Events$onInput($author$project$Msg$UpdateRulesVcMinYearsBeforeWinner)
													]),
												_List_Nil) : A2(
												$elm$html$Html$span,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('rules-dialog__value')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														$elm$core$String$fromInt(r.fC))
													]))
											]))
									]))
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn-secondary'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								form.dW ? 'Cancel' : 'Close')
							])),
						form.dW ? A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn-primary'),
								$elm$html$Html$Attributes$disabled(form.j),
								$elm$html$Html$Events$onClick($author$project$Msg$SubmitRules)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								form.j ? 'Saving...' : 'Save Rules')
							])) : $elm$html$Html$text('')
					]))
			]));
};
var $author$project$Msg$CheckNtvdmSupport = {$: 213};
var $author$project$Msg$CheckWineInstall = {$: 211};
var $author$project$Msg$SelectServersDir = {$: 202};
var $author$project$Msg$SelectWinePrefixesDir = {$: 209};
var $author$project$Msg$SetAutoDownloadStars = function (a) {
	return {$: 205, a: a};
};
var $author$project$Msg$SetUseWine = function (a) {
	return {$: 207, a: a};
};
var $elm$core$Basics$ge = _Utils_ge;
var $elm$html$Html$a = _VirtualDom_node('a');
var $elm$html$Html$Attributes$href = function (url) {
	return A2(
		$elm$html$Html$Attributes$stringProperty,
		'href',
		_VirtualDom_noJavaScriptUri(url));
};
var $elm$html$Html$Attributes$target = $elm$html$Html$Attributes$stringProperty('target');
var $author$project$View$Dialog$Settings$viewNtvdmStatus = function (maybeResult) {
	if (!maybeResult.$) {
		var result = maybeResult.a;
		return result.c2 ? A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--valid')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(result.bM)
				])) : A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--invalid')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(result.bM),
					function () {
					var _v1 = result.dI;
					if (!_v1.$) {
						var url = _v1.a;
						return A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('settings-dialog__help-link')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$a,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$href(url),
											$elm$html$Html$Attributes$target('_blank')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Download OTVDM nightly build')
										]))
								]));
					} else {
						return $elm$html$Html$text('');
					}
				}()
				]));
	} else {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--not-checked')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('Not checked')
				]));
	}
};
var $author$project$View$Dialog$Settings$viewWineStatus = F2(
	function (isValid, maybeMessage) {
		if (!maybeMessage.$) {
			var message = maybeMessage.a;
			return isValid ? A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--valid')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(message)
					])) : A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--invalid')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(message)
					]));
		} else {
			return isValid ? A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--valid')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Validated')
					])) : A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('settings-dialog__wine-status settings-dialog__wine-status--not-checked')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('Not checked')
					]));
		}
	});
var $author$project$View$Dialog$Settings$viewSettingsDialog = F5(
	function (maybeSettings, wineCheckInProgress, wineCheckMessage, ntvdmCheckInProgress, ntvdmCheckResult) {
		var zoomLevel = A2(
			$elm$core$Maybe$withDefault,
			100,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.fP;
				},
				maybeSettings));
		var winePrefixesDir = A2(
			$elm$core$Maybe$withDefault,
			'~/.config/astrum/wine_prefixes',
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.fK;
				},
				maybeSettings));
		var validWineInstall = A2(
			$elm$core$Maybe$withDefault,
			false,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.fq;
				},
				maybeSettings));
		var useWine = A2(
			$elm$core$Maybe$withDefault,
			false,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.fm;
				},
				maybeSettings));
		var serversDir = A2(
			$elm$core$Maybe$withDefault,
			'Loading...',
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.eT;
				},
				maybeSettings));
		var autoDownloadStars = A2(
			$elm$core$Maybe$withDefault,
			true,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.c1;
				},
				maybeSettings));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('settings-dialog')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Settings')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('\u00D7')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('settings-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Display')
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$label,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__label')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text(
													'Zoom Level: ' + ($elm$core$String$fromInt(zoomLevel) + '%'))
												])),
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__zoom-row')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary btn--small'),
															$elm$html$Html$Events$onClick($author$project$Msg$ZoomOut),
															$elm$html$Html$Attributes$disabled(zoomLevel <= 50)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text('-')
														])),
													A2(
													$elm$html$Html$div,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('settings-dialog__zoom-bar')
														]),
													_List_fromArray(
														[
															A2(
															$elm$html$Html$div,
															_List_fromArray(
																[
																	$elm$html$Html$Attributes$class('settings-dialog__zoom-fill'),
																	A2(
																	$elm$html$Html$Attributes$style,
																	'width',
																	$elm$core$String$fromFloat(((zoomLevel - 50) / 150) * 100) + '%')
																]),
															_List_Nil)
														])),
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary btn--small'),
															$elm$html$Html$Events$onClick($author$project$Msg$ZoomIn),
															$elm$html$Html$Attributes$disabled(zoomLevel >= 200)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text('+')
														])),
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary btn--small'),
															$elm$html$Html$Events$onClick($author$project$Msg$ZoomReset)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text('Reset')
														]))
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Shortcuts: Ctrl+Plus/Minus, Ctrl+Scroll, or Ctrl+0 to reset.')
												]))
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('settings-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Game Files')
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$label,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__label')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Servers Directory')
												])),
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__path-row')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$span,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('settings-dialog__path')
														]),
													_List_fromArray(
														[
															$elm$html$Html$text(serversDir)
														])),
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary btn--small'),
															$elm$html$Html$Events$onClick($author$project$Msg$SelectServersDir)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text('Change...')
														]))
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Game files for each session are stored in subdirectories under this folder.')
												]))
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$label,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__checkbox-label')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$input,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$type_('checkbox'),
															$elm$html$Html$Attributes$checked(autoDownloadStars),
															$elm$html$Html$Events$onCheck($author$project$Msg$SetAutoDownloadStars)
														]),
													_List_Nil),
													$elm$html$Html$text('Auto download Stars.exe')
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Automatically download Stars.exe from the server to each session directory.')
												]))
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('settings-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Wine (Linux)')
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$label,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__checkbox-label')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$input,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$type_('checkbox'),
															$elm$html$Html$Attributes$checked(useWine),
															$elm$html$Html$Events$onCheck($author$project$Msg$SetUseWine)
														]),
													_List_Nil),
													$elm$html$Html$text('Use Wine to launch Stars!')
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Enable this on Linux to run Stars! through Wine.')
												]))
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$label,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__label')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Wine Prefixes Directory')
												])),
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__path-row')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$span,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('settings-dialog__path')
														]),
													_List_fromArray(
														[
															$elm$html$Html$text(winePrefixesDir)
														])),
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary btn--small'),
															$elm$html$Html$Events$onClick($author$project$Msg$SelectWinePrefixesDir),
															$elm$html$Html$Attributes$disabled(!useWine)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text('Change...')
														]))
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Directory containing per-server Wine prefixes. Each server gets its own prefix for separate serial keys.')
												]))
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__wine-check-row')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary'),
															$elm$html$Html$Events$onClick($author$project$Msg$CheckWineInstall),
															$elm$html$Html$Attributes$disabled((!useWine) || wineCheckInProgress)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text(
															wineCheckInProgress ? 'Checking...' : 'Check Wine Installation')
														])),
													A2($author$project$View$Dialog$Settings$viewWineStatus, validWineInstall, wineCheckMessage)
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Verifies that 32-bit Wine is properly installed and working.')
												]))
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('settings-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('16-bit Support (Windows)')
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Stars! is a 16-bit application. 64-bit Windows requires OTVDM (winevdm) to run 16-bit programs. 32-bit Windows uses native NTVDM.')
												]))
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('settings-dialog__field')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__wine-check-row')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--secondary'),
															$elm$html$Html$Events$onClick($author$project$Msg$CheckNtvdmSupport),
															$elm$html$Html$Attributes$disabled(ntvdmCheckInProgress)
														]),
													_List_fromArray(
														[
															$elm$html$Html$text(
															ntvdmCheckInProgress ? 'Checking...' : 'Check 16-bit Support')
														])),
													$author$project$View$Dialog$Settings$viewNtvdmStatus(ntvdmCheckResult)
												])),
											A2(
											$elm$html$Html$p,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('settings-dialog__hint')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Checks for OTVDM (64-bit) or NTVDM (32-bit) to run Stars!.')
												]))
										]))
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Close')
								]))
						]))
				]));
	});
var $author$project$Model$FromSetupRaceDialog = function (a) {
	return {$: 1, a: a};
};
var $author$project$Msg$SubmitSetupRace = {$: 81};
var $author$project$Msg$UploadAndSetRace = {$: 83};
var $author$project$Msg$SelectRaceForSession = function (a) {
	return {$: 80, a: a};
};
var $author$project$View$Dialog$Races$viewSetupRaceOption = F2(
	function (selectedRaceId, race) {
		var isSelected = _Utils_eq(
			selectedRaceId,
			$elm$core$Maybe$Just(race.dM));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('setup-race-dialog__race'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('is-selected', isSelected)
						])),
					$elm$html$Html$Events$onClick(
					$author$project$Msg$SelectRaceForSession(race.dM))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('setup-race-dialog__race-name')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(race.eb)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('setup-race-dialog__race-singular')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Singular: ' + race.ec)
						]))
				]));
	});
var $author$project$View$Dialog$Races$viewSetupRaceDialog = F2(
	function (form, races) {
		return A2(
			$elm$html$Html$div,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Setup My Race')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							$author$project$View$Helpers$viewFormError(form.c),
							A2(
							$elm$html$Html$p,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('setup-race-dialog__description')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Select a race from your profile to use in this session, or upload a new one.')
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('setup-race-dialog__actions')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn-primary'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$OpenRaceBuilder(
												$author$project$Model$FromSetupRaceDialog(form.eV)))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Create New Race')
										])),
									A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn-secondary'),
											$elm$html$Html$Events$onClick($author$project$Msg$UploadAndSetRace)
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Upload Race')
										]))
								])),
							$elm$core$List$isEmpty(races) ? A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('setup-race-dialog__empty')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('No races in your profile. Upload a race file to get started.')
								])) : A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('setup-race-dialog__list')
								]),
							A2(
								$elm$core$List$map,
								$author$project$View$Dialog$Races$viewSetupRaceOption(form.cq),
								races))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer dialog__footer--right')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-primary'),
									$elm$html$Html$Attributes$disabled(
									_Utils_eq(form.cq, $elm$core$Maybe$Nothing) || form.j),
									$elm$html$Html$Events$onClick($author$project$Msg$SubmitSetupRace)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									form.j ? 'Setting up...' : 'Use This Race')
								]))
						]))
				]));
	});
var $author$project$Msg$OpenMapViewer = F4(
	function (a, b, c, d) {
		return {$: 263, a: a, b: b, c: c, d: d};
	});
var $author$project$View$Dialog$TurnFiles$viewPlayerOrderStatus = function (player) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('turn-files-dialog__order-row'),
				$elm$html$Html$Attributes$classList(
				_List_fromArray(
					[
						_Utils_Tuple2('turn-files-dialog__order-row--submitted', player.e7),
						_Utils_Tuple2('turn-files-dialog__order-row--pending', !player.e7)
					]))
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('turn-files-dialog__order-number')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						$elm$core$String$fromInt(player.eu + 1))
					])),
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('turn-files-dialog__order-name')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						player.dU ? (player.ee + ' (Bot)') : player.ee)
					])),
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('turn-files-dialog__order-status')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						player.e7 ? 'Submitted' : 'Pending')
					]))
			]));
};
var $author$project$View$Dialog$TurnFiles$viewTurnFilesDialog = F2(
	function (form, hasConflict) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('turn-files-dialog')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									'Year ' + $elm$core$String$fromInt(form.fO))
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('dialog__close'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('x')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__body')
						]),
					_List_fromArray(
						[
							$author$project$View$Helpers$viewFormError(form.c),
							hasConflict ? A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('turn-files-dialog__conflict-warning')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Warning: Local order file was modified after upload. This may indicate a problem.')
								])) : $elm$html$Html$text(''),
							function () {
							var _v0 = form.bZ;
							if (!_v0.$) {
								var ordersStatus = _v0.a;
								return A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('turn-files-dialog__section')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$h3,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('turn-files-dialog__section-title')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Orders Status')
												])),
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('turn-files-dialog__orders')
												]),
											A2($elm$core$List$map, $author$project$View$Dialog$TurnFiles$viewPlayerOrderStatus, ordersStatus.ev))
										]));
							} else {
								return form.bE ? A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('turn-files-dialog__section')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$h3,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('turn-files-dialog__section-title')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Orders Status')
												])),
											A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('turn-files-dialog__loading')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Loading orders status...')
												]))
										])) : $elm$html$Html$text('');
							}
						}(),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('turn-files-dialog__section')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h3,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('turn-files-dialog__section-title')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Turn Files')
										])),
									function () {
									if (form.I) {
										return A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('turn-files-dialog__loading')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Loading turn files...')
												]));
									} else {
										var _v1 = form.cR;
										if (!_v1.$) {
											var turnFiles = _v1.a;
											return A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('turn-files-dialog__files')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('turn-files-dialog__file')
															]),
														_List_fromArray(
															[
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('turn-files-dialog__file-label')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Universe File (.xy)')
																	])),
																A2(
																$elm$html$Html$div,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('turn-files-dialog__file-info')
																	]),
																_List_fromArray(
																	[
																		A2(
																		$elm$html$Html$span,
																		_List_fromArray(
																			[
																				$elm$html$Html$Attributes$class('turn-files-dialog__file-size')
																			]),
																		_List_fromArray(
																			[
																				$elm$html$Html$text(
																				$elm$core$String$fromInt(
																					$elm$core$String$length(turnFiles.fi)) + ' bytes (base64)')
																			]))
																	]))
															])),
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('turn-files-dialog__file')
															]),
														_List_fromArray(
															[
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('turn-files-dialog__file-label')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Turn File (.m)')
																	])),
																A2(
																$elm$html$Html$div,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('turn-files-dialog__file-info')
																	]),
																_List_fromArray(
																	[
																		A2(
																		$elm$html$Html$span,
																		_List_fromArray(
																			[
																				$elm$html$Html$Attributes$class('turn-files-dialog__file-size')
																			]),
																		_List_fromArray(
																			[
																				$elm$html$Html$text(
																				$elm$core$String$fromInt(
																					$elm$core$String$length(turnFiles.fg)) + ' bytes (base64)')
																			]))
																	]))
															]))
													]));
										} else {
											return A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('turn-files-dialog__empty')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('No turn files available')
													]));
										}
									}
								}()
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog__footer')
						]),
					_List_fromArray(
						[
							function () {
							var _v2 = form.cR;
							if (!_v2.$) {
								return A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--secondary'),
											$elm$html$Html$Events$onClick(
											A4($author$project$Msg$OpenMapViewer, form.eV, form.fO, form.az, form.ay))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('View Map')
										]));
							} else {
								return $elm$html$Html$text('');
							}
						}(),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Close')
								]))
						]))
				]));
	});
var $author$project$Msg$OpenCreateUserDialog = {$: 217};
var $author$project$Msg$SwitchUsersListPane = {$: 230};
var $author$project$Msg$UpdateUsersListFilter = function (a) {
	return {$: 216, a: a};
};
var $author$project$View$Dialog$Users$onEscapeClear = function (currentFilter) {
	return A2(
		$elm$html$Html$Events$stopPropagationOn,
		'keydown',
		A2(
			$elm$json$Json$Decode$andThen,
			function (key) {
				return ((key === 'Escape') && (!$elm$core$String$isEmpty(currentFilter))) ? $elm$json$Json$Decode$succeed(
					_Utils_Tuple2(
						$author$project$Msg$UpdateUsersListFilter(''),
						true)) : $elm$json$Json$Decode$fail('not escape or filter empty');
			},
			A2($elm$json$Json$Decode$field, 'key', $elm$json$Json$Decode$string)));
};
var $elm$core$String$toLower = _String_toLower;
var $author$project$View$Dialog$Users$userMatchesFilter = F2(
	function (query, user) {
		var lowerQuery = $elm$core$String$toLower(query);
		var lowerNickname = $elm$core$String$toLower(user.ee);
		var lowerEmail = $elm$core$String$toLower(user.dp);
		return A2($elm$core$String$contains, lowerQuery, lowerNickname) || A2($elm$core$String$contains, lowerQuery, lowerEmail);
	});
var $author$project$Msg$CancelApproveRegistration = {$: 235};
var $author$project$View$Dialog$Users$viewApproveComplete = F2(
	function (nickname, newApikey) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__result')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-icon')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('\u2713')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Registration Approved: ' + nickname)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-warning')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Please save this API key as the server will not show it again:')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-key')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(newApikey)
						])),
					A2(
					$elm$html$Html$button,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('btn btn--primary'),
							$elm$html$Html$Events$onClick($author$project$Msg$CancelApproveRegistration)
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Done')
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewApproveError = F2(
	function (nickname, errorMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__error')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-danger')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Approval Failed')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Failed to approve registration for ' + (nickname + ':')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text(errorMsg)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelApproveRegistration)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('OK')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewApprovingUser = function (nickname) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('users-list-dialog__loading')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('spinner')
					]),
				_List_Nil),
				$elm$html$Html$text('Approving registration for ' + (nickname + '...'))
			]));
};
var $author$project$Msg$SubmitApproveRegistration = function (a) {
	return {$: 236, a: a};
};
var $author$project$View$Dialog$Users$viewConfirmApprove = F2(
	function (userId, nickname) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__confirm')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-success')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('\u2713')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Approve Registration?')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Approve the registration request from ' + (nickname + '?')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text('This will create their account and generate an API key.')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelApproveRegistration)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitApproveRegistration(userId))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Approve')
								]))
						]))
				]));
	});
var $author$project$Msg$CancelRejectRegistration = {$: 239};
var $author$project$Msg$SubmitRejectRegistration = function (a) {
	return {$: 240, a: a};
};
var $author$project$View$Dialog$Users$viewConfirmReject = F2(
	function (userId, nickname) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__confirm')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-danger')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Reject Registration?')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Are you sure you want to reject the registration from ' + (nickname + '?')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text('This action cannot be undone.')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelRejectRegistration)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--danger'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitRejectRegistration(userId))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Reject')
								]))
						]))
				]));
	});
var $author$project$Msg$ConfirmApproveRegistration = F2(
	function (a, b) {
		return {$: 234, a: a, b: b};
	});
var $author$project$Msg$ConfirmRejectRegistration = F2(
	function (a, b) {
		return {$: 238, a: a, b: b};
	});
var $author$project$Msg$ViewRegistrationMessage = F3(
	function (a, b, c) {
		return {$: 232, a: a, b: b, c: c};
	});
var $author$project$View$Dialog$Users$viewPendingUserItem = function (user) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('users-list-dialog__item')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__user-info')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__nickname')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(user.ee)
							])),
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__email')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(user.dp)
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__actions')
					]),
				_List_fromArray(
					[
						function () {
						var _v0 = user.bM;
						if (!_v0.$) {
							var message = _v0.a;
							return A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('users-list-dialog__message-btn'),
										$elm$html$Html$Events$onClick(
										A3($author$project$Msg$ViewRegistrationMessage, user.dM, user.ee, message)),
										$elm$html$Html$Attributes$title('View registration message')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('\uD83D\uDCAC')
									]));
						} else {
							return $elm$html$Html$text('');
						}
					}(),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--primary btn--sm'),
								$elm$html$Html$Events$onClick(
								A2($author$project$Msg$ConfirmApproveRegistration, user.dM, user.ee)),
								$elm$html$Html$Attributes$title('Approve Registration')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Approve')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--danger btn--sm'),
								$elm$html$Html$Events$onClick(
								A2($author$project$Msg$ConfirmRejectRegistration, user.dM, user.ee)),
								$elm$html$Html$Attributes$title('Reject Registration')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Reject')
							]))
					]))
			]));
};
var $author$project$Msg$CloseRegistrationMessage = {$: 233};
var $author$project$View$Dialog$Users$viewRegistrationMessage = F3(
	function (userId, nickname, message) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__message-view')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__message-header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h3,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('users-list-dialog__message-title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Message from ' + nickname)
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__message-content')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$p,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(message)
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__message-actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseRegistrationMessage)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Back')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary'),
									$elm$html$Html$Events$onClick(
									A2($author$project$Msg$ConfirmApproveRegistration, userId, nickname))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Approve')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--danger'),
									$elm$html$Html$Events$onClick(
									A2($author$project$Msg$ConfirmRejectRegistration, userId, nickname))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Reject')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewRejectError = F2(
	function (nickname, errorMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__error')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-danger')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Rejection Failed')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Failed to reject registration for ' + (nickname + ':')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text(errorMsg)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelRejectRegistration)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('OK')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewRejectingUser = function (nickname) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('users-list-dialog__loading')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('spinner')
					]),
				_List_Nil),
				$elm$html$Html$text('Rejecting registration for ' + (nickname + '...'))
			]));
};
var $author$project$View$Dialog$Users$viewPendingPane = function (state) {
	var _v0 = state.b1;
	switch (_v0.$) {
		case 1:
			var userId = _v0.a;
			var nickname = _v0.b;
			var message = _v0.c;
			return A3($author$project$View$Dialog$Users$viewRegistrationMessage, userId, nickname, message);
		case 2:
			var userId = _v0.a;
			var nickname = _v0.b;
			return A2($author$project$View$Dialog$Users$viewConfirmApprove, userId, nickname);
		case 3:
			var nickname = _v0.b;
			return $author$project$View$Dialog$Users$viewApprovingUser(nickname);
		case 4:
			var nickname = _v0.a;
			var apikey = _v0.b;
			return A2($author$project$View$Dialog$Users$viewApproveComplete, nickname, apikey);
		case 5:
			var nickname = _v0.a;
			var err = _v0.b;
			return A2($author$project$View$Dialog$Users$viewApproveError, nickname, err);
		case 6:
			var userId = _v0.a;
			var nickname = _v0.b;
			return A2($author$project$View$Dialog$Users$viewConfirmReject, userId, nickname);
		case 7:
			var nickname = _v0.b;
			return $author$project$View$Dialog$Users$viewRejectingUser(nickname);
		case 8:
			var nickname = _v0.a;
			var err = _v0.b;
			return A2($author$project$View$Dialog$Users$viewRejectError, nickname, err);
		default:
			var filteredPending = $elm$core$String$isEmpty(state.bo) ? state.b3 : A2(
				$elm$core$List$filter,
				$author$project$View$Dialog$Users$userMatchesFilter(state.bo),
				state.b3);
			return $elm$core$List$isEmpty(state.b3) ? A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__empty')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('No pending registration requests.')
					])) : ($elm$core$List$isEmpty(filteredPending) ? A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__empty')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('No pending registrations match your filter.')
					])) : A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__list')
					]),
				A2($elm$core$List$map, $author$project$View$Dialog$Users$viewPendingUserItem, filteredPending)));
	}
};
var $author$project$Msg$CancelDeleteUser = {$: 223};
var $author$project$Msg$SubmitDeleteUser = function (a) {
	return {$: 224, a: a};
};
var $author$project$View$Dialog$Users$viewConfirmDeleteUser = F2(
	function (userId, nickname) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__confirm')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-danger')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Delete User?')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Are you sure you want to delete the user ' + (nickname + '?')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text('This action cannot be undone.')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelDeleteUser)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--danger'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitDeleteUser(userId))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Delete User')
								]))
						]))
				]));
	});
var $author$project$Msg$CancelResetApikey = {$: 227};
var $author$project$Msg$SubmitResetApikey = function (a) {
	return {$: 228, a: a};
};
var $author$project$View$Dialog$Users$viewConfirmResetApikey = F2(
	function (userId, nickname) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__confirm')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-warning')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Reset API Key?')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Are you sure you want to reset the API key for ' + (nickname + '?')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text('This action cannot be undone.')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--secondary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelResetApikey)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Cancel')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--warning'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$SubmitResetApikey(userId))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Reset API Key')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewDeleteUserError = F2(
	function (nickname, errorMsg) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__error')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__icon is-danger')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('!')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Delete Failed')
						])),
					A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__message')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Failed to delete user ' + (nickname + ':')),
							A2($elm$html$Html$br, _List_Nil, _List_Nil),
							$elm$html$Html$text(errorMsg)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('confirm-dialog__actions')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary'),
									$elm$html$Html$Events$onClick($author$project$Msg$CancelDeleteUser)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('OK')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewDeletingUser = function (nickname) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('users-list-dialog__loading')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('spinner')
					]),
				_List_Nil),
				$elm$html$Html$text('Deleting user ' + (nickname + '...'))
			]));
};
var $author$project$View$Dialog$Users$viewResetApikeyComplete = F2(
	function (nickname, newApikey) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__result')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-icon')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('\u2713')
						])),
					A2(
					$elm$html$Html$h3,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-title')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('New API Key for ' + nickname)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-warning')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Please save this key as the server will not show it again:')
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__result-key')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(newApikey)
						])),
					A2(
					$elm$html$Html$button,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('btn btn--primary'),
							$elm$html$Html$Events$onClick($author$project$Msg$CancelResetApikey)
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Done')
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewResettingApikey = function (nickname) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('users-list-dialog__loading')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('spinner')
					]),
				_List_Nil),
				$elm$html$Html$text('Resetting API key for ' + (nickname + '...'))
			]));
};
var $author$project$Msg$ConfirmDeleteUser = F2(
	function (a, b) {
		return {$: 222, a: a, b: b};
	});
var $author$project$Msg$ConfirmResetApikey = function (a) {
	return {$: 226, a: a};
};
var $author$project$View$Dialog$Users$viewUserListItem = F2(
	function (currentUserId, user) {
		var isSelf = _Utils_eq(user.dM, currentUserId);
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('users-list-dialog__item')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__user-info')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('users-list-dialog__name-row')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('users-list-dialog__nickname')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(user.ee),
											isSelf ? A2(
											$elm$html$Html$span,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('users-list-dialog__self-badge')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text(' (you)')
												])) : $elm$html$Html$text('')
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('users-list-dialog__badges')
										]),
									_List_fromArray(
										[
											user.dW ? A2(
											$elm$html$Html$span,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('users-list-dialog__badge users-list-dialog__badge--manager')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Manager')
												])) : $elm$html$Html$text(''),
											user.dT ? A2(
											$elm$html$Html$span,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('users-list-dialog__badge users-list-dialog__badge--active')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Active')
												])) : A2(
											$elm$html$Html$span,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('users-list-dialog__badge users-list-dialog__badge--inactive')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('Inactive')
												]))
										]))
								])),
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('users-list-dialog__email')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(user.dp)
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('users-list-dialog__actions')
						]),
					_List_fromArray(
						[
							isSelf ? $elm$html$Html$text('') : A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('users-list-dialog__delete-btn'),
									$elm$html$Html$Events$onClick(
									A2($author$project$Msg$ConfirmDeleteUser, user.dM, user.ee)),
									$elm$html$Html$Attributes$title('Delete User')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('\uD83D\uDDD1')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('users-list-dialog__reset-btn'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$ConfirmResetApikey(user.dM)),
									$elm$html$Html$Attributes$title('Reset API Key')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('\uD83D\uDD12')
								]))
						]))
				]));
	});
var $author$project$View$Dialog$Users$viewUsersPane = function (state) {
	var _v0 = state.be;
	switch (_v0.$) {
		case 1:
			var userId = _v0.a;
			var nickname = _v0.b;
			return A2($author$project$View$Dialog$Users$viewConfirmDeleteUser, userId, nickname);
		case 2:
			var nickname = _v0.b;
			return $author$project$View$Dialog$Users$viewDeletingUser(nickname);
		case 3:
			var nickname = _v0.a;
			var err = _v0.b;
			return A2($author$project$View$Dialog$Users$viewDeleteUserError, nickname, err);
		default:
			var _v1 = state.ck;
			switch (_v1.$) {
				case 1:
					var userId = _v1.a;
					var nickname = _v1.b;
					return A2($author$project$View$Dialog$Users$viewConfirmResetApikey, userId, nickname);
				case 2:
					var nickname = _v1.b;
					return $author$project$View$Dialog$Users$viewResettingApikey(nickname);
				case 3:
					var nickname = _v1.a;
					var newApikey = _v1.b;
					return A2($author$project$View$Dialog$Users$viewResetApikeyComplete, nickname, newApikey);
				default:
					var filteredUsers = $elm$core$String$isEmpty(state.bo) ? state.cT : A2(
						$elm$core$List$filter,
						$author$project$View$Dialog$Users$userMatchesFilter(state.bo),
						state.cT);
					return $elm$core$List$isEmpty(state.cT) ? A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__loading')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Loading users...')
							])) : ($elm$core$List$isEmpty(filteredUsers) ? A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__empty')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('No users match your filter.')
							])) : A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__list')
							]),
						A2(
							$elm$core$List$map,
							$author$project$View$Dialog$Users$viewUserListItem(state.bb),
							filteredUsers)));
			}
	}
};
var $author$project$View$Dialog$Users$viewUsersListDialog = function (state) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('users-list-dialog')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('User Management')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('dialog__close'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('\u00D7')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__tabs')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__tab'),
								$elm$html$Html$Attributes$classList(
								_List_fromArray(
									[
										_Utils_Tuple2('is-active', !state.a_)
									])),
								$elm$html$Html$Events$onClick($author$project$Msg$SwitchUsersListPane)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								'Users (' + ($elm$core$String$fromInt(
									$elm$core$List$length(state.cT)) + ')'))
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__tab'),
								$elm$html$Html$Attributes$classList(
								_List_fromArray(
									[
										_Utils_Tuple2('is-active', state.a_ === 1)
									])),
								$elm$html$Html$Events$onClick($author$project$Msg$SwitchUsersListPane)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								'Pending (' + ($elm$core$String$fromInt(
									$elm$core$List$length(state.b3)) + ')'))
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('users-list-dialog__filter')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('users-list-dialog__filter-wrapper')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('users-list-dialog__filter-input'),
										$elm$html$Html$Attributes$type_('text'),
										$elm$html$Html$Attributes$placeholder('Filter by nickname or email...'),
										$elm$html$Html$Attributes$value(state.bo),
										$elm$html$Html$Events$onInput($author$project$Msg$UpdateUsersListFilter),
										$author$project$View$Dialog$Users$onEscapeClear(state.bo)
									]),
								_List_Nil),
								$elm$core$String$isEmpty(state.bo) ? $elm$html$Html$text('') : A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('users-list-dialog__filter-clear'),
										$elm$html$Html$Events$onClick(
										$author$project$Msg$UpdateUsersListFilter('')),
										$elm$html$Html$Attributes$title('Clear filter (Esc)')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('\u232B')
									]))
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__body')
					]),
				_List_fromArray(
					[
						function () {
						var _v0 = state.a_;
						if (!_v0) {
							return $author$project$View$Dialog$Users$viewUsersPane(state);
						} else {
							return $author$project$View$Dialog$Users$viewPendingPane(state);
						}
					}()
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('dialog__footer')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn btn--secondary'),
								$elm$html$Html$Events$onClick($author$project$Msg$CloseDialog)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Close')
							])),
						function () {
						var _v1 = state.a_;
						if (!_v1) {
							return A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn--primary'),
										$elm$html$Html$Events$onClick($author$project$Msg$OpenCreateUserDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Create User')
									]));
						} else {
							return $elm$html$Html$text('');
						}
					}()
					]))
			]));
};
var $author$project$View$Dialog$viewDialog = function (model) {
	var serverData = $author$project$Model$getCurrentServerData(model);
	var _v0 = model.bg;
	if (_v0.$ === 1) {
		return $elm$html$Html$text('');
	} else {
		var dialog = _v0.a;
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('dialog-overlay'),
					A2($author$project$View$Helpers$onClickTarget, 'dialog-overlay', $author$project$Msg$CloseDialog)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('dialog')
						]),
					_List_fromArray(
						[
							function () {
							switch (dialog.$) {
								case 0:
									var form = dialog.a;
									return $author$project$View$Dialog$Server$viewAddServerDialog(form);
								case 1:
									var serverUrl = dialog.a;
									var form = dialog.b;
									return A2($author$project$View$Dialog$Server$viewEditServerDialog, serverUrl, form);
								case 2:
									var serverUrl = dialog.a;
									var serverName = dialog.b;
									return A2($author$project$View$Dialog$Server$viewRemoveServerDialog, serverUrl, serverName);
								case 3:
									var serverUrl = dialog.a;
									var form = dialog.b;
									return A2($author$project$View$Dialog$Auth$viewConnectDialog, serverUrl, form);
								case 4:
									var serverUrl = dialog.a;
									var form = dialog.b;
									return A2($author$project$View$Dialog$Auth$viewRegisterDialog, serverUrl, form);
								case 5:
									var form = dialog.a;
									return $author$project$View$Dialog$Session$viewCreateSessionDialog(form);
								case 6:
									var form = dialog.a;
									return A2($author$project$View$Dialog$Users$viewInviteUserDialog, form, serverData.cS);
								case 7:
									return A2($author$project$View$Dialog$Users$viewInvitationsDialog, serverData.bD, serverData.cu);
								case 8:
									var errorMsg = dialog.a;
									return A2($author$project$View$Dialog$Races$viewRacesDialog, errorMsg, serverData.ce);
								case 9:
									var form = dialog.a;
									return A2($author$project$View$Dialog$Races$viewSetupRaceDialog, form, serverData.ce);
								case 11:
									var form = dialog.a;
									return $author$project$View$Dialog$Rules$viewRulesDialog(form);
								case 12:
									var form = dialog.a;
									var hasConflict = A2(
										$elm$core$Maybe$withDefault,
										false,
										A2(
											$elm$core$Maybe$map,
											$elm$core$Set$member(form.fO),
											A2($elm$core$Dict$get, form.eV, serverData.bY)));
									return A2($author$project$View$Dialog$TurnFiles$viewTurnFilesDialog, form, hasConflict);
								case 13:
									return A5($author$project$View$Dialog$Settings$viewSettingsDialog, model.a2, model.cY, model.cZ, model.bU, model.bV);
								case 14:
									var state = dialog.a;
									return $author$project$View$Dialog$Users$viewUsersListDialog(state);
								case 15:
									var form = dialog.a;
									return $author$project$View$Dialog$Users$viewCreateUserDialog(form);
								case 16:
									var state = dialog.a;
									return $author$project$View$Dialog$ApiKey$viewChangeApikeyDialog(state);
								case 10:
									var form = dialog.a;
									return $author$project$View$Dialog$RaceBuilder$viewRaceBuilderDialog(form);
								default:
									var form = dialog.a;
									return $author$project$View$Dialog$MapViewer$viewMapViewerDialog(form);
							}
						}()
						]))
				]));
	}
};
var $author$project$Msg$CloseSessionDetail = {$: 53};
var $author$project$Msg$DeleteSession = function (a) {
	return {$: 46, a: a};
};
var $author$project$Msg$DownloadHistoricBackup = function (a) {
	return {$: 198, a: a};
};
var $author$project$Msg$DownloadSessionBackup = function (a) {
	return {$: 196, a: a};
};
var $author$project$Msg$JoinSession = function (a) {
	return {$: 44, a: a};
};
var $author$project$Msg$LaunchStars = function (a) {
	return {$: 192, a: a};
};
var $author$project$Msg$OpenGameDir = function (a) {
	return {$: 191, a: a};
};
var $author$project$Msg$OpenInviteDialog = {$: 56};
var $author$project$Msg$OpenRulesDialog = F2(
	function (a, b) {
		return {$: 152, a: a, b: b};
	});
var $author$project$Msg$OpenSetupRaceDialog = function (a) {
	return {$: 79, a: a};
};
var $author$project$Msg$QuitSession = function (a) {
	return {$: 48, a: a};
};
var $author$project$Msg$StartGame = function (a) {
	return {$: 136, a: a};
};
var $elm$core$List$all = F2(
	function (isOkay, list) {
		return !A2(
			$elm$core$List$any,
			A2($elm$core$Basics$composeL, $elm$core$Basics$not, isOkay),
			list);
	});
var $author$project$View$Helpers$getCurrentUserId = function (model) {
	var _v0 = $author$project$Model$getCurrentServerData(model).aH;
	if (_v0.$ === 2) {
		var info = _v0.a;
		return $elm$core$Maybe$Just(info.fn);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Dict$isEmpty = function (dict) {
	if (dict.$ === -2) {
		return true;
	} else {
		return false;
	}
};
var $elm$core$List$maximum = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(
			A3($elm$core$List$foldl, $elm$core$Basics$max, x, xs));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Dict$sizeHelp = F2(
	function (n, dict) {
		sizeHelp:
		while (true) {
			if (dict.$ === -2) {
				return n;
			} else {
				var left = dict.d;
				var right = dict.e;
				var $temp$n = A2($elm$core$Dict$sizeHelp, n + 1, right),
					$temp$dict = left;
				n = $temp$n;
				dict = $temp$dict;
				continue sizeHelp;
			}
		}
	});
var $elm$core$Dict$size = function (dict) {
	return A2($elm$core$Dict$sizeHelp, 0, dict);
};
var $elm$core$List$sortBy = _List_sortBy;
var $elm$core$List$sort = function (xs) {
	return A2($elm$core$List$sortBy, $elm$core$Basics$identity, xs);
};
var $author$project$View$SessionDetail$viewInvitee = function (invitation) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('session-detail__member session-detail__invitee')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('session-detail__invitee-name')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(invitation.dP)
					])),
				A2(
				$elm$html$Html$button,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('btn btn--danger btn--xs'),
						$elm$html$Html$Events$onClick(
						$author$project$Msg$CancelSentInvitation(invitation.dM)),
						$elm$html$Html$Attributes$title('Cancel invitation')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('\u00D7')
					]))
			]));
};
var $author$project$View$Helpers$getNickname = F2(
	function (userProfiles, userId) {
		return A2(
			$elm$core$Maybe$withDefault,
			userId,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.ee;
				},
				$elm$core$List$head(
					A2(
						$elm$core$List$filter,
						function (u) {
							return _Utils_eq(u.dM, userId);
						},
						userProfiles))));
	});
var $author$project$View$SessionDetail$viewMemberId = F2(
	function (userProfiles, memberId) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('session-detail__member')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(
					A2($author$project$View$Helpers$getNickname, userProfiles, memberId))
				]));
	});
var $author$project$Msg$PromoteMember = F2(
	function (a, b) {
		return {$: 50, a: a, b: b};
	});
var $author$project$View$SessionDetail$viewMemberWithPromote = F4(
	function (userProfiles, isManager, sessionId, memberId) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('session-detail__member-wrapper')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-detail__member')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(
							A2($author$project$View$Helpers$getNickname, userProfiles, memberId))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-detail__member-actions')
						]),
					_List_fromArray(
						[
							isManager ? A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn--primary btn--xs'),
									$elm$html$Html$Events$onClick(
									A2($author$project$Msg$PromoteMember, sessionId, memberId)),
									$elm$html$Html$Attributes$title('Promote to manager')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Promote')
								])) : $elm$html$Html$text('')
						]))
				]));
	});
var $author$project$Msg$MouseDownOnPlayer = F4(
	function (a, b, c, d) {
		return {$: 138, a: a, b: b, c: c, d: d};
	});
var $author$project$Msg$MouseEnterPlayer = function (a) {
	return {$: 140, a: a};
};
var $author$project$Msg$MouseLeavePlayer = {$: 141};
var $author$project$Msg$SetPlayerReady = F2(
	function (a, b) {
		return {$: 134, a: a, b: b};
	});
var $elm$virtual_dom$VirtualDom$MayPreventDefault = function (a) {
	return {$: 2, a: a};
};
var $elm$html$Html$Events$preventDefaultOn = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$MayPreventDefault(decoder));
	});
var $author$project$View$SessionDetail$viewPlayerRow = F9(
	function (userProfiles, myRace, sessionId, currentUserId, isManager, sessionStarted, dragState, index, player) {
		var playerNumber = index + 1;
		var nickname = A2($author$project$View$Helpers$getNickname, userProfiles, player.fo);
		var mouseAttrs = isManager ? _List_fromArray(
			[
				A2(
				$elm$html$Html$Events$preventDefaultOn,
				'mousedown',
				A3(
					$elm$json$Json$Decode$map2,
					F2(
						function (x, y) {
							return _Utils_Tuple2(
								A4($author$project$Msg$MouseDownOnPlayer, player.fo, player.fo, x, y),
								true);
						}),
					A2($elm$json$Json$Decode$field, 'clientX', $elm$json$Json$Decode$float),
					A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float))),
				A2(
				$elm$html$Html$Events$on,
				'mouseenter',
				$elm$json$Json$Decode$succeed(
					$author$project$Msg$MouseEnterPlayer(player.fo))),
				A2(
				$elm$html$Html$Events$on,
				'mouseleave',
				$elm$json$Json$Decode$succeed($author$project$Msg$MouseLeavePlayer))
			]) : _List_Nil;
		var isDragging = function () {
			if (!dragState.$) {
				var ds = dragState.a;
				return _Utils_eq(ds.dk, player.fo);
			} else {
				return false;
			}
		}();
		var isDragOver = function () {
			if (!dragState.$) {
				var ds = dragState.a;
				return _Utils_eq(
					ds.dh,
					$elm$core$Maybe$Just(player.fo));
			} else {
				return false;
			}
		}();
		var isCurrentUser = _Utils_eq(
			currentUserId,
			$elm$core$Maybe$Just(player.fo));
		var displayName = function () {
			if (isCurrentUser) {
				if (!myRace.$) {
					var race = myRace.a;
					return nickname + (' (' + (race.eb + ')'));
				} else {
					return nickname;
				}
			} else {
				return nickname;
			}
		}();
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('session-detail__player-wrapper'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('session-detail__player-wrapper--dragging', isDragging),
							_Utils_Tuple2('session-detail__player-wrapper--drag-over', isDragOver)
						]))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_Utils_ap(
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('session-detail__player'),
								$elm$html$Html$Attributes$classList(
								_List_fromArray(
									[
										_Utils_Tuple2('session-detail__player--draggable', isManager)
									]))
							]),
						mouseAttrs),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-detail__player-number')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									$elm$core$String$fromInt(playerNumber))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-detail__player-info')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-detail__player-id')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(displayName)
										])),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-detail__player-status'),
											$elm$html$Html$Attributes$classList(
											_List_fromArray(
												[
													_Utils_Tuple2('session-detail__player-status--ready', player.eE),
													_Utils_Tuple2('session-detail__player-status--not-ready', !player.eE)
												]))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											player.eE ? 'Ready' : 'Not Ready')
										]))
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-detail__player-actions')
						]),
					_List_fromArray(
						[
							(isCurrentUser && (!sessionStarted)) ? A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class(
									player.eE ? 'btn btn-secondary btn-sm' : 'btn btn-success btn-sm'),
									$elm$html$Html$Events$onClick(
									A2($author$project$Msg$SetPlayerReady, sessionId, !player.eE))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									player.eE ? 'Unready' : 'Ready')
								])) : $elm$html$Html$text('')
						]))
				]));
	});
var $author$project$Msg$OpenTurnFilesDialog = F3(
	function (a, b, c) {
		return {$: 187, a: a, b: b, c: c};
	});
var $author$project$View$SessionList$viewOrdersSummary = function (players) {
	var total = $elm$core$List$length(players);
	var submitted = $elm$core$List$length(
		A2(
			$elm$core$List$filter,
			function ($) {
				return $.e7;
			},
			players));
	var allSubmitted = _Utils_eq(submitted, total);
	return A2(
		$elm$html$Html$span,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('session-detail__orders-summary'),
				$elm$html$Html$Attributes$classList(
				_List_fromArray(
					[
						_Utils_Tuple2('session-detail__orders-summary--complete', allSubmitted)
					]))
			]),
		_List_fromArray(
			[
				$elm$html$Html$text(
				$elm$core$String$fromInt(submitted) + ('/' + $elm$core$String$fromInt(total)))
			]));
};
var $author$project$View$SessionDetail$viewTurnItem = F4(
	function (sessionId, year, isLatest, maybeOrdersStatus) {
		var ordersBadge = function () {
			if (!maybeOrdersStatus.$) {
				var ordersStatus = maybeOrdersStatus.a;
				return $author$project$View$SessionList$viewOrdersSummary(ordersStatus.ev);
			} else {
				return isLatest ? A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-detail__orders-loading')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('...')
						])) : $elm$html$Html$text('');
			}
		}();
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('session-detail__turn-link'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('session-detail__turn-link--latest', isLatest)
						])),
					$elm$html$Html$Events$onClick(
					A3($author$project$Msg$OpenTurnFilesDialog, sessionId, year, isLatest))
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(
					'Year ' + $elm$core$String$fromInt(year)),
					ordersBadge
				]));
	});
var $author$project$View$SessionDetail$viewSessionDetail = F5(
	function (session, detail, availableTurns, ordersStatusByYear, model) {
		var serverData = $author$project$Model$getCurrentServerData(model);
		var hasStarsExe = A2(
			$elm$core$Maybe$withDefault,
			false,
			A2($elm$core$Dict$get, session.dM, serverData.cz));
		var hasInvitation = A2(
			$elm$core$List$any,
			function (inv) {
				return _Utils_eq(inv.eV, session.dM);
			},
			serverData.bD);
		var currentUserId = $author$project$View$Helpers$getCurrentUserId(model);
		var isManager = function () {
			if (!currentUserId.$) {
				var uid = currentUserId.a;
				return A2($elm$core$List$member, uid, session.d1);
			} else {
				return false;
			}
		}();
		var isMemberOrManager = function () {
			if (!currentUserId.$) {
				var uid = currentUserId.a;
				return A2($elm$core$List$member, uid, session.d3) || A2($elm$core$List$member, uid, session.d1);
			} else {
				return false;
			}
		}();
		var isPlayer = function () {
			if (!currentUserId.$) {
				var uid = currentUserId.a;
				return A2(
					$elm$core$List$any,
					function (p) {
						return _Utils_eq(p.fo, uid);
					},
					session.ev);
			} else {
				return false;
			}
		}();
		var currentPlayerReady = function () {
			if (!currentUserId.$) {
				var uid = currentUserId.a;
				return A2(
					$elm$core$Maybe$withDefault,
					false,
					A2(
						$elm$core$Maybe$map,
						function ($) {
							return $.eE;
						},
						$elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (p) {
									return _Utils_eq(p.fo, uid);
								},
								session.ev))));
			} else {
				return false;
			}
		}();
		var showSetupRaceButton = isMemberOrManager && ((!currentPlayerReady) && (!session.e5));
		var currentPlayerNumber = function () {
			if (!currentUserId.$) {
				var uid = currentUserId.a;
				return A2(
					$elm$core$Maybe$withDefault,
					1,
					A2(
						$elm$core$Maybe$map,
						function (_v5) {
							var idx = _v5.a;
							return idx + 1;
						},
						$elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (_v4) {
									var p = _v4.b;
									return _Utils_eq(p.fo, uid);
								},
								A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, session.ev)))));
			} else {
				return 1;
			}
		}();
		var canQuit = isMemberOrManager && ((!session.e5) && ((!currentPlayerReady) && ((!isManager) || ($elm$core$List$length(session.d1) > 1))));
		var canJoin = (!isMemberOrManager) && ((!session.e5) && (session.dX || hasInvitation));
		var allPlayersReady = (!$elm$core$List$isEmpty(session.ev)) && A2(
			$elm$core$List$all,
			function ($) {
				return $.eE;
			},
			session.ev);
		var canStartGame = session.eQ && (allPlayersReady && (!session.e5));
		var startGameBlockedReason = session.e5 ? $elm$core$Maybe$Just('Game has already started') : ((!session.eQ) ? $elm$core$Maybe$Just('Rules must be configured first') : ($elm$core$List$isEmpty(session.ev) ? $elm$core$Maybe$Just('No players have joined yet') : ((!allPlayersReady) ? $elm$core$Maybe$Just('All players must be ready') : $elm$core$Maybe$Nothing)));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('session-detail')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-detail__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-detail__back'),
									$elm$html$Html$Events$onClick($author$project$Msg$CloseSessionDetail)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('< Back')
								])),
							A2(
							$elm$html$Html$h2,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-detail__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(session.ea)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-detail__header-actions')
								]),
							_List_fromArray(
								[
									canJoin ? A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--primary'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$JoinSession(session.dM))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Join')
										])) : $elm$html$Html$text(''),
									function () {
									if (isManager && (!session.e5)) {
										var isStarting = _Utils_eq(
											model.cH,
											$elm$core$Maybe$Just(session.dM));
										if (isStarting) {
											return A2(
												$elm$html$Html$button,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('btn btn--success btn--loading'),
														$elm$html$Html$Attributes$disabled(true)
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('Starting...')
													]));
										} else {
											if (!startGameBlockedReason.$) {
												var reason = startGameBlockedReason.a;
												return A2(
													$elm$html$Html$span,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('tooltip-wrapper'),
															A2($elm$html$Html$Attributes$attribute, 'title', reason)
														]),
													_List_fromArray(
														[
															A2(
															$elm$html$Html$button,
															_List_fromArray(
																[
																	$elm$html$Html$Attributes$class('btn btn--success btn--disabled'),
																	$elm$html$Html$Attributes$disabled(true)
																]),
															_List_fromArray(
																[
																	$elm$html$Html$text('Start Game')
																]))
														]));
											} else {
												return A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('btn btn--success'),
															$elm$html$Html$Events$onClick(
															$author$project$Msg$StartGame(session.dM))
														]),
													_List_fromArray(
														[
															$elm$html$Html$text('Start Game')
														]));
											}
										}
									} else {
										return $elm$html$Html$text('');
									}
								}(),
									(isManager && (!session.e5)) ? A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--primary'),
											$elm$html$Html$Events$onClick($author$project$Msg$OpenInviteDialog)
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Invite User')
										])) : $elm$html$Html$text(''),
									(isManager && session.e5) ? A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--secondary'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$DownloadSessionBackup(session.dM)),
											A2($elm$html$Html$Attributes$attribute, 'title', 'Download session backup')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('\u2E13 Backup')
										])) : $elm$html$Html$text(''),
									(isPlayer && session.e5) ? A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--secondary'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$DownloadHistoricBackup(session.dM)),
											A2($elm$html$Html$Attributes$attribute, 'title', 'Download all historic game files')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('\u2E13 Historic')
										])) : $elm$html$Html$text(''),
									isManager ? A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--danger'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$DeleteSession(session.dM))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Delete')
										])) : $elm$html$Html$text(''),
									canQuit ? A2(
									$elm$html$Html$button,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('btn btn--secondary'),
											$elm$html$Html$Events$onClick(
											$author$project$Msg$QuitSession(session.dM))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Quit')
										])) : $elm$html$Html$text('')
								]))
						])),
					function () {
					var sessionInvitees = A2(
						$elm$core$List$filter,
						function (inv) {
							return _Utils_eq(inv.eV, session.dM);
						},
						serverData.cu);
					return A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('session-detail__content')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('session-detail__section-row')
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__section session-detail__section--two-thirds')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$h3,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__section-title')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('Info')
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__info')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__row')
															]),
														_List_fromArray(
															[
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__label')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Status')
																	])),
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__value'),
																		$elm$html$Html$Attributes$classList(
																		_List_fromArray(
																			[
																				_Utils_Tuple2('session-detail__value--started', session.e5),
																				_Utils_Tuple2('session-detail__value--not-started', !session.e5)
																			]))
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text(
																		session.e5 ? 'Started' : 'Not Started')
																	]))
															])),
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__row')
															]),
														_List_fromArray(
															[
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__label')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Visibility')
																	])),
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__value')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text(
																		session.dX ? 'Public' : 'Private')
																	]))
															])),
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__row')
															]),
														_List_fromArray(
															[
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__label')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Session ID')
																	])),
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__value session-detail__value--mono')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text(session.dM)
																	]))
															])),
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__row')
															]),
														_List_fromArray(
															[
																A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__label')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Rules')
																	])),
																session.eQ ? A2(
																$elm$html$Html$button,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('btn btn-sm btn-secondary'),
																		$elm$html$Html$Events$onClick(
																		A2($author$project$Msg$OpenRulesDialog, session.dM, session.eQ))
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('View Rules')
																	])) : (isManager ? A2(
																$elm$html$Html$button,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('btn btn-sm btn-primary'),
																		$elm$html$Html$Events$onClick(
																		A2($author$project$Msg$OpenRulesDialog, session.dM, session.eQ))
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Configure Rules')
																	])) : A2(
																$elm$html$Html$span,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('session-detail__value session-detail__value--muted')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Not configured')
																	])))
															]))
													]))
											])),
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__section session-detail__section--one-third')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$h3,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__section-title')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														'Managers (' + ($elm$core$String$fromInt(
															$elm$core$List$length(session.d1)) + ')'))
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__members')
													]),
												$elm$core$List$isEmpty(session.d1) ? _List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__empty')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('No managers')
															]))
													]) : A2(
													$elm$core$List$map,
													$author$project$View$SessionDetail$viewMemberId(serverData.cS),
													session.d1))
											]))
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('session-detail__section-row')
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__section session-detail__section--half')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$h3,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__section-title')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														'Members (' + ($elm$core$String$fromInt(
															$elm$core$List$length(session.d3)) + ')'))
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__members')
													]),
												$elm$core$List$isEmpty(session.d3) ? _List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__empty')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('No members')
															]))
													]) : A2(
													$elm$core$List$map,
													A3($author$project$View$SessionDetail$viewMemberWithPromote, serverData.cS, isManager, session.dM),
													session.d3))
											])),
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__section session-detail__section--half')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$h3,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__section-title')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														'Invitees (' + ($elm$core$String$fromInt(
															$elm$core$List$length(sessionInvitees)) + ')'))
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__members')
													]),
												$elm$core$List$isEmpty(sessionInvitees) ? _List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__empty')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('No pending invitations')
															]))
													]) : A2($elm$core$List$map, $author$project$View$SessionDetail$viewInvitee, sessionInvitees))
											]))
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('session-detail__section')
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__section-header')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$h3,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__section-title'),
														$elm$html$Html$Attributes$title('Players are members who have already set the race with which they want to play.')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														'Players (' + ($elm$core$String$fromInt(
															$elm$core$List$length(session.ev)) + ')')),
														A2(
														$elm$html$Html$span,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__help-icon')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('?')
															]))
													])),
												showSetupRaceButton ? A2(
												$elm$html$Html$button,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('btn btn-success btn-sm'),
														$elm$html$Html$Events$onClick(
														$author$project$Msg$OpenSetupRaceDialog(session.dM))
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(
														isPlayer ? 'Change Race' : 'Setup My Race')
													])) : $elm$html$Html$text('')
											])),
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__players')
											]),
										function () {
											if ($elm$core$List$isEmpty(session.ev)) {
												return _List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__empty')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('No players yet')
															]))
													]);
											} else {
												var myRace = A2($elm$core$Dict$get, session.dM, serverData.cB);
												return A2(
													$elm$core$List$indexedMap,
													F2(
														function (idx, player) {
															return A9($author$project$View$SessionDetail$viewPlayerRow, serverData.cS, myRace, session.dM, currentUserId, isManager, session.e5, detail.dj, idx, player);
														}),
													session.ev);
											}
										}())
									])),
								function () {
								if (session.e5 && (!$elm$core$Dict$isEmpty(availableTurns))) {
									var sortedYears = $elm$core$List$sort(
										$elm$core$Dict$keys(availableTurns));
									var latestYear = $elm$core$List$maximum(sortedYears);
									return A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('session-detail__section')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__section-header')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$h3,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__section-title')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text(
																'Turns (' + ($elm$core$String$fromInt(
																	$elm$core$Dict$size(availableTurns)) + ')'))
															])),
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('session-detail__section-actions')
															]),
														_List_fromArray(
															[
																hasStarsExe ? A2(
																$elm$html$Html$button,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('btn btn--primary btn--sm'),
																		$elm$html$Html$Events$onClick(
																		$author$project$Msg$LaunchStars(session.dM))
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Launch Stars!')
																	])) : A2(
																$elm$html$Html$button,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('btn btn--primary btn--sm'),
																		$elm$html$Html$Attributes$disabled(true),
																		$elm$html$Html$Attributes$title('stars.exe not found in game directory. Enable auto-download in Settings or manually copy stars.exe.')
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Launch Stars!')
																	])),
																A2(
																$elm$html$Html$button,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
																		$elm$html$Html$Events$onClick(
																		$author$project$Msg$OpenGameDir(session.dM))
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text('Open Game Dir')
																	])),
																function () {
																var _v1 = _Utils_Tuple2(
																	latestYear,
																	A2($elm$core$Dict$get, session.dM, serverData.cB));
																if ((!_v1.a.$) && (!_v1.b.$)) {
																	var year = _v1.a.a;
																	var race = _v1.b.a;
																	var _v2 = A2(
																		$elm$core$Maybe$andThen,
																		$elm$core$Dict$get(year),
																		A2($elm$core$Dict$get, session.dM, serverData.cD));
																	if (!_v2.$) {
																		return A2(
																			$elm$html$Html$button,
																			_List_fromArray(
																				[
																					$elm$html$Html$Attributes$class('btn btn--secondary btn--sm'),
																					$elm$html$Html$Events$onClick(
																					A4($author$project$Msg$OpenMapViewer, session.dM, year, race.ec, currentPlayerNumber))
																				]),
																			_List_fromArray(
																				[
																					$elm$html$Html$text('View Map')
																				]));
																	} else {
																		return $elm$html$Html$text('');
																	}
																} else {
																	return $elm$html$Html$text('');
																}
															}()
															]))
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('session-detail__turns')
													]),
												A2(
													$elm$core$List$map,
													function (year) {
														return A4(
															$author$project$View$SessionDetail$viewTurnItem,
															session.dM,
															year,
															_Utils_eq(
																latestYear,
																$elm$core$Maybe$Just(year)),
															A2($elm$core$Dict$get, year, ordersStatusByYear));
													},
													sortedYears))
											]));
								} else {
									return $elm$html$Html$text('');
								}
							}()
							]));
				}()
				]));
	});
var $author$project$View$Layout$viewDisconnectedState = A2(
	$elm$html$Html$div,
	_List_fromArray(
		[
			$elm$html$Html$Attributes$class('empty-state')
		]),
	_List_fromArray(
		[
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('empty-state__icon')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('!')
				])),
			A2(
			$elm$html$Html$h2,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('empty-state__title')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('Not Connected')
				])),
			A2(
			$elm$html$Html$p,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('empty-state__description')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('Click on the server to connect.')
				]))
		]));
var $author$project$View$Layout$viewEmptyState = A2(
	$elm$html$Html$div,
	_List_fromArray(
		[
			$elm$html$Html$Attributes$class('empty-state')
		]),
	_List_fromArray(
		[
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('empty-state__icon')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('+')
				])),
			A2(
			$elm$html$Html$h2,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('empty-state__title')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('Welcome to Astrum')
				])),
			A2(
			$elm$html$Html$p,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('empty-state__description')
				]),
			_List_fromArray(
				[
					$elm$html$Html$text('Select a server from the sidebar to get started, or add a new server.')
				]))
		]));
var $author$project$Model$InvitedSessions = 3;
var $author$project$Model$MySessions = 1;
var $author$project$Model$MyTurn = 4;
var $author$project$Msg$OpenCreateSessionDialog = {$: 39};
var $author$project$Model$PublicSessions = 2;
var $author$project$Msg$RefreshSessions = {$: 37};
var $author$project$View$SessionList$hasUnsubmittedTurn = F3(
	function (userId, ordersStatusDict, session) {
		if (!session.e5) {
			return false;
		} else {
			var _v0 = $elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (p) {
						return _Utils_eq(p.fo, userId);
					},
					session.ev));
			if (_v0.$ === 1) {
				return false;
			} else {
				var player = _v0.a;
				var _v1 = A2($elm$core$Dict$get, session.dM, ordersStatusDict);
				if (_v1.$ === 1) {
					return false;
				} else {
					var yearDict = _v1.a;
					var _v2 = A2(
						$elm$core$Maybe$andThen,
						function (y) {
							return A2($elm$core$Dict$get, y, yearDict);
						},
						$elm$core$List$maximum(
							$elm$core$Dict$keys(yearDict)));
					if (_v2.$ === 1) {
						return false;
					} else {
						var ordersStatus = _v2.a;
						var _v3 = $elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (pos) {
									return _Utils_eq(pos.eu, player.eu);
								},
								ordersStatus.ev));
						if (_v3.$ === 1) {
							return false;
						} else {
							var playerOrderStatus = _v3.a;
							return !playerOrderStatus.e7;
						}
					}
				}
			}
		}
	});
var $author$project$View$SessionList$isUserInSession = F2(
	function (userId, session) {
		return A2($elm$core$List$member, userId, session.d3) || A2($elm$core$List$member, userId, session.d1);
	});
var $author$project$View$SessionList$filterSessions = F4(
	function (maybeUserId, filter, sessions, ordersStatusDict) {
		switch (filter) {
			case 0:
				return sessions;
			case 1:
				if (!maybeUserId.$) {
					var userId = maybeUserId.a;
					return A2(
						$elm$core$List$filter,
						$author$project$View$SessionList$isUserInSession(userId),
						sessions);
				} else {
					return _List_Nil;
				}
			case 2:
				return A2(
					$elm$core$List$filter,
					function ($) {
						return $.dX;
					},
					sessions);
			case 3:
				return A2(
					$elm$core$List$filter,
					function ($) {
						return $.es;
					},
					sessions);
			default:
				if (!maybeUserId.$) {
					var userId = maybeUserId.a;
					return A2(
						$elm$core$List$filter,
						A2($author$project$View$SessionList$hasUnsubmittedTurn, userId, ordersStatusDict),
						sessions);
				} else {
					return _List_Nil;
				}
		}
	});
var $author$project$Msg$SetSessionFilter = function (a) {
	return {$: 36, a: a};
};
var $author$project$View$SessionList$viewFilterButton = F3(
	function (filter, label, activeFilter) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('filter-btn'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'is-active',
							_Utils_eq(filter, activeFilter))
						])),
					$elm$html$Html$Events$onClick(
					$author$project$Msg$SetSessionFilter(filter))
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(label)
				]));
	});
var $author$project$View$SessionList$viewFilterButtonWithTooltip = F4(
	function (filter, label, activeFilter, tooltip) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('filter-btn'),
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'is-active',
							_Utils_eq(filter, activeFilter))
						])),
					$elm$html$Html$Events$onClick(
					$author$project$Msg$SetSessionFilter(filter)),
					A2($elm$html$Html$Attributes$attribute, 'title', tooltip)
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(label)
				]));
	});
var $author$project$Msg$ViewSessionDetail = function (a) {
	return {$: 52, a: a};
};
var $author$project$View$SessionList$viewSessionCard = F4(
	function (maybeUserId, allSessionTurns, allSessionOrdersStatus, session) {
		var isAlreadyMemberOrManager = function () {
			if (!maybeUserId.$) {
				var userId = maybeUserId.a;
				return A2($author$project$View$SessionList$isUserInSession, userId, session);
			} else {
				return false;
			}
		}();
		var maybeTurnInfo = function () {
			if (session.e5 && isAlreadyMemberOrManager) {
				var sessionTurns = A2(
					$elm$core$Maybe$withDefault,
					$elm$core$Dict$empty,
					A2($elm$core$Dict$get, session.dM, allSessionTurns));
				var ordersStatus = A2(
					$elm$core$Maybe$withDefault,
					$elm$core$Dict$empty,
					A2($elm$core$Dict$get, session.dM, allSessionOrdersStatus));
				var latestYear = $elm$core$List$maximum(
					$elm$core$Dict$keys(sessionTurns));
				return A2(
					$elm$core$Maybe$map,
					function (year) {
						return {
							bZ: A2($elm$core$Dict$get, year, ordersStatus),
							fO: year
						};
					},
					latestYear);
			} else {
				return $elm$core$Maybe$Nothing;
			}
		}();
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('session-card'),
					$elm$html$Html$Events$onClick(
					$author$project$Msg$ViewSessionDetail(session.dM))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-card__header')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h3,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-card__title')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(session.ea)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-card__badges')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__badge'),
											$elm$html$Html$Attributes$classList(
											_List_fromArray(
												[
													_Utils_Tuple2('is-public', session.dX),
													_Utils_Tuple2('is-private', !session.dX)
												]))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											session.dX ? 'Public' : 'Private')
										])),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__badge'),
											$elm$html$Html$Attributes$classList(
											_List_fromArray(
												[
													_Utils_Tuple2('is-started', session.e5),
													_Utils_Tuple2('is-not-started', !session.e5)
												]))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											session.e5 ? 'Started' : 'Not Started')
										]))
								]))
						])),
					function () {
					if (!maybeTurnInfo.$) {
						var turnInfo = maybeTurnInfo.a;
						return A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-card__turn')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__turn-year')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											'Year ' + $elm$core$String$fromInt(turnInfo.fO))
										])),
									function () {
									var _v1 = turnInfo.bZ;
									if (!_v1.$) {
										var ordersStatus = _v1.a;
										return $author$project$View$SessionList$viewOrdersSummary(ordersStatus.ev);
									} else {
										return A2(
											$elm$html$Html$span,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('session-card__orders-loading')
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('...')
												]));
									}
								}()
								]));
					} else {
						return $elm$html$Html$text('');
					}
				}(),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-card__info')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-card__row')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Managers + Members')
										])),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__value')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											$elm$core$String$fromInt(
												$elm$core$List$length(session.d1) + $elm$core$List$length(session.d3)))
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-card__row')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__label')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Players')
										])),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-card__value')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											$elm$core$String$fromInt(
												$elm$core$List$length(session.ev)))
										]))
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('session-card__footer')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-card__members')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									$elm$core$String$fromInt(
										$elm$core$List$length(session.d1) + $elm$core$List$length(session.d3)) + ' users')
								])),
							((!isAlreadyMemberOrManager) && (!session.e5)) ? A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn btn-sm btn-primary session-card__action'),
									$elm$html$Html$Events$onClick(
									$author$project$Msg$JoinSession(session.dM)),
									A2(
									$elm$html$Html$Events$stopPropagationOn,
									'click',
									$elm$json$Json$Decode$succeed(
										_Utils_Tuple2(
											$author$project$Msg$JoinSession(session.dM),
											true)))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Join')
								])) : $elm$html$Html$text('')
						]))
				]));
	});
var $author$project$View$SessionList$viewSessionList = function (model) {
	var serverData = $author$project$Model$getCurrentServerData(model);
	var currentUserId = $author$project$View$Helpers$getCurrentUserId(model);
	var filteredSessions = A4($author$project$View$SessionList$filterSessions, currentUserId, model.cy, serverData.cE, serverData.cA);
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('session-list')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('session-list__header')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('session-list__title')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Sessions')
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('session-list__actions')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn-secondary btn-sm'),
										$elm$html$Html$Events$onClick($author$project$Msg$RefreshSessions)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Refresh')
									])),
								A2(
								$elm$html$Html$button,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('btn btn-primary btn-sm'),
										$elm$html$Html$Events$onClick($author$project$Msg$OpenCreateSessionDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Create Session')
									]))
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('session-list__filters')
							]),
						_List_fromArray(
							[
								A3($author$project$View$SessionList$viewFilterButton, 0, 'All', model.cy),
								A3($author$project$View$SessionList$viewFilterButton, 1, 'My Sessions', model.cy),
								A3($author$project$View$SessionList$viewFilterButton, 2, 'Public', model.cy),
								A3($author$project$View$SessionList$viewFilterButton, 3, 'Invited', model.cy),
								A4($author$project$View$SessionList$viewFilterButtonWithTooltip, 4, 'My Turn', model.cy, 'Sessions where you have a turn to submit')
							]))
					])),
				$elm$core$List$isEmpty(filteredSessions) ? A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('session-list__empty')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('No sessions found')
					])) : A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('session-list__grid')
					]),
				A2(
					$elm$core$List$map,
					A3($author$project$View$SessionList$viewSessionCard, currentUserId, serverData.cD, serverData.cA),
					filteredSessions))
			]));
};
var $author$project$View$Layout$viewSessionListOrEmpty = function (model) {
	var _v0 = model.aS;
	if (_v0.$ === 1) {
		return $author$project$View$Layout$viewEmptyState;
	} else {
		var serverUrl = _v0.a;
		return A2($author$project$Model$isConnected, serverUrl, model.aT) ? $author$project$View$SessionList$viewSessionList(model) : $author$project$View$Layout$viewDisconnectedState;
	}
};
var $author$project$View$Layout$viewContent = function (model) {
	var serverData = $author$project$Model$getCurrentServerData(model);
	var dragPreview = function () {
		var _v2 = model.cx;
		if (!_v2.$) {
			var detail = _v2.a;
			var _v3 = detail.dj;
			if (!_v3.$) {
				var dragState = _v3.a;
				return A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('drag-preview'),
							A2($elm$html$Html$Attributes$style, 'position', 'fixed'),
							A2(
							$elm$html$Html$Attributes$style,
							'left',
							$elm$core$String$fromFloat(dragState.d9 - 100) + 'px'),
							A2(
							$elm$html$Html$Attributes$style,
							'top',
							$elm$core$String$fromFloat(dragState.bP - 20) + 'px'),
							A2($elm$html$Html$Attributes$style, 'pointer-events', 'none'),
							A2($elm$html$Html$Attributes$style, 'z-index', '10000')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('session-detail__player session-detail__player--drag-clone')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('session-detail__player-id')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(dragState.dl)
										]))
								]))
						]));
			} else {
				return $elm$html$Html$text('');
			}
		} else {
			return $elm$html$Html$text('');
		}
	}();
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('content')
			]),
		_List_fromArray(
			[
				function () {
				var _v0 = model.cx;
				if (!_v0.$) {
					var detail = _v0.a;
					var _v1 = A2($author$project$Model$getSessionById, detail.eV, serverData.cE);
					if (!_v1.$) {
						var session = _v1.a;
						var ordersStatusByYear = A2(
							$elm$core$Maybe$withDefault,
							$elm$core$Dict$empty,
							A2($elm$core$Dict$get, session.dM, serverData.cA));
						var availableTurns = A2(
							$elm$core$Maybe$withDefault,
							$elm$core$Dict$empty,
							A2($elm$core$Dict$get, session.dM, serverData.cD));
						return A5($author$project$View$SessionDetail$viewSessionDetail, session, detail, availableTurns, ordersStatusByYear, model);
					} else {
						return $author$project$View$Layout$viewSessionListOrEmpty(model);
					}
				} else {
					return $author$project$View$Layout$viewSessionListOrEmpty(model);
				}
			}(),
				dragPreview
			]));
};
var $author$project$Msg$OpenSettingsDialog = {$: 201};
var $author$project$Msg$ToggleUserMenu = {$: 253};
var $elm$html$Html$h1 = _VirtualDom_node('h1');
var $author$project$View$Layout$viewHeader = function (model) {
	var serverName = A2(
		$elm$core$Maybe$withDefault,
		'Astrum',
		A2(
			$elm$core$Maybe$map,
			function ($) {
				return $.ea;
			},
			A2(
				$elm$core$Maybe$andThen,
				function (url) {
					return A2($author$project$Model$getServerByUrl, url, model.cw);
				},
				model.aS)));
	var serverData = $author$project$Model$getCurrentServerData(model);
	var isGlobalManager = function () {
		var _v3 = serverData.aH;
		if (_v3.$ === 2) {
			var info = _v3.a;
			return info.dW;
		} else {
			return false;
		}
	}();
	var hasInvitations = !$elm$core$List$isEmpty(serverData.bD);
	var connectionStatus = function () {
		var _v1 = model.aS;
		if (!_v1.$) {
			var _v2 = serverData.aH;
			switch (_v2.$) {
				case 2:
					var info = _v2.a;
					return A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('header__user-btn is-connected'),
								$elm$html$Html$Events$onClick($author$project$Msg$ToggleUserMenu)
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('status-dot')
									]),
								_List_Nil),
								$elm$html$Html$text(info.aZ),
								hasInvitations ? A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('header__notification-dot')
									]),
								_List_Nil) : $elm$html$Html$text(''),
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('header__user-arrow')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('\u25BC')
									]))
							]));
				case 1:
					return A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('header__status is-connecting')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('status-dot')
									]),
								_List_Nil),
								$elm$html$Html$text('Connecting...')
							]));
				case 3:
					return A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('header__status is-error')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('status-dot')
									]),
								_List_Nil),
								$elm$html$Html$text('Error')
							]));
				default:
					return A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('header__status is-disconnected')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Not connected')
							]));
			}
		} else {
			return $elm$html$Html$text('');
		}
	}();
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('header')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('header__actions')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('header__settings-btn'),
								$elm$html$Html$Events$onClick($author$project$Msg$OpenSettingsDialog),
								$elm$html$Html$Attributes$title('Settings')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('\u2699')
							])),
						function () {
						var _v0 = model.aS;
						if (!_v0.$) {
							var isFetching = serverData.bn;
							var btnClass = isFetching ? 'header__refresh-btn is-loading' : 'header__refresh-btn';
							return A2(
								$elm$html$Html$button,
								_Utils_ap(
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class(btnClass),
											$elm$html$Html$Attributes$title('Refresh')
										]),
									isFetching ? _List_fromArray(
										[
											$elm$html$Html$Attributes$disabled(true)
										]) : _List_fromArray(
										[
											$elm$html$Html$Events$onClick($author$project$Msg$RefreshSessions)
										])),
								_List_fromArray(
									[
										$elm$html$Html$text('\u27F3')
									]));
						} else {
							return $elm$html$Html$text('');
						}
					}(),
						isGlobalManager ? A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('header__admin-btn'),
								$elm$html$Html$Events$onClick($author$project$Msg$OpenUsersListDialog),
								$elm$html$Html$Attributes$title('Manage Users')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('\uD83D\uDC64'),
								(serverData.b2 > 0) ? A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('header__pending-badge')
									]),
								_List_Nil) : $elm$html$Html$text('')
							])) : $elm$html$Html$text('')
					])),
				A2(
				$elm$html$Html$h1,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('header__title')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(serverName)
					])),
				connectionStatus
			]));
};
var $author$project$Msg$ClearError = {$: 279};
var $author$project$View$Layout$viewStatusBar = function (model) {
	var serverData = $author$project$Model$getCurrentServerData(model);
	var statusText = function () {
		var _v4 = serverData.aH;
		switch (_v4.$) {
			case 2:
				var info = _v4.a;
				return 'Connected as ' + info.aZ;
			case 1:
				return 'Connecting...';
			case 3:
				var err = _v4.a;
				return 'Error: ' + err;
			default:
				var _v5 = model.aS;
				if (!_v5.$) {
					return 'Not connected';
				} else {
					return 'Select a server';
				}
		}
	}();
	var formatDuration = function (ms) {
		var seconds = ms / 1000;
		var formatted = function (parts) {
			_v2$2:
			while (true) {
				if (parts.b) {
					if (parts.b.b) {
						if (!parts.b.b.b) {
							var whole = parts.a;
							var _v3 = parts.b;
							var decimal = _v3.a;
							return whole + ('.' + A2($elm$core$String$left, 3, decimal + '000'));
						} else {
							break _v2$2;
						}
					} else {
						var whole = parts.a;
						return whole + '.000';
					}
				} else {
					break _v2$2;
				}
			}
			return $elm$core$String$fromFloat(seconds);
		}(
			A2(
				$elm$core$String$split,
				'.',
				$elm$core$String$fromFloat(seconds)));
		return formatted + 's';
	};
	var sessionCountText = function () {
		var _v1 = serverData.bJ;
		if (!_v1.$) {
			var result = _v1.a;
			return $elm$core$String$fromInt(result.eU) + (' sessions in ' + formatDuration(result.dn));
		} else {
			return $elm$core$String$fromInt(
				$elm$core$List$length(serverData.cE)) + ' sessions';
		}
	}();
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('status-bar')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('status-bar__left')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('status-bar__item')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(statusText)
							])),
						function () {
						var _v0 = model.c;
						if (!_v0.$) {
							var err = _v0.a;
							return A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('status-bar__item status-bar__error status-bar__error--dismissible'),
										$elm$html$Html$Events$onClick($author$project$Msg$ClearError),
										$elm$html$Html$Attributes$title('Click to dismiss')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(err),
										A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('status-bar__error-dismiss')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('✕')
											]))
									]));
						} else {
							return $elm$html$Html$text('');
						}
					}()
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('status-bar__right')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('status-bar__item')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(sessionCountText)
							]))
					]))
			]));
};
var $author$project$View$Layout$viewMainContent = function (model) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('main-content')
			]),
		_List_fromArray(
			[
				$author$project$View$Layout$viewHeader(model),
				$author$project$View$Layout$viewContent(model),
				$author$project$View$Layout$viewStatusBar(model)
			]));
};
var $author$project$Msg$OpenAddServerDialog = {$: 6};
var $author$project$Msg$SelectServer = function (a) {
	return {$: 2, a: a};
};
var $author$project$Msg$ServerDragEnter = function (a) {
	return {$: 146, a: a};
};
var $author$project$Msg$ServerDragLeave = {$: 147};
var $author$project$Msg$ShowContextMenu = F3(
	function (a, b, c) {
		return {$: 15, a: a, b: b, c: c};
	});
var $author$project$View$ServerBar$onContextMenu = function (serverUrl) {
	return A2(
		$elm$html$Html$Events$preventDefaultOn,
		'contextmenu',
		A3(
			$elm$json$Json$Decode$map2,
			F2(
				function (x, y) {
					return _Utils_Tuple2(
						A3($author$project$Msg$ShowContextMenu, serverUrl, x, y),
						true);
				}),
			A2($elm$json$Json$Decode$field, 'clientX', $elm$json$Json$Decode$float),
			A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float)));
};
var $author$project$Msg$ServerDragStart = F2(
	function (a, b) {
		return {$: 144, a: a, b: b};
	});
var $author$project$View$ServerBar$onMouseDownServer = function (serverUrl) {
	return A2(
		$elm$html$Html$Events$preventDefaultOn,
		'mousedown',
		A3(
			$elm$json$Json$Decode$map2,
			F2(
				function (y, button) {
					return (!button) ? _Utils_Tuple2(
						A2($author$project$Msg$ServerDragStart, serverUrl, y),
						true) : _Utils_Tuple2($author$project$Msg$NoOp, false);
				}),
			A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float),
			A2($elm$json$Json$Decode$field, 'button', $elm$json$Json$Decode$int)));
};
var $elm$html$Html$Events$onMouseEnter = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mouseenter',
		$elm$json$Json$Decode$succeed(msg));
};
var $elm$core$String$concat = function (strings) {
	return A2($elm$core$String$join, '', strings);
};
var $elm$core$String$toUpper = _String_toUpper;
var $elm$core$String$words = _String_words;
var $author$project$View$ServerBar$serverInitials = function (name) {
	return $elm$core$String$toUpper(
		$elm$core$String$concat(
			A2(
				$elm$core$List$take,
				2,
				A2(
					$elm$core$List$map,
					$elm$core$String$left(1),
					$elm$core$String$words(name)))));
};
var $author$project$View$ServerBar$viewServerButton = F4(
	function (selectedUrl, serverData, dragState, server) {
		var isSelected = _Utils_eq(
			selectedUrl,
			$elm$core$Maybe$Just(server.fl));
		var isDragging = function () {
			if (!dragState.$) {
				var ds = dragState.a;
				return _Utils_eq(ds.dm, server.fl);
			} else {
				return false;
			}
		}();
		var isDraggedOver = function () {
			if (!dragState.$) {
				var ds = dragState.a;
				return _Utils_eq(
					ds.di,
					$elm$core$Maybe$Just(server.fl));
			} else {
				return false;
			}
		}();
		var dragEvents = _List_fromArray(
			[
				$author$project$View$ServerBar$onMouseDownServer(server.fl),
				$elm$html$Html$Events$onMouseEnter(
				$author$project$Msg$ServerDragEnter(server.fl)),
				$elm$html$Html$Events$onMouseLeave($author$project$Msg$ServerDragLeave)
			]);
		var connectionState = A2($author$project$Model$getConnectionState, server.fl, serverData);
		var statusClass = function () {
			switch (connectionState.$) {
				case 2:
					return 'is-online';
				case 1:
					return 'is-connecting';
				case 3:
					return 'is-offline';
				default:
					return 'is-offline';
			}
		}();
		return A2(
			$elm$html$Html$div,
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('server-button'),
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2('is-selected', isSelected),
								_Utils_Tuple2('is-dragging', isDragging),
								_Utils_Tuple2('is-drag-over', isDraggedOver)
							]))
					]),
				dragEvents),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('server-button__indicator')
						]),
					_List_Nil),
					A2(
					$elm$html$Html$button,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('server-button__btn'),
							$elm$html$Html$Events$onClick(
							$author$project$Msg$SelectServer(server.fl)),
							$author$project$View$ServerBar$onContextMenu(server.fl),
							$elm$html$Html$Attributes$title(server.ea)
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('server-button__initials')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(
									$author$project$View$ServerBar$serverInitials(server.ea))
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('server-button__status ' + statusClass)
						]),
					_List_Nil),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('server-tooltip')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(server.ea)
						]))
				]));
	});
var $author$project$View$ServerBar$viewServerBar = function (model) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('server-bar')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('server-bar__list')
					]),
				A2(
					$elm$core$List$map,
					A3($author$project$View$ServerBar$viewServerButton, model.aS, model.aT, model.cv),
					model.cw)),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('server-bar__bottom')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('add-server-btn'),
								$elm$html$Html$Events$onClick($author$project$Msg$OpenAddServerDialog),
								$elm$html$Html$Attributes$title('Add Server')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('+')
							]))
					]))
			]));
};
var $author$project$Msg$CopyToClipboard = function (a) {
	return {$: 258, a: a};
};
var $author$project$Msg$HideApiKey = {$: 257};
var $author$project$Msg$HideUserMenu = {$: 254};
var $author$project$Msg$OpenChangeApikeyDialog = {$: 242};
var $author$project$Msg$OpenInvitationsDialog = {$: 61};
var $author$project$Msg$OpenRacesDialog = {$: 71};
var $author$project$Msg$ShowApiKey = function (a) {
	return {$: 255, a: a};
};
var $author$project$View$Menus$viewUserMenu = function (model) {
	if (!model.cF) {
		return $elm$html$Html$text('');
	} else {
		var _v0 = model.aS;
		if (_v0.$ === 1) {
			return $elm$html$Html$text('');
		} else {
			var serverUrl = _v0.a;
			var serverData = $author$project$Model$getCurrentServerData(model);
			var maybeSerialKey = function () {
				var _v3 = serverData.aH;
				if (_v3.$ === 2) {
					var info = _v3.a;
					return $elm$core$String$isEmpty(info.eR) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(info.eR);
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}();
			return A2(
				$elm$html$Html$div,
				_List_Nil,
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('user-menu-backdrop'),
								$elm$html$Html$Events$onClick($author$project$Msg$HideUserMenu)
							]),
						_List_Nil),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('user-menu')
							]),
						_List_fromArray(
							[
								function () {
								if (!maybeSerialKey.$) {
									var serialKey = maybeSerialKey.a;
									return A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('user-menu__serial')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$span,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('user-menu__serial-label')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('Serial Key:')
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('user-menu__value-row')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$span,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('user-menu__serial-value')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text(serialKey)
															])),
														A2(
														$elm$html$Html$button,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('user-menu__copy-btn'),
																$elm$html$Html$Events$onClick(
																$author$project$Msg$CopyToClipboard(serialKey)),
																A2($elm$html$Html$Attributes$attribute, 'title', 'Copy to clipboard')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('\uD83D\uDCCB')
															]))
													]))
											]));
								} else {
									return $elm$html$Html$text('');
								}
							}(),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__separator')
									]),
								_List_Nil),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__item'),
										$elm$html$Html$Events$onClick($author$project$Msg$OpenRacesDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('My Races')
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__item'),
										$elm$html$Html$Events$onClick($author$project$Msg$OpenInvitationsDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Invitations')
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__separator')
									]),
								_List_Nil),
								function () {
								var _v2 = model.bh;
								if (!_v2.$) {
									var apiKey = _v2.a;
									return A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('user-menu__apikey')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$span,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('user-menu__apikey-label')
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('API Key:')
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('user-menu__value-row')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$span,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('user-menu__apikey-value')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text(apiKey)
															])),
														A2(
														$elm$html$Html$button,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('user-menu__copy-btn'),
																$elm$html$Html$Events$onClick(
																$author$project$Msg$CopyToClipboard(apiKey)),
																A2($elm$html$Html$Attributes$attribute, 'title', 'Copy to clipboard')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text('\uD83D\uDCCB')
															]))
													])),
												A2(
												$elm$html$Html$div,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('user-menu__item user-menu__item--small'),
														$elm$html$Html$Events$onClick($author$project$Msg$HideApiKey)
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('Hide')
													]))
											]));
								} else {
									return A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('user-menu__item'),
												$elm$html$Html$Events$onClick(
												$author$project$Msg$ShowApiKey(serverUrl))
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('View API Key')
											]));
								}
							}(),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__item'),
										$elm$html$Html$Events$onClick($author$project$Msg$OpenChangeApikeyDialog)
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Change API Key')
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__separator')
									]),
								_List_Nil),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('user-menu__item'),
										$elm$html$Html$Events$onClick(
										$author$project$Msg$Disconnect(serverUrl))
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Disconnect')
									]))
							]))
					]));
		}
	}
};
var $author$project$View$Layout$view = function (model) {
	var isServerDragging = !_Utils_eq(model.cv, $elm$core$Maybe$Nothing);
	var isPlayerDragging = function () {
		var _v0 = model.cx;
		if (!_v0.$) {
			var detail = _v0.a;
			return !_Utils_eq(detail.dj, $elm$core$Maybe$Nothing);
		} else {
			return false;
		}
	}();
	var isDragging = isPlayerDragging || isServerDragging;
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('app'),
				$elm$html$Html$Attributes$classList(
				_List_fromArray(
					[
						_Utils_Tuple2('app--dragging', isDragging)
					]))
			]),
		_List_fromArray(
			[
				$author$project$View$ServerBar$viewServerBar(model),
				$author$project$View$Layout$viewMainContent(model),
				A2($author$project$View$Menus$viewContextMenu, model.a8, model.aT),
				$author$project$View$Menus$viewUserMenu(model),
				$author$project$View$Dialog$viewDialog(model)
			]));
};
var $author$project$View$view = $author$project$View$Layout$view;
var $author$project$Main$main = $elm$browser$Browser$element(
	{dO: $author$project$Main$init, e8: $author$project$Subscriptions$subscriptions, fk: $author$project$Update$update, fI: $author$project$View$view});
_Platform_export({'Main':{'init':$author$project$Main$main(
	$elm$json$Json$Decode$succeed(
		{}))(0)}});}(this));