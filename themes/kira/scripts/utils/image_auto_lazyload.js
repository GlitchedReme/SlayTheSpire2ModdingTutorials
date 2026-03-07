'use strict';

function imageAutoLazyloadHelper(content) {
	var siteRoot = hexo.config.root || '/';
	if (!siteRoot.endsWith('/')) {
		siteRoot += '/';
	}
	var imageRoot = siteRoot + 'images/';

	var str = content.replace(
		/<img.*?src="(.*?)" alt="(.*?)".*?\/?>/gi,
		'<img data-fancybox="gallery" data-sizes="auto" data-src="$1" alt="$2" class="lazyload">'
	);
	str = str.replace(
		/src="images\//g,
		'src="' + imageRoot
	);
	str = str.replace(
		/src="\.\.\/\.\.\/images\//g,
		'src="' + imageRoot
	);
	str = str.replace(
		/src="\/images\//g,
		'src="' + imageRoot
	);
	return str;
}

hexo.extend.helper.register('image_auto_lazyload', imageAutoLazyloadHelper);
