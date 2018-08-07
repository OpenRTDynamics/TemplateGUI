// 
// 
// This a template for writing real-time applications using OpenRTDynamics
// (openrtdynamics.sf.net)
// 
//
// 


// The name of the program
ProgramName = 'template'; // must be the filename without .sce




//
// To run the generated controller stored in template.[i,r]par, call from a terminal the 
//
// ortd --baserate=1000 --rtmode 1 -s template -i 901 -l 0 --master_tcpport 10000
// 
// If you want to use harder real-time capabilities, run as root: 
// 
// sudo ortd --baserate=1000 --rtmode 1 -s template -i 901 -l 0 --master_tcpport 10000
// 

ENABLE_HARDWARE=0;
PRINT_BARS = 1;


deff('[x]=ra(from,to,len)','x=linspace(from,to,len)'' ');
deff('[x]=co(val,len)','x=val*ones(1,len)'' ');
deff('[x]=cosra(from,to,len)','  x=0.5-0.5*cos(linspace(0,%pi,len)); x=x*(to-from)+from; x=x'';  ');



// // Design an Oscillator
s=poly(0,'s'); z=poly(0,'z');

T_a = 1/40; // Sampling time for discretisation
scf(1);clf;
// plot(t, y);
// 
// Hz = horner( H,  1/T_a * (z-1)/z ) / z; // discretise using euler
// // Hz = horner( H,  2/T_a * (z-1)/(z+1) ) / z; // discretise using biliear
// 


phi=2/180*%pi;
r = 0.9997;
z_oo = r * ( cos(phi) + %i * sin(phi) );
z_oo_ = r * ( cos(phi) - %i * sin(phi) );

Hz = z/ ( poly( [z_oo, z_oo_], 'z' ));  Hz=Hz/horner(Hz,1);

yz = dsimul( tf2ss(Hz), ones( 1, ceil(10/T_a)   ) );

t=linspace(0,10,ceil(10/T_a));
plot(t, yz, 'r');

  //abort;



// Design an Oscillator
s=poly(0,'s'); z=poly(0,'z');

//w = 5;  // Frq. in omega space
//d=0.000001; // Damping
//T_a = 1/40; // Sampling time for discretisation
//
//H = 1/ (  s^2/w^2 + 2*d/w * s + 1  );
//t=0:T_a:3;
//y=csim( 'step', t, tf2ss(H) );
//scf(1);clf;plot(t, y);
//Hz = horner( H,  1/T_a * (z-1)/z ) / z; // discretise using euler
//


//    zeta = 0.9;
//    omega0 = 0.2;
//    T_a = 1/40;
//    a1 = -2*zeta*exp( -zeta*omega0*T_a ) * cos( sqrt( 1-zeta^2  )*omega0 * T_a ) ;
//    a2 = exp( -2*zeta*omega0*T_a );
//
//    M = 1/ real( z^2 + a1 * z + a2 );
//    Hz = M/horner(M,1);


yz = dsimul( tf2ss(Hz), ones( 1, length(t) ) );

scf(1);clf;
plot(t, yz,'r');


//abort;


//  abort;
CouplingFaktor_ = 10; // slow waves
CouplingFaktor = [ co(20, 20), co(20, 20), co(20,20) ];

//CouplingFaktor = 20; // fast waves

//CouplingFaktor = 40; // fast waves



function [sim,out] = ld_fngen(sim, events, shape_, period, amp) // PARSEDOCU_BLOCK
    //
    // %PURPOSE: function generator
    // 
    // shape_ - the shape of the output signal: =0 : ???
    // period, amp * - Periode length in samples and amplitude
    // out * - output
    // 
    //

    ortd_checkpar(sim, list('SingleValue', 'shape_', shape_) );

    btype = 80;
    [sim,bid] = libdyn_new_block(sim, events, btype, [shape_], [], ...
    insizes=[1,1], outsizes=[1], ...
    intypes=[ORTD.DATATYPE_FLOAT,ORTD.DATATYPE_FLOAT], outtypes=[ORTD.DATATYPE_FLOAT]  );

    [sim,out] = libdyn_conn_equation(sim, bid, list(period, amp));
    [sim,out] = libdyn_new_oport_hint(sim, out, 0);
endfunction



function [sim, x,v] = damped_oscillator(sim, u)
    [sim,x] = ld_ztf(sim, 0, u, Hz ); 
    v = x;
endfunction

