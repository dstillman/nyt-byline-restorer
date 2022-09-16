var currentVersion = 1;

var feedURLs = [
	'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
	'https://rss.nytimes.com/services/xml/rss/nyt/MostViewed.xml',
	'https://content.api.nytimes.com/svc/news/v3/all/recent.rss'
];

debug = false;
function log(msg) {
	if (!debug) return;
	console.log(msg);
}

function addBylines(urlMap) {
	var present = 0;
	var added = 0;
	var notFound = 0;
	var feedCounts = {};
	for (let i = 0; i < feedURLs.length; i++) {
		feedCounts[i] = 0;
	}
	
	urlMap.forEach((info, url) => {
		if (info.id) {
			if (document.getElementById(info.id)) {
				log(url + " is already present -- skipping");
				present++;
				return;
			}
			info.id = null;
		}
		
		let links = document.querySelectorAll(`a[href*="${url}"]`);
		if (links.length) {
			log(`Found ${url}`);
			added++;
			
			feedCounts[info.feed] = ++feedCounts[info.feed];
			
			let byline = document.createElement('div');
			byline.id = 'byline-' + Math.floor(Math.random() * (9999999999));
			byline.className = 'article-byline';
			byline.textContent = info.authorString;
			
			let target = links[0];
			log(`Found ${links.length} links for ${url}`);
			log(links);
			for (let link of links) {
				let h2 = link.querySelector('h2, .hed');
				if (h2) {
					// Avoid gap between large top headlines and byline
					let h2Size = getComputedStyle(h2).getPropertyValue('font-size');
					if (h2Size.endsWith('px') && h2Size > "31") {
						target = h2;
					}
					// Normally we add the byline after the containing div, which makes for
					// better spacing below headlines with keylines
					else {
						target = h2.parentNode;
					}
					// If the headline is centered, center the byline too
					if (getComputedStyle(h2).getPropertyValue('text-align') == 'center') {
						byline.classList.add('article-byline-centered');
					}
					break;
				}
			}
			
			target.parentNode.insertBefore(byline, target.nextSibling);
			info.id = byline.id;
			log(`Added ${url} with ${info.id}`);
		}
		else {
			log(`Didn't find ${url}`);
			notFound++;
		}
	});
	
	if (debug) {
		log(`Present: ${present}  Added: ${added}  Not Found: ${notFound}`);
		
		let countStrings = [];
		for (let i in feedCounts) {
			countStrings.push(feedURLs[i].match(/[^\/]+$/)[0] + ': ' + feedCounts[i]);
		}
		if (countStrings.length) {
			log(countStrings.join(' '));
		}
	}
}

// From https://gist.github.com/johnhawkinson/7400d0f19158b1bbcc2b5319bbc8d451
function titleCase(s) {
	var n, i, o, olower;
	n = s.charAt(0);
	for (i = 1; i < s.length; i++) {
		o = s.charAt(i - 1);
		olower = o.toLowerCase();
		if (o !== olower) {
			n += s.charAt(i).toLowerCase();
		}
		else {
			n += s.charAt(i);
		}
	}
	return n;
}

/**
 * Bylines on section pages are present but hidden, so just unhide the line and rehide the
 * timestamp and divider (which someone might reasonably want but let's stick to our mission)
 */
function unhideBylines() {
	// Sections with explicit classes, which seems to be most sections
	var elems = document.querySelectorAll('.byline');
	for (let elem of elems) {
		if (getComputedStyle(elem).getPropertyValue('display') == 'none') {
			elem.style.display = 'flex';
			let freshness = elem.querySelector('.freshness');
			if (freshness) {
				freshness.style.display = 'none';
			}
			let divider = elem.querySelector('.divider');
			if (divider) {
				divider.style.display = 'none';
			}
		}
	}
	// Sections with css-* classes (e.g., https://www.nytimes.com/section/multimedia)
	elems = document.querySelectorAll('span[itemprop="author"]');
	for (let elem of elems) {
		let parent = elem.parentNode;
		if (getComputedStyle(parent).getPropertyValue('display') == 'none') {
			if (parent.childNodes.length == 3) {
				parent.style.display = 'flex';
				parent.childNodes[0].style.display = 'none';
				parent.childNodes[1].style.display = 'none';
			}
		}
	}
}

