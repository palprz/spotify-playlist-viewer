function Folder(name, artists) {
  this.name = name;
  this.artists = artists;
  this.trackCount = 0;
}

function Artist(id, name, albums) {
  this.id = id;
  this.name = name;
  this.albums = albums;
  this.trackCount = 0;
}

function Album(id, name, tracks) {
  this.id = id;
  this.name = name;
  this.tracks = tracks;
  this.trackCount = tracks.size;
}

function Track(id, name) {
  this.id = id;
  this.name = name;
}

api = {
  login: function() {
    var client_id = 'c676b1cde38a4bf9a725cafebeab4c69';
    var redirect_uri = 'https://rawgit.com/palprz/spotify-playlist-viewer/master/index.html';

    var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id + '&redirect_uri=' + redirect_uri +
      '&scope=playlist-read-private&response_type=token';

    window.location = url;
  },
  getAPIResponse: function(url, accessToken) {
    return $.getJSON({
      url: url,
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }).fail(function(jqXHR, textStatus, errorThrown) {
      var status = jqXHR.status;
      if (status === 401) {
        ui.display401Error();
      } else {
        ui.displayGeneralError();
      }
    });
  },
  getPlaylists: async function(accessToken, offset) {
    var playlistsResponse = await api.getAPIResponse('https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset, accessToken);
    return playlistsResponse;
  },
  getUserId: async function(accessToken) {
    var userResponse = await api.getAPIResponse('https://api.spotify.com/v1/me', accessToken);
    return userResponse.id;
  }
}

ui = {
  displayLoginElements: function() {
    $('.progress').css('display', 'none');
    $('.utils').css('display', 'none');
  },
  displayProgressElements: function() {
    $('#login').css('display', 'none');
    $('.progress').css('display', 'block');
  },
  displayResultElements: function() {
    $('.progress').css('display', 'none');
    $('.utils').css('display', 'block');
  },
  display401Error: function() {
    // TODO create something more fancy than that
    $('#result').html('<b style="font-size: 72px">Ooops!</b><p>There was a problem with authorize your session (calm down - probably it just expired).</p><p>Please click magic button with text "LOGIN" and you will fix this problem.</p>');
    $('.progress').css('display', 'none');
    $('#login').css('display', 'block');
    $('.utils').css('display', 'none');
  },
  displayGeneralError: function() {
    // TODO create something more fancy than that
    $('#result').html('<p> <b style="font-size: 72px">:(</b></p><p>Something terrible wrong happend!</p><p>If you are not angry enough after this error to close this page, please send me details from console browser in new issue which you can create on the <a href="https://github.com/palprz/spotify-playlist-viewer/issues">Github</a>. I will be happy to help you with it!</p>');
    $('.progress').css('display', 'none');
    $('#login').css('display', 'none');
    $('.utils').css('display', 'none');
  },
  initBasicAnimation: function() {
    $(document).on('click', '#login', function() {
      console.log('Start login...');
      ui.displayProgressElements();
      api.login();
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

    $(document).on('click', '.cookies', function() {
      $('.cookies-info').animate({
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

    if (config.isTrackBadges()) {
      $(document).on('mouseenter', '#result span', function() {
        var $badge = $(this).parent().children('.badge');
        if ($badge.length !== 0) {
          $badge.css('display', 'block');
        }
      });

      $(document).on('mouseleave', '#result span', function() {
        var $badge = $(this).parent().children('.badge');
        if ($badge.length !== 0) {
          $badge.css('display', 'none');
        }
      });
    }

    $(document).on('click', '#close-cookies-info', function() {
      ui.hideCookiesInfo();
    });

    $(document).on('click', '#save-config', function() {
      config.save();
      ui.hideConfiguration();
      ui.refreshConfig();
    });

    $(document).on('click', '#default-config', function() {
      config.default();
      ui.hideConfiguration();
      ui.refreshConfig();
    });

    $(document).on('click', '#cancel-config', function() {
      ui.hideConfiguration();
      ui.refreshConfig();
    });

    $(window).scroll(function() {
      if ($(this).scrollTop() >= 50) {
        $('#go-to-top-btn').fadeIn(500);
      } else {
        $('#go-to-top-btn').fadeOut(200);
      }
    });

    $(document).on('click', '#go-to-top-btn', function() {
      $('body,html').animate({
        scrollTop: 0
      }, 200);
    });

    $('select').material_select();
  },
  hideConfiguration: function() {
    $('.configuration').animate({
      height: 'hide'
    });
  },
  hideCookiesInfo: function() {
    $('.cookies-info').animate({
      height: 'hide'
    });
  },
  refreshConfig: function() {
    $('#general-folder-name').val(Cookies.get('general-folder-name'));
    $('#folder-splitter').val(Cookies.get('folder-splitter'));
    // TODO $('#display-data-way').val(Cookies.set('display-data-way'));
    $('#track-badges').prop('checked', (Cookies.get('track-badges') == 'true'));
  },
  displayResult: function(folders) {
    var html = '<ul class="card">';
    folders.forEach(function(folder) {
      html += '<li><i class="expand-collapse material-icons">expand_less</i><span>' + folder.name + '</span><span class="new badge" data-badge-caption="track(s)">' + folder.trackCount + '</span><ul>';
      folder.artists.forEach(function(artist) {
        html += '<li><i class="expand-collapse material-icons">expand_less</i><span><a href="spotify:artist:' + artist.id + '">' + artist.name + '</a></span><span class="new badge" data-badge-caption="track(s)">' + artist.trackCount + '</span><ul>';
        artist.albums.forEach(function(album) {
          html += '<li><i class="expand-collapse material-icons">expand_less</i><span><a href="spotify:album:' + album.id + '">' + album.name + '</a></span><span class="new badge" data-badge-caption="track(s)">' + album.trackCount + '</span><ul>';
          album.tracks.forEach(function(track) {
            html += '<li><span><a href="spotify:track:' + track.id + '">' + track.name + '</a></span></li>';
          });
          html += '</ul></li>';
        });
        html += '</ul></li>';
      });
      html += '</li></ul>';
    });

    ui.displayResultElements();
    $('#result').html(html);
  }
}

utils = {
  sortFolders: function(folders) {
    folders.forEach(function(folder) {
      folder.artists = utils.sortMapByValue([...folder.artists]);
      folder.artists.forEach(function(artist) {
        artist.albums = utils.sortMapByValue([...artist.albums]);
        artist.albums.forEach(function(album) {
          album.tracks = utils.sortMapByValue([...album.tracks]);
        })
      });
    });
  },
  sortMapByValue: function(array) {
    var sortedArray = array.sort(function(a, b) {
      if (a[1].name > b[1].name) {
        return 1;
      }
      if (a[1].name < b[1].name) {
        return -1;
      }
      return 0;
    });

    return new Map(sortedArray.map(obj => [obj[0], obj[1]]));
  },
  getAccessTokenFromURL: function() {
    var parameters = window.location.hash.substring(1).split('&');
    var accessToken;
    if (parameters.length > 0) {
      accessToken = parameters[0].split('=')[1];
    }

    return accessToken;
  }
}

config = {
  save: function() {
    var generalFolderName = $('#general-folder-name').val();
    var folderSplitter = $('#folder-splitter').val();
    var displayDataWay = $('#display-data-way').val();
    var trackBadges = $('#track-badges').is(":checked");
    if (generalFolderName === '') {
      Cookies.set('general-folder-name', 'General');
    } else {
      Cookies.set('general-folder-name', generalFolderName);
    }

    if (folderSplitter === '') {
      Cookies.set('folder-splitter', '::');
    } else {
      Cookies.set('folder-splitter', folderSplitter);
    }
    Cookies.set('display-data-way', displayDataWay);
    Cookies.set('track-badges', trackBadges);
    Cookies.set('default-configuration', false);
  },
  default: function() {
    Cookies.set('general-folder-name', 'General');
    Cookies.set('display-data-way', 'TODO');
    Cookies.set('track-badges', true);
    Cookies.set('default-configuration', true);
  },
  getGeneralFolderName: function() {
    return Cookies.get('general-folder-name');
  },
  getFolderSplitter: function() {
    return Cookies.get('folder-splitter');
  },
  getDisplayDataWay: function() {
    return Cookies.get('display-data-way');
  },
  isTrackBadges: function() {
    return Cookies.get('track-badges') == 'true';
  },
  isDefaultConfiguration: function() {
    return Cookies.get('default-configuration') == 'true';
  },
  isAnyConfiguration: function() {
    return Cookies.get('default-configuration') !== undefined;
  }
}

check = {
  //50 is a max number of playlists which response can have.
  containsMaxPlaylists: function(response) {
    return response.items.length === 50;
  },
  hasPlaylistSeparator: function(playlist) {
    return playlist.name.includes(config.getFolderSplitter());
  },
  folderExists: function(folders, folderNameToFind) {
    return typeof folders.get(folderNameToFind) !== 'undefined';
  },
  artistExists: function(folder, artistId) {
    return typeof folder.artists.get(artistId) !== 'undefined';
  },
  albumExists: function(artist, albumId) {
    return typeof artist.albums.get(albumId) !== 'undefined';
  }
}

async function getAllPlaylists(accessToken) {
  var isSomethingLeft = true;
  var offset = 0;
  var playlistItems = [];
  while (isSomethingLeft) {
    var response = await api.getPlaylists(accessToken, offset);
    playlistItems.push(response);
    if (check.containsMaxPlaylists(response)) {
      offset += 50;
    } else {
      isSomethingLeft = false;
    }
  }

  var playlists = [];
  for (var i = 0; i < playlistItems.length; i++) {
    playlists.push(...playlistItems[i].items);
  }

  return playlists;
}

function getCorrectFolder(folders, playlists, i) {
  var folder;
  if (check.hasPlaylistSeparator(playlists[i])) {
    var folderNameToFind = playlists[i].name.split(config.getFolderSplitter())[0];
    if (check.folderExists(folders, folderNameToFind)) {
      // Use existing folder
      folder = folders.get(folderNameToFind);
    } else {
      // Create new folder
      folder = new Folder(folderNameToFind, new Map());
      folders.set(folder.name, folder);
    }
  } else {
    // Use general
    folder = folders.get(config.getGeneralFolderName());
  }

  return folder;
}

function populateTracksFromResponse(folders, playlists, response) {
  for (var i = 0; i < response.length; i++) {

    var folder = getCorrectFolder(folders, playlists, i);
    folder.trackCount += response[i].items.length;

    response[i].items.forEach(function(item) {
      var artistId = item.track.artists[0].id;
      var artistName = item.track.artists[0].name;

      var albumId = item.track.album.id;
      var albumName = item.track.album.name;

      var trackId = item.track.id;
      var trackName = item.track.name;

      if (check.artistExists(folder, artistId)) {
        // Found artist
        var foundArtist = folder.artists.get(artistId);
        if (check.albumExists(foundArtist, albumId)) {
          // Found album
          var track = new Track(trackId, trackName);
          var foundAlbum = foundArtist.albums.get(albumId);
          foundAlbum.tracks.set(trackId, track); // TODO create updateTracks function in Album function
          foundAlbum.trackCount = foundAlbum.tracks.size;
        } else {
          // No album
          var track = new Track(trackId, trackName);
          var map = new Map();
          map.set(trackId, track);
          var newAlbum = new Album(albumId, albumName, map);
          foundArtist.albums.set(albumId, newAlbum);
        }
        foundArtist.trackCount += 1;
      } else {
        // No artist means no album
        var track = new Track(trackId, trackName);
        var map = new Map();
        map.set(trackId, track);
        var album = new Album(albumId, albumName, map);

        var map = new Map();
        map.set(albumId, album);
        var artist = new Artist(artistId, artistName, map);
        artist.trackCount += 1;
        folder.artists.set(artistId, artist);
      }
    });
  }
}

(function() {
  if (!config.isAnyConfiguration()) {
    config.default();
  }

  ui.initBasicAnimation();
  ui.refreshConfig();

  var accessToken = utils.getAccessTokenFromURL();

  if (accessToken !== undefined) {
    ui.displayProgressElements();

    var folders = new Map();
    var generalFolder = new Folder(config.getGeneralFolderName(), new Map());
    folders.set(generalFolder.name, generalFolder);

    api.getUserId(accessToken).then(function(userId) {
      getAllPlaylists(accessToken).then(function(playlists) {
        var mapPlaylists = {};
        playlists.forEach(function(playlist) {
          mapPlaylists[playlist.id] = playlist.name;
        });

        var promises = [];
        for (var key in mapPlaylists) {
          var url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + key + '/tracks';
          promises.push(api.getAPIResponse(url, accessToken));
        }

        Promise.all(promises).then(function() {
          populateTracksFromResponse(folders, playlists, arguments[0]);
        }).then(function() {
          utils.sortFolders(folders);
          ui.displayResult(folders);
        });
      });
    });
  } else {
    ui.displayLoginElements();
  }
})();
