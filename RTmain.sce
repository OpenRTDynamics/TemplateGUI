// 
// 
// This a template for writing real-time applications using OpenRTDynamics
// (openrtdynamics.sf.net)
// 
//
// 


// The name of the program
ProgramName = 'RTmain'; // must be the filename without .sce
thispath = get_absolute_file_path(ProgramName+'.sce');
cd(thispath);

//
// To run the generated controller run the following command within this directory
//
// ortdrun
// 
// If you want to use harder real-time capabilities, sudo-execution is required: 
// 
// sudo ortdrun
// 

// Added on 7.8.18
function Stream=NewStream(Name)
    Stream.Name = Name;
    Stream.DemuxInfo = list();
    Stream.StreamSignals = list();
endfunction

// Added on 7.8.18
function [Stream] = AddSignalToStream(Stream, SigName, Sig)
    Stream.StreamSignals($+1) = Sig;
    Stream.DemuxInfo($+1) = struct('N',SigName, 'SI', length(Stream.DemuxInfo) + 1 , 'len',1 );

    printf("Added signal " + string( SigName ) + " to the stream "+ string(Stream.Name + "\n") );
endfunction

// Added on 7.8.18
function [sim, PacketFramework, Stream, StreamSig] = FinalizeStream(sim, PacketFramework, Stream)
    [sim, StreamSig] = ld_mux(sim, 0, length(Stream.StreamSignals), Stream.StreamSignals );


    //  [sim] = ld_printf(sim, 0, StreamSig, "StreamSig ", length(Stream.StreamSignals) );

    [sim, PacketFramework]=ld_SendPacketMux(sim, PacketFramework, Signal=StreamSig, NValues_send=length( Stream.StreamSignals ), datatype=ORTD.DATATYPE_FLOAT, SourceName=Stream.Name, Stream.DemuxInfo);

    // disp(Stream.DemuxInfo);
    printf(" ---------- Table of stream (%s) contents ---------\n", Stream.Name );
    for i=1:length(Stream.DemuxInfo)

        printf("  " + string( Stream.DemuxInfo(i).N ) + "\n" ); 

    end
endfunction





// Superblock: A more complex oscillator with damping
function [sim, x,v] = damped_oscillator(sim, u)
    T_a = 0.1; // sample time
    
    // create feedback signals
    [sim,x_feedback] = libdyn_new_feedback(sim);

        [sim,v_feedback] = libdyn_new_feedback(sim);

            // use this as a normal signal
            [sim,a] = ld_add(sim, ev, list(u, x_feedback), [1, -1]);
            [sim,a] = ld_add(sim, ev, list(a, v_feedback), [1, -1]);
    
            [sim,v] = ld_ztf(sim, ev, a, 1/(z-1) * T_a ); // Integrator approximation
    
            // feedback gain
            [sim,v_gain] = ld_gain(sim, ev, v, 0.5);
    
            // close loop v_gain = v_feedback
        [sim] = libdyn_close_loop(sim, v_gain, v_feedback);
    
    
        [sim,x] = ld_ztf(sim, ev, v, 1/(z-1) * T_a ); // Integrator approximation  
    
        // feedback gain
        [sim,x_gain] = ld_gain(sim, ev, x, 0.6);
    
    // close loop x_gain = x_feedback
    [sim] = libdyn_close_loop(sim, x_gain, x_feedback);
endfunction


// The main real-time thread
function [sim, outlist, userdata] = Thread_MainRT(sim, inlist, userdata)
  // This will run in a thread
  [sim, Tpause] = ld_const(sim, ev, 1/27);  // The sampling time that is constant at 27 Hz in this example
  [sim, out] = ld_ClockSync(sim, ev, in=Tpause); // synchronise this simulation

  // print the time interval
  [sim] = ld_printf(sim, ev, Tpause, "Time interval [s]", 1);

  // save the absolute time into a file
  [sim, time] = ld_clock(sim, ev);
  [sim] = ld_savefile(sim, ev, fname="AbsoluteTime.dat", source=time, vlen=1);

  //
  // Add you own control system here
  //
  
    // Init GUI-interface -- Data is forwarded by node.js
    Configuration.UnderlyingProtocoll = "UDP";
    Configuration.DestHost = "127.0.0.1";
    Configuration.DestPort = 20000;
    Configuration.LocalSocketHost = "127.0.0.1";
    Configuration.LocalSocketPort = 20001;
    
    [sim, PacketFramework] = ld_PF_InitInstance(sim, InstanceName="PaPi__", Configuration);
    
    //            PacketFramework.Configuration.debugmode = %f;
    PacketFramework.Configuration.debugmode = %f;
    
      
  
  [sim, PacketFramework, Parameter1]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="Parameter1");
  [sim] = ld_printf(sim, 0, Parameter1, "Parameter1 ", 1);
  
  
  [sim, x,v] = damped_oscillator(sim, u=Parameter1);

            Stream=NewStream('GUI');

        // Please Note: only signals of size 1 and type ORTD.DATATYPE_FLOAT are accepted by AddSignalToStream!
            [Stream] = AddSignalToStream(Stream, SigName="x", Sig=x); 
            [Stream] = AddSignalToStream(Stream, SigName="v", Sig=v); 
            
            //
            [sim, PacketFramework, Stream, StreamSig] = FinalizeStream(sim, PacketFramework, Stream);

//         // Stream the data of the oscillator (This also accepts vector-signals of size NValues_send
//        [sim, PacketFramework]=ld_SendPacket(sim, PacketFramework, Signal=x, NValues_send=1, datatype=ORTD.DATATYPE_FLOAT, SourceName="x")


    
    PacketFramework.PaPIConfig.SmartDevice.ScreenName = "MainMenu";


    // finalise the communication interface
    [sim,PacketFramework] = ld_PF_Finalise(sim,PacketFramework);
    
    
  outlist = list();
endfunction




// This is the main top level schematic
function [sim, outlist] = schematic_fn(sim, inlist)  

// 
// Create a thread that runs the control system (no hard realtime)
// 
   
        ThreadPrioStruct.prio1=ORTD.ORTD_RT_NORMALTASK; // or  ORTD.ORTD_RT_REALTIMETASK
        ThreadPrioStruct.prio2=0; // for ORTD.ORTD_RT_REALTIMETASK: 1-99 as described in   man sched_setscheduler
                                  // for ORTD.ORTD_RT_NORMALTASK this is the nice-value (higher value means less priority)
        ThreadPrioStruct.cpu = -1; // The CPU on which the thread will run; -1 dynamically assigns to a CPU, 
                                   // counting of the CPUs starts at 0
                                   

//    NOTE: for rt_preempt real-time (better realtime ) use the following parameters configuration for the thread
// 
//         // Create a RT thread on CPU 0:
//         ThreadPrioStruct.prio1=ORTD.ORTD_RT_REALTIMETASK; // rt_preempt FIFO scheduler
//         ThreadPrioStruct.prio2=50; // Highest priority
//         ThreadPrioStruct.cpu = 0; // CPU 0                
                                   

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
// Set-up: Compile the schematic into the files RTmain.ipar and RTmain.rpar
//

thispath = get_absolute_file_path(ProgramName+'.sce');
cd(thispath);
z = poly(0,'z');

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