function removeMinRead() {
	// Remove "x min read"
	for (let p of document.querySelectorAll('p')) {
		if (/min read$/.test(p.textContent)) {
			p.hidden = true;
		}
	}
	
	// Remove stylesheet we added to hide "x min read" before we could remove them more precisely
	var styleStart = document.getElementById('nyt-byline-restorer-style-start');
	if (styleStart) {
		styleStart.parentNode.removeChild(styleStart);
	}
}

function showAnnouncement() {
	var iframe = document.createElement('iframe');
	iframe.style.position = 'fixed';
	iframe.style.zIndex = 2147483647;
	iframe.style.top = '15px';
	iframe.style.right = '20px';
	iframe.style.width = '325px';
	iframe.style.height = '200px';
	iframe.style.border = 'none';
	
	function closeIframe() {
		chrome.storage.sync.set({
			lastVersion: currentVersion
		});
		
		iframe.parentNode.removeChild(iframe);
	}
	
	window.addEventListener('message', function (event) {
		if (event.origin + '/' == chrome.runtime.getURL('/')) {
			if (event.data.type == 'announcement-close') {
				closeIframe();
				return;
			}
			
			if (event.data.type == 'setting-change') {
				switch (event.data.key) {
					case 'removeMinRead':
						chrome.storage.sync.set({
							[event.data.key]: !!event.data.value
						});
						break;
				}
				
				if (event.data.key == 'removeMinRead' && event.data.value) {
					removeMinRead();
				}
				
				closeIframe();
			}
		}
	});
	iframe.setAttribute('src', chrome.runtime.getURL("announcement1.html"));
	
	document.body.appendChild(iframe);
}


var base = window.location.href.match(/https:\/\/[^\/]+([^\?]+)/)[1];
var isHomepage = base == '/';
// Match /section/foo and /section/foo/bar, since sometimes the latter has bylines
// (e.g., /section/technology/personaltech)
var isSection = base.match(/^\/section\/[a-z\-]+/);

chrome.storage.sync.get(
	{
		lastVersion: 0,
		restoreBylines: true,
		removeMinRead: false,
	},
	function (options) {
		if (isHomepage) {
			if (options.lastVersion < currentVersion) {
				showAnnouncement();
			}
			
			if (options.removeMinRead) {
				removeMinRead();
			}
			
			let urls = feedURLs.slice();
			var urlMap = new Map();
			let i = 0;
			
			function processNextFeedURL() {
				let url = urls.shift();
				if (!url) {
					// Once all feeds have been processed, check all bylines again after a short delay,
					// both for elements that were added after the page load and to restore bylines that
					// were removed by JS updating components on the page (particularly when clicking
					// Back from an article).
					setTimeout(() => addBylines(urlMap), 750);
					setTimeout(() => addBylines(urlMap), 2500);
					setTimeout(() => addBylines(urlMap), 5000);
					return;
				}
				
				let feedIndex = i++;
				log("Fetching " + url);
				fetch(url)
				.then(r => r.text())
				.then((text) => {
					log("Running text for " + url);
					var doc = (new DOMParser).parseFromString(text, 'text/xml');
					var items = doc.querySelectorAll('item');
					for (let item of items) {
						// Get relative paths without query strings from the feed item URLs
						let url = item.querySelector('link:not([rel])').textContent;
						if (!url) continue;
						url = url.match(/https:\/\/[^\/]+([^\?]+)/)[1];
						
						// Ignore URLs we already have
						if (urlMap.has(url)) {
							continue;
						}
						
						// Opinion pieces already show authors
						if (url.includes('/opinion/')) {
							continue;
						}
						
						// Fix capitalization of author names
						let creator = item.querySelector('creator');
						if (!creator) {
							continue;
						}
						let authorString = creator.textContent;
						if (authorString.startsWith('By ')) {
							authorString = authorString.substr(3);
						}
						authorString = authorString
							.split(/ and /g)
							.map(author => titleCase(author))
							.join(' and ');
						if (!authorString) {
							continue;
						}
						
						urlMap.set(
							url,
							{
								id: null,
								authorString,
								feed: feedIndex
							}
						);
					}
					
					log("Adding bylines for " + url);
					addBylines(urlMap);
				})
				.catch((e) => {
					console.log(e);
				})
				.then(() => {
					processNextFeedURL();
				});
			}
			
			if (options.restoreBylines) {
				processNextFeedURL();
			}
		}
		else if (isSection) {
			if (options.restoreBylines) {
				unhideBylines();
			}
		}
	}
);