
chrome.runtime.onMessage.addListener(
  function(messagePayload, sender, sendResponse) {
    if ( messagePayload.message === "getSelectedText" ) {
	    var text = "";
	    var activeEl = document.activeElement;
	    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
	    if (
	      (activeElTagName == "textarea") || (activeElTagName == "input" &&
	      /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
	      (typeof activeEl.selectionStart == "number")
	    ) {
	        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
	    } else if (window.getSelection) {
	        text = window.getSelection().toString();
	    }
	    sendResponse({selectedText: text});
    }
    return true;
  }
);