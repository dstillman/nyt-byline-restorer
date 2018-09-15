var feedURL = 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml';

function processFeed(doc) {
	var items = doc.querySelectorAll('item');
	for (let item of items) {
		// Get relative paths without query strings from the feed item URLs
		let url = item.querySelector('link:not([rel])').textContent;
		url = url.match(/https:\/\/[^\/]+([^\?]+)/)[1];
		
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
		
		let byline = document.createElement('div');
		byline.className = 'article-byline';
		byline.textContent = authorString;
		
		let link = document.querySelector(`a[href="${url}"]`);
		if (link) {
			let h2 = link.querySelector('h2');
			let target = h2 ? h2.parentNode : link;
			target.parentNode.insertBefore(byline, target.nextSibling);
		}
	}
}

fetch(feedURL)
	.then(response => response.text())
	.then(text => (new DOMParser).parseFromString(text, 'text/xml'))
	.then(doc => {
		processFeed(doc);
		
		// Check to make sure the bylines are still there after a short delay, and re-add them if not.
		// Without this, JS on the page can update the components (particularly when clicking Back
		// from an article) and clear the bylines we added.
		setTimeout(() => {
			if (!document.querySelector('.article-byline')) {
				console.log("Reprocessing bylines");
				processFeed(doc);
				return;
			}
		}, 750);
	})
	.catch(e => console.log(e));