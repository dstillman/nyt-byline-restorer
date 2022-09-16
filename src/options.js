// Saves options to chrome.storage
function saveOptions() {
	var restoreBylines = document.getElementById('restoreBylines').checked;
	var removeMinRead = document.getElementById('removeMinRead').checked;
	chrome.storage.sync.set({
		restoreBylines,
		removeMinRead,
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Saved!';
		setTimeout(function() {
			status.textContent = '';
		}, 1500);
	});
}

// Restores options using the preferences stored in chrome.storage
function restoreOptions() {
	chrome.storage.sync.get({
		restoreBylines: true,
		removeMinRead: false,
	}, function(items) {
		document.getElementById('restoreBylines').checked = items.restoreBylines;
		document.getElementById('removeMinRead').checked = items.removeMinRead;
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById('restoreBylines').addEventListener('click', saveOptions);
document.getElementById('removeMinRead').addEventListener('click', saveOptions);