function [sim, X] = WaveChain__(sim, Excitement, Fl, Fr, Fm, Level, N)
    C = CouplingFaktor;

    [sim, Ex] = ld_demux(sim, 0, N, Excitement);

    X_fb = list();
    X_fb_ = list();
    X = list();
    Fd = list();

    N=N-2;        // left and right oscillator are not defined in the loop

    // Open feedbacks
    [sim,X_fb_(1)] = libdyn_new_feedback(sim); [ sim, X_fb(1) ] = ld_gain(sim, 0, X_fb_(1), 1 );    
    for i=1:N
        [sim,X_fb_(i+1)] = libdyn_new_feedback(sim); [ sim, X_fb(i+1) ] = ld_gain(sim, 0, X_fb_(i+1), 1 );
    end    
    [sim,X_fb_(N+2)] = libdyn_new_feedback(sim); 
    [ sim, X_fb(N+2) ] = ld_gain(sim, 0, X_fb_(N+2), 1 );



    // Left bound eqn    
    [sim, Fd(1)] = ld_add(sim, ev, list( X_fb(1), X_fb(2) ), [-1, 1]*C(1) );    

    // [sim, Fd(1)] = ld_const(sim, 0, 0); // 

    [sim, F] = ld_add(sim, ev, list(Fl, Fd(1)), [1, 1]);    // RB
    [sim, F] = ld_add(sim, ev, list(F, Ex(1)), [1, 1]);    // Excitement
    [sim, X(1),v1] = damped_oscillator(sim, F);

    // Inner eqn
    for i=1:N
        [sim, Fd(i+1)] = ld_add(sim, ev, list( X_fb(i+1), X_fb(i+2) ), [-1, 1]*C(i+1) );    
        [sim, F] = ld_add(sim, ev, list(Fd(i), Fd(i+1)), [-1, 1]);    
        [sim, F] = ld_add(sim, ev, list(F, Ex(i+1)), [1, 1]);    // Excitement

        if i==(ceil(N/2)) then
            [sim, F] = ld_add(sim, ev, list(F, Fm), [1, 1]);      // add something in the middle of the chain
        end

        [sim, X(i+1),v1] = damped_oscillator(sim, F);
    end

    // Left bound eqn    
    [sim, F] = ld_add(sim, ev, list(Fr, Fd(N+1)), [1, -1]);    // RB
    [sim, F] = ld_add(sim, ev, list(F, Ex(N)), [1, 1]);    // Excitement
    [sim, X(N+2),v1] = damped_oscillator(sim, F);

    // Close feedbacks    
    [sim] = libdyn_close_loop(sim, X(1), X_fb_(1) );
    for i=1:N
        [sim] = libdyn_close_loop(sim, X(i+1), X_fb_(i+1) );
    end
    [sim] = libdyn_close_loop(sim, X(N+2), X_fb_(N+2) );


    // add level
    for i=1:(N+2)
        [sim, X(i)] = ld_add(sim, 0, list(X(i), Level), [1,1] );
    end
endfunction

function [sim, X] = WaveChain(sim, Excitement, Fl, Fr, Fm, Level, N)

    [sim, X] = WaveChain__(sim, Excitement, Fl, Fr, Fm, Level, N);

    //   [sim, X__] = WaveChain__(sim, Excitement, Fl, Fr, N*2);
    // 
    //   X=list();
    //   j=1;
    //   for i=1:N
    //     [sim, X(i)] = ld_add(sim, 0, list( X__(j), X__(j+1) ), [0.5, 0.5] );
    //     j=j+2;
    //   end


endfunction

function [sim] = printBar(sim, X)
    [sim, a1__] = ld_add_ofs(sim, 0, X, 1.4);
    [sim, a1__] = ld_gain(sim, 0, a1__, 10);
    [sim] = ld_printfbar(sim, 0, in=a1__, str=" ");
endfunction



function [sim] = LED_hardware_new(sim, X, M)
    
    // Just copied this from scilab_loader.sce from module NeopixelPI
    // 

    
    function [sim, out] = ld_RPiNeoPixel(sim, events, CH1, CH2, par ) // PARSEDOCU_BLOCK
    // 
    // RPiNeoPixelBlock - block
    //
    // CH1 : struct(  *R, *G, *B, *W, Nleds  )
    // CH2 : struct(  *R, *G, *B, *W, Nleds  )
    //
    // par : struct(  )
    // 
    
       // check the input parameters
    //   ortd_checkpar(sim, list('String', 'str', str) );
    //   ortd_checkpar(sim, list('Signal', 'in1', in1) );
    //   ortd_checkpar(sim, list('Signal', 'in2', in2) );
    
    //    ortd_checkpar(sim, list('SingleValue', 'gain', gain) );
    
    
    // introduce some parameters that are refered to by id's
       parameter1 = 12345;
       vec = [ CH1.Nleds , CH2.Nleds ];
    
       // pack all parameters into a structure "parlist"
       parlist = new_irparam_set();
    
       parlist = new_irparam_elemet_ivec(parlist, parameter1, 10); // id = 10
       parlist = new_irparam_elemet_ivec(parlist, vec, 11); // vector of integers (double vectors are similar, replace ivec with rvec)
      // parlist = new_irparam_elemet_ivec(parlist, ascii(str), 12); // id = 12; A string parameter
    
       p = combine_irparam(parlist); // convert to two vectors of integers and floating point values respectively
    
    // Set-up the block parameters and I/O ports
      Uipar = [ p.ipar ];
      Urpar = [ p.rpar ];
      btype = 70101 + 0; // Reference to the block's type (computational function). Use the same id you are giving via the "libdyn_compfnlist_add" C-function
    
      insizes=[CH1.Nleds,CH1.Nleds,CH1.Nleds,CH1.Nleds,  CH2.Nleds,CH2.Nleds,CH2.Nleds,CH2.Nleds ]; // Input port sizes
      outsizes=[1]; // Output port sizes
      dfeed=[1];  // for each output 0 (no df) or 1 (a direct feedthrough to one of the inputs)
      intypes=[ORTD.DATATYPE_INT32 * ones(4,1) ;   ORTD.DATATYPE_INT32 * ones(4,1) ]; // datatype for each input port
      outtypes=[ORTD.DATATYPE_FLOAT]; // datatype for each output port
    
      blocktype = 1; // 1-BLOCKTYPE_DYNAMIC (if block uses states), 2-BLOCKTYPE_STATIC (if there is only a static relationship between in- and output)
    
      // Create the block
      [sim, blk] = libdyn_CreateBlockAutoConfig(sim, events, btype, blocktype, Uipar, Urpar, insizes, outsizes, intypes, outtypes, dfeed);
      
      // connect the inputs
     [sim,blk] = libdyn_conn_equation(sim, blk, list(  CH1.R, CH1.G, CH1.B, CH1.W,   CH2.R, CH2.G, CH2.B, CH2.W  ) ); // connect in1 to port 0 and in2 to port 1
    
      // connect the ouputs
     [sim,out] = libdyn_new_oport_hint(sim, blk, 0);   // 0th port
    endfunction


  //
  Nleds = M;
  

  

  inlist_v = list();
 
  inlist = list();

  inlistR = list();
  inlistG = list();
  inlistB = list();

    for i=1:Nleds
      
        v = X(i);

        [sim, v] = ld_gain(sim, 0, v, 1/2 );
        [sim, v] = ld_sat(sim, 0, v, -0.5, 0.5);
        [sim, v] = ld_add_ofs(sim, 0, v, 0.5);
        [sim, v] = ld_mult(sim, 0, list(v, v), [0, 0] );  // v^2
        
        
        inlist_v($+1) = v;
        
        
        // cut here

        [sim, pwm] = ld_gain(sim, 0, v, 255 );

        [sim, tmp] = ld_floorInt32(sim, 0, pwm );
        
        inlist($+1) = tmp;
        
        
