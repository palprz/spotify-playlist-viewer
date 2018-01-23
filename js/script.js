function Folder(name, artists) {
  this.name = name;
  this.artists = artists;
}

function Album(id, name) {
  this.id = id;
  this.name = name;
}

function Artist(id, name, albums) {
  this.id = id;
  this.name = name;
  this.albums = albums;
}

function initBasicAnimation() {
  $(document).on('click', '#login', function() {
    console.log('Start login...');
    $('.progress').css('display', 'block');
    login();
  });

  $(document).on('click', '.expand-collapse', function() {
    var $children = $(this).parent().children('ul');
    var val = $children.css('display');
    if (val === 'none') {
      $(this).text('expand_less');
    } else {
      $(this).text('expand_more');
    }
    $children.animate({
      height: 'toggle'
    });
  });

  $(document).on('click', '.settings', function() {
    $('.configuration').animate({
      height: 'toggle'
    });
  });
  
  $(document).on('click', '.expand-all', function() {
    $('.card').find('ul').animate({
      height: 'show'
    });
  });

  $(document).on('click', '.collapse-all', function() {
    $('.card').find('ul').animate({
      height: 'hide'
    });
  });

  $('select').material_select();
}

function login() {
  var client_id = 'c676b1cde38a4bf9a725cafebeab4c69';
  var redirect_uri = 'https://rawgit.com/palprz/spotify-playlist-viewer/master/index.html';

  var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id + '&redirect_uri=' + redirect_uri
          + '&scope=playlist-read-private&response_type=token';

  window.location = url;
}

function getAPIResponse(url, accessToken) {
  return $.getJSON({
    url: url,
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  });
}

async function getPlaylists(accessToken, offset) {
  var playlistsResponse = await getAPIResponse('https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset, accessToken);
  return playlistsResponse;
}

async function getUserId(accessToken) {
  var userResponse = await getAPIResponse('https://api.spotify.com/v1/me', accessToken);
  return userResponse.id;
}

function displayResult(folders) {
  var html = '<ul class="card">';
  folders.forEach(function(folder) {
    html += '<li><i class="expand-collapse material-icons">expand_less</i><span>' + folder.name + '</span><ul>';
    folder.artists.forEach(function(artist) {
      html += '<li><i class="expand-collapse material-icons">expand_less</i><span><a href="spotify:artist:' + artist.id
              + '">' + artist.name + '</a></span><ul>';
      artist.albums.forEach(function(album) {
        html += '<li><span><a href="spotify:album:' + album.id + '">' + album.name + '</a></span></li>';
      });
      html += '</ul></li>';
    });
    html += '</li></ul>';
  });

  $('.progress').css('display', 'none');
  $('.utils').css('display', 'block');
  $('#result').html(html);
}

async function getAllPlaylists(accessToken) {
  var isSomethingLeft = true;
  var offset = 0;
  var playlistItems = [];
  while (isSomethingLeft) {
    var response = await getPlaylists(accessToken, offset);
    playlistItems.push(response);
    //50 -> max number of lists to get from response
    if (response.items.length === 50) {
      offset += 50;
    } else {
      isSomethingLeft = false;
    }
  }
  
  var playlists = [];
  for(var i = 0; i < playlistItems.length; i++) {
    playlists.push(...playlistItems[i].items);
  }

  return playlists;
}

function sortFolders(folders) {
  folders.forEach(function(folder) {
    folder.artists= sortMapByValue([...folder.artists]);
    folder.artists.forEach(function(artist) {
      artist.albums= sortMapByValue([...artist.albums]);
    });
  });
}

function sortMapByValue(array) {
  var sortedArray = array.sort(function(a,b) {
    if(a[1].name > b[1].name) {
      return 1;
    }

    if(a[1].name < b[1].name) {
      return -1;
    }
    
    return 0;
  });

  return new Map(sortedArray.map(obj => [obj[0], obj[1]]));
}

function getCorrectFolder(folders, playlists, i) {
  var folder;
  if(playlists[i].name.includes('::') ) { //TODO add configuration for this
    var folderNameToFind = playlists[i].name.split('::')[0];
    if(typeof folders.get(folderNameToFind) === 'undefined') { 
      //Create new folder
      folder = new Folder(folderNameToFind, new Map());
      folders.set(folder.name, folder);
    } else {
      //Use existing folder
      folder = folders.get(folderNameToFind);
    }
  } else {
    //Use general
    folder = folders.get('General');
  }
  
  return folder;
}

function populateTracksFromResponse(folders, playlists, response) {
  for (var i = 0; i < response.length; i++) {
    
    var folder = getCorrectFolder(folders, playlists, i);
    
    response[i].items.forEach(function(item) {
      var albumId = item.track.album.id;
      var albumName = item.track.album.name;

      var artistId = item.track.artists[0].id;
      var artistName = item.track.artists[0].name;

      // Find artist
      if (typeof folder.artists.get(artistId) === 'undefined') {
        // No artist means no album
        var album = new Album(albumId, albumName);
        
        var map = new Map();
        map.set(albumId, album);
        var artist = new Artist(artistId, artistName, map);
        folder.artists.set(artistId, artist);
      } else {
        // There is artist
        var foundArtist = folder.artists.get(artistId);
        if (typeof foundArtist.albums.get(albumId) === 'undefined') {
          // No album
          var newAlbum = new Album(albumId, albumName);
          foundArtist.albums.set(albumId, newAlbum);
        }
      }
    });
  } 
}

(function() {
  initBasicAnimation();
  
  // Get parameters from URL
  var vars = window.location.hash.substring(1).split('&');
  var accessToken;
  if (vars.length > 0) {
    accessToken = vars[0].split('=')[1];
  }

  if (accessToken !== undefined) {
    $('#login').css('display', 'none');
    $('.progress').css('display', 'block');

    var folders = new Map();
    var folder = new Folder('General', new Map());
    folders.set(folder.name, folder);

    getAllPlaylists(accessToken).then(function(playlists) {
      var mapPlaylists = {};
      playlists.forEach(function(playlist) {
        mapPlaylists[playlist.id] = playlist.name;
      });

      getUserId(accessToken).then(function(userId) {
        var promises = [];
        for ( var key in mapPlaylists) {
          var url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + key + '/tracks';
          promises.push(getAPIResponse(url, accessToken));
        }

        Promise.all(promises).then(function() {
          populateTracksFromResponse(folders, playlists, arguments[0]);
        }).then(function() {
          sortFolders(folders);
          displayResult(folders);
        });
      });
    });
  } else {
    $('.progress').css('display', 'none');
    $('.utils').css('display', 'none');
  }
})();
