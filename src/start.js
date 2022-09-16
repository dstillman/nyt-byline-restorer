function insertCSS() {
	var link = document.createElement("link");
	link.href = chrome.extension.getURL('styleStart.css');
	link.id = 'nyt-byline-restorer-style-start';
	link.type = "text/css";
	link.rel = "stylesheet";
	document.getElementsByTagName("html")[0].appendChild(link);
}

chrome.storage.sync.get(
	{
		removeMinRead: false,
	},
	function (items) {
		if (items.removeMinRead) {
			insertCSS();
		}
	}
);
