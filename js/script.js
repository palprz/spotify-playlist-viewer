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
  // console.log('test');
  // console.log(folders);
  var html = '<ul class="card">';
  // for ( var folder in folders) {
  html += '<li><i class="expand-collapse material-icons">expand_less</i><span>' + folder.name + '</span><ul>';
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
  html += '</li>';
  // }
  html += '</ul>';

  $('.progress').css('display', 'none');
  $('.utils').css('display', 'block');
  $('#result').html(html);
}

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

(function() {
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

    // Get user
    var getUser = getAPIResponse('https://api.spotify.com/v1/me', accessToken);

    getUser.done(function(response) {
      var userId = response.id;

      // Get playlists
      var playlistsResponse = getAPIResponse('https://api.spotify.com/v1/me/playlists?limit=50', accessToken);

      playlistsResponse.done(function(response) {
        var playlists = {};
        response.items.forEach(function(playlist) {
          playlists[playlist.id] = playlist.name;
        });

        var promises = [];
        for ( var key in playlists) {
          var url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + key + '/tracks';
          promises.push(getAPIResponse(url, accessToken));
        }

        // Get tracks
        Promise.all(promises).then(function() {
          var response = arguments[0];
          for ( var index in response) {
            response[index].items.forEach(function(item) {
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
    console.log('show...');
    $('.card').find('ul').animate({
      height: 'show'
    });
  });

  $(document).on('click', '.collapse-all', function() {
    console.log('hide...');
    $('.card').find('ul').animate({
      height: 'hide'
    });
  });

})();