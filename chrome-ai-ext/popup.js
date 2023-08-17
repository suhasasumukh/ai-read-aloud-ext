
var getFirstBrowserLanguage = function () {
    var nav = window.navigator;
    var browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
    i,
    language;

    // support for HTML 5.1 "navigator.languages"
    if (Array.isArray(nav.languages)) {
      for (i = 0; i < nav.languages.length; i++) {
        language = nav.languages[i];
        if (language && language.length) {
          return language;
        }
      }
    }

    // support for other well known properties in browsers
    for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }

    return null;
};

var voices;
var selectedVoice = '';
var language;
var fragments;

function readFragment(fragmentIndex) {
  window.speechSynthesis.cancel(); // Revive the speech synthensis engine when it crash
  var msg = new SpeechSynthesisUtterance();
  msg.lang = language;
  msg.voice = selectedVoice;
  msg.volume = 1;

  msg.text = fragments[fragmentIndex];
  console.log("Reading:" + fragments[fragmentIndex]);
  msg.onend = function() {
    if (fragmentIndex + 1 < fragments.length) {
      setTimeout(function() {
        readFragment(fragmentIndex + 1)
      },300);
    } else {
      fragments = [];
    }
  };
  window.speechSynthesis.speak(msg);
}

function readSelectedText() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var selectElement = document.getElementById('voice');
    var selectedOption = selectElement.options[selectElement.selectedIndex];
    var currentVoice = selectedOption.value;
    localStorage.setItem( 'readSelectedText_language', currentVoice );

    language = getFirstBrowserLanguage();
    voices.filter(function(voice) {
      if (voice.name == currentVoice) {
        selectedVoice = voice;
      }
    });
    if (! selectedVoice) {
      selectedVoice = voices[0];
    }

    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "getSelectedText"}, function(response) {
      fragments = response.selectedText.split(/[:.]\s+/);
      readFragment(0);
    });
  });
}

function updateVoices() {
  var voiceHtml = '';
  var promise = new Promise(function(resolve, reject) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = function() {
        resolve();
      };
      voices = window.speechSynthesis.getVoices();
    } else {
        reject();
    }
  });
  promise.then(function(){
    voices = window.speechSynthesis.getVoices();

    voiceHtml = '';
    var defaultVoice = localStorage.getItem('readSelectedText_language');
    if (! defaultVoice) {
      var browserLanguage = getFirstBrowserLanguage();
      if (browserLanguage) {
        browserLanguage = browserLanguage.toLowerCase();
        if (browserLanguage == 'en-us') {
          defaultVoice = 'Google US English';
        } else if (browserLanguage == 'en') {
          defaultVoice = 'Google UK English Male'
        }
      }      
    }

    // http://php.wekeepcoding.com/article/17595781/Getting+the+list+of+voices+in+speechSynthesis+of+Chrome+(Web+Speech+API)
    voices.filter(function(voice) { 
      voiceHtml = voiceHtml + '<option value="' + voice.name + '"';
      if ((voice.name == defaultVoice) && (defaultVoice)) {
        voiceHtml = voiceHtml + ' selected ';
      }
      voiceHtml = voiceHtml + '>' + voice.name + '</option>';
    });
    document.getElementById('voice').innerHTML = voiceHtml;
    readSelectedText();
  }).catch(function(){
    document.getElementById('mainBody').innerHTML = 'Your browser does not support text to speech.';
  })
}

document.addEventListener('DOMContentLoaded', function() {
  updateVoices();

  var checkPageButton = document.getElementById('checkPage');
  checkPageButton.addEventListener('click', function() {
    chrome.tabs.getSelected(null, function(tab) {
      readSelectedText();
    });
  }, false);
}, false);