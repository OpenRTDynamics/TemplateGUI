# TemplateGUI
This repository holds a template for an ORTD-realtime program controlled by an HTML-based GUI 

Important files are:

* RTMain.sce: The ORTD-based real-time program
* ORTDTargetServer.js: A node.js script to forward the data in-between the HTML-GUI and the real-time program
* html/GUITemplate.html: A template for a GUI

To run this demo it is required that you have node.js (commands node and npm), as well as OpenRTDynamics (command ortdrun), installed

To install modules required by node.js issue:

$ npm install

To launch the demo issue:

$ npm run

Point your browser to localhost:8091/GUITemplate.html
