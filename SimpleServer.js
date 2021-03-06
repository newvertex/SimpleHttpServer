#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var path = require('path');
let program = require('commander');

const VERSION = require('./package.json').version;
delete require.cache[require.resolve('./package.json')];

program
  .version(VERSION)
  .option('-p, --port <port-number>', 'Change server port')
  .option('-l, --live-reload-url <url>', 'Change Live Reload url')
  .parse(process.argv);

const PORT = program.port || 1337;

// LiveReload constants, Edit first line
const LIVE_RELOAD_URL = program.liveReloadUrl ||  'http://localhost:35729/livereload.js';

const LIVE_RELOAD_TAG = '<script type="text/javascript" src="' + LIVE_RELOAD_URL + '"></script>';

if(!String.prototype.insertAt){
  String.prototype.insertAt = function(index = 0, string = '') {
    if(index>0)
		return this.substring(0, index) + string + this.substring(index, this.length);
    else
		return this + string;
  };
}

var contentType = {
  '.html' : 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png'
};

function getType(ext) {
  return {'Content-Type': ext ? contentType[ext] : 'text/plain'};
}

function read(res, url) {
  url = '.' + url;  //Go to current directory

  if (url.length < 3) {  //If root requested then return index file
    url += 'index.html';
  }

  fs.access(url, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, getType());
      res.end('404 Not Found.\n' + err);
      return;
    }

    fs.readFile(url, (err, data) => {
      if (err) {
        res.writeHead(500, getType());
        res.end('500 Internal error.\n</hr>Contact administrator.');
        return;
      }

	  // Add LiveReload script tag to all html page before close body tag
	  if (path.extname(url) == '.html' || path.extname(url) == '.htm') {
		data = String(data);
        data = data.insertAt(data.lastIndexOf('</body>'), LIVE_RELOAD_TAG);
      }

      res.writeHead(200, getType(path.extname(url)));
      res.end(data);
    });

  });
}

http.createServer((req, res)=>{
  var url = req.url;
  read(res, url);
}).listen(PORT);
console.log(`Server Running on ${PORT} ....`);
