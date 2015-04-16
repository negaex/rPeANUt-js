# rnutjs
rnutjs is a web-based IDE, assembler and emulator for the Australian National University (ANU)'s architecture rPeANUt.

There is a live version at [***REMOVED***.com/app/rnutjs](http://***REMOVED***.com/app/rnutjs).

The goal of this project was to create an IDE that would facilitate working across different devices. The original rPeANUt simulator is written in Java, which isn't supported by current iOS devices. Although this web implementation falls short in terms of speed (it will run at about 2/3rd the speed), it can be run on any modern browser (not tested in IE or Opera; has known bugs running in Firefox).

It makes use of HTML5 local storage and the Dropbox API to store and synchronize files across sessions and devices.

The IDE is mobile-web-app capable, allowing it to be run on mobile devices without the of UI the browser.

Features coming in future updates:
  1. Macros
  2. #include
  3. Strings in blocks

Preview
=======

Image 1: Preview of running program.
![alt tag](https://raw.githubusercontent.com/***REMOVED***/rnutjs/master/preview0.png)

Image 2: Preview of file storage.
![alt tag](https://raw.githubusercontent.com/***REMOVED***/rnutjs/master/preview1.png)
