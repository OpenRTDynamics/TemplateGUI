#!/usr/bin/env node

// http://localhost:8091/index.html

//
// TODO: include udev
//
// https://github.com/cheery/node-udev
//

var TargetServerVersionStr = "ORTD Target Server 7.8.18";
var OnOdroid = false;

var ipc = require('node-ipc');
var cldprocess = require('child_process');
var byline = require('byline');
var exec = require('child_process').exec;

http = require('http');
url = require("url"),
    path = require("path"),
    fs = require("fs")

var fs = require('fs');

var ORTD_PF_decoder;


// UDP

var dgram = require('dgram');

// var PORT_toORTD   = parseInt(process.argv[3],10);//20001;
// var PORT_fromORTD = parseInt(process.argv[2],10);//20000;

// var PORT_toRecv   = parseInt(process.argv[4],10);//21000;

var PORT_toORTD = 20001;
var PORT_fromORTD = 20000;

var PORT_toRecv = 21000;


var RecvAddress = 0;
var RecvPort = 0;

var ORTDAddress = 'localhost';

var clientORTD = dgram.createSocket('udp4');
clientORTD.bind(PORT_fromORTD);

var clientRecv = dgram.createSocket('udp4');
clientRecv.bind(PORT_toRecv);




//
// Webinterface
//

// http-server config
var HTTPPORT = 8091;



// ORTD variables
var Process_ortdrun;
var ortd_running = 0;
var ortd_program = '';

var AngSens_running = 0; // NONGENERIC



// Vars to store the current screen name and its configuration
var CurrentScreen = '';
var CurrentConfig = '';
var AppNameToLoad = undefined;
var NewDatamodusActive = 1;
var PrintORTDStdout = false;


function ParseJSONCommand(JSONData, ORTD_PF_decoder) {

    //          try {

    jsoncmd = JSON.parse(JSONData);

    //console.log(jsoncmd);

    if (jsoncmd.cmd == 'TOSCILAB') {
        // console.log('Sending command to Scilab: ' + jsoncmd.scicmd);

        // process.stdout.write('TO S> ' + jsoncmd.scicmd);

        try {
            ScilabProc.stdin.write(jsoncmd.scicmd + '\n');
        } catch (e) {
            console.log('Error sending command to scilab.');
        }

    } else if (jsoncmd.cmd == 'TOSOCKETIO') {

        //console.log('Sending command to Socket.io: event=' + jsoncmd.eventname + ' data= ' );
        //console.log(jsoncmd.data);

        io.sockets.emit(jsoncmd.eventname, jsoncmd.data);
    } else if (jsoncmd.cmd == 'SetORTDParameter') {

        // console.log(ORTD_PF_decoder);
        // console.log("Setting parameter");
        // console.log(jsoncmd);
        // TODO! If multiple this a nested array
        V = [jsoncmd.Values];

        ORTD_PF_decoder.SetParameter(jsoncmd.ParameterName, V);
    }


    //   } catch (e) {
    //       console.log('Error in parsing JSONCMD');
    //  }
}


function BuildStatusStruct() {
    return {
        "ortd_running": ortd_running,
        // "AngSens_running": AngSens_running,
        "ortd_program": ortd_program
    };
}


var RemoteShellCommands = {
    // "ShutdownOS": {
    //     CommandLine: "halt"
    // },
    // "RebootOS": {
    //     CommandLine: "reboot"
    // },
    "df": {
        CommandLine: "df -h"
    },
    "ps": {
        CommandLine: "ps axu"
    },
    "ShowDev": {
        CommandLine: "ls /dev"
    },
    "OdroidC2_EnableI2C": {
        CommandLine: "modprobe aml_i2c"
    },
    "OdroidC2_ShowI2CBus": {
        CommandLine: "i2cdetect -y 1; i2cdetect -y 2"
    }
};




// http-server

// got from stackoverflow: 
// http://stackoverflow.com/questions/6084360/node-js-as-a-simple-web-server
var httpserver = http.createServer(function(request, response) {

    //  console.log(request);

    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), 'html', uri);

    var ParsedUri = path.parse(uri);
    if (ParsedUri.dir == '/json') {
        // Matlab: webread('http://10.211.55.9:8091/json/block.states.userdata.EC_MainControl.States');
        var ScilabVarName = ParsedUri.base;

        // console.log('Requesting Scilab variable: ' + ScilabVarName);
        ScilabProc.stdin.write(ScilabVarName + '\n');
    }

    // console.log(path.parse(uri));

    fs.stat(filename, function(err, stat) {
        if (err != null) {
            //if(!exists) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.write("404 Not Found\n");
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }

            //   console.log(filename);
            if (filename.split('.').pop() == 'js') {
                //  console.log('sending javascipt');
                response.writeHead(200, {
                    "Content-Type": "text/javascript"
                });
                //         response.writeHead(200);
            } else {
                response.writeHead(200);
            }
            response.write(file, "binary");
            response.end();
        });
    });
}).listen(HTTPPORT);

