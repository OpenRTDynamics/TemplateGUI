








function VectorPlotClass(container, Heigh, Width, Ny) {
    this.container = container;
    this.Ny = Ny;
    this.Width = Width;
    this.Heigh = Heigh;

    this.stage = new Kinetic.Stage({
        container: this.container,
        width: this.Width,
        height: this.Heigh
    });

    this.layer = new Kinetic.Layer();


    // complex dashed and dotted line

    var lp = [],
        i;
    for (i = 0; i < this.Ny; i++) {
        Y = this.Heigh / 2 + 0 * i * 2;
        X = (this.Width / (1.0 * this.Ny)) * i;
        lp[2 * i] = X;
        lp[2 * i + 1] = Y;
    }
    //       console.log(lp);
    this.blueLine = new Kinetic.Line({
        //        points: [73, 70, 340, 23, 450, 60, 500, 20],
        points: lp,
        stroke: 'green',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round'

    });


    this.layer.add(this.blueLine);
    this.stage.add(this.layer);

    this.PlotDraw = PlotDraw;

    function PlotDraw(Values, ofs, scale) {
        var i;
        for (i = 0; i < this.Ny; ++i) {
            Y_norm = -scale * (Values[i] + ofs);
            Y = Y_norm * (this.Heigh / 2) + this.Heigh / 2;
            this.blueLine.points()[i * 2 + 1] = Y;
        }
        this.layer.draw();
    }

}




function VectorPlotClass2(container, Heigh, Width, Ny, Depth) {
    //   console.log('New VectorPlotClass2' + ' Heigh=' + Heigh + ' Width=' + Width +
    //            ' Ny=' + Ny + ' Depth=' + Depth );


    this.container = container;
    this.Ny = Ny;
    this.Width = Width;
    this.Heigh = Heigh;
    this.Depth = Depth;

    this.stage = new Kinetic.Stage({
        container: this.container,
        width: this.Width,
        height: this.Heigh
    });

    this.layer = new Kinetic.Layer();


    // complex dashed and dotted line

    var i;
    console.log('Creating ' + this.Depth + ' lines with ' + this.Ny + ' datapoints');

    // create a number of lines
    this.lines = [];
    for (i = 0; i < this.Depth; ++i) {

        var lp = [],
            j;
        for (j = 0; j < this.Ny; j++) {
            Y = this.Heigh / 2 + 0 * j * 2;
            X = (this.Width / (1.0 * this.Ny)) * j;
            lp[2 * j] = X;
            lp[2 * j + 1] = Y;
        }


        this.lines[i] = new Kinetic.Line({
            points: lp,
            stroke: 'green',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round'

        });

        this.layer.add(this.lines[i]);
    }

    this.stage.add(this.layer);
    this.LineRoundCounter = 0;



    this.PlotDraw = PlotDraw;

    function PlotDraw(Values, ofs, scale) {

        if (this.LineRoundCounter == this.Depth) {
            this.LineRoundCounter = 0;
        }

        var i, tmp1;
        for (i = 0; i < this.Ny; ++i) {
            Y_norm = -scale * (Values[i] + ofs);
            Y = Y_norm * (this.Heigh / 2) + this.Heigh / 2;
            this.lines[this.LineRoundCounter].points()[i * 2 + 1] = Y;
        }

        var j = this.LineRoundCounter;
        for (i = 0; i < this.Depth; ++i) {
            if (j == -1) {
                j = this.Depth - 1;
            }
            tmp1 = (1.0 * i / (this.Depth - 1));

            // Colormap
            red = 0;
            green = 40 + (1 - tmp1) * 60;
            blue = 0;


            this.lines[j].stroke('rgb(' + red + ',' + green + ',' + blue + ')');

            j--;
        }

        this.layer.draw();
        this.LineRoundCounter++;
    }

}




