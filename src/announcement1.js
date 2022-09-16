window.addEventListener('DOMContentLoaded', function (event) {
	var buttons = document.querySelectorAll('button');
	for (let button of buttons) {
		button.addEventListener('click', function () {
			parent.postMessage({
				type: "setting-change",
				key: "removeMinRead",
				value: parseInt(this.value)
			}, "*");
		});
	}
	
	document.getElementById('close-button').addEventListener('click', function () {
		parent.postMessage({
			type: "announcement-close"
		}, "*");
	});
});