// set-up socket.io
var io = require('socket.io').listen(httpserver);
io.set('log level', 1); // reduce logging
var SocketIOClient = {
    'socket': 0
};


// try { io.sockets.emit('SCISTOUT', {  "Data" : line } ); } catch(err) { }



//
//
//


/* UDP PaPi Packets forwarding */


ORTD_PF_decoder = new ORTD_PF_decoderClass(1295793, function(Cfg, Parameters, Sources) {
    // console.log('## NEW CFG ##: ');
    // console.log(Cfg);

    //io.sockets.emit('NewConfig', { Cfg: Cfg, Parameters: Parameters, Sources: Sources } ); 

    try {
        Screen = Cfg['PaPIConfig']['SmartDevice']['ScreenName'];
        console.log('Got screen info: ' + Screen);
        if (CurrentScreen != Screen) {
            console.log('Screen has been changed!');

            if (CurrentScreen == '') {
                console.log('First screen activated')
                io.sockets.emit('FirstScreenActive', {});
                // FirstScreenActive


                // Load Applicatoin
                if (AppNameToLoad != undefined) {
                    /////////


                    try {
                        console.log('Loading Application ' + AppNameToLoad);
                        ScilabProc.stdin.write('exec(\'html/Applications/' + AppNameToLoad + '.sce\');\n');
                    } catch (e) {
                        console.log('Error sending command to scilab.');
                    }

                }
            }

            CurrentScreen = Screen;
            //CurrentConfig = Cfg['PaPIConfig'];
            CurrentConfig = Cfg;

            io.sockets.emit('ScreenChanged', Screen);
            io.sockets.emit('ConfigChanged', CurrentConfig);




        }

    } catch (err) {

    }

}, function() {
    // Source group complete callback (Data ready)

    //console.log('## Updated data ##');

    //console.log(ORTD_PF_decoder.CurrentSources);


    if (NewDatamodusActive == 1) {

        sid = 0;
        Nsources = ORTD_PF_decoder.CurrentSources.length;

        for (sid = 0; sid < Nsources; ++sid) {

            NV = parseInt(ORTD_PF_decoder.CurrentSources[sid].NValues);
            RcvBuffer = ORTD_PF_decoder.CurrentSources[sid].RcvBuffer;

            var Values = new Array(NV); // FIXME: max of SourceProperties.NValues_send


            for (i = 0; i < NV; ++i)
                Values[i] = RcvBuffer.readDoubleLE(i * 8);



            // new format
            // Try compression: https://socket.io/blog/socket-io-1-4-0/
            try {
                // io.sockets.compress(true).emit('SD', {
                //     "SourceID": sid,
                //     "Data": Values
                // });

                io.sockets.emit('SD', {
                    "SourceID": sid,
                    "Data": Values
                });
            } catch (err) {}
        }

    }





}, function(Buffer, MessageLength) {
    // Send callback

    // // send this packet to ORTD

    //     console.log('Sending ' + MessageLength + ' Values ');
    //     console.log(Buffer);

    clientORTD.send(Buffer, 0, MessageLength, PORT_toORTD, ORTDAddress);


    // server.send(Buffer, 0, MessageLength, ORTD_PORT, ORTD_HOST, function(err, bytes) {
    //    if (err) throw err;
    //    console.log('UDP message sent to ' + ORTD_HOST +':'+ ORTD_PORT);
    // });         

});




//
// Socket io events
//