function VectorPlotClass3(container, Heigh, Width, Ny, Depth) {
    console.log('New VectorPlotClass2' + ' Heigh=' + Heigh + ' Width=' + Width +
        ' Ny=' + Ny + ' Depth=' + Depth);


    this.container = container;
    this.Ny = Ny;
    this.Width = Width;
    this.Heigh = Heigh;
    this.Depth = Depth;

    this.stage = new Kinetic.Stage({
        container: this.container,
        width: this.Width,
        height: this.Heigh
    });

    this.layer = new Kinetic.Layer();


    // create initial datapoints for the red line
    var lp = [],
        j;
    for (j = 0; j < this.Ny; j++) {
        Y = this.Heigh / 2 + 0 + 0 * j * 2;
        X = (this.Width / (1.0 * this.Ny)) * j;
        lp[2 * j] = X;
        lp[2 * j + 1] = Y;
    }


    // Add a red line for the reference
    this.redLine = new Kinetic.Line({
        points: lp,
        stroke: 'red',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round'
    });
    this.layer.add(this.redLine);


    // complex dashed and dotted line
    var i;
    console.log('Creating ' + this.Depth + ' lines with ' + this.Ny + ' datapoints');



    // create a number of lines
    this.lines = [];
    for (i = 0; i < this.Depth; ++i) {

        // create initial datapoints for each line separately
        var lp = [],
            j;
        for (j = 0; j < this.Ny; j++) {
            Y = this.Heigh / 2 + 0 * j * 2;
            X = (this.Width / (1.0 * this.Ny)) * j;
            lp[2 * j] = X;
            lp[2 * j + 1] = Y;
        }

        this.lines[i] = new Kinetic.Line({
            points: lp,
            stroke: 'green',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round'

        });

        this.layer.add(this.lines[i]);
    }




    // Finalise
    this.stage.add(this.layer);
    this.LineRoundCounter = 0;



    this.PlotDraw = PlotDraw;

    function PlotDraw(Values, ofs, scale) {

        if (this.LineRoundCounter == this.Depth) {
            this.LineRoundCounter = 0;
        }

        var i, tmp1;
        for (i = 0; i < this.Ny; ++i) {
            Y_norm = -scale * (Values[i] + ofs);
            Y = Y_norm * (this.Heigh / 2) + this.Heigh / 2;
            this.lines[this.LineRoundCounter].points()[i * 2 + 1] = Y;
        }

        var j = this.LineRoundCounter;
        for (i = 0; i < this.Depth; ++i) {
            if (j == -1) {
                j = this.Depth - 1;
            }
            tmp1 = (1.0 * i / this.Depth) * 180;

            this.lines[j].stroke('rgb(' + tmp1 + ',' + tmp1 + ',' + tmp1 + ')');

            j--;
        }

        this.layer.draw();
        this.LineRoundCounter++;
    }

    this.PlotDrawRedLine = PlotDrawRedLine;

    function PlotDrawRedLine(Values, ofs, scale) {
        var i;
        for (i = 0; i < this.Ny; ++i) {
            Y_norm = -scale * (Values[i] + ofs);
            Y = Y_norm * (this.Heigh / 2) + this.Heigh / 2;
            this.redLine.points()[i * 2 + 1] = Y;
        }
        this.layer.draw();
    }

}