//        // make color
//        Ncol = 1000;
//        ColTable = jetcolormap(Ncol);
//
////        [sim, ColLookup] = ld_gain(sim, 0, v, Ncol );
//        
//        DimmFactor = 3;
//        
//        [sim, R_norm] = ld_lookup(sim, 0, u=v, lower_b=0, upper_b=1, table=ColTable(:,1), interpolation=1);
//        [sim, G_norm] = ld_lookup(sim, 0, u=v, lower_b=0, upper_b=1, table=ColTable(:,2), interpolation=1);
//        [sim, B_norm] = ld_lookup(sim, 0, u=v, lower_b=0, upper_b=1, table=ColTable(:,3), interpolation=1);
//        
//        [sim, pwmR] = ld_gain(sim, 0, R_norm, 255 / DimmFactor );
//        [sim, pwmG] = ld_gain(sim, 0, G_norm, 255 / DimmFactor );
//        [sim, pwmB] = ld_gain(sim, 0, B_norm, 255 / DimmFactor );
//        
//        [sim, tmpR] = ld_floorInt32(sim, 0, pwmR );
//        [sim, tmpG] = ld_floorInt32(sim, 0, pwmG );
//        [sim, tmpB] = ld_floorInt32(sim, 0, pwmB );
//        
//        inlistR($+1) = tmpR;
//        inlistG($+1) = tmpG;
//        inlistB($+1) = tmpB;

    end

  [sim, V] = ld_mux(sim, 0, Nleds, inlist_v);
  
  // [sim, out] = ld_vector_lookup(sim, events, u, lower_b, upper_b, table, interpolation, vecsize)
  
          // make color
        Ncol = 1000;
        ColTable = jetcolormap(Ncol);

  [sim, R_norm] = ld_vector_lookup(sim, 0, u=V, lower_b=0, upper_b=1, table=ColTable(:,1), interpolation=1, Nleds);
  [sim, G_norm] = ld_vector_lookup(sim, 0, u=V, lower_b=0, upper_b=1, table=ColTable(:,2), interpolation=1, Nleds);
  [sim, B_norm] = ld_vector_lookup(sim, 0, u=V, lower_b=0, upper_b=1, table=ColTable(:,3), interpolation=1, Nleds);
  
  // TODO vector_gain, floorint32
          DimmFactor = 3;

  [sim, pwmR] = ld_vector_gain(sim, 0, R_norm, 255 / DimmFactor, Nleds)
  [sim, pwmG] = ld_vector_gain(sim, 0, G_norm, 255 / DimmFactor, Nleds)
  [sim, pwmB] = ld_vector_gain(sim, 0, B_norm, 255 / DimmFactor, Nleds)
  
  //
  [sim, R] = ld_vector_floorInt32(sim, 0, pwmB, Nleds );
  [sim, G] = ld_vector_floorInt32(sim, 0, pwmG, Nleds );
  [sim, B] = ld_vector_floorInt32(sim, 0, pwmR, Nleds );
  


  
//  [sim, R] = ld_muxInt32(sim, 0, Nleds, inlistB);
//  [sim, G] = ld_muxInt32(sim, 0, Nleds, inlistG);
//  [sim, B] = ld_muxInt32(sim, 0, Nleds, inlistR);
//

  [sim, R] = ld_constvecInt32(sim, 0, [ 0*ones( Nleds,1 ) ] );
  [sim, G] = ld_constvecInt32(sim, 0, [ 0*ones( Nleds,1 ) ] );
  //[sim, B] = ld_constvecInt32(sim, 0, [ 0*ones( Nleds,1 ) ] );
  [sim, W] = ld_constvecInt32(sim, 0, [ 0*ones( Nleds,1 ) ] );
  
 // R = V;
  
  CH1 = struct( "R", R, "G", G, "B", B, "W", W, "Nleds", Nleds   );
  CH2 = CH1;
 [sim, out] = ld_RPiNeoPixel(sim, 0, CH1, CH2, struct( "NCH", 1 ) );
  
  

endfunction


