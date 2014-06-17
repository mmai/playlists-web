/** @jsx React.DOM */

var React = require("react");
var LaddaButton = require("react-ladda");
var _ = require("lodash");

window.React = React;

var Application = React.createClass({
  getInitialState: function() {
    return {
        songs: [],
        fetchingLastfmLovedTracks: false
    };
  },
  getSong: function(songId) {
      var songIndex = _.findIndex(this.state.songs, function (song){
              return song.id === songId;
          });
      return this.state.songs[songIndex];
  },
   searchLovedTracks: function(user) {
      var that = this;
      var playlists = require("playlists");
      var lastfm = require('playlists-lastfm');
      var youtube = require('playlists-youtube');
      var soundcloud = require('playlists-soundcloud');
      window.youtube_callbacks ={};
      window.soundcloud_callbacks ={};
      window.lastfm_callbacks ={};
      that.setState({
              user: null,
              message: null,
              songs:[],
              fetchingLastfmLovedTracks: true
          });

      var mylastfm = playlists.makeMusicService(lastfm, {key: '1e049e903004205189901533570d81b1', callbacks_store_name: 'lastfm_callbacks', user: user});
      var musicServices = [
          playlists.makeMusicService(youtube, {key: 'AIzaSyB1OG8q7t-tuVYfL6qVw9GZ-cvjO56X2j0', callbacks_store_name: 'youtube_callbacks'}),
          playlists.makeMusicService(soundcloud, {key: 'TiNg2DRYhBnp01DA3zNag', callbacks_store_name: 'soundcloud_callbacks'})
      ];

      mylastfm.getLovedTracks().then(function(lastfm_loved_tracks){
              //Show found playlist
              var lovedPlaylist = new playlists.Playlist(lastfm_loved_tracks);
              that.setState({
                      user: user,
                      songs: lovedPlaylist.songs,
                      fetchingLastfmLovedTracks: false
                  });

              //Search songs on services
              for (var i = 0, len = musicServices.length;i<len;i++){
                  searchOnService(musicServices[i], lovedPlaylist);
              }
          })
//      .end();
      .catch(function (error){
              console.log(error.message);
              that.setState({fetchingLastfmLovedTracks: false});
              that.setState({user: false});
              that.setState({message: error.message});
          });

      function searchOnService(service, playlist){
          service.searchPlaylist(playlist, function(track, foundSong){
                  var song = that.getSong(track.id)
                  song[service.name] = foundSong;
                  that.forceUpdate();
              }).then(function(playlist){
                      //                        console.log(playlist.toText());
                  }).done();
      }
  },

  render: function() {
      return (
        <div>
            <form onSubmit={this.onSubmitForm} className="form-horizontal">
            <div className="input-group">
            <input ref="input" type="text" className="form-control" placeholder="LastFM user name" />
                <span className="input-group-btn">
                <LaddaButton active={this.state.fetchingLastfmLovedTracks} color="blue" style="expand-right">
                    <button type="submit" className="btn btn-default" id="btnSaveNewInterest">Search loved tracks</button>
                </LaddaButton>
                </span>
            </div>
            </form>

            <SearchResultsTitle user={this.state.user} message={this.state.message}/>

            <table className="table table-condensed table-hover">
            <tbody>
              {this.state.songs.map(function(song, i) {
                return <SongsItem song={song} key={i} />;
              })}
            </tbody>
            </table>
        </div>
    );
  },

  onSubmitForm: function(e) {
    e.preventDefault();
    var node = this.refs.input.getDOMNode();
    this.searchLovedTracks(node.value);
    node.value = "";
  },

});

var SearchResultsTitle = React.createClass({
        render: function(){
            var message = '';
            if (this.props.message){
                message = this.props.message;
            } 
            else if (this.props.user != null) {
                message = this.props.user + "'s loved tracks";
            }
            return <h3>{message}</h3>
        }
    });

var SongsItem = React.createClass({
  propTypes: {
    song: React.PropTypes.object.isRequired
  },

  render: function() {
      return (
          <tr key={this.props.key}>
          <td>{this.props.song.name} ({this.props.song.artist})</td>
            <td><RecordInstance servicename='youtube' record={this.props.song.youtube}/></td>
            <td><RecordInstance servicename='soundcloud' record={this.props.song.soundcloud}/></td>
          </tr>
      );
  },

});

var RecordInstance = React.createClass({
  render: function(){
      if (this.props.record === undefined){
          //Searching
//          return (<img src='assets/spinner.png' />);
//          return (<span className="glyphicon glyphicon-refresh"></span>);
          return (<span className="glyphicon spin glyphicon-refresh"></span>);
      }
      if (this.props.record === false){
          //Not found
          //return (<span className="glyphicon glyphicon-remove"></span>);
          return (<span></span>);
      }
      return <a target='_blank' href={this.props.record.url}><img src={'assets/'+this.props.servicename+'.png'} /></a>;
  }
});

React.renderComponent(<Application fetchingLastfmLovedTracks={false} />, document.getElementById("app"));