// 
// New functions in 2018 below
// 
// 





    function TimeSeriesMultiCHSVGFast(container, mode, par_) {

        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        // this.par = par_;

        //this.ParameterValue = initialVal;

        var BarValue;
        var vEMGVisualisation;

//        var polyline;
        var PlotLines = Array();


        var PixelScaleFacY;


        var zeroLine;
        var Dx;

        var par = par_;
        this.par = par;





        var NBlocks = par['NBlocks'];
        var BlockSize = par['BlockSize']; 
        var Nsamples = NBlocks * BlockSize;  // formerly par.N

        var VarPar = par['VarPar'];
        var Ymin = VarPar['yMin'];
        var Ymax = VarPar['yMax'];
                
        var MarkerList = undefined;


        if (VarPar.hasOwnProperty("Marker")) {
            console.log('Setting up some plot markers');
            console.log(VarPar['Marker']);

            MarkerList = VarPar['Marker'];
        }

        var CurrentWriteIndex = 0;
        var CurrentWriteIndexInBlock = 0;
        var CurrentBlockIndex = 0;




        if (mode == 'default') {

            this.container.innerHTML = `  
                                            <div>
                                                <div id="Drawing">                </div>
                                            </div>

                                 `;


            // Calc layout
            Xofs = 10;


            innerWidth = par['VarPar']['width'] - Xofs;
            innerHeight = par['VarPar']['height'];


            //


            DivElements = $(this.container).children();


            DrawingDiv = DivElements.find('#Drawing')[0];

            // console.log('DrawingDiv: '); console.log(DrawingDiv);


            var draw = SVG(DrawingDiv).size(innerWidth, innerHeight)


            YRage = Ymax - Ymin;
            PixelScaleFacY = innerHeight / YRage;
            zeroLine = Math.round(Ymax * PixelScaleFacY);
            Dx = innerWidth / Nsamples;



            // Draw plot elements
            var XAxis = draw.line(Xofs, zeroLine, innerWidth, zeroLine).stroke({
                color: '#999999',
                width: 1
            });

            var BlockDataBuffers = Array();

            
            // go through all plot lines
            par['VarPar']['Lines'].forEach(function(LineCfg) {

                // Allocate buffers for storing 
                var Buf = Array( BlockSize );
                for (k = 0; k < BlockSize; ++k) {
                    Buf[k] = 0.0;
                }
                BlockDataBuffers.push( Buf );


                // generate the polyline chain
                PolylineChain = Array(NBlocks);
                for (k=0; k<NBlocks; ++k) {



                    // generate initial data
                    var InitData = Array((BlockSize+1) * 2);
                    for (i = 0; i < BlockSize  +  1; ++i) {  // Please note + 1 is needed to closed the gaps that would appear between blocks
                        x = Xofs + (Dx * i  +  Dx*k*BlockSize ); // Math.round
                        y = zeroLine;

                        // console.log(x);

                        InitData[i * 2] = x;
                        InitData[i * 2 + 1] = y;
                    }

                    polyline = draw.polyline(InitData).fill('none').stroke({
                        color: LineCfg['LineColor'],
                        width: LineCfg['LineWidth']
                    });

                    PolylineChain[k] = polyline;

                }

                PlotLines.push( PolylineChain );

            });


            YAxis = draw.line(Xofs, innerHeight, Xofs, 0).stroke({
                color: '#999999',
                width: 3
            });



            if (VarPar.hasOwnProperty("Marker")) {


                MarkerList.forEach(function(Marker) {
                    console.log('Drawing marker ' + Marker['Name']);


                    var MarkerSVG = draw.line(Xofs + Dx * Marker['PosXI'], innerHeight, Xofs + Dx * Marker['PosXI'], 0).stroke({
                        color: Marker['Color'],
                        width: Marker['StrokeWidth']
                    });

                    Marker['MarkerSVG'] = MarkerSVG;
                    console.log(MarkerSVG);

                    debug = MarkerSVG;

                });


            }

            // console.log(polyline);
            // console.log(polyline.node)
            // console.log(polyline.node.points)
        }



        this.updateMarkerPosXI = updateMarkerPosXI;

        function updateMarkerPosXI(MarkerIndex, PosXI) {

            Marker = MarkerList[MarkerIndex];
            MarkerSVG = Marker['MarkerSVG'];

            // console.log('Updating marker position');
            // console.log(PosXI);

            MarkerSVG.node.attributes.x1.value = Xofs + Dx * PosXI;
            MarkerSVG.node.attributes.x2.value = Xofs + Dx * PosXI;

        }

        this.update = update;
        function update(Values) {
            // console.log('Update  ' + CurrentWriteIndex );


            if ( CurrentWriteIndex >= Nsamples ) {
                CurrentWriteIndex = 0;
            }

            if (CurrentBlockIndex >= NBlocks ) {
                CurrentBlockIndex = 0;
            }



            // updateMarkerPosXI(0, CurrentWriteIndex);


            // store data for the next upcoming block
            for (k = 0; k < PlotLines.length; ++k) {
                BlockDataBuffers[k][ CurrentWriteIndexInBlock ] = Values[k];

                // console.log(CurrentWriteIndexInBlock);
            }

            // console.log( BlockDataBuffers[0] );


            if (CurrentWriteIndexInBlock >= BlockSize) {
                CurrentWriteIndexInBlock = -1;

                for (k = 0; k < PlotLines.length; ++k) {
                    this.updateBlock(k, CurrentBlockIndex, BlockDataBuffers[k] );
                }

                updateMarkerPosXI(0, (CurrentBlockIndex+1) * BlockSize);

                CurrentBlockIndex++;
            }


            CurrentWriteIndex++;
            CurrentWriteIndexInBlock++;



        }

        this.updateBlock = updateBlock;
        function updateBlock(LineIndex, BlockIndex, val) {
            PolylineChain = PlotLines[LineIndex];
            Polyline = PolylineChain[BlockIndex];

            for (i = 0; i < BlockSize; ++i) {
                //            polyline.node.points[i].x =  Math.round( Dx * i ) ;

                Polyline.node.points[i].y = zeroLine - PixelScaleFacY * val[i];
            }

            // Update the last point of the previous Polyline in the chain (if exists)
            if (BlockIndex > 0) {

                 PolylinePrev = PolylineChain[BlockIndex-1];
                 PolylinePrev.node.points[BlockSize].y = zeroLine - PixelScaleFacY * val[0];

            }

        }

        // function update(val, LineIndex) {
        //     vec = val[0];

        //     //console.log('Update line index: ' + LineIndex);

        //     for (i = 0; i < Nsamples; ++i) {
        //         //            polyline.node.points[i].x =  Math.round( Dx * i ) ;
        //         polylines[LineIndex].node.points[i].y = zeroLine - PixelScaleFacY * val[i + CutleftI];
        //     }

        // }



    }
















    function TimeSeriesMultiCHSVG(container, mode, par_) {

        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        // this.par = par_;

        //this.ParameterValue = initialVal;

        var BarValue;
        var vEMGVisualisation;

//        var polyline;
        var polylines = Array();


        var PixelScaleFacY;


        var zeroLine;
        var Dx;

        var par = par_;
        this.par = par;

        console.log(par);






        // var NBlocks = par['NBlocks'];
        // var BlockSize = par['BlockSize']; 
        var Nsamples = par.N;  // formerly par.N

        var VarPar = par['VarPar'];
        var Ymin = VarPar['yMin'];
        var Ymax = VarPar['yMax'];

        var MarkerList = undefined;


        if (VarPar.hasOwnProperty("Marker")) {
            console.log('Setting up some plot markers');
            console.log(VarPar['Marker']);

            MarkerList = VarPar['Marker'];
        }

        var CurrentWriteIndex = 0;




        if (mode == 'default') {

            this.container.innerHTML = `  
                                            <div>
                                                <div id="Drawing">                </div>
                                            </div>

                                 `;


            // Calc layout
            Xofs = 10;
            par.N = par.N;

            innerWidth = par['VarPar']['width'] - Xofs;
            innerHeight = par['VarPar']['height'];


            //


            DivElements = $(this.container).children();


            DrawingDiv = DivElements.find('#Drawing')[0];

            // console.log('DrawingDiv: '); console.log(DrawingDiv);


            var draw = SVG(DrawingDiv).size(innerWidth, innerHeight)

            var Data = Array(par.N * 2);


            YRage = Ymax - Ymin;
            PixelScaleFacY = innerHeight / YRage;
            zeroLine = Math.round(Ymax * PixelScaleFacY);
            Dx = innerWidth / par.N;

            for (i = 0; i < par.N; ++i) {
                x = Xofs + Math.round(Dx * i);
                y = zeroLine;

                Data[i * 2] = x;
                Data[i * 2 + 1] = y;
            }

            // Draw plot elements
            XAxis = draw.line(Xofs, zeroLine, innerWidth, zeroLine).stroke({
                color: '#999999',
                width: 1
            });

            // go through all plot lines
            par['VarPar']['Lines'].forEach(function(LineCfg) {

                polyline = draw.polyline(Data).fill('none').stroke({
                    color: LineCfg['LineColor'],
                    width: LineCfg['LineWidth']
                });

                polylines.push( polyline );

            });


            YAxis = draw.line(Xofs, innerHeight, Xofs, 0).stroke({
                color: '#999999',
                width: 3
            });



            if (VarPar.hasOwnProperty("Marker")) {


                MarkerList.forEach(function(Marker) {
                    console.log('Drawing marker ' + Marker['Name']);


                    MarkerSVG = draw.line(Xofs + Dx * Marker['PosXI'], innerHeight, Xofs + Dx * Marker['PosXI'], 0).stroke({
                        color: Marker['Color'],
                        width: Marker['StrokeWidth']
                    });

                    Marker['MarkerSVG'] = MarkerSVG;
                    console.log(MarkerSVG);

                    debug = MarkerSVG;

                });


            }

            // console.log(polyline);
            // console.log(polyline.node)
            // console.log(polyline.node.points)
        }



        this.updateMarkerPosXI = updateMarkerPosXI;

        function updateMarkerPosXI(MarkerIndex, PosXI) {

            Marker = MarkerList[MarkerIndex];
            MarkerSVG = Marker['MarkerSVG'];

            // console.log('Updating marker position');
            // console.log(PosXI);

            MarkerSVG.node.attributes.x1.value = Xofs + Dx * PosXI;
            MarkerSVG.node.attributes.x2.value = Xofs + Dx * PosXI;

        }

        this.update = update;
        function update(Values) {
            // console.log('Update  ' + CurrentWriteIndex );


            if ( CurrentWriteIndex >= par.N ) {
                CurrentWriteIndex = 0;
            }

            updateMarkerPosXI(0, CurrentWriteIndex);

            Linecounter = 0;
            polylines.forEach( function(polyline) {
                polyline.node.points[ CurrentWriteIndex  ].y = zeroLine - PixelScaleFacY * Values[  Linecounter  ];

                Linecounter++;
            } );

            CurrentWriteIndex++;



            // for (i = 0; i < par.N; ++i) {
            //     //            polyline.node.points[i].x =  Math.round( Dx * i ) ;
            //     polylines[LineIndex].node.points[i].y = zeroLine - PixelScaleFacY * val[i + CutleftI];
            // }

        }
        // function update(val, LineIndex) {
        //     vec = val[0];

        //     //console.log('Update line index: ' + LineIndex);

        //     for (i = 0; i < par.N; ++i) {
        //         //            polyline.node.points[i].x =  Math.round( Dx * i ) ;
        //         polylines[LineIndex].node.points[i].y = zeroLine - PixelScaleFacY * val[i + CutleftI];
        //     }

        // }



    }











    function DataChainMultiCHSVG(container, mode, par_) {

        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        this.par = par_;

        //this.ParameterValue = initialVal;

        var BarValue;
        var vEMGVisualisation;

//        var polyline;
        var polylines = Array();


        var PixelScaleFacY;


        var zeroLine;
        var Dx;
        // var par = par_;

        console.log(this.par);



        var Ymin = this.par['VarPar']['yMin'];
        var Ymax = this.par['VarPar']['yMax'];


        var CutleftI = this.par['VarPar']['CutleftI'];; // "CutleftI":40, "CutRightI":20,
        var CutRightI = this.par['VarPar']['CutRightI'];; // "CutleftI":40, "CutRightI":20,

        var VarPar = this.par['VarPar'];
        var MarkerList = undefined;


        if (VarPar.hasOwnProperty("Marker")) {
            console.log('Setting up some plot markers');
            console.log(VarPar['Marker']);

            MarkerList = VarPar['Marker'];
        }




        if (mode == 'default') {

            this.container[0].innerHTML = `  
                                            <div>
                                                <div id="Drawing">                </div>
                                            </div>

                                 `;


            // Calc layout
            Xofs = 10;
            this.par.N = this.par.N - CutleftI - CutRightI;

            innerWidth = this.par['VarPar']['width'] - Xofs;
            innerHeight = this.par['VarPar']['height'];


            //


            DivElements = this.container.children();


            DrawingDiv = DivElements.find('#Drawing')[0];

            // console.log('DrawingDiv: '); console.log(DrawingDiv);


            var draw = SVG(DrawingDiv).size(innerWidth, innerHeight)

            var Data = Array(this.par.N * 2);


            YRage = Ymax - Ymin;
            PixelScaleFacY = innerHeight / YRage;
            zeroLine = Math.round(Ymax * PixelScaleFacY);
            Dx = innerWidth / this.par.N;

            for (i = 0; i < this.par.N; ++i) {
                x = Xofs + Math.round(Dx * i);
                y = zeroLine;

                Data[i * 2] = x;
                Data[i * 2 + 1] = y;
            }

            // Draw plot elements
            XAxis = draw.line(Xofs, zeroLine, innerWidth, zeroLine).stroke({
                color: '#999999',
                width: 1
            });

            // go through all plot lines
            this.par['VarPar']['Lines'].forEach(function(LineCfg) {

                polyline = draw.polyline(Data).fill('none').stroke({
                    color: LineCfg['LineColor'],
                    width: LineCfg['LineWidth']
                });

                polylines.push( polyline );

            });


            YAxis = draw.line(Xofs, innerHeight, Xofs, 0).stroke({
                color: '#999999',
                width: 3
            });



            if (VarPar.hasOwnProperty("Marker")) {


                MarkerList.forEach(function(Marker) {
                    console.log('Drawing marker ' + Marker['Name']);


                    MarkerSVG = draw.line(Xofs + Dx * Marker['PosXI'], innerHeight, Xofs + Dx * Marker['PosXI'], 0).stroke({
                        color: Marker['Color'],
                        width: Marker['StrokeWidth']
                    });

                    Marker['MarkerSVG'] = MarkerSVG;
                    console.log(MarkerSVG);

                    debug = MarkerSVG;

                });


            }

            // console.log(polyline);
            // console.log(polyline.node)
            // console.log(polyline.node.points)
        }



        this.updateMarkerPosXI = updateMarkerPosXI;

        function updateMarkerPosXI(MarkerIndex, PosXI) {

            Marker = MarkerList[MarkerIndex];
            MarkerSVG = Marker['MarkerSVG'];

            // console.log('Updating marker position');
            // console.log(PosXI);

            MarkerSVG.node.attributes.x1.value = Xofs + Dx * PosXI;
            MarkerSVG.node.attributes.x2.value = Xofs + Dx * PosXI;

        }

        this.update = update;

        function update(val, LineIndex) {
            vec = val[0];

            //console.log('Update line index: ' + LineIndex);

            for (i = 0; i < this.par.N; ++i) {
                //            polyline.node.points[i].x =  Math.round( Dx * i ) ;
                polylines[LineIndex].node.points[i].y = zeroLine - PixelScaleFacY * val[i + CutleftI];
            }

        }

    }