function [sim] = LED_hardware(sim, X, M)
    pwm1 = list();
    pwm2 = list();

    for i=1:16
        v = X(i);

        [sim, v] = ld_gain(sim, 0, v, 1/2 );
        [sim, v] = ld_sat(sim, 0, v, -0.5, 0.5);
        [sim, v] = ld_add_ofs(sim, 0, v, 0.5);
        [sim, v] = ld_mult(sim, 0, list(v, v), [0, 0] );  // v^2

        [sim, pwm1(i)] = ld_gain(sim, 0, v, 255 );

        pwm(i) = pwm1(i);

        //   [sim] = ld_printf(sim, 0, pwm(i),  + "pwm "+string(i), 1);


    end
    for i=17:32
        v = X(i);

        [sim, v] = ld_gain(sim, 0, v, 1/2 );
        [sim, v] = ld_sat(sim, 0, v, -0.5, 0.5);
        [sim, v] = ld_add_ofs(sim, 0, v, 0.5);
        [sim, v] = ld_mult(sim, 0, list(v, v), [0, 0] );  // v^2

        [sim, pwm2(i-16)] = ld_gain(sim, 0, v, 255 );

        //   [sim] = ld_printf(sim, 0, pwm(i),  + "pwm "+string(i), 1);
        pwm(i) = pwm2(i-16);


    end


    if ENABLE_HARDWARE==1 then

        //   exec('../I2C/scilab_loader.sce');



        function sim=i2c_TLC59116_driver(sim, ObjectIdentifyer, I2CDevicename, I2Caddr, pwm)
            //     
            // This is a driver for the TLC59116 (16 channel pwm LED driver)
            // http://www.elv.de/I2C-Bus-LED-Treiber-Steuern-Sie-16-LEDs-%C3%BCber-nur-2-Leitungen/x.aspx/cid_726/detail_31520
            //     

            // open the device using the linux-kernel I2C driver interface
            [sim] = ld_I2CDevice_shObj(sim, 0, ObjectIdentifyer, Visibility=2, I2CDevicename, I2Caddr); 


            // Define some constants
            [sim, Hex_aa] = ld_constvecInt32(sim, 0, 170); // 0xaa 
            [sim, Hex_ff] = ld_constvecInt32(sim, 0, 255); // 0xff
            [sim, Hex_00] = ld_constvecInt32(sim, 0, 0); // 0x00

            // Initiate command
            [sim, Hex_80] = ld_constvecInt32(sim, 0, 128); // 0x80 start writing registers at register 0x00
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_80, vecsize=1);

            // Write to registers
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);

            // write to pwm registers
            for i=1:16
                [sim,pwm_] = ld_floorInt32(sim, 0, in=pwm(i));  
                [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=pwm_, vecsize=1);
            end

            // write remaining registers
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_ff, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_aa, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_aa, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_aa, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_aa, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_00, vecsize=1);
            [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=Hex_ff, vecsize=1);

            // send everything
            [sim] = ld_I2CDevice_Transmit(sim, 0, ObjectIdentifyer);
        endfunction

        function [opwm] = flipArray2(pwm);      
            opwm( 1) =  pwm( 16); // 16
            opwm( 2) =  pwm( 15); // 15
            opwm( 3) =  pwm( 14); // 14
            opwm( 4) =  pwm( 6);
            opwm( 5) =  pwm( 9);
            opwm( 6) =  pwm( 10);
            opwm( 7) =  pwm( 1);
            opwm( 8) =  pwm( 8);
            opwm( 9) =  pwm( 3);
            opwm( 10) = pwm( 11);
            opwm( 11) = pwm( 5);
            opwm( 12) = pwm( 12);
            opwm( 13) = pwm( 2);
            opwm( 14) = pwm( 4 );   // 13
            opwm( 15) = pwm( 13 );
            opwm( 16) = pwm( 7);
        endfunction
        function [opwm] = flipArray1(pwm);      
            opwm( 1) =  pwm( 6 ); 
            opwm( 2) =  pwm( 1 ); 
            opwm( 3) =  pwm( 13 ); 
            opwm( 4) =  pwm( 14 );
            opwm( 5) =  pwm( 4 );
            opwm( 6) =  pwm( 8 );
            opwm( 7) =  pwm( 7 );
            opwm( 8) =  pwm( 11 );
            opwm( 9) =  pwm( 10 );
            opwm( 10) = pwm( 2 );
            opwm( 11) = pwm( 5 );
            opwm( 12) = pwm( 3 );
            opwm( 13) = pwm( 9 );
            opwm( 14) = pwm( 12 );  
            opwm( 15) = pwm( 15 );
            opwm( 16) = pwm( 16 );
        endfunction

        [pwm1] = flipArray2(pwm1);
        [pwm2] = flipArray1(pwm2);

        sim = i2c_TLC59116_driver(sim, ObjectIdentifyer="LEDArray1", I2CDevicename="/dev/i2c-1", I2Caddr=111, pwm=pwm2); // DE/2 = 6f =10= 111
        sim = i2c_TLC59116_driver(sim, ObjectIdentifyer="LEDArray2", I2CDevicename="/dev/i2c-1", I2Caddr=110, pwm=pwm1); // DE/2 = 6e =10= 110
    end

endfunction


