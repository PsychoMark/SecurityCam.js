var fs = require('fs');
var util = require('util');
var stream = require('stream');

var FfmpegCommand = require('fluent-ffmpeg');

var helpers = require('./helpers');
var BaseProcessor = require('./baseprocessor');


function FFMPEGProcessor()
{
    BaseProcessor.apply(this, arguments);
}

util.inherits(FFMPEGProcessor, BaseProcessor);



FFMPEGProcessor.prototype.run = function()
{
	var self = this;
	var filename = helpers.createVariableFilename(this.cam.options.filename, this.now,
	{
		camId: this.camId
	});

	var tempFilename = filename + '.recording';
	var cleanup = function()
	{
		fs.rename(tempFilename, filename, function(err)
		{
			console.log('Error: could not move ' + tempFilename + ' to ' + filename + ': ' + err.message);
			self.doEnd();
		});
	}


	var command = new FfmpegCommand();
	command
		.input(this.cam.options.input)
		.inputOptions(['-t ' + this.cam.options.time]);

	if (typeof(this.cam.options.inputFormat) !== 'undefined')
	{
		command.inputFormat(this.cam.options.inputFormat);
		if (this.cam.options.inputFormat === 'mjpeg')
			command.inputOption('-use_wallclock_as_timestamps 1');
	}

	command
		.output(tempFilename)
		.videoCodec(this.cam.options.videoCodec)
		.outputFormat(this.cam.options.outputFormat);

	command.on('error', function(err, stdout, stderr)
	{
		console.log('Error: FFmpeg output:' + err.message);
		cleanup();
	});

	command.on('end', function()
	{
		cleanup();
	});

	self.doStart();
	command.run();

	FFMPEGProcessor.super_.prototype.run.call(this);
}


module.exports = FFMPEGProcessor;