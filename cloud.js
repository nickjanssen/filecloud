var formidable = require('formidable'),
	http = require('http'),
	util = require('util');

var path = require('path');
var _ = require('underscore');
var qs = require('querystring');
var fs = require('fs');
var mkdirp = require('mkdirp');
var os = require('os');


var config = require('./config.json');

var s3 = require('s3');

var client = s3.createClient({
	maxAsyncS3: 20, // this is the default
	s3RetryCount: 3, // this is the default
	s3RetryDelay: 1000, // this is the default
	multipartUploadThreshold: 20971520, // this is the default (20 MB)
	multipartUploadSize: 15728640, // this is the default (15 MB)
	s3Options: {
		accessKeyId: config.accessKeyId,
		secretAccessKey: config.secretAccessKey,
		// any other options are passed to new AWS.S3()
		// See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
	},
});

var getAuthUser = function (key) {
	var user = null;
	_.each(require('./keys.json'), function (obj) {
		if (obj.key === key) {
			user = obj;
		}
	});

	return user;
};

http.createServer(function(req, res) {

	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
		'Access-Control-Allow-Headers': '*'
	});

	if (req.method.toLowerCase() === 'delete') {
        var body = '';
        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            if (body.length > 1e6)
                req.connection.destroy();
        });
        req.on('end', function () {
        	var json = JSON.parse(body);

			var user = getAuthUser(json.key);

			if (!user) {
    			res.end('Access denied.');
    			return;
    		}

    		var bucketKey = json.url.replace(config.endPoint + '/', '');

    		client.deleteObjects({
				Bucket: config.bucket,
				Delete: {
					Objects: [
						{
							Key: bucketKey
						}
					]
				}
    		});

        });
	}

	if (req.method.toLowerCase() === 'post') {
		var form = new formidable.IncomingForm();
		form.keepExtensions = true;

		form.parse(req, function(err, fields, files) {

			var user = getAuthUser(fields.key);

			if (!user) {
				res.end('Access denied.');
				fs.unlink(files.file.path);
				return;
			}

			var params = {
				localFile: files.file.path,

				s3Params: {
					Bucket: config.bucket,
					Key: user.site + '/' + path.basename(files.file.path),
					// other options supported by putObject, except Body and ContentLength.
					// See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
				},
			};

			var uploader = client.uploadFile(params);

			uploader.on('error', function (err) {
				console.error('unable to upload:', err.stack);
			});

			uploader.on('end', function () {

				fs.unlink(files.file.path);

				res.writeHead(200, {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
					'Access-Control-Allow-Headers': '*',
					'content-type': 'text/plain'
				});

				res.end(JSON.stringify({
					url: config.endPoint + '/' + user.site + '/' + path.basename(files.file.path)
				}));

			});

		});
		return;
	} else {
		res.end();
	}

}).listen(5000);
