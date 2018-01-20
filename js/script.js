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

function displayResult(folder) {
  var html = '<ul class="card"><li><i class="expand-collapse material-icons">expand_less</i><span>' + folder.name + '</span><ul>';
  for ( var key in folder.artists) {
    var artist = folder.artists[key];
    html += '<li><i class="expand-collapse material-icons">expand_less</i><span><a href="spotify:artist:' + artist.id
            + '">' + artist.name + '</a></span><ul>';
    for ( var keyAlbum in artist.albums) {
      var album = artist.albums[keyAlbum];
      html += '<li><span><a href="spotify:album:' + album.id + '">' + album.name + '</a></span></li>';
    }
    html += '</ul></li>';
  }
  html += '</li></ul>';

  $('.progress').css('display', 'none');
  $('.utils').css('display', 'block');
  $('#result').html(html);
}

async function getPlaylists(accessToken, offset) {
  var playlistsResponse = await getAPIResponse('https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset, accessToken);
  return playlistsResponse;
}

async function getUserId(accessToken) {
  var userResponse = await getAPIResponse('https://api.spotify.com/v1/me', accessToken);
  return userResponse.id;
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

(function() {
  initBasicAnimation();
  
  // Get parameters from URL
  var vars = window.location.hash.substring(1).split('&');
  var accessToken;
  if (vars.length > 0) {
    accessToken = vars[0].split('=')[1];
  }

  if (accessToken !== undefined) {
    // var folders = {};
    $('#login').css('display', 'none');
    $('.progress').css('display', 'block');

    // TODO create folder
    // var generalFolder = new Folder('General', {});
    var folder = new Folder('General', {});

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
          var response = arguments[0];
          for (var i = 0; i < response.length; i++) {
            response[i].items.forEach(function(item) {
              var albumId = item.track.album.id;
              var albumName = item.track.album.name;

              var artistId = item.track.artists[0].id;
              var artistName = item.track.artists[0].name;

              // Find artist
              if (typeof folder.artists[artistId] === 'undefined') {
                // No artist means no album
                var album = new Album(albumId, albumName);
                var map = {};
                map[albumId] = album;
                var artist = new Artist(artistId, artistName, map);
                folder.artists[artistId] = artist;
              } else {
                // There is artist
                var foundArtist = folder.artists[artistId];
                if (typeof foundArtist.albums[albumId] === 'undefined') {
                  // No album
                  var newAlbum = new Album(albumId, albumName);
                  foundArtist.albums[albumId] = newAlbum;
                }
              }
            });
          }
          return folder;
        }).then(function(folder) {
          displayResult(folder);
        });
      });
    });
  } else {
    $('.progress').css('display', 'none');
    $('.utils').css('display', 'none');
  }
})();
