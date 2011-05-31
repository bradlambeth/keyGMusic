var keygmusicListener = {

  // Function adapted from http://code.google.com/p/music-beta-controller/
  // Find a the first tab in the current window that is showing Music Beta
  // and call callback with the id of that tab.
  FindMusicBetaTab: function(callback) {
    chrome.windows.getAll({populate: true}, function(windows) {
        var pattern = 'https?\:\/\/music\.google\.com\/music\/listen.*';
        for (var window = 0; window < windows.length; window++) {
          for (var i = 0; i < windows[window].tabs.length; i++) {
            if (windows[window].tabs[i].url.match(pattern)) {
              callback(windows[window].tabs[i].id)
              return;
            }
          }
        }
        callback(null);
      });
  },

  // Function adapted from http://code.google.com/p/music-beta-controller/
  // Send the given command to a tab showing Music Beta,
  // or open one if non exists.
  sendCommand: function(command) {
    keygmusicListener.FindMusicBetaTab(function(tab_id) {
        if (tab_id) {
          if (command == "foreground") {
            chrome.tabs.update(tab_id, {selected: true});
          } else {
            chrome.tabs.executeScript(tab_id,
                {
                  code: "location.assign('javascript:SJBpost(\"" + command +
                        "\");void 0');",
                  allFrames: true
                });
          }
        } else {
          chrome.tabs.create({url: 'http://music.google.com/music/listen',
                              selected: true});
        }
      });
  },

  // Init keygmusicListener object
  init: function(){

    if (window.location.href.search(/^http\:\/\/music\.google\.com\/music\/listen/) != -1){

      chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        var allToggles = {
          "play"      : function(){ keygmusicListener.sendCommand("playPause"); },
          "stop"      : function(){ keygmusicListener.sendCommand("stop"); },
          "prev"      : function(){ keygmusicListener.sendCommand("prevSong"); },
          "next"      : function(){ keygmusicListener.sendCommand("nextSong"); },

//          "volup"     : function(){ keygmusicListener.sendCommand("var volCont=window.jQuery('.volumeContainer');var volNow=volCont.slider('option','value');if(volNow<=90){window.amznMusic.playerInterface.setVolume((volNow/100)+0.1);volCont.slider('option','value',volNow+10)}else{window.amznMusic.playerInterface.setVolume(1);volCont.slider('option','value',100)}") },
//          "voldown"   : function(){ keygmusicListener.sendCommand("var volCont=window.jQuery('.volumeContainer');var volNow=volCont.slider('option','value');if(volNow>=10){window.amznMusic.playerInterface.setVolume((volNow/100)-0.1);volCont.slider('option','value',volNow-10)}else{window.amznMusic.playerInterface.setVolume(0);volCont.slider('option','value',0)}"); },
        };

        if (request.method == "sendCommand" && allToggles[request.action] != undefined){

          try{
            allToggles[request.action]();
            sendResponse({"result" : 200});
          }catch(e){
            sendResponse({"result" : 500});
          }

        }
      });

    }

    this.unAllowedKeys = [16, 17, 18, 91];

    // Inject in tab keyup listener, who will check for (maybe) valid keygmusic combo
    window.addEventListener('keyup', function(event){

      var modifiers = new Array();
      var key = '';
      var keycode = '';

      // Get the modifiers
      if(event.metaKey) modifiers.push('meta');
      if(event.ctrlKey) modifiers.push('control');
      if(event.altKey) modifiers.push('alt');
      if(event.shiftKey) modifiers.push('shift');

      // Get keycode
      if(event.keyCode) {
        keycode = event.keyCode;
      }

      if(modifiers.length > 0 && !keygmusicListener.inArray(keygmusicListener.unAllowedKeys, keycode)) {

        var request = {
          "method" : "keyup",
          "modifiers" : modifiers,
          "keycode"   : keycode,
        };
        chrome.extension.sendRequest(request, function(response){});

      }

    }, false);

  },

  // Check if Object is Array
  inArray: function(arr, value){
    var i;
    for (i=0; i < arr.length; i++) {
      if (arr[i] === value) {
        return true;
      }
    }
    return false;
  }

}

try{

  keygmusicListener.init();

}catch(e){
  // Fail, but with dignity!
}