function [sim, PacketFramework, S] = Excitements(sim, PacketFramework, M)





    // Add a parameter for controlling the oscillator
    [sim, PacketFramework, LeftBoundInc]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="LeftBoundInc");
    [sim, PacketFramework, RightBoundInc]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="RightBoundInc");
    [sim, PacketFramework, MiddleInc]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="MiddleInc");

    //    [sim,LeftBound] = ld_ztf(sim, 0, LeftBoundInc, 100* (z-1)/z ); 
    //    [sim,RightBound] = ld_ztf(sim, 0, RightBoundInc, 100* (z-1)/z ); 

    a=0.9; TP=(1-a)/(z-a) - ( (1-a)/(z-a) / z^10 ) ;
    [sim,LeftBound] = ld_ztf(sim, 0, LeftBoundInc, 100* TP*(z-1) ); 
    [sim,RightBound] = ld_ztf(sim, 0, RightBoundInc, 100* TP* (z-1) ); 
    [sim,Middle] = ld_ztf(sim, 0, MiddleInc, 100* TP* (z-1) ); 


    //
    // Add you own control system here
    //






    // 
    // Mode statemachine
    // 


    // fn
    function [sim, outlist, active_state, x_global_kp1, userdata] = controller_switch_sm(sim, inlist, x_global, state, statename, userdata)
        // This function is called multiple times: once for each state.
        // At runtime these are different nested simulation. Switching
        // between them is done, where each simulation represents a
        // certain state.

        printf("defining state %s \n", statename);

        PacketFramework = userdata(1);

        if PRINT_BARS == 1 then
            [sim] = ld_printf(sim, ev, in=x_global, str="<cntrl_state "+statename+"> x_global", insize=1);
        end

        //
        switch = inlist(1);  [sim, switch] = ld_gain(sim, ev, switch, 1);

        // some general signals
        [sim, one] = ld_const(sim, 0, 4);
        [sim, zero] = ld_const(sim, 0, 0);
        [sim, imp] = ld_initimpuls(sim,0);

        [sim, imp1] = ld_gain(sim, 0, imp, 250);
        [sim, imp2] = ld_gain(sim, 0, imp, -200);

        [sim, Excitement] = ld_constvec(sim, 0, zeros(M,1) );

        // default outputs
        LeftBound = zero; RightBound = zero; Middle = zero; Level = zero;

        // define different controllers here
        select state
        case 1 // state 1
            // silence

            //         [sim, Excitement] = ld_constvec(sim, 0, [ zeros(3,1) ; 1 ; zeros(6,1); 1; zeros(21,1) ] );


            active_state = switch;
        case 2 // state 2

            // Make some waves
            ExternalExInten = 2.5;

            [sim, excitement] = ld_modcounter(sim, 0, in=one, initial_count=0, mod=300);
            [sim, excitement] = ld_gain(sim, 0, excitement, ExternalExInten*1/300);	
            a=0.9; TP=(1-a)/(z-a) - ( (1-a)/(z-a) / z^4 ) ;
            [sim,excitement] = ld_ztf(sim, 0, excitement, 100* TP*(z-1) ); 
            [sim, RightBound] = ld_add(sim, 0, list(RightBound, excitement), [1,1] );


            active_state = switch;
        case 3 // Stehende Welle

            [sim, period] = ld_const(sim, 0, 1/T_a * 0.7);
            [sim, amp] = ld_const(sim, 0, 3);
            [sim,out] = ld_fngen(sim, 0, shape_=1, period, amp);
            [sim, RightBound] = ld_add(sim, 0, list(RightBound, out), [1,1] );
            //         [sim] = ld_printf(sim, ev, in=out, str="sin: ", insize=1);


            active_state = switch;

        case 4 // 

            // RightBound excitation
            [sim, period1] = ld_const(sim, 0, 1/T_a * 5); // low modulation for fm
            [sim, amp1] = ld_const(sim, 0,  1/T_a * 0.7 );
            [sim, period] = ld_fngen(sim, 0, shape_=1, period1, amp1);
            [sim, period] = ld_add_ofs(sim, 0, period,  1.3 * 1/T_a * 0.7 );

            [sim, amp] = ld_const(sim, 0, 3);
            [sim,out] = ld_fngen(sim, 0, shape_=1, period, amp);
            [sim, RightBound] = ld_add(sim, 0, list(RightBound, out), [1,1] );
            //         [sim] = ld_printf(sim, ev, in=out, str="sin: ", insize=1);

            // LeftBound excitation
            [sim, period1] = ld_const(sim, 0, 1/T_a * 4); // low modulation for fm
            [sim, amp1] = ld_const(sim, 0,  1/T_a * 0.7 );
            [sim, period] = ld_fngen(sim, 0, shape_=1, period1, amp1);
            [sim, period] = ld_add_ofs(sim, 0, period,  1.3 * 1/T_a * 0.7 );

            [sim, amp] = ld_const(sim, 0, 3);
            [sim,out] = ld_fngen(sim, 0, shape_=1, period, amp);
            [sim, LeftBound] = ld_add(sim, 0, list(LeftBound, out), [1,1] );

            active_state = switch;

        case 5 // reduce level
            r = 20*[-1,0,0,0,-1,0,0,0,-1,-0.25];
            [sim, Middle] = ld_play_simple(sim, 0, r);

            r = linspace(0, -1.5, 1/T_a * 6);
            [sim, Level] = ld_play_simple(sim, 0, r);

            active_state = switch;
        case 6 // reduce level
            r = 20*[1,0,0,0,1,0,0,0,1,0.25];
            [sim, Middle] = ld_play_simple(sim, 0, r);

            r = linspace(-1.5, 0, 1/T_a * 6);
            [sim, Level] = ld_play_simple(sim, 0, r);

            active_state = switch;

        case 7 // 
            //         r = 15*[ cosra(0,-1, 1/T_a * 0.5); cosra(-1, 0, 1/T_a * 0.5)  ];
            r = 15*[ co(-1, 1/T_a * 0.5); cosra(-1, 0, 1/T_a * 0.5)  ];
            r(1) = r(1)  -20;
            r(2) = r(2)  +20;

            [sim, Middle] = ld_play_simple(sim, 0, r);

            //         r = linspace(-1.5, 0, 1/T_a * 6);
            //         [sim, Level] = ld_play_simple(sim, 0, r);

            active_state = switch;

        case 8 // 

            // RightBound excitation
            [sim, period1] = ld_const(sim, 0, 1/T_a * 5); // low modulation for fm
            [sim, amp1] = ld_const(sim, 0,  1/T_a * 0.7 );
            [sim, period] = ld_fngen(sim, 0, shape_=1, period1, amp1);
            [sim, period] = ld_add_ofs(sim, 0, period,  1.3 * 1/T_a * 0.7 );


            // 3, 50, 4, 400
            // 8, 13, 6, 600 // schnelle Wellen
            [sim, PacketFramework, amp]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="exc1.amp");
            [sim, PacketFramework, frqModuUpperfreq]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="exc1.frqModuUpperfreq");
            [sim, PacketFramework, frqModuLowerfreq]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="exc1.frqModuLowerfreq");
            [sim, PacketFramework, frqModuRate]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="exc1.frqModuRate");

            // Make modulator signal
            [sim, one] = ld_const(sim, 0, 1);
            [sim, Modulator_] = ld_fngen(sim, 0, shape_=1, frqModuRate, one); // a sinus to modulate

            //         [sim] = ld_printf(sim, 0, in=Modulator_, str="Modulator_", insize=1);        
            [sim, Modulator] = ld_muparser(sim, 0, list(Modulator_, frqModuLowerfreq, frqModuUpperfreq), ...
            '  ((u1/2)+0.5) * (u3-u2) + u2  ', float_param=[]);

            [sim,out] = ld_fngen(sim, 0, shape_=1, Modulator, amp);        
            [sim, RightBound] = ld_add(sim, 0, list(RightBound, out), [1,1] );


            active_state = switch;


        case 9 // External control

