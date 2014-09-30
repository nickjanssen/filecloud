# Filecloud

A node.js service that allows you to POST files, store them on S3 and receive a URL in return.
You can also perform a DELETE request with a url parameter to delete the file from S3.

## Configuration

Create a `config.json` file in the root repo folder, and add the following:

```
{
	"endPoint": "http://my-cool-site.s3-website-us-east-1.amazonaws.com",
	"accessKeyId": "YOUR S3 KEY ID",
	"secretAccessKey": "YOUR S3 ACCESS KEY"
}
```

## Authentification

Create a `keys.json` file in the root repo folder. This file contains an array of objects with a `key` and `site` member.

### Example
```
[
	{
		"key": "TP529hc81XqVXpF",
		"site": "my-cool-site1"
	},
	{
		"key": "zNfE4Yim9wwTpaU",
		"site": "my-cool-site2"
	}
]
```

## Posting files

You need to POST files to this server using a file upload form. Or use AngularJS $upload. Be sure to pass a `key` parameter that matches one of the keys in `keys.json`.

## Deleting files

Make a DELETE request, and pass in a `key`.

## Running the service

Simply run `node cloud.js`.

## License

MIT