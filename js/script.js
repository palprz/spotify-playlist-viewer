function login() {
  var client_id = 'c676b1cde38a4bf9a725cafebeab4c69';
  var redirect_uri = 'http://localhost:63342/spotify/index.html';

  var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id + '&redirect_uri=' + redirect_uri
          + '&scope=playlist-read-private&response_type=token';

  window.location = url;
}

// TODO
// https://stackoverflow.com/questions/3458553/javascript-passing-parameters-to-a-callback-function
function getAPIResponse(url, accessToken) {
  return $.ajax({
    url: url,
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  });
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
  var key = {};
  for (i = 0; i < vars.length; i++) {
    var tmp = vars[i].split('=');
    key[tmp[0]] = tmp[1];
  }

  if (typeof key['access_token'] !== 'undefined') {
    // var folders = {};
    var accessToken = key['access_token'];
    $('#login').css('display', 'none');
    $('.progress').css('display', 'block');

    // TODO create folder
    // var generalFolder = new Folder('General', {});
    var folder = new Folder('General', {});

    // Get User ID
    getAPIResponse('https://api.spotify.com/v1/me', accessToken).then(function(response) {
      var userId = response.id;

      // TODO this will check only 20 lists -> needs to check minimum 50
      // Get playlists
      getAPIResponse('https://api.spotify.com/v1/me/playlists', accessToken).then(function(response) {
        var playlists = {};
        response.items.forEach(function(playlist) {
          playlists[playlist.id] = playlist.name;
        });

        // TODO callback...
        for ( var key in playlists) {
          var url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + key + '/tracks';

          // Get tracks
          getAPIResponse(url, accessToken).then(function(response) {
            response.items.forEach(function(item) {
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
                var artist = folder.artists[artistId];
                if (typeof artist.albums[albumId] === 'undefined') {
                  // No album
                  var album = new Album(albumId, albumName);
                  artist.albums[albumId] = album;
                }
              }
            });
          });

          // TODO add folder to folders
        }
      });
    });

    // Display response
    setTimeout(function() {
      // console.log('test');
      // console.log(folders);
      var html = '<ul class="card">'
      // for ( var folder in folders) {
      html += '<li><i class="expand-collapse material-icons">expand_less</i><span>' + folder.name + '</span><ul>';
      for ( var key in folder.artists) {
        var artist = folder.artists[key]
        html += '<li><i class="expand-collapse material-icons">expand_less</i><span><a href="spotify:artist:'
                + artist.id + '">' + artist.name + '</a></span><ul>';
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
      $('#result').html(html);
    }, 1000);
  } else {
    $('.progress').css('display', 'none');
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