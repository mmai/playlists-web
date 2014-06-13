/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var _ = require("lodash");

window.React = React;

var SongsStore = Fluxxor.createStore({
  actions: {
    "SEARCH_LOVED_TRACKS": "searchLovedTracks"
  },

  initialize: function() {
    this.songs = [];
  },

  getSong: function(songId) {
      var songIndex = _.findIndex(this.songs, function (song){
              return song.id === songId;
          });
      return this.songs[songIndex];
  },

  searchLovedTracks: function(payload) {
      var that = this;
      var playlists = require("playlists");
      var lastfm = require('playlists-lastfm');
      var youtube = require('playlists-youtube');
      var soundcloud = require('playlists-soundcloud');
      window.youtube_callbacks ={};
      window.soundcloud_callbacks ={};
      window.lastfm_callbacks ={};

      var mylastfm = playlists.makeMusicService(lastfm, {key: '1e049e903004205189901533570d81b1', callbacks_store_name: 'lastfm_callbacks', user: payload.user});
      var musicServices = [
          playlists.makeMusicService(youtube, {key: 'AIzaSyB1OG8q7t-tuVYfL6qVw9GZ-cvjO56X2j0', callbacks_store_name: 'youtube_callbacks'}),
          playlists.makeMusicService(soundcloud, {key: 'TiNg2DRYhBnp01DA3zNag', callbacks_store_name: 'soundcloud_callbacks'})
      ];

      mylastfm.getLovedTracks().then(function(lastfm_loved_tracks){
              //Show found playlist
              var lovedPlaylist = new playlists.Playlist(lastfm_loved_tracks);
              that.songs = lovedPlaylist.songs;
              that.emit("change");

              //Search songs on services
              for (var i = 0, len = musicServices.length;i<len;i++){
                  searchOnService(musicServices[i], lovedPlaylist);
              }
          })
//      .end();
      .catch(function (error){
              console.log(error.message);
          });

      function searchOnService(service, playlist){
          service.searchPlaylist(playlist, function(track, foundSong){
                  var song = that.getSong(track.id)
                  song[service.name] = foundSong;
                  that.emit("change");
              }).then(function(playlist){
                      //                        console.log(playlist.toText());
                  }).done();
          }
      },

  getState: function() {
    return {
      songs: this.songs
    };
  }
});

var actions = {
  searchLovedTracks: function(user) {
    this.dispatch("SEARCH_LOVED_TRACKS", {user: user});
  },

};

var stores = {
  SongsStore: new SongsStore()
};

var flux = new Fluxxor.Flux(stores, actions);

window.flux = flux;

var FluxMixin = Fluxxor.FluxMixin(React),
    FluxChildMixin = Fluxxor.FluxChildMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

var Application = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("SongsStore")],

  getStateFromFlux: function() {
    var flux = this.getFlux();
    // Normally we'd use one key per store, but we only have one store, so
    // we'll use the state of the store as our entire state here.
    return flux.store("SongsStore").getState();
  },

  render: function() {
    return (
      <div className="container">
        <form onSubmit={this.onSubmitForm}>
          <input ref="input" type="text" size="30" placeholder="LastFM user name" />
          <input type="submit" value="Search loved tracks" />
        </form>
        <table className="table">
          {this.state.songs.map(function(song, i) {
            return <SongsItem song={song} key={i} />;
          })}
        </table>
      </div>
    );
  },

  onSubmitForm: function(e) {
    e.preventDefault();
    var node = this.refs.input.getDOMNode();
    this.getFlux().actions.searchLovedTracks(node.value);
    node.value = "";
  },

});

var SongsItem = React.createClass({
  mixins: [FluxChildMixin],

  propTypes: {
    song: React.PropTypes.object.isRequired
  },

  render: function() {
      return (
          <tr key={this.props.key}>
            <td>{this.props.song.name}</td>
            <td><RecordInstance servicename='soundcloud' record={this.props.song.soundcloud}/></td>
            <td><RecordInstance servicename='youtube' record={this.props.song.youtube}/></td>
          </tr>
      );
  },

});

var RecordInstance = React.createClass({
  render: function(){
      var playlink = <span></span>;
      if ((this.props.record !== undefined) && (this.props.record !== false)){
          var imgSrc = "assets/" + this.props.servicename + ".png";
          playlink = <a target='_blank' href={this.props.record.url}><img src={imgSrc} /></a>;
      }
      return playlink;
  }
});

React.renderComponent(<Application flux={flux} />, document.getElementById("app"));
