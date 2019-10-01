/* ------------------------------------------------------------------
 * node-onvif - service-recording.js
 *
 * Copyright (c) 2019 - 2020, Giuseppe Sisinni, All rights reserved.
 * Released under the MIT license
 * Date: 2019-10-01
 * ---------------------------------------------------------------- */
'use strict';
const mUrl    = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
 * Constructor: OnvifServiceSearch(params)
 * - params:
 *    - xaddr   : URL of the entry point for the search service
 *                (Required)
 *    - user  : User name (Optional)
 *    - pass  : Password (Optional)
 *    - time_diff: ms
 * ---------------------------------------------------------------- */
function OnvifServiceRecording(params) {
	this.xaddr = '';
	this.user = '';
	this.pass = '';

	let err_msg = '';

	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		throw new Error('The value of "params" was invalid: ' + err_msg);
	}

	if('xaddr' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['xaddr'], 'string')) {
			throw new Error('The "xaddr" property was invalid: ' + err_msg);
		} else {
			this.xaddr = params['xaddr'];
		}
	} else {
		throw new Error('The "xaddr" property is required.');
	}

	if('user' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['user'], 'string', true)) {
			throw new Error('The "user" property was invalid: ' + err_msg);
		} else {
			this.user = params['user'] || '';
		}
	}

	if('pass' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['pass'], 'string', true)) {
			throw new Error('The "pass" property was invalid: ' + err_msg);
		} else {
			this.pass = params['pass'] || '';
		}
	}

	this.oxaddr = mUrl.parse(this.xaddr);
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	}

	this.time_diff = params['time_diff'];
	this.name_space_attr_list = [
		'xmlns:tse="http://www.onvif.org/ver10/recording/wsdl"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"',
		'xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"',
		'xmlns:tns1="http://www.onvif.org/ver10/topics"'
	];
};

OnvifServiceRecording.prototype._createRequestSoap = function(body) {
	let soap = mOnvifSoap.createRequestSoap({
		'body': body,
		'xmlns': this.name_space_attr_list,
		'diff': this.time_diff,
		'user': this.user,
		'pass': this.pass
	});
	return soap;
};

/* ------------------------------------------------------------------
 * Method: getRecordings([callback])
 * ---------------------------------------------------------------- */
OnvifServiceRecording.prototype.getRecordings = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<tse:GetRecordings/>';
        
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetRecordings', soap).then((result) => {
			try {
				let d = result['data']['GetRecordingsResponse']['RecordingItem']['RecordingToken'];
				if(!Array.isArray(d)) {
					result['data']['GetRecordingsResponse']['RecordingItem']['RecordingToken'] = [d];
				}
			} catch(e) {}
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

module.exports = OnvifServiceRecording;