//


    function TimeSeriesSVGPlayback(container, mode, par_) {
        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        this.par = par;

        //this.ParameterValue = initialVal;
        var par = par_;
        var Waves;
        var SampleTime = par['VarPar']['SampleTime'];;
        var TimeShift = par['VarPar']['TimeShift'];;

        if (mode == 'default') {
            this.container[0].innerHTML = `  
                                                <div id="Plot"></div>
                                 `;

            // Test this
            PlotDiv = $(this.container).find('#Plot');

            par.N = par.Data.TimeSeries[0].length; // ASSUMED HERE: all Time series plots have the same length
            console.log('Autodetected Time series length: ' + par.N);

            // Display Waves
//            Waves = new DataChainSVG(PlotDiv, 'default', par);
            Waves = new DataChainMultiCHSVG(PlotDiv, 'default', par);



            // Draw the whole time-series for all plot lines
            var LineIndex = 0;
            par['VarPar']['Lines'].forEach(function(LineCfg) {
    
                Waves.update(par.Data.TimeSeries[ LineIndex ], LineIndex);

                LineIndex = LineIndex + 1;


            });

            
        }


        this.updateSample = updateSample;

        function updateSample(index) {
            // Waves.update( par.Data.vecArray[ index ] );
            // move the marker position

            Waves.updateMarkerPosXI(0, index);
        }


        this.update = update;

        function update(time) {
            LineIndex = 0;

            this.updateSample(Math.round((TimeShift + time) / SampleTime), LineIndex);
        }
    }


    function DataChainSVGPlayback(container, mode, par_) {
        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        this.par = par;

        //this.ParameterValue = initialVal;
        var par = par_;
        var Waves;
        var SampleTime = par['VarPar']['SampleTime'];;
        var TimeShift = par['VarPar']['TimeShift'];;

        if (mode == 'default') {
            this.container[0].innerHTML = `  
                                                <div id="Plot"></div>
                                 `;

            // Test this
            PlotDiv = $(this.container).find('#Plot');

            par.N = par.Data.vecArray[0].length;
            console.log('Autodetected vector length: ' + par.N);

            // Display Waves
            Waves = new DataChainMultiCHSVG(PlotDiv, 'default', par);
        }


        this.updateSample = updateSample;

        function updateSample(index) {
            LineIndex = 0;
            Waves.update(par.Data.vecArray[index], LineIndex);
        }


        this.update = update;

        function update(time) {
            //      console.log(( (TimeShift + time ) / SampleTime ) );

            LineIndex = 0;

            this.updateSample(Math.round((TimeShift + time) / SampleTime), LineIndex);
        }
    }










    function RangeSlider(container, mode, CallbackFn, par_) {
        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        this.par = par_;
        this.CallbackFn = CallbackFn;

        //this.ParameterValue = initialVal;
        var par = par_;

        par.width;


        if (mode == 'default') {
            this.container.innerHTML = `  
                                                <div>

                                                    <div id="SliderContainer" align="left" style="position: relative; width: 800px; height: 50px; background: #003300; ">

                                                      <div id="SliderValueDisplay" style="width: 100px; position: relative; top: 0px; left: 0px;">--</div>


                                                      <div id="DraggableLeft" style="position: relative; top: 0px; left: 0px; width : 50px;  height: 50px; background: rgba(0, 120, 0, 0.5);
                                                       border: 2px solid rgba(0, 255, 0, 0.5);  border-radius: 10px;"> </div>

                                                    </div>

                                                </div>
                                 `;

            // Test this
            
            var SliderValueDisplayDiv = $(this.container).find('#SliderValueDisplay')[0];

            var SliderContainer = $(this.container).find('#SliderContainer')[0];
           // SliderContainer.style.width = par.width + 'px';

            var DraggableLeft = $(this.container).find('#DraggableLeft')[0];


            // Draggables
            //var DraggableLeft = $(PlotDiv).children().find('#DraggableLeft')[0];

            console.log(DraggableLeft);

            var DraggableLeft_x = 0, DraggableLeft_y = 0;

            interact(DraggableLeft)
              .draggable({
                snap: {
                  targets: [

                 //   interact.createSnapGrid({ x: 1, y: 1 })
                            // snap only the y coord to 100
                              // i.e. move horizontally at y=100
                     { y: 200, range: Infinity }

                  ],
                  range: Infinity,
//                  relativePoints: [ { x: 0, y: 0 } ]
                  relativePoints: [ { y: 0, range: Infinity } ]
                },
                inertia: false,
                restrict: {
                  restriction: DraggableLeft.parentNode,
                  elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                  endOnly: true
                }
              })
              .on('dragmove', function (event) {
                DraggableLeft_x += event.dx;
                DraggableLeft_y += event.dy;

                event.target.style.webkitTransform =
                event.target.style.transform =
                    'translate(' + DraggableLeft_x + 'px, ' + DraggableLeft_y + 'px)';


                pcent = DraggableLeft_x / (800 - 50);
                if (pcent > 1)
                    pcent = 1;

                if (pcent < 0)
                    pcent = 0;

                CallbackFn( pcent );

                SliderValueDisplayDiv.innerHTML = Math.round( 100*pcent ) + ' %';

              });

            
        }

    }





    function RangeSliderSymetric(container, mode, CallbackFn, par_) {
        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        this.par = par_;
        this.CallbackFn = CallbackFn;

        //this.ParameterValue = initialVal;
        var par = par_;

        par.width; // 800

        
        if (par.height === undefined) {
            par.height = 50;
        }

        if (par.min === undefined) {
            par.min = -1;
        }

        if (par.max === undefined) {
            par.max = 1;
        }        

        if (mode == 'default') {
            this.container.innerHTML = `  
                                                <div>

                                                    <div id="SliderContainer" align="left" style="position: relative; width: ` + Math.round(par.width) + `px; height: ` + Math.round(par.height) +  `px; background: #003300; ">
    
                                                      <div id="SliderValueDisplay" style="width: 100px; ">--</div>


                                                      <div id="DraggableLeft" style="position: absolute; top:0px; left: ` +  Math.round((par.width - par.height) / 2) +  `px; width : ` + Math.round(par.height) +  `px;  height: ` + Math.round(par.height) +  `px; background: rgba(0, 120, 0, 0.5);
                                                       border: 2px solid rgba(0, 255, 0, 0.5);  border-radius: 10px;"> </div>

                                                    </div>

                                                </div>
                                 `;

            // Test this
            
            var SliderValueDisplayDiv = $(this.container).find('#SliderValueDisplay')[0];

            var SliderContainer = $(this.container).find('#SliderContainer')[0];
           // SliderContainer.style.width = par.width + 'px';

            var DraggableLeft = $(this.container).find('#DraggableLeft')[0];


            // Draggables
            //var DraggableLeft = $(PlotDiv).children().find('#DraggableLeft')[0];

            console.log(DraggableLeft);

            var DraggableLeft_x = 0, DraggableLeft_y = 0;

            interact(DraggableLeft)
              .draggable({
                snap: {
                  targets: [

                 //   interact.createSnapGrid({ x: 1, y: 1 })
                            // snap only the y coord to 100
                              // i.e. move horizontally at y=100
                     { y: 200, range: Infinity }

                  ],
                  range: Infinity,
//                  relativePoints: [ { x: 0, y: 0 } ]
                  relativePoints: [ { y: 0, range: Infinity } ]
                },
                inertia: false,
                restrict: {
                  restriction: DraggableLeft.parentNode,
                  elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                  endOnly: true
                }
              })
              .on('dragmove', function (event) {
                DraggableLeft_x += event.dx;
                DraggableLeft_y += event.dy;

                event.target.style.webkitTransform =
                event.target.style.transform =
                    'translate(' + DraggableLeft_x + 'px, ' + DraggableLeft_y + 'px)';


                pcent = 2 * DraggableLeft_x / (par.width - par.height) ;
                if (pcent > 1)
                    pcent = 1;

                if (pcent < -1)
                    pcent = -1;


                // pcent = 2 * DraggableLeft_x / (par.width - par.height) ;
                // if (pcent > par.max)
                //     pcent = par.max;

                // if (pcent < -par.min)
                //     pcent = par.min;


                CallbackFn( pcent );

                SliderValueDisplayDiv.innerHTML = Math.round( 100*pcent ) + ' %';

              });

            
        }

    }







    function RangeSlider2(container, mode, CallbackFn, par_) {
        this.container = container;
        this.mode = mode; // 'slider', 'EditField', 'Buttons1', 'Buttons2'
        this.par = par_;
        this.CallbackFn = CallbackFn;

        //this.ParameterValue = initialVal;
        var par = par_;

        par.width; // 800

        
        if (par.height === undefined) {
            par.height = 50;
        }

        // if (par.min === undefined) {
        //     par.min = -1;
        // }

        // if (par.max === undefined) {
        //     par.max = 1;
        // }        

        var PixelRange = par.width - par.height;
        var Range = par.max - par.min;

        var PixelInit = (par.init - par.min) / Range * PixelRange;

        console.log( 'PixelRange ' + PixelRange + '  Range ' + Range + ' PixelInit'  + PixelInit );



        if (mode == 'default') {
            this.container.innerHTML = `  
                                                <div>

                                                    <div id="SliderContainer" align="left" style="position: relative; width: ` + Math.round(par.width) + `px; height: ` + Math.round(par.height) +  `px; background: #003300; ">
    
                                                      <div id="SliderValueDisplay" style="width: 100px; ">--</div>


                                                      <div id="DraggableLeft" style="position: absolute; top:0px; left: ` +  Math.round( PixelInit  ) +  `px; width : ` + Math.round(par.height) +  `px;  height: ` + Math.round(par.height) +  `px; background: rgba(0, 120, 0, 0.5);
                                                       border: 2px solid rgba(0, 255, 0, 0.5);  border-radius: 10px;"> </div>

                                                    </div>

                                                </div>
                                 `;

            // Test this
            
            var SliderValueDisplayDiv = $(this.container).find('#SliderValueDisplay')[0];

            var SliderContainer = $(this.container).find('#SliderContainer')[0];
           // SliderContainer.style.width = par.width + 'px';

            var DraggableLeft = $(this.container).find('#DraggableLeft')[0];


            // Draggables
            //var DraggableLeft = $(PlotDiv).children().find('#DraggableLeft')[0];

            console.log(DraggableLeft);

            var DraggableLeft_x = 0, DraggableLeft_y = 0;

            interact(DraggableLeft)
              .draggable({
                snap: {
                  targets: [

                 //   interact.createSnapGrid({ x: 1, y: 1 })
                            // snap only the y coord to 100
                              // i.e. move horizontally at y=100
                     { y: 200, range: Infinity }

                  ],
                  range: Infinity,
//                  relativePoints: [ { x: 0, y: 0 } ]
                  relativePoints: [ { y: 0, range: Infinity } ]
                },
                inertia: false,
                restrict: {
                  restriction: DraggableLeft.parentNode,
                  elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                  endOnly: true
                }
              })
              .on('dragmove', function (event) {
                DraggableLeft_x += event.dx;
                DraggableLeft_y += event.dy;

                event.target.style.webkitTransform =
                event.target.style.transform =
                    'translate(' + DraggableLeft_x + 'px, ' + DraggableLeft_y + 'px)';


                pcent = Range * DraggableLeft_x / (PixelRange) ;
                // if (pcent > 1)
                //     pcent = 1;

                // if (pcent < -1)
                //     pcent = -1;


                // pcent = 2 * DraggableLeft_x / (par.width - par.height) ;
                if (pcent > par.max)
                    pcent = par.max;

                if (pcent < par.min)
                    pcent = par.min;


                CallbackFn( pcent );

                SliderValueDisplayDiv.innerHTML = Math.round( 100*pcent ) + ' %';

              });

            
        }

    }