//            // RightBound excitation
//            [sim, period1] = ld_const(sim, 0, 1/T_a * 5); // low modulation for fm
//            [sim, amp1] = ld_const(sim, 0,  1/T_a * 0.7 );
//            [sim, period] = ld_fngen(sim, 0, shape_=1, period1, amp1);
//            [sim, period] = ld_add_ofs(sim, 0, period,  1.3 * 1/T_a * 0.7 );
//

            // 3, 50, 4, 400
            // 8, 13, 6, 600 // schnelle Wellen
            [sim, PacketFramework, amp]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="externcntrl.ExciteRight");
            RightBound = amp;

            [sim, PacketFramework, amp]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="externcntrl.ExciteLeft");
            LeftBound = amp;


            active_state = switch;

        case 99  // editor

            [sim, PacketFramework, tmp]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="EditorUploadTrigger");
            [sim, PacketFramework, EditorUploadTrigger]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="EditorUploadTrigger_Manual");
            [sim, TriggerReload] = ld_detect_step_event(sim, 0, in=EditorUploadTrigger, eps=0.2);

            [sim, TriggerReload] = ld_initimpuls(sim, 0);

            [sim, out, Excitement] = OnlineExchange(sim, TriggerReload, M);

            active_state = switch;

        end

        userdata = list(PacketFramework);

        // the user defined output signals of this nested simulation
        if state ~= 99 then
            [sim, out] = ld_mux(sim, 0, 5, list(LeftBound, RightBound, Middle, Level, zero) );
        end
        outlist = list(out, Excitement);
        x_global_kp1 = x_global;
    endfunction



    // 
    [sim, PacketFramework, Mode]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="Mode");
    [sim, switch] = ld_detect_step_event(sim, ev, in=Mode, eps=0.2);

    // set-up three states represented by three nested simulations
    [sim, outlist, x_global, active_state,userdata] = ld_statemachine(sim, ev=ev, ...
    inlist=list(switch), ..
    insizes=[1], outsizes=[5, M], ... 
    intypes=[ORTD.DATATYPE_FLOAT*ones(1,1) ], outtypes=[ORTD.DATATYPE_FLOAT, ORTD.DATATYPE_FLOAT], ...
    nested_fn=controller_switch_sm, Nstates=9, state_names_list=list("silence", "shot", "sinus", "undef", "unfill", "fill", "undef", "undef", "editor"), ...
    inittial_state=7, x0_global=[1], userdata=list(PacketFramework)  );

    PacketFramework = userdata(1);


    [sim, out_] = ld_demux(sim, 0, 5, outlist(1) );

    // superpose with given parameters
    [sim, RightBound] = ld_add(sim, 0, list(RightBound, out_(1) ), [1,1] );
    [sim, LeftBound] = ld_add(sim, 0, list(LeftBound, out_(2) ), [1,1] );
    [sim, Middle] = ld_add(sim, 0, list(Middle, out_(3) ), [1,1] );
    Level = out_(4);

    //
    Excitement = outlist(2);


    // outputs
    S.RightBound = RightBound;
    S.LeftBound = LeftBound;
    S.Middle = Middle;
    S.Level = Level;
    S.Excitement = Excitement;
endfunction