io.on('connection', function(socket) {

    SocketIOClient.socket = socket;

    // TODO: socket.emit !?!?!?!?

    // io.sockets.emit('StatusUpdate', BuildStatusStruct() );   
    // io.sockets.emit('ScreenChanged', CurrentScreen);
    // io.sockets.emit('ConfigChanged',  CurrentConfig);

    // TODO emit these events later, when all socket.on-commands are finished
    socket.emit('Welcome', {
        Version: TargetServerVersionStr
    });
    socket.emit('StatusUpdate', BuildStatusStruct());
    socket.emit('ScreenChanged', CurrentScreen);
    socket.emit('ConfigChanged', CurrentConfig);



    // forwards commands comming from Web/PaPi to Scilab
    socket.on('ConsoleCommand', function(msg) {
        //  console.log(msg);
        //  process.stdout.write('TO S> ' + msg);

        try {
            ScilabProc.stdin.write(msg.Data + '\n');
        } catch (e) {
            console.log('Error sending command to scilab.');
        }
    });

    socket.on('SetTargetServerConfig', function(msg) {
        PrintORTDStdout = msg.PrintORTDStdout;
        console.log('New Target Server Config: ');
        console.log(msg);
    });




    socket.on('LoadApplication', function(msg) {
        //  console.log(msg);
        //  process.stdout.write('TO S> ' + msg);

        try {
            console.log('Loading Application ' + msg.AppName);
            ScilabProc.stdin.write('exec(\'html/Applications/' + msg.AppName + '.sce\');\n');
        } catch (e) {
            console.log('Error sending command to scilab.');
        }
    });




    function escapeToSci(str) {
        return str
            .replace(/[\\]/g, '\\\\')
            .replace(/[\"]/g, '\\\"')
            .replace(/[\']/g, '\'\'')
            .replace(/[\/]/g, '\\/')
            .replace(/[\b]/g, '\\b')
            .replace(/[\f]/g, '\\f')
            .replace(/[\n]/g, '\\n')
            .replace(/[\r]/g, '\\r')
            .replace(/[\t]/g, '\\t');
    };


    var SessionData;

    socket.on('SetSessionData', function(msg) {
        //  console.log(msg);
        //  process.stdout.write('TO S> ' + msg);

        try {
            ScilabProc.stdin.write('SessionData = struct();\n');
            ScilabProc.stdin.write('SessionData.key = \'' + escapeToSci(msg['key']) + '\';\n');
            ScilabProc.stdin.write('SessionData.date = \'' + escapeToSci(msg['date']) + '\';\n');
            ScilabProc.stdin.write('SessionData.time = \'' + escapeToSci(msg['time']) + '\';\n');

            ScilabProc.stdin.write('SessionData.UTCdatestr = \'' + escapeToSci(msg['UTCdatestr']) + '\';\n');

        } catch (e) {
            console.log('Error sending command to scilab.');
        }
    });

    socket.on('SetSciVar', function(msg) {
        //  console.log(msg);
        //  process.stdout.write('TO S> ' + msg);

        try {

            if (msg['Type'] == 'string') {
                ScilabProc.stdin.write(msg['VarName'] + ' = \'' + escapeToSci(msg['Value']) + '\';\n');
            } else if (msg['Type'] == 'value') {
                ScilabProc.stdin.write(msg['VarName'] + ' = \'' + escapeToSci(msg['Value']) + '\';\n');
            }

        } catch (e) {
            console.log('Error setting scilab variable.');
        }
    });


    socket.on('SetDatamodus', function(msg) {
        NewDatamodusActive = msg['NewDatamodus'];




    });




    socket.on('UpdateSessionData', function(msg) {
        //  console.log(msg);
        //  process.stdout.write('TO S> ' + msg);

        SessionData = msg;

        try {
            // ScilabProc.stdin.write('TargetServer.SessionData = struct();\n');
            // ScilabProc.stdin.write('TargetServer.SessionData.key = \'' + msg['key'] + '\';\n');
            // ScilabProc.stdin.write('TargetServer.SessionData.date = \'' + msg['date'] + '\';\n');
            // ScilabProc.stdin.write('TargetServer.SessionData.time = \'' + msg['time'] + '\';\n');

            // ScilabProc.stdin.write('TargetServer.SessionData.UTCdatestr = \'' + msg['UTCdatestr'] + '\';\n');

            Object.keys(msg).forEach(function(key) {
                ScilabProc.stdin.write('SessionData.' + key + ' = \'' + escapeToSci(msg[key]) + '\';\n');
            });


        } catch (e) {
            console.log('Error sending command to scilab.');
        }




    });




    // EnableOldStyleUDPCommunicationToClient = false;

    // if (EnableOldStyleUDPCommunicationToClient) {

    //     socket.on('ORTDPACKET', function(message) {
    //         //  console.log('Got ORTD packet form PaPI via socket.io');
    //         //  console.log(message);
    //         bdata = new Buffer(message, 'base64');
    //         clientORTD.send(bdata, 0, bdata.length, PORT_toORTD, ORTDAddress);
    //     });

    // } else {

    //     socket.on('ORTDPACKET', function(message) {
    //         console.log('**** Your client is trying to use old style communicaltion via direct ORTD control-packets via socket.io ****');
    //     });

    // }

    socket.on('SetParameter', function(message) {
        // Set only one parameter
        // console.log(ORTD_PF_decoder);
        //console.log("Setting parameter");
        //console.log(message);
        // TODO! If multiple this a nested array
        V = [message.Values];

        ORTD_PF_decoder.SetParameter(message.ParameterName, V);
    });

    socket.on('SetParameter2', function(message) {
        // console.log(ORTD_PF_decoder);
        console.log("Setting parameter v2");

        console.log(message);
        // TODO! If multiple this a nested array
        if (typeof(message.Values) == 'number') {
            V = [message.Values];
            console.log('SetParameter2: Preformed cast');
        } else {
            V = message.Values;
        }

        ORTD_PF_decoder.SetParameter(message.ParameterName, V);
    });

    socket.on('ToggleParameter', function(message) {
        console.log('ToggleParameter');
        console.log(message);

        ORTD_PF_decoder.ToggleParameter(message.ParameterName);
    });


    function RunCommand(message) {
        cmd = message["cmd"];
        CommandLine = RemoteShellCommands[cmd]['CommandLine'];

        child = exec(CommandLine, function(error, stdout, stderr) {
            //   console.log('stdout: ' + stdout);
            //   console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            socket.emit('RunCommandResponse', {
                cmd: cmd,
                stdout: stdout,
                stderr: stderr,
                error: error
            });

        });
    }



    // RunCommand
    socket.on('RunCommand', function(message) {
        //   console.log('RunCommand');
        //   console.log(message);
        RunCommand(message);
    });

    socket.on('SetSystemTime', function(message) {
        CommandLine = 'date -s \'@' + message.SecSince + '\'';
        console.log('SetSystemTime: ' + CommandLine);

        child = exec(CommandLine, function(error, stdout, stderr) {

            if (error !== null) {
                console.log('exec error: ' + error);
            }

        });

    });

    socket.on('StartORTD', function(data) {
        console.log('Rqst. to: Starting ORTD interpreter');


        if (ortd_running == 0) {
            console.log('Starting ORTD interpreter');

            // set datamodus to new style. Old applications must activate their mode in their own
            NewDatamodusActive = 1;

            try {
                Program = data.Program

                console.log('Starting ORTD with the program ' + Program);

                Process_ortdrun = cldprocess.spawn('ortdrun', ['-s', Program], {
                    cwd: '.'
                });

                ortd_program = Program;

            } catch (e) {
                Process_ortdrun = cldprocess.spawn('ortdrun', [], {
                    cwd: '.'
                });
                ortd_program = '';
            }


            ortd_running = 1;
            io.sockets.emit('StatusUpdate', BuildStatusStruct());

            try {
                AppNameToLoad = data.AppName;
            } catch (e) {
                AppNameToLoad = undefined;
            }

            Process_ortdrun.stdout.on('data', function(data) {
                if (PrintORTDStdout) {
                    console.log('stdout: ' + data);
                }
            });



            var ORTD_ERR_Stream = byline.createStream(Process_ortdrun.stderr);
            ORTD_ERR_Stream.setEncoding('utf8');
            ORTD_ERR_Stream.on('data', function(data) {
                //data = '' + data;
                //    console.log('stderr: ' + data);


                // Look for "ORTD_IO:"
                cmp1 = "ORTD_IO:";
                CmpData = data.substring(0, cmp1.length)


                if ((CmpData === cmp1)) {
                    IOData = data.substring(cmp1.length);

                    // Parse that line of data
                    cmp2 = "JSONCMD:";
                    if ((IOData.substring(0, cmp2.length) === cmp2)) {
                        JSONData = IOData.substring(cmp2.length);

                        // console.log(JSONData);

                        ParseJSONCommand(JSONData, ORTD_PF_decoder);


                    }




                    //  io.sockets.emit('ORTD_IO', {  "Line" : IOData } );    
                } else {
                    // Data not comming from embedded Scilab but from the ORTD-interpreter
                    //data = ' ' + data;
                    //console.log('stderr: ' + data);
                    D = '' + data;
                    io.sockets.emit('ORTD_STDERR', {
                        "Line": D
                    });
                }


                // try { io.sockets.emit('ORTD_IO', {  "Data" : data } ); } catch(err) { }
            });



            // Process_ortdrun.stderr.on('data', function(data) {
            //     data = ' ' + data;
            //     console.log('stderr: ' + data);
            //     // try { io.sockets.emit('ORTD_IO', {  "Data" : data } ); } catch(err) { }
            // });

            Process_ortdrun.on('exit', function(code) {
                console.log('OpenRTDynamics interpreter exited (exit) ' + code);
                ortd_running = 0;
                io.sockets.emit('StatusUpdate', BuildStatusStruct());
            });
            Process_ortdrun.on('close', function(code) {
                console.log('OpenRTDynamics interpreter exited (close) ' + code);
                ortd_running = 0;
                io.sockets.emit('StatusUpdate', BuildStatusStruct());
            });


        }
    });

    socket.on('StopORTD', function(data) {
        if (ortd_running == 1) {
            console.log('Stopping ORTD interpreter');
            //      Process_ortdrun.kill('SIGINT');
            Process_ortdrun.kill('SIGHUP');


            CurrentScreen = '';
            CurrentConfig = '';

            io.sockets.emit('ScreenChanged', CurrentScreen);
            io.sockets.emit('ConfigChanged', CurrentConfig);

            io.sockets.emit('StoppedORTD', {});


        }
    });



    //////////////////// NONGENERIC ///////////////////////////////////



    // socket.on('StartAngSens', function(data) {
    //     console.log('Rqst. to: Starting AngSens');

    //     var AngSensConfig = data["AngSensConfig"];

    //     if (AngSens_running == 0) {
    //         console.log('Starting AngSens...');

    //         try {


    //             Process_AngSens = cldprocess.spawn(AngSensConfig["cmd"], [], {
    //                 cwd: AngSensConfig["cwd"]
    //             });
    //             AngSens_running = 1;
    //             io.sockets.emit('StatusUpdate', BuildStatusStruct());

    //             Process_AngSens.stdout.on('data', function(data) {
    //                 //console.log('stdout: ' + data);
    //                 //io.sockets.emit('AngSens_IO', {  "Data" : data } ); 
    //                 D = '' + data;
    //                 io.sockets.emit('AngSens_IO', {
    //                     "Data": D
    //                 });
    //             });

    //             Process_AngSens.stderr.on('data', function(data) {
    //                 data = ' ' + data;
    //                 //  console.log('stderr: ' + data);
    //                 D = '' + data;
    //                 io.sockets.emit('AngSens_IO', {
    //                     "Data": D
    //                 });
    //             });

    //             Process_AngSens.on('exit', function(code) {
    //                 console.log('AngSens exited (exit) ' + code);
    //                 AngSens_running = 0;
    //                 io.sockets.emit('StatusUpdate', BuildStatusStruct());
    //             });
    //             Process_AngSens.on('close', function(code) {
    //                 console.log('AngSens exited (close) ' + code);
    //                 AngSens_running = 0;
    //                 io.sockets.emit('StatusUpdate', BuildStatusStruct());
    //             });

    //         } catch (e) {
    //             console.log('Error starting AngSens');
    //             io.sockets.emit('AngSens_IO', {
    //                 "Data": "Error starting AngSens"
    //             });
    //         }


    //     }
    // });

    // socket.on('StopAngSens', function(data) {
    //     if (AngSens_running == 1) {
    //         console.log('Stopping AngSens');
    //         //      Process_ortdrun.kill('SIGINT');
    //         Process_AngSens.kill('SIGHUP');
    //     }
    // });

    //////////////////// NONGENERIC END ///////////////////////////////////




});




//var Process_ortdrun = cldprocess.spawn('ortdrun', [ '-s', 'template', '-l', '0'], { cwd : '..' } );




/***************************************\
 * 
 * You should start both hello and world
 * then you will see them communicating.
 * 
 * *************************************/

ipc.config.id = 'world';
ipc.config.retry = 1500;
ipc.config.silent = true;

var ScilabProc;

//var ToScilabLogfile = fs.createWriteStream("ToScilabLogfile.log");




ipc.serve(
    function() {
        ipc.server.on(
            'app.disconnected',
            function(data, socket) {
                //  console.log('**************************');

            });



        ipc.server.on(
            'app.message',
            function(data, socket) {

                ipc.log('got a message from'.debug, (data.id).variable, (data.message));

                if (data.message == 'ScilabCommand') {
                    ScilabProc.stdin.write(data.command);
                    // process.stdout.write('TO S> ' + data.command);

                    // write to logfile
                    // ToScilabLogfile.write(data.command);




                }

                if (data.message == 'StopScilab') {
                    console.log('About to stop scilab');
                    //ScilabProc.disconnect();
                    ScilabProc.kill();
                }

                if (data.message == 'StartScilab') {
                    console.log('Starting Scilab');

                    try {
                        ScilabProc.kill();
                        console.log('A previously active Scilab Process has been killed');
                    } catch (err) {

                    }

                    //try {
                    // ScilabProc = cldprocess.spawn('/Applications/scilab-5.5.1.app/Contents/MacOS/bin/scilab', [ '-nwni' ], { cwd : '.' } );
                    //} catch(e) {

                    //                      ScilabProc = cldprocess.spawn('scilab551', [ '-nwni' ], { cwd : '.' } );
                    ScilabProc = cldprocess.spawn('scilab551', ['-nw'], {
                        cwd: '.'
                    });
                    //}


                    //   console.log(ScilabProc.pid);




                    var ScilabStdout_Stream = byline.createStream(ScilabProc.stdout);
                    ScilabStdout_Stream.setEncoding('utf8');
                    ScilabStdout_Stream.on('data', function(data) {
                        //data = '' + data;
                        //console.log('scilab stdout: ' + data);


                        // Look for "ORTD_IO:"
                        cmp1 = "ORTD_IO:";
                        CmpData = data.substring(0, cmp1.length);


                        if ((CmpData === cmp1)) {
                            IOData = data.substring(cmp1.length);

                            // Parse that line of data
                            cmp2 = "JSONCMD:";
                            if ((IOData.substring(0, cmp2.length) === cmp2)) {
                                JSONData = IOData.substring(cmp2.length);

                                // console.log(JSONData);

                                ParseJSONCommand(JSONData, ORTD_PF_decoder);
                            }

                        } else {
                            // Data not comming from embedded Scilab but from the ORTD-interpreter

                            // //try { 
                            // // Forward data to PaPI vis socket.io
                            // io.sockets.emit('SCISTOUT', {
                            //     ConsoleId: 1,
                            //     Data: '' + data
                            // });
                            // //} catch(err) { }


                            // ipc.server.emit(
                            //     socket,
                            //     'app.message', {
                            //         id: ipc.config.id,
                            //         message: '' + data
                            //     }
                            // );

                        }

                    });




                    ScilabProc.stdout.on('data', function(data) {
                        //                      console.log('stdout: ' + data);
                        //process.stdout.write('FROM S> ' + data);



                        // TODO! 
                        // // Parse that line of data
                        // cmp2 = "JSONCMD:";
                        // if ((IOData.substring(0, cmp2.length) === cmp2)) {
                        //     JSONData = IOData.substring(cmp2.length);

                        //     // console.log(JSONData);

                        //  ParseJSONCommand(JSONData);

                        // }


                        //try { 
                        // Forward data to PaPI vis socket.io
                        io.sockets.emit('SCISTOUT', {
                            ConsoleId: 1,
                            Data: '' + data
                        });
                        //} catch(err) { }


                        ipc.server.emit(
                            socket,
                            'app.message', {
                                id: ipc.config.id,
                                message: '' + data
                            }
                        );

                    });




                    ScilabProc.stderr.on('data', function(data) {
                        // console.log('stderr: ' + data);

                        io.sockets.emit('SCISTOUT', {
                            ConsoleId: 1,
                            Data: '' + data
                        });

                    });


                    ScilabProc.on('close', function(code) {
                        console.log('child process exited with code ' + code);
                        ipc.server.emit(
                            socket,
                            'app.message', {
                                id: ipc.config.id,
                                message: 'ScilabExited'
                            }
                        );

                    });


                }


                // ipc.server.emit(
                //     socket,
                //     'app.message',
                //     {
                //         id      : ipc.config.id,
                //         message : data.message+' world!'
                //     }
                // );
            }
        );
    }
);

//ipc.server.define.listen['app.message'] = 'This event type listens for message strings as value of data key.';

ipc.server.start();

//console.log(ipc.server.define.listen);




// UDP events


var EMGFrqDivCounter = 1;

clientORTD.on('message', function(message) {
    // console.log('Got something from ORTD');


    returnCode = ORTD_PF_decoder.ProcessPacket(message);


    // Uncomment to save data in transmission

    // if (returnCode >= 0) {
    //     // ORTD Data packet
    //     // Do not send large data so often....
    //     if (message.length > 600) {
    //         EMGFrqDivCounter = EMGFrqDivCounter + 1;
    //         if (EMGFrqDivCounter % 4 == 1) {
    //             io.sockets.emit('ORTDPACKET', message.toString('base64'));
    //             // console.log('Saved transmission capacity');
    //         }
    //         return;
    //     }
    // }

    // forward raw data to PaPI via socket.io                      
    io.sockets.emit('ORTDPACKET', message.toString('base64'));


    return;


});



clientRecv.on('message', function(message, rinfo) {
    if (packetCount == 0) {
        RecvAddress = rinfo.address;
        RecvPort = rinfo.port;
        packetCount = 1;
        //   console.log('Relay to: ', RecvAddress + ':' + RecvPort);
    }
    clientORTD.send(message, 0, message.length, PORT_toORTD, ORTDAddress);

});




function ScilabInterface(ScilabExec, EventCallback) {
    //this.SenderId = SenderId;
    this.ScilabExec = ScilabExec;
    this.EventCallback = EventCallback;

    // this.ScilabProc;


    this.Start = Start;

    function Start(message, DataCallback) {
        this.DataCallback = DataCallback;

        console.log('Starting Scilab');

        try {
            this.ScilabProc.kill();
            console.log('A previously active Scilab Process has been killed');
        } catch (err) {

        }

        //try {
        // ScilabProc = cldprocess.spawn('/Applications/scilab-5.5.1.app/Contents/MacOS/bin/scilab', [ '-nwni' ], { cwd : '.' } );
        //} catch(e) {

        //                      ScilabProc = cldprocess.spawn('scilab551', [ '-nwni' ], { cwd : '.' } );
        //this.ScilabProc = cldprocess.spawn('scilab551', ['-nw'], {
        //    cwd: '.'
        //});

        this.ScilabProc = cldprocess.spawn(this.ScilabExec, ['-nw'], {
            cwd: '.'
        });


        //    console.log(this.ScilabProc.pid);




        this.ScilabProc.stdout.on('data', function(data) {
            //                      console.log('stdout: ' + data);
            process.stdout.write('FROM S> ' + data);

            //try { 
            // Run callback
            this.DataCallback(data);


        });




        this.ScilabProc.stderr.on('data', function(data) {
            //  console.log('stderr: ' + data);
        });


        this.ScilabProc.on('close', function(code) {

            // run event callback
            this.EventCallback('close');


            // console.log('child process exited with code ' + code);
            // ipc.server.emit(
            //     socket,
            //     'app.message', {
            //         id: ipc.config.id,
            //         message: 'ScilabExited'
            //     }
            // );

        });
    }

    this.Stop = Stop;

    function Stop(message) {

    }

    this.SendCommand = SendCommand;

    function SendCommand(message, ResponseCallback) {


    }

    this.PutRawData = PutRawData;

    function PutRawData(message) {
        this.ScilabProc.stdin.write(message);
        process.stdout.write('TO S> ' + message);

    }
}



// // Udev & Hardware management
// //Process_udevadm = cldprocess.spawn('udevadm', [], {  cwd: '.' });
// Process_udevadm = cldprocess.spawn('udevadm', ['monitor'], {
//     cwd: '.'
// });
// //Process_udevadm = cldprocess.spawn('ls', ['-l'], {  cwd: '.' });

// console.log('started udevadm');


// Process_udevadm.stdout.on('data', function(data) {
//     console.log('stdout: ' + data);
// });




// var udevadm_Stream = byline.createStream(Process_udevadm.stdout);
// udevadm_Stream.setEncoding('utf8');

// udevadm_Stream.on('data', function(data) {    

//     console.log('UDEV: ' + data); 

//     // Look for "ORTD_IO:"
//     cmp1 = "ORTD_IO:";
//     CmpData = data.substring(0, cmp1.length)


//     if ((CmpData === cmp1)) {
//         IOData = data.substring(cmp1.length);
//     }

// });



function ORTD_PF_decoderClass(SenderId, NewConfigCallback, SourceGroupCompleteCallback, SendCallback) {
    //this.SenderId = SenderId;
    this.NewConfigCallback = NewConfigCallback;
    this.SourceGroupCompleteCallback = SourceGroupCompleteCallback;
    this.SendCallback = SendCallback;
    this.CurrentSenderId = SenderId;
    this.CurrentSenderId = 1295793;

    this.ProtocollConfigRawPackages = new Array();
    this.ProtocollConfigRawPackages_N;
    this.CurrentConfig;
    this.CurrentSources = new Array();
    this.CurrentParameters = new Array();


    // Buffer for sending UDP packets
    var UDPSendPacketBuffer = new Buffer(2000); // size is propably bigger than every UDP-Packet


    this.GetParameterID = GetParameterID;

    function GetParameterID(ParameterName) {
        var P = this.CurrentParameters;

        //console.log('Avaiulable Parameters: ' + P);

        for (key in P) {

            //console.log('GetParameterID: chekcing: ' + P[key].ParameterName);

            if (P[key].ParameterName == ParameterName) {
                return key;
            }
        }
        return -1;
    }


    this.ToggleParameter = ToggleParameter;

    function ToggleParameter(ParameterName) {
        console.log('Toggling par ' + ParameterName);

        ParameterID = this.GetParameterID(ParameterName);

        if (ParameterID == -1)
            return;

        //        NValues = this.CurrentParameters[ParameterID].NValues;

        Value = this.CurrentParameters[ParameterID].Values;
        if (Value[0] == 0) {
            Value[0] = 1;
        } else {
            Value[0] = 0;
        }

        this.SetParameter(ParameterName, Value);
    }


    this.SetParameter = SetParameter;

    function SetParameter(ParameterName, Value) {
        console.log('Setting par ' + ParameterName + ' to ' + Value);

        ParameterID = this.GetParameterID(ParameterName);

        if (ParameterID == -1)
            return;

        NValues = this.CurrentParameters[ParameterID].NValues;

        this.CurrentParameters[ParameterID].Values = Value;

        //console.log('ParameterID ' + ParameterID + ' NValues ' + NValues);



        var i;

        // the required message length
        var MessageLength = 12 + NValues * 8;
        var counter = 111;

        // write the header of the UDP-packet
        UDPSendPacketBuffer.writeInt32LE(12, 0);
        UDPSendPacketBuffer.writeInt32LE(counter, 4);
        UDPSendPacketBuffer.writeInt32LE(ParameterID, 8);

        // add the parameters given in data[i]
        for (i = 0; i < NValues; ++i) {
            //console.log( parseFloat( Value[i] )  );
            UDPSendPacketBuffer.writeDoubleLE(parseFloat(Value[i]), 12 + i * 8);
        }

        this.SendCallback(UDPSendPacketBuffer, MessageLength);

        // // send this packet to ORTD
        // server.send(UDPSendPacketBuffer, 0, MessageLength, ORTD_PORT, ORTD_HOST, function(err, bytes) {
        //    if (err) throw err;
        //    console.log('UDP message sent to ' + ORTD_HOST +':'+ ORTD_PORT);
        // });         

    }


    this.RequestNewConfigFromORTD = RequestNewConfigFromORTD;

    function RequestNewConfigFromORTD() {

        // def request_new_config_from_ORTD(self):
        //     Counter = 1
        //     data = struct.pack('<iiid', 12, Counter, int(-3), float(0))
        //     print ("Requesting config via socket.io")
        //     self.SocketIO.emit('ORTDPACKET', base64.b64encode(data).decode('ascii') )

        // the required message length
        var MessageLength = 12 + 1 * 8;
        var counter = 111;

        // write the header of the UDP-packet
        UDPSendPacketBuffer.writeInt32LE(12, 0);
        UDPSendPacketBuffer.writeInt32LE(counter, 4);
        UDPSendPacketBuffer.writeInt32LE(-3, 8);

        // add the parameters given in data[i]
        UDPSendPacketBuffer.writeDoubleLE(parseFloat(0), 12 + 1 * 8);

        this.SendCallback(UDPSendPacketBuffer, MessageLength);
    }

    this.ProcessPacket = ProcessPacket;

    function ProcessPacket(message) {

        var SenderID;
        var SourceID;
        var PacketCounter;


        SenderID = message.readInt32LE(0); // TODO: Should be also included in the JSON-config

        if (SenderID != this.CurrentSenderId) {
            console.log('Wrong sender id ' + SenderID + ' != ' + this.CurrentSenderId)
            return -1;
        }

        PacketCounter = message.readInt32LE(4);
        SourceID = message.readInt32LE(8);

        if (SourceID == -4) {
            this.ProtocollConfigRawPackages_N = message.readInt32LE(8 + 4); // NUmber of Packages


            console.log('Got a part of a config ' + PacketCounter + ' of ' + this.ProtocollConfigRawPackages_N);


            this.ProtocollConfigRawPackages[PacketCounter] = message.slice(16); // cut from 16 to the end messsage.length
            // console.log( ProtocollConfigRawPackages[PacketCounter].toString('utf8') );


            // Check if all packages arrived
            var NotAllArrived = false;
            for (i = 1; i <= this.ProtocollConfigRawPackages_N; ++i) {
                // check if ProtocollConfigRawPackages[i] exists

                if (this.ProtocollConfigRawPackages[i] === undefined) {
                    NotAllArrived = true; // one packet failed to arrive (by now)
                    console.log('+***** Packet # ' + i + ' is still missing ****');
                }
                //        console.log('Got part: ' + PartStr);
            }

            if (NotAllArrived == false) {
                // config complete
                var ProtocollconfigString = '';

                // concatenate all buffers receved
                for (i = 1; i <= this.ProtocollConfigRawPackages_N; ++i) {
                    ProtocollconfigString = ProtocollconfigString + this.ProtocollConfigRawPackages[i].toString('utf8');
                }

                ProtocollConfigRawPackages = new Array(); // Reset array

                //      console.log('Complete config: ' + ProtocollconfigString);      

                try {
                    this.CurrentConfig = JSON.parse(ProtocollconfigString);
                } catch (err) {
                    console.log('Failed to parse JSON config');
                    return -2;
                }

                //      console.log('#############################');
                //      console.log(this.CurrentConfig);

                // Collect sources & parameters
                this.CurrentParameters = new Array();
                P = this.CurrentConfig['ParametersConfig'];
                for (key in P) {
                    console.log('new parameter:')
                    //console.log(key)

                    tmp = {
                        ParameterName: P[key]['ParameterName'],
                        NValues: P[key]['NValues'],
                        datatype: P[key]['datatype'],
                        initial_value: P[key]['initial_value'],
                        Values: [0.0]
                    };

                    console.log(tmp);

                    this.CurrentParameters[parseInt(key)] = tmp;
                    //        console.log( this.CurrentParameters[ parseInt(key) ] );
                }

                this.CurrentSources = new Array();
                P = this.CurrentConfig['SourcesConfig'];
                for (key in P) {
                    //        console.log('new source:')
                    //console.log(key)

                    this.CurrentSources[parseInt(key)] = {
                        SourceName: P[key]['SourceName'],
                        NValues: P[key]['NValues_send'],
                        datatype: P[key]['datatype'],
                        Demux: P[key]['Demux'],
                        Subscribers: new Array(),
                        RcvBuffer: new Buffer(8 * P[key]['NValues_send'])
                    };
                    //        console.log( this.CurrentSources[ parseInt(key) ] );
                }

                // Put reformatet lists of Parameters and Sources into the Config
                //this.CurrentConfig['Sources'] = this.CurrentSources;
                //this.CurrentConfig['Parameters'] = this.CurrentParameters;

                // this.CurrentSenderId = SenderID; // 1295793;
                // Config is ready
                this.NewConfigCallback(this.CurrentConfig, this.CurrentParameters, this.CurrentSources);


            }

        } else if (SourceID >= 0) {
            // signal data

            if (this.CurrentSources[SourceID] === undefined) {
                console.log('Source id not in config ' + SourceID);
                return -3;
            }

            //console.log('got streaming data for source id ' + SourceID + ' (' + this.CurrentSources[SourceID].SourceName + ')');

            // copy data
            message.copy(this.CurrentSources[SourceID].RcvBuffer, 0, 12, 12 + 8 * this.CurrentSources[SourceID].NValues);
            // CurrentSources[SourceID].Subscribers

            return SourceID;

        } else if (SourceID == -1) {
            // Source group complete

            //console.log('Source Group complete');
            this.SourceGroupCompleteCallback();
            return -4;
        } else if (SourceID == -2) {
            // Source group complete

            console.log('Requesting new config from ORTD');
            this.RequestNewConfigFromORTD();
            return -5;
        }




        return -10;

    }

}