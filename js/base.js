//Create roomsy global
if (typeof(roomsy) === 'undefined') {
	var roomsy = {};
}

roomsy.bookingForm = {};
roomsy.bookingForm.IFRAMEWIDTH = 640;
roomsy.bookingForm.IFRAMEHEIGHT = 500;
roomsy.bookingForm.HEIGHTBUFFER = 10; //Arbitrary height buffer for dialog box

//Mixpanel integration
//var mpq=[];mpq.push(["init","38e4c7aabe404e5854716102c81bcbf5"]);(function(){var b,a,e,d,c;b=document.createElement("script");b.type="text/javascript";b.async=true;b.src=(document.location.protocol==="https:"?"https:":"http:")+"//api.mixpanel.com/site_media/js/api/mixpanel.js";a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(b,a);e=function(f){return function(){mpq.push([f].concat(Array.prototype.slice.call(arguments,0)))}};d=["init","track","track_links","track_forms","register","register_once","identify","name_tag","set_config"];for(c=0;c<d.length;c++){mpq[d[c]]=e(d[c])}})();

//Function getBaseURL
//returns baseURL
var getBaseURL = function () {
		var LOCALHOST_BASE_URL = 'http://localhost/calendar/',
			url = location.href,
			baseURL = url.substring(0, url.indexOf('/', 8)); //BaseURL goes till first '/' after http:// or https://
		
		//returns the base URL if it can't fine https://localhost in the url
		/*
		if (baseURL.indexOf('https://localhost') === -1) {
			return baseURL + '/';
		}
		*/
		return LOCALHOST_BASE_URL;
		
}

$(function () {
	//mpq.name_tag($('#user-email').text());
});