function [sim, distance]=i2c_SRF02sonar_driver(sim, ObjectIdentifyer, I2CDevicename, I2Caddr)
    //     
    // This is a driver for the SRF02 sonar
    //     


    // The main real-time thread
    function [sim, outlist, userdata] = Thread_MainRT(sim, inlist, userdata)
        // This will run in a thread
        [sim, Tpause] = ld_const(sim, 0, 70 / 1000);  // The sampling time at least 65 ms; 70 to be sure
        [sim, out] = ld_ClockSync(sim, 0, in=Tpause); // synchronise this simulation

        // save the absolute time into a file
        //  [sim, time] = ld_clock(sim, ev);
        //  [sim] = ld_savefile(sim, ev, fname="AbsoluteTime.dat", source=time, vlen=1);

        // open the device using the linux-kernel I2C driver interface
        [sim] = ld_I2CDevice_shObj(sim, 0, ObjectIdentifyer, Visibility=2, I2CDevicename, I2Caddr=112 ); // addr = 0x70

        //    //
        [sim, out_i32] = ld_I2CDevice_Read(sim, 0, ObjectIdentifyer, Register=2 );
        [sim, sonar1] = ld_Int32ToFloat(sim, 0, out_i32 );

        [sim, out_i32] = ld_I2CDevice_Read(sim, 0, ObjectIdentifyer, Register=3 );
        [sim, sonar2] = ld_Int32ToFloat(sim, 0, out_i32 );

        if 1==1 then
            //    [sim] = ld_printf(sim, 0, in=sonar1, str="Sonar1: ", insize=1);
            //    [sim] = ld_printf(sim, 0, in=sonar2, str="Sonar2: ", insize=1);
            //
            [sim, tmp] = ld_gain(sim, 0, sonar2, 0.5);
            [sim] = ld_printfbar(sim, 0, tmp, "Sonar");
        end


        //    // Filtered TODO
        //    [sim, tmp] = ld_ztf(sim, 0, sonar2, (z-1)/z );
        //    [sim, tmp] = ld_sat(sim, 0, tmp, 0, 1);
        //
        //    [sim, tmp] = ld_ztf(sim, 0, sonar2, z/(z-1) *  );
        //    
        //    
        //    [sim, tmp] = ld_gain(sim, 0, sonar2, 0.5);
        //    [sim] = ld_printfbar(sim, 0, tmp, "Sonar");
        //

        // store results
        [sim, one] = ld_const(sim, 0, 1);
        [sim] = ld_write_global_memory(sim, 0, data=sonar2, index=one, ident_str=ObjectIdentifyer+"memory", datatype=ORTD.DATATYPE_FLOAT, ElementsToWrite=1);



        // Define some constants
        [sim, cmd] = ld_constvecInt32(sim, 0, 81); // 0x51  // means start ranging and result in 

        // write to command register
        [sim] = ld_I2CDevice_Write(sim, 0, ObjectIdentifyer, Register=0, in=cmd);


        //    [sim] = ld_I2CDevice_BufferWrite(sim, 0, ObjectIdentifyer, in=cmd, vecsize=1);
        //    // send everything
        //    [sim] = ld_I2CDevice_Transmit(sim, 0, ObjectIdentifyer);
        //    
        // Read


        //
        // [sim] = ld_printf(sim, 0, in=Tpause, str="Sonar1: ", insize=1);

        outlist = list();
    endfunction


    ThreadPrioStruct.prio1=ORTD.ORTD_RT_REALTIMETASK; // or  ORTD.ORTD_RT_NORMALTASK
    ThreadPrioStruct.prio2=50; // for ORTD.ORTD_RT_REALTIMETASK: 1-99 as described in   man sched_setscheduler
    // for ORTD.ORTD_RT_NORMALTASK this is the nice-value (higher value means less priority)
    ThreadPrioStruct.cpu = -1; // The CPU on which the thread will run; -1 dynamically assigns to a CPU, 
    // counting of the CPUs starts at 0

    [sim, StartThread] = ld_initimpuls(sim, ev); // triggers your computation only once
    [sim, outlist, computation_finished] = ld_async_simulation(sim, ev, ...
    inlist=list(), ...
    insizes=[], outsizes=[], ...
    intypes=[], outtypes=[], ...
    nested_fn = Thread_MainRT, ...
    TriggerSignal=StartThread, name=ObjectIdentifyer+"MainRealtimeThread", ...
    ThreadPrioStruct, userdata=list() );



    // initialise a global memory
    [sim] = ld_global_memory(sim, 0, ident_str=ObjectIdentifyer+"memory", datatype=ORTD.DATATYPE_FLOAT, len=5, initial_data=[0,0,0,0,0], visibility='global', useMutex=1);



    // read the memory
    [sim, readI] = ld_const(sim, ev, 1);
    [sim, distance] = ld_read_global_memory(sim, 0, index=readI, ident_str=ObjectIdentifyer+"memory", datatype=ORTD.DATATYPE_FLOAT, ElementsToRead=1);
    //  [sim]  = ld_printf(sim, 0, distance, "distance: ", 1);

    //  distance = 0;




endfunction










// The main real-time thread
function [sim, outlist, userdata] = Thread_MainRT(sim, inlist, userdata)
    // This will run in a thread
    [sim, Tpause] = ld_const(sim, ev, 1/40);  // The sampling time that is constant at 27 Hz in this example
    [sim, out] = ld_ClockSync(sim, ev, in=Tpause); // synchronise this simulation


    // save the absolute time into a file
    //  [sim, time] = ld_clock(sim, ev);
    //  [sim] = ld_savefile(sim, ev, fname="AbsoluteTime.dat", source=time, vlen=1);


