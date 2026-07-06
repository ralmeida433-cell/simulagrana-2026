const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
// wait, jsdom doesn't have canvas implementation unless canvas is installed
// Let me write a tiny React script or test it in the browser?
