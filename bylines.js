var feedURL = 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml';

function addBylines(urlMap) {
	var present = 0;
	var added = 0;
	var notFound = 0;
	
	urlMap.forEach((info, url) => {
		if (info.id) {
			if (document.getElementById(info.id)) {
				//console.log(url + " is already present -- skipping");
				present++;
				return;
			}
			info.id = null;
		}
		
		let links = document.querySelectorAll(`a[href*="${url}"]`);
		if (links.length) {
			//console.log(`Found ${url}`);
			added++;
			
			let byline = document.createElement('div');
			byline.id = 'byline-' + Math.floor(Math.random() * (9999999999));
			byline.className = 'article-byline';
		    byline.textContent = 'By ' + info.authorString.toUpperCase().replace("AND", "and");

			
			let target = links[0];
			for (let link of links) {
				let h2 = link.querySelector('h2');
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
		}
		else {
			//console.log(`Didn't find ${url}`);
			notFound++;
		}
	});
	
	//console.log(`Present: ${present}  Added: ${added}  Not Found: ${notFound}`);
}

if (window.location.href.split('?')[0] == 'https://www.nytimes.com/') {
	fetch(feedURL)
		.then(response => response.text())
		.then(text => {
			var urlMap = new Map();
			
			let doc = (new DOMParser).parseFromString(text, 'text/xml');
			let items = doc.querySelectorAll('item');
			for (let item of items) {
				// Get relative paths without query strings from the feed item URLs
				let url = item.querySelector('link:not([rel])').textContent;
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
				let authorString = item.querySelector('creator').textContent
					.split(/ and /g)
					.map((author) => {
						return author
							.toLowerCase()
							.split(' ')
							.map(name => name.charAt(0).toUpperCase() + name.substr(1))
							.join(' ');
					})
					.join(' and ');
				if (!authorString) {
					continue;
				}
				
				urlMap.set(
					url,
					{
						id: null,
						authorString
					});
			}
			
			addBylines(urlMap);
			// Check all bylines again after a short delay, both for elements that were added after
			// the page load and to restore bylines that were removed by JS updating components on
			// the page (particularly when clicking Back from an article).
			setTimeout(() => addBylines(urlMap), 750);
			setTimeout(() => addBylines(urlMap), 2500);
			setTimeout(() => addBylines(urlMap), 5000);
		})
		.catch(e => console.log(e));
}
