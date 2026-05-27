'use strict';

const path = require('path');

function resolveFromHexoUtil(packageName) {
	const hexoMain = require.resolve('hexo');
	const hexoUtilMain = require.resolve('hexo-util', {
		paths: [path.dirname(hexoMain)]
	});

	return require.resolve(packageName, {
		paths: [path.dirname(hexoUtilMain)]
	});
}

const hexoMain = require.resolve('hexo');
const hexoUtilMain = require.resolve('hexo-util', {
	paths: [path.dirname(hexoMain)]
});
const hexoUtilDistDir = path.dirname(hexoUtilMain);
const highlightAliases = require(path.join(hexoUtilDistDir, '..', 'highlight_alias.json'));

if (!highlightAliases.languages.includes('tscn')) {
	highlightAliases.languages.push('tscn');
}

Object.assign(highlightAliases.aliases, {
	tscn: 'tscn',
	tscnfile: 'tscn',
	'godot-scene': 'tscn'
});

const hljs = require(resolveFromHexoUtil('highlight.js'));

if (!hljs.getLanguage('tscn')) {
	hljs.registerLanguage('tscn', function (hljs) {
		const IDENT = /[A-Za-z_][A-Za-z0-9_]*/;
		const NUMBER = {
			className: 'number',
			relevance: 0,
			variants: [
				{ begin: /-?\b\d+\.\d+(?:e[+-]?\d+)?\b/i },
				{ begin: /-?\b\d+(?:e[+-]?\d+)?\b/i }
			]
		};
		const BUILT_IN_CALL = {
			className: 'built_in',
			begin: /\b(?:AABB|Basis|Color|NodePath|Packed(?:Byte|Color|Float32|Float64|Int32|Int64|String|Vector2|Vector3|Vector4)Array|Plane|Projection|Quaternion|Rect2i?|RID|Signal|StringName|Transform2D|Transform3D|Vector[234]i?)\s*(?=\()/,
			relevance: 0
		};
		const CONSTANT = {
			className: 'literal',
			begin: /\b(?:false|true|null|INF|NAN)\b/,
			relevance: 0
		};
		const RESOURCE_REF = {
			className: 'symbol',
			begin: /\b(?:ExtResource|SubResource)\s*(?=\()/,
			relevance: 0
		};
		const ATTR = {
			className: 'attr',
			begin: IDENT,
			end: /\s*=/,
			excludeEnd: true,
			relevance: 0
		};

		return {
			name: 'Godot TSCN',
			aliases: ['tscnfile', 'godot-scene'],
			case_insensitive: false,
			contains: [
				hljs.COMMENT(';', '$'),
				{
					className: 'meta',
					begin: /^\[(?:gd_scene|ext_resource|sub_resource|node|connection|editable|resource)\b/,
					end: /\]/,
					keywords: {
						keyword: 'gd_scene ext_resource sub_resource node connection editable resource'
					},
					contains: [
						hljs.QUOTE_STRING_MODE,
						ATTR,
						NUMBER,
						CONSTANT
					]
				},
				{
					className: 'attribute',
					begin: /^\s*[A-Za-z_][A-Za-z0-9_./:-]*(?=\s*=)/,
					relevance: 0
				},
				hljs.QUOTE_STRING_MODE,
				RESOURCE_REF,
				BUILT_IN_CALL,
				NUMBER,
				CONSTANT
			]
		};
	});
}
