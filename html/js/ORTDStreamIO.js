// Put this into a separed file
//
// I/O Interface
//
var socket; //x = io.connect();


var CurrentSources;
var CurrentParameters;
var CurrentConfig;
var ConfigChangedCallback = undefined;
var NewDataCallback = undefined

function SetIOCallbacks(ConfigChangedCallbackFN, NewDataCallbackFN) {
    ConfigChangedCallback = ConfigChangedCallbackFN;
    NewDataCallback = NewDataCallbackFN;
}

function GetSourceIDByName(name) {
    for (i = 0; i < CurrentSources.length; ++i) {
        if (CurrentSources[i].SourceName == name) {
            return i;
        }
    }
    return -1;
}



$(document).ready(function() {
    // Register events when document is ready

    socket = io.connect();


    console.log('Document ready');

    socket.on('ScreenChanged', function(ScreenName) {
        console.log('Screen changed to ' + ScreenName);


        try {
            document.getElementById('ScreenStatusDisplay').innerHTML = "Currently active screen: " + ScreenName + "<br>";
        } catch (e) {}


    });


    socket.on('ConfigChanged', function(Config) {
        // http://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
        console.log('Config changed to ' + Config);

        CurrentConfig = Config;

        function syntaxHighlight(json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
                var cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }

        try {
            document.getElementById('ScreenConfigDisplay').innerHTML = '<br><pre>' + syntaxHighlight(JSON.stringify(Config, undefined, 4)) + "</pre><br>";

            console.log(syntaxHighlight(JSON.stringify(Config, undefined, 4)));
        } catch (e) {}



        // Nsources = CurrentConfig.SourcesConfig.length;
        // console.log('Nsources = ' + Nsources);

        // Collect sources & parameters
        CurrentParameters = new Array();
        P = CurrentConfig['ParametersConfig'];
        for (key in P) {
            console.log('new parameter:')
            //console.log(key)

            tmp = {
                ParameterName: P[key]['ParameterName'],
                NValues: P[key]['NValues'],
                datatype: P[key]['datatype'],
                initial_value: P[key]['initial_value']
            };

            console.log(tmp);

            CurrentParameters[parseInt(key)] = tmp;
            //        console.log( this.CurrentParameters[ parseInt(key) ] );
        }

        CurrentSources = new Array();
        P = CurrentConfig['SourcesConfig'];
        for (key in P) {
            //        console.log('new source:')
            //console.log(key)

            CurrentSources[parseInt(key)] = {
                SourceName: P[key]['SourceName'],
                NValues: P[key]['NValues_send'],
                datatype: P[key]['datatype'],
                Demux: P[key]['Demux'],
                Subscribers: new Array(),
                RcvBuffer: new Array(P[key]['NValues_send'])

            };
            //        console.log( this.CurrentSources[ parseInt(key) ] );
        }


        console.log("GetSourceIDByName Test : " + GetSourceIDByName("Stream"));

        if (ConfigChangedCallback != undefined) {
            try {
                SCN = CurrentConfig.PaPIConfig.SmartDevice.ScreenName;
            } catch (e) {
                SCN = "";
            }
            ConfigChangedCallback(0, CurrentConfig, SCN); // Note: 0 is reserved for a futre instance of a class of this part of code
        }

    });


    socket.on('SD', function(data) {
        sid = data.SourceID;
        Values = data.Data;


        if (NewDataCallback != undefined) {
            NewDataCallback(0, sid, Values); // Note: 0 is reserved for a futre instance of a class of this part of code
        }

        //console.log( Values );
    });
});


function IOSetParameter(name, value) {
    socket.emit('SetParameter2', {
        ParameterName: name,
        Values: value
    });
};

function IOToggleParameter(name) {
    socket.emit('ToggleParameter', {
        ParameterName: name
    });
};



//
// A very basic exmple
//

// SetIOCallbacks(
//   function(resved, Config, CurrentScreen) {
//       console.log( 'Config changed; screen is ' + CurrentScreen  );

//       if (CurrentScreen == "EC_TuneMaxStim.active") {
//         // Build a GUI
//       } else if (CurrentScreen == "...") {

//       }

//   },
//   function(reserved, SourceID, Values) {
//     //console.log('Got data update for id ' + SourceID);
//   }
// );



//
// END I/O Interface
//