![Super logo of Spotify Playlist Viewer](https://raw.githubusercontent.com/palprz/spotify-playlist-viewer/master/img/logo_spv.png)
# Spotify Playlist Viewer [January - February 2018]

Simple web application for displaying playlists in different way than Spotify.
If you found any issue, please let me know by adding it here with step to reproduce and description: https://github.com/palprz/spotify-playlist-viewer/issues

## Link to demo of application
Can take 30 seconds to run application on Heroku (sorry, free version got some disadvantage!):

https://spotify-playlist-viewer.herokuapp.com/

## Technologies
- HTML 5
- CSS 3
- JavaScript (ES6)

## Features
- Display artists, albums and tracks you have in all your playlists
- All artists, albums and tracks contain link to your Spotify application. Unfortunately javascript can only open element, but cannot run it directly in the Spotify application.
- Creating folders by using splitters in the name of playlists on Spotify (by default is '::'). Example: 'party::Ariana Grande'
- Display all artists, albums and tracks without order and with A-Z or Z-A order
- Display badges with number of tracks under element (folder/artist/album)
- Configuration - more details you can find in below section

## Configuration
- **Name of General folder:** use to name folder which will contain all details which are in the playlists which hasn't got splitter in the name
- **Name of splitter:** use to create folders
- **Show badges with number of tracks under elements (folder, artist, album):**
- **Maximum extend list:**  if you don't want to extend all tracks, you can choose 'album' to see all folders, artists and albums
- **Sorting:** if you would like to see in the same order like you have in playlists, you can switch off sorting
- **Way of displaying items:** you can specify which elements (folder, artist, album, track) you would like to show and hide


| Configuration option            | Available values           |Default value|
| ------------------------------- |:-------------|:-----|
| Name of general folder          | any text (excape empty text)           | General  |
| Folder splitter                 | any text (except empty text)          |::  |
| Way of showing playlists        | folder > artist > album > track<br/>folder > artist > track <br/>folder > album > track<br/>folder > track           | folder > artist > album > track  |
| Max extend list with elements   | folder<br/>artist<br/>album<br/>track           | track  |
| Sorting                         | a-z<br/>z-a<br/>no sorting           | a-z  |
| Display badges                  | always<br/>mouse over<br/>never           | mouse over  |

## Screens from running application
General view:
![General view screenshot](https://raw.githubusercontent.com/palprz/spotify-playlist-viewer/master/img/general_doc.png)

Configuration:
![Configuration screenshot](https://raw.githubusercontent.com/palprz/spotify-playlist-viewer/master/img/configuration_doc.png)

Typical usage:
![Typical usage screenshot](https://raw.githubusercontent.com/palprz/spotify-playlist-viewer/master/img/typical_usage_doc.png)
