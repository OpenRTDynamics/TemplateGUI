// 
// 
// This a template for writing real-time applications using OpenRTDynamics
// that also connect to a HTML-based graphical user interface.
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




// Superblock: A more complex oscillator with damping
function [sim, x,v] = damped_oscillator(sim, u)
    T_a = 0.1; // sample time

    // create feedback signals
    [sim,x_feedback] = libdyn_new_feedback(sim);

    [sim,v_feedback] = libdyn_new_feedback(sim);

    // use this as a normal signal
    [sim,a] = ld_add(sim, 0, list(u, x_feedback), [1, -1]);
    [sim,a] = ld_add(sim, 0, list(a, v_feedback), [1, -1]);

    [sim,v] = ld_ztf(sim, 0, a, 1/(z-1) * T_a ); // Integrator approximation

    // feedback gain
    [sim,v_gain] = ld_gain(sim, 0, v, 0.5);

    // close loop v_gain = v_feedback
    [sim] = libdyn_close_loop(sim, v_gain, v_feedback);


    [sim,x] = ld_ztf(sim, 0, v, 1/(z-1) * T_a ); // Integrator approximation  

    // feedback gain
    [sim,x_gain] = ld_gain(sim, 0, x, 0.6);

    // close loop x_gain = x_feedback
    [sim] = libdyn_close_loop(sim, x_gain, x_feedback);
endfunction


// The main real-time thread
function [sim, outlist, userdata] = Thread_MainRT(sim, inlist, userdata)
    // This subsystem will run in a thread and regularly executed
    [sim, Tpause] = ld_const(sim, 0, 1/20);  // The sampling time that is constant at 20 Hz in this example
    [sim, out] = ld_ClockSync(sim, 0, in=Tpause); // synchronise this simulation to a clock

    // print the time interval
    //  [sim] = ld_printf(sim, 0, Tpause, "Time interval [s]", 1);

    // save the absolute time into a file
    [sim, time] = ld_clock(sim, 0);
    //  [sim] = ld_savefile(sim, 0, fname="AbsoluteTime.dat", source=time, vlen=1); // needs a non read-only filesystem

    //
    // Add you own control system here
    //

    // Configure the connection to the node.js instance that forwards the data to and from a HTML-GUI
    Configuration.UnderlyingProtocoll = "UDP";

    // Destination of the node.js instance 
    Configuration.DestHost = "127.0.0.1";      
    Configuration.DestPort = 20000;

    // Listen on:
    Configuration.LocalSocketHost = "127.0.0.1";
    Configuration.LocalSocketPort = 20001;

    // Init
    [sim, PacketFramework] = ld_PF_InitInstance(sim, InstanceName="PaPi__", Configuration);

    // Enabling debug mode causes additional printf-messages during runtime
    PacketFramework.Configuration.debugmode = %f;


    // Register a new parameter
    [sim, PacketFramework, Parameter1]=ld_PF_Parameter(sim, PacketFramework, NValues=1, datatype=ORTD.DATATYPE_FLOAT, ParameterName="Parameter1");
    [sim] = ld_printf(sim, 0, Parameter1, "Parameter1 ", 1);

    // implement some dynamic system so this demo is not so empty
    [sim, x,v] = damped_oscillator(sim, u=Parameter1);

    // Create a new stream of signals to be send to the GUI
    Stream=NewStream('GUI');

    // Please Note: only signals of size 1 and type ORTD.DATATYPE_FLOAT are accepted by AddSignalToStream!
    [Stream] = AddSignalToStream(Stream, SigName="x", Sig=x); 
    [Stream] = AddSignalToStream(Stream, SigName="v", Sig=v); 

    // Finish the stream
    [sim, PacketFramework, Stream, StreamSig] = FinalizeStream(sim, PacketFramework, Stream);

    
    //         // Optional to NewStream: This also accepts vector-signals (len>1) of size NValues_send
    //        [sim, PacketFramework]=ld_SendPacket(sim, PacketFramework, Signal=x, NValues_send=1, datatype=ORTD.DATATYPE_FLOAT, SourceName="x")


    // stores static information of this application
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
    [sim, outlist, computation_finished] = ld_async_simulation(sim, 0, ...
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