//    Configuration.UnderlyingProtocoll = "UDP";
//    Configuration.DestHost = "127.0.0.1";
//    Configuration.DestPort = 20000;
//    Configuration.LocalSocketHost = "127.0.0.1";
//    Configuration.LocalSocketPort = 20001;
//    [sim, PacketFramework] = ld_PF_InitInstance(sim, InstanceName="WavePingPong_RemoteControl", Configuration);



    // PAPI -- Data is forwarded by node.js
    Configuration.UnderlyingProtocoll = "UDP";
    Configuration.DestHost = "127.0.0.1";
    Configuration.DestPort = 20000;
    Configuration.LocalSocketHost = "127.0.0.1";
    Configuration.LocalSocketPort = 20001;
    
    [sim, PacketFramework] = ld_PF_InitInstance(sim, InstanceName="PaPi__", Configuration);
    
    //            PacketFramework.Configuration.debugmode = %f;
    PacketFramework.Configuration.debugmode = %f;




    if ENABLE_HARDWARE==1 then

        //
        [sim, distance]=i2c_SRF02sonar_driver(sim, ObjectIdentifyer="Sonar", I2CDevicename="/dev/i2c-1", I2Caddr=112 ); // addr = 0x70
        //  sim = i2c_TLC59116_driver(sim, ObjectIdentifyer="LEDArray1", I2CDevicename="/dev/i2c-1", I2Caddr=111, pwm=pwm2); // DE/2 = 6f =10= 111

    end


    if 1==1 then


        if PRINT_BARS == 1 then
            [sim] = ld_printf(sim, ev, Tpause, ORTD.termcode.clearscreen + "Time interval [s]", 1);
        end

        // The number of oscillators in the chain
        M=60;

        [sim, PacketFramework, S] = Excitements(sim, PacketFramework, M);



        [sim, one] = ld_const(sim, 0, 1);


        a = 0.97;
        [sim, Level] = ld_ztf(sim, 0, S.Level, (1-a)/(z-a) );
        [sim, X] = WaveChain(sim, Excitement=S.Excitement, Fl=S.LeftBound, Fr=S.RightBound, Fm=S.Middle, Level, M);

        if PRINT_BARS == 1 then
            // print the time interval

            // print bars
            for i=1:M
                [sim] = printBar(sim, X(i) );
            end
        end

        // Make vector of X
        //   Xlist = list();
        //   for i=1:M
        //     Xlist(i) = X(i)
        //   end
        //  

        [sim, Xvec] = ld_mux(sim, 0, M, X);

        if ENABLE_HARDWARE==1 then

            // HW
            [sim] = LED_hardware(sim, X, M);
            
        end
        
        if ENABLE_HARDWARE==2 then
            
            // HW 2
            [sim] = LED_hardware_new(sim, X, M);
            
        end
        


         // Stream the data of the oscillator
        [sim, PacketFramework]=ld_SendPacket(sim, PacketFramework, Signal=Xvec, NValues_send=M, datatype=ORTD.DATATYPE_FLOAT, SourceName="X")



    end

    PacketFramework.PaPIConfig.SmartDevice.ScreenName = "MainMenu";


    // finalise the communication interface
    [sim,PacketFramework] = ld_PF_Finalise(sim,PacketFramework);
    ld_PF_Export_js(PacketFramework, fname="ProtocollConfig.json");


    outlist = list();
endfunction




// This is the main top level schematic
function [sim, outlist] = schematic_fn(sim, inlist)  

    // 
    // Create a thread that runs the control system
    // 

    ThreadPrioStruct.prio1=ORTD.ORTD_RT_NORMALTASK; // or  ORTD.ORTD_RT_NORMALTASK
    ThreadPrioStruct.prio2=0; // for ORTD.ORTD_RT_REALTIMETASK: 1-99 as described in   man sched_setscheduler
    // for ORTD.ORTD_RT_NORMALTASK this is the nice-value (higher value means less priority)
    ThreadPrioStruct.cpu = -1; // The CPU on which the thread will run; -1 dynamically assigns to a CPU, 
    // counting of the CPUs starts at 0

    [sim, StartThread] = ld_initimpuls(sim, ev); // triggers your computation only once
    [sim, outlist, computation_finished] = ld_async_simulation(sim, ev, ...
    inlist=list(), ...
    insizes=[], outsizes=[], ...
    intypes=[], outtypes=[], ...
    nested_fn = Thread_MainRT, ...
    TriggerSignal=StartThread, name="MainRealtimeThread", ...
    ThreadPrioStruct, userdata=list() );


    // output of schematic (empty)
    outlist = list();
endfunction



//
// Set-up (no detailed understanding necessary)
//

thispath = get_absolute_file_path(ProgramName+'.sce');
cd(thispath);
z = poly(0,'z');

exec('OnlineExchange.sce');

// defile ev
ev = [0]; // main event

// set-up schematic by calling the user defined function "schematic_fn"
insizes = []; outsizes=[];
[sim_container_irpar, sim]=libdyn_setup_schematic(schematic_fn, insizes, outsizes);

// pack the simulation into a irpar container
parlist = new_irparam_set();
parlist = new_irparam_container(parlist, sim_container_irpar, 901); // pack simulations into irpar container with id = 901
par = combine_irparam(parlist); // complete irparam set
save_irparam(par, ProgramName+'.ipar', ProgramName+'.rpar'); // Save the schematic to disk

// clear
par.ipar = []; par.rpar = [];


