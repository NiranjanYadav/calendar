//Occurs when an booking is clicked. Gets an event that represents the booking as parameter.
roomsy.bookingClicked = function(event){
	var bookingID = event.booking_id, //???
		OUT_OF_ORDER = 3;
	
	if (event.state === OUT_OF_ORDER) {// Open out of order booking
		roomsy.openBookingDialog('booking/edit_out_of_order/' + bookingID + '/1');
		$("#booking_dialog").dialog({title: 'Edit Out of Order '+bookingID});
		
	}
	else {//Open normal booking
		roomsy.openBookingDialog('booking/edit_booking/' + bookingID + '/1');
		$("#booking_dialog").dialog({title: 'Booking ID: ' + bookingID});
		
	}
}

//Occurs when an booking is clicked. Gets an event that represents the booking as parameter.
roomsy.roomNameClicked = function(roomDiv){
	var roomID = roomDiv.attr("id");
	//$('#room_edit_dialog').dialog('close');
	$('#room_edit_dialog').dialog('open');
	
	var url = getBaseURL() + 'index.php/room/view_room_edit_form/' + roomID + '/1';
	$('#room_edit_dialog').dialog('close');
	$('#room_edit_dialog').dialog('open');
	
	// open the booking dialog once the content is loaded
	$('#room-edit-dialog-iframe').attr("src", url);
	$("#room_edit_dialog").dialog({
		title: 'Edit Room: ',
		width: 'auto',
		height: 'auto'
	});
	
}



//Occurs when an booking is resized. Gets an event that represents the booking as parameter.
roomsy.bookingResized = function(event, dayDelta, minuteDelta, revertFunc) {	
	var dateFrom1 = formatDate(addDays(cloneDate(event.start), -dayDelta),"yyyy-MM-dd");
	var dateTo1 = formatDate(addDays(cloneDate(event.end || event.start), -dayDelta),"yyyy-MM-dd");
	
	var dateFrom2 = formatDate(event.start,"yyyy-MM-dd");
	var dateTo2 = formatDate(addDays(cloneDate(event.end || event.start), 1),"yyyy-MM-dd");

	// used for update_calendar_booking. The calendar view and php's dates are 1 day off.
	var dateFrom1_actual = formatDate(addDays(cloneDate(event.start), 0),"yyyy-MM-dd");
	var dateTo1_actual = formatDate(addDays(cloneDate(event.end), 0),"yyyy-MM-dd");
	
	var room_id = rooms[event.room].room_id;
	var state = event.state;
	
	if (!confirm("Change check-out date from " + dateTo1 +" to " + dateTo2 + "?")){
		revertFunc();
	} 
	else {
		$.get(getBaseURL() + 'index.php/calendar/resize_booking_room_history/'+event.booking_id+"/"+room_id+"/"+state+"/"+dateFrom1_actual+"/"+dateTo1_actual+"/"+dateFrom2+"/"+dateTo2, function(data){
			if (data != "success") {
				alert(data);
				revertFunc();
			} else {
				// reload booking_list_wrap and calendar
				roomsy.reloadBookings();

				window.parent.socket.emit('newBooking', {
					'companyID': window.parent.$('#current-hotel').val(),
					'checkInDate': $('#check_in_date').val(),
					'checkOutDate': $('#check_out_date').val(),
					'bookingID': $('#booking_id').val()
				});
			}			
		});
	}
}

//Creates calendar
roomsy.buildCalendar = function(){

	var dateString = $("#sellingDate").text();		
	var date = new Date(dateString.replace(/-/g,'/'));
	
	roomsy.calendar = $('#calendar').fullCalendar({			
		monthFromBeginningOnly: true, //Set this true if you want calendar always start from the first day
		
		year: date.getFullYear(),
		month: date.getMonth(),
		date: date.getDate(),
		
		defaultView: 'relative',
		selectable: true,
		selectHelper: true,
		showNumbers: false,
		
		//weekends: false,
		//height: 700,
		//contentHeight: 500,
		//aspectRatio: 2,
		//weekMode: 'variable',
		rowsHeight: '1.8em',
		
		header: {
			left: 'title',
			center: null,
			//center: 'month,agendaWeek,basicWeek,agendaDay,basicDay prevYear,nextYear',
			//right: 'month,relative today prev,next'
			right: 'prev,next'
		},
		
		buttonText: {
			prev: '&nbsp;&#9668;&nbsp;',
			next: '&nbsp;&#9658;&nbsp;',
			prevYear: '&nbsp;&lt;&lt;&nbsp;',
			nextYear: '&nbsp;&gt;&gt;&nbsp;',
			//today: 'today',
			month: 'month',
			//week: 'week',
			relative: 'relative'
			//day: 'day'
		},
		
		editable: true,
		//disableDragging: true,
		//disableResizing: true,
		dragOpacity: .5,
		dragRevertDuration: 100,
		
		allDayText: 'ALLDAY',
		firstHour: 10,
		slotMinutes: 15,
		defaultEventMinutes: 45,
		allDayDefault: true,
		
		//Text format for columnn headers
		columnFormat: "dd<br>ddd",
		timeFormat: "h(:mm)[T]{ - h(:mm)T}",
		titleFormat: "yyyy-MM-dd { -yyyy-MM-dd }",

		//today is acquired from looking up DIV
		today: dateString.replace(/-/g,'/'),

		daysBeforeToday: 7,
		daysAfterToday: 23,
	
		eventClick: roomsy.bookingClicked,
		//dayClick: roomsy.dayClicked,
		viewChanged: roomsy.viewChanged,
		eventResize: roomsy.bookingResized,
		eventDrop: occupacyMoved,
		eventSources: [getCalendarBookings],
		rooms: rooms
		
	});
	
	$("#room_edit_dialog").dialog({
		title: 'Edit Room',
		autoOpen: false,
		width: 510,
		height: 260,
		resizable: false
	});
	
	$('#room_edit_dialog').html($('<iframe />', {
		'id': 'room-edit-dialog-iframe',
		'scrolling': 'no',
		'frameborder': 0,
		'width': 460,
		'height': 190
	}));
		
	// if the user has owner permission, then the user can edit Room name and Room type by clicking on Room name on calendar
	$(".room-name").on("click", function() {
		roomsy.roomNameClicked($(this));
	});


	$(".add-new-reservation").on('click', function(e){
		roomsy.openBookingDialog(getBaseURL() + 'index.php/booking/create_booking/0');
		$("#booking_dialog").dialog({title: 'New reservation'});
		//mpq.track("Open New Booking Form", {"type":"Reservation"}); //mixpanel tracking
	});

}

//Create bookings by clicking on calendar
//NOT COMPLETE
//Callback function called by initialization of calendar
roomsy.dayClicked = function( date, allDay, jsEvent, view) {
	$("#booking_dialog").dialog({title: 'New reservation'});
	roomsy.openBookingDialog(getBaseURL() + 'index.php/booking/create_booking/0');
}

//Gets rooms data from rooms.xml
//JAEYUN MAGIC - Lots of globals here. Needs to be fixed
roomsy.getRooms = function(callback){

	data = [{"room_name":"101","room_id":"44","can_be_sold_online":"0","room_type_acronym":"ND","room_type":"Non-Smoking Double"},{"room_name":"102","room_id":"45","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"103","room_id":"46","can_be_sold_online":"0","room_type_acronym":"ND","room_type":"Non-Smoking Double"},{"room_name":"104","room_id":"47","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"105","room_id":"48","can_be_sold_online":"0","room_type_acronym":"ND","room_type":"Non-Smoking Double"},{"room_name":"106","room_id":"49","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"107","room_id":"50","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"108","room_id":"51","can_be_sold_online":"0","room_type_acronym":"ND","room_type":"Non-Smoking Double"},{"room_name":"109","room_id":"52","can_be_sold_online":"0","room_type_acronym":"ND","room_type":"Non-Smoking Double"},{"room_name":"110","room_id":"53","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"111","room_id":"54","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"112","room_id":"129","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"114","room_id":"56","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"115","room_id":"57","can_be_sold_online":"0","room_type_acronym":"SS","room_type":"Smoking Single"},{"room_name":"116","room_id":"58","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"117","room_id":"59","can_be_sold_online":"0","room_type_acronym":"SS","room_type":"Smoking Single"},{"room_name":"118","room_id":"60","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"119","room_id":"61","can_be_sold_online":"0","room_type_acronym":"SS","room_type":"Smoking Single"},{"room_name":"120","room_id":"62","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"121","room_id":"63","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"122","room_id":"64","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"123","room_id":"65","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"124","room_id":"66","can_be_sold_online":"0","room_type_acronym":"SS","room_type":"Smoking Single"},{"room_name":"125","room_id":"67","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"126","room_id":"68","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"127","room_id":"69","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"128","room_id":"70","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"129","room_id":"71","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"130","room_id":"72","can_be_sold_online":"0","room_type_acronym":"SD","room_type":"Smoking Double"},{"room_name":"131","room_id":"73","can_be_sold_online":"0","room_type_acronym":"SS","room_type":"Smoking Single"},{"room_name":"132","room_id":"74","can_be_sold_online":"0","room_type_acronym":"SS","room_type":"Smoking Single"},{"room_name":"133","room_id":"75","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"},{"room_name":"134","room_id":"76","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"},{"room_name":"135","room_id":"77","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"},{"room_name":"136","room_id":"78","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"},{"room_name":"137","room_id":"79","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"},{"room_name":"138","room_id":"80","can_be_sold_online":"0","room_type_acronym":"NS","room_type":"Non-Smoking Single"},{"room_name":"139","room_id":"81","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"},{"room_name":"140","room_id":"82","can_be_sold_online":"0","room_type_acronym":"EXEC","room_type":"Executive"}];

	//Initialize Variables
	//For each Data
	var roomsArray = new Array();
	rooms = new Array();
	roomIds = new Array();
	
	$(data).each(function(index, roomObject){			
		//rebuild objects in roomsArray but trim roomtype length
		//******************************
		roomsArray[index] = {};				
		roomsArray[index].name = roomObject.room_name;				
		
		
		if (roomObject.room_type_acronym != null) 
		{
			if (roomObject.room_type_acronym) 
			{
				roomsArray[index].room_type = roomObject.room_type_acronym;
			}
			else if (roomObject.room_type.length > 6) // trims room type to 6 characters prevent from being too long and messing up the columns
			{
				roomsArray[index].room_type = roomObject.room_type.substr(0,6); // trims room type to 6 characters
			}
			else 
			{
				roomsArray[index].room_type = roomObject.room_type;
			}
		} else
		{
			roomsArray[index].room_type = "";
		}
		roomsArray[index].room_id = roomObject.room_id;
		//******************************
		
		// wtf --- this makes no sense JAEYUN MAGIC
		// update June 25, 2011. The code below ensures that
		// the bookings are aligned with the rooms accordingly on calendar display.
		if(roomIds[roomObject.room_id] === undefined){ //because variables are global this somehow works...
			
			roomIds[roomObject.room_id] = rooms.length; //why length?
			rooms[rooms.length] = roomObject.room_id;
		}
		
	});
	
	rooms = roomsArray; //Rebuild array of room objects
	
	if(callback !== undefined) {
		callback(bookings);
	}
	
}

//Requests rooms XML and builds calendar interface
roomsy.initInterface = function() {
	roomsy.getRooms(roomsy.buildCalendar);
}

$(function() {
	roomsy.initInterface();
});

//If set to true makes script load bookings data every time scope on calendar is changed.
//Set reloadDataEveryRefetch to true if you implemented data saving.
var reloadDataEveryRefetch = true;



//Set to 1 is the check_out_date date is not shown as occuped, 0 - if is.		
var check_out_dateHack = 1;

var bookings = null;
var rooms = [];
var room_names = [];

// EVENT HANDLERS ###################################################################

//Occures when an booking is moved. Gets an event that represents the booking as parameter.
function occupacyMoved(event,dayDelta,minuteDelta,allDay,revertFunc,ev,ui,roomDelta) {
	
	var dateFrom1 = formatDate(addDays(cloneDate(event.start), -dayDelta),"yyyy-MM-dd");
	var dateTo1 = formatDate(addDays(cloneDate(event.end || event.start), -dayDelta),"yyyy-MM-dd");
	var dateFrom2 = formatDate(event.start,"yyyy-MM-dd");
	var dateTo2 = formatDate(addDays(cloneDate(event.end || event.start), 1),"yyyy-MM-dd");
	
	var room1 = rooms[event.room-roomDelta].name;
	var room2 = rooms[event.room].name;
	var type1 = rooms[event.room-roomDelta].room_type;
	var type2 = rooms[event.room].room_type;
	var room_id = rooms[event.room].room_id;
	var state = event.state;
	
	// Generate alert string for moving booking blocks
	confirmation_string = "";
	if (type1 != type2) {
		confirmation_string = confirmation_string + "- Roomtype will be changed from "+type1+" to "+type2+"\n";
	}
	if (room1 != room2) {
		confirmation_string = confirmation_string + "- Room will be changed from "+room1+" to "+room2+"\n";
	}
	if (dateFrom1 != dateFrom2)
	{
		confirmation_string = confirmation_string + "- Check-in date will change from "+dateFrom1+" to "+dateFrom2+"\n";
	}
	confirmation_string = confirmation_string + "Are you sure?";
	
	if (!confirm(confirmation_string)){
		revertFunc();
		
	} else
		$.get(getBaseURL() + 'index.php/calendar/move_booking_room_history/'+event.booking_id+"/"+room_id+"/"+state+"/"+dateFrom1+"/"+dateTo1+"/"+dateFrom2+"/"+dateTo2, function(data){
			if (data != "success") {
				alert(data);
				revertFunc();
			} else {
			
				// reload booking_list_wrap
				roomsy.reloadBookings();

				window.parent.socket.emit('newBooking', {
					'companyID': window.parent.$('#current-hotel').val(),
					'checkInDate': $('#check_in_date').val(),
					'checkOutDate': $('#check_out_date').val(),
					'bookingID': $('#booking_id').val()
				});
			}
		});

	
	
	//that's how we can get booking object from the event
	//console.log(convertToBooking(event).check_out_date);
}



//###################################################################################

//Get booking data
//Format is decided by Full Calendar format. See FullCalendar online documentation.
function getCalendarBookings(start, end, callback){
	var param = 'start=' + encodeURIComponent(start.toUTCString()) + '&end=' + encodeURIComponent(end.toUTCString());	

	bookingObjects = [{"booking_id":"77326","room_id":"44","check_in_date":"2013-09-01","check_out_date":"2013-09-10","room_name":"101","state":"1","customer_name":"Ensign Drilling","balance":"321.55","color":"false","guest_name":"Dave","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"59494","room_id":"44","check_in_date":"2013-07-28","check_out_date":"2013-08-30","room_name":"101","state":"2","customer_name":"Vertex","balance":"861.1","color":"false","guest_name":"Donald","guest_count":"2","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"40967","room_id":"45","check_in_date":"2013-03-25","check_out_date":"2013-12-31","room_name":"102","state":"3","customer_name":null,"balance":"0","color":"","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77344","room_id":"46","check_in_date":"2013-08-30","check_out_date":"2013-08-31","room_name":"103","state":"2","customer_name":"John","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"74400","room_id":"46","check_in_date":"2013-09-03","check_out_date":"2013-09-13","room_name":"103","state":"1","customer_name":"KellerDenali Construction","balance":"258.33","color":"false","guest_name":"Chris Royce","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75478","room_id":"46","check_in_date":"2013-09-20","check_out_date":"2013-09-27","room_name":"103","state":"0","customer_name":"Corporate Lodging","balance":"0","color":"false","guest_name":"Stein Gregory","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77040","room_id":"46","check_in_date":"2013-08-29","check_out_date":"2013-08-30","room_name":"103","state":"2","customer_name":"Harry Osteneck","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77774","room_id":"47","check_in_date":"2013-09-02","check_out_date":"2013-09-04","room_name":"104","state":"2","customer_name":"Sperry Rail Services","balance":"0","color":"false","guest_name":"Craig Vanderputt","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77029","room_id":"47","check_in_date":"2013-09-06","check_out_date":"2013-09-12","room_name":"104","state":"0","customer_name":"CLC","balance":"84.48","color":"false","guest_name":"Clean Harbors Canada","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"78038","room_id":"47","check_in_date":"2013-09-04","check_out_date":"2013-09-05","room_name":"104","state":"2","customer_name":"Pace Technology","balance":"0","color":"false","guest_name":"Chris Boyle","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75476","room_id":"47","check_in_date":"2013-09-20","check_out_date":"2013-09-27","room_name":"104","state":"0","customer_name":"Corporate Lodging","balance":"0","color":"false","guest_name":"Stein Gregory","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75479","room_id":"48","check_in_date":"2013-09-20","check_out_date":"2013-09-27","room_name":"105","state":"0","customer_name":"Corporate Lodging","balance":"0","color":"false","guest_name":"Stein Gregory","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76888","room_id":"48","check_in_date":"2013-08-29","check_out_date":"2013-09-13","room_name":"105","state":"1","customer_name":"precision drilling","balance":"-402.99","color":"false","guest_name":"Andrew Hofer","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75996","room_id":"49","check_in_date":"2013-09-02","check_out_date":"2013-09-11","room_name":"106","state":"1","customer_name":"Techmation","balance":"300.84","color":"false","guest_name":"Allan Wiebe","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77301","room_id":"49","check_in_date":"2013-08-30","check_out_date":"2013-08-31","room_name":"106","state":"2","customer_name":"David Macdonald","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"75477","room_id":"49","check_in_date":"2013-09-20","check_out_date":"2013-09-27","room_name":"106","state":"0","customer_name":"Corporate Lodging","balance":"0","color":"false","guest_name":"Stein Gregory","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77072","room_id":"50","check_in_date":"2013-08-29","check_out_date":"2013-08-30","room_name":"107","state":"2","customer_name":"precision drilling","balance":"0","color":"false","guest_name":"Alex Mitchell Lavery","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77032","room_id":"50","check_in_date":"2013-09-06","check_out_date":"2013-09-12","room_name":"107","state":"0","customer_name":"CLC","balance":"95.38","color":"false","guest_name":"Clean Harbors Canada","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77819","room_id":"50","check_in_date":"2013-09-02","check_out_date":"2013-09-03","room_name":"107","state":"2","customer_name":"David McDonald","balance":"-10.9","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"78398","room_id":"50","check_in_date":"2013-09-04","check_out_date":"2013-09-06","room_name":"107","state":"2","customer_name":"Somervill","balance":"0","color":"false","guest_name":"Bill Codinal & Clara","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"72157","room_id":"51","check_in_date":"2013-08-11","check_out_date":"2013-10-11","room_name":"108","state":"1","customer_name":"Pyramid Corporation","balance":"2238.86","color":"false","guest_name":"Simon Darley","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"77169","room_id":"52","check_in_date":"2013-09-03","check_out_date":"2013-09-12","room_name":"109","state":"1","customer_name":"Amalgamated Heating","balance":"258.33","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"76165","room_id":"52","check_in_date":"2013-08-27","check_out_date":"2013-08-30","room_name":"109","state":"2","customer_name":"helen and grace","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"65967","room_id":"53","check_in_date":"2013-07-28","check_out_date":"2013-10-31","room_name":"110","state":"1","customer_name":"Sandy Saunders","balance":"-1047.6","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77031","room_id":"54","check_in_date":"2013-09-06","check_out_date":"2013-09-12","room_name":"111","state":"0","customer_name":"CLC","balance":"95.38","color":"false","guest_name":"Clean Harbors Canada","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77043","room_id":"54","check_in_date":"2013-09-02","check_out_date":"2013-09-05","room_name":"111","state":"2","customer_name":"Standard west steel","balance":"0","color":"false","guest_name":"Mitch Anderson","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"65404","room_id":"54","check_in_date":"2013-07-15","check_out_date":"2013-08-30","room_name":"111","state":"2","customer_name":"Everett Pride Constructio","balance":"0","color":"false","guest_name":"Jarett Sealock","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"78605","room_id":"54","check_in_date":"2013-09-05","check_out_date":"2013-09-06","room_name":"111","state":"2","customer_name":"Gordon Satermo","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"69523","room_id":"129","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"112","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1377.76","color":"false","guest_name":null,"guest_count":"0","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"76456","room_id":"129","check_in_date":"2013-09-03","check_out_date":"2013-09-16","room_name":"112","state":"0","customer_name":"AB rail","balance":"172.22","color":"false","guest_name":"Shawn Duffet","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"76977","room_id":"56","check_in_date":"2013-09-08","check_out_date":"2013-11-10","room_name":"114","state":"0","customer_name":"Everett Pride Constructio","balance":"0","color":"","guest_name":"Jarett Sealock","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"78747","room_id":"56","check_in_date":"2013-09-06","check_out_date":"2013-09-07","room_name":"114","state":"1","customer_name":"Somer Bill","balance":"-97.01","color":"false","guest_name":"Bill & Clara ","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"73621","room_id":"56","check_in_date":"2013-08-27","check_out_date":"2013-09-06","room_name":"114","state":"2","customer_name":"KellerDenali Construction","balance":"0","color":"false","guest_name":"Derek Lantz","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"68364","room_id":"57","check_in_date":"2013-08-04","check_out_date":"2013-09-26","room_name":"115","state":"1","customer_name":"Allan Peterson","balance":"0","color":"false","guest_name":"BP Pump","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"65965","room_id":"58","check_in_date":"2013-07-27","check_out_date":"2013-10-31","room_name":"116","state":"1","customer_name":"Andrew Konorowski","balance":"-987.74","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77802","room_id":"59","check_in_date":"2013-09-02","check_out_date":"2013-09-03","room_name":"117","state":"2","customer_name":"Asplundh","balance":"258.33","color":"false","guest_name":"Raymond Therrien (ASPLUNDH Canada)","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"69524","room_id":"59","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"117","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1323.26","color":"false","guest_name":"Alan Chopp","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"76464","room_id":"59","check_in_date":"2013-09-03","check_out_date":"2013-09-16","room_name":"117","state":"0","customer_name":"AB rail","balance":"150.42","color":"false","guest_name":"Joe Diogo","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"55760","room_id":"60","check_in_date":"2013-06-05","check_out_date":"2013-09-04","room_name":"118","state":"2","customer_name":"Cameron Construction","balance":"5809.91","color":"false","guest_name":"Edwin Leader","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"78537","room_id":"60","check_in_date":"2013-09-05","check_out_date":"2013-09-15","room_name":"118","state":"1","customer_name":"Vertex","balance":"86.11","color":"false","guest_name":"Donald Pel'Ipngel","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"69521","room_id":"61","check_in_date":"2013-08-27","check_out_date":"2013-09-01","room_name":"119","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1203.36","color":"false","guest_name":null,"guest_count":"0","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"77206","room_id":"61","check_in_date":"2013-09-01","check_out_date":"2014-04-15","room_name":"119","state":"1","customer_name":"Burt Macburnie","balance":"-944.79","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"68434","room_id":"62","check_in_date":"2013-07-26","check_out_date":"2013-12-04","room_name":"120","state":"1","customer_name":"Murphy Malcolm","balance":"1267.32","color":"false","guest_name":"Kenneth Watkins","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77877","room_id":"63","check_in_date":"2013-09-02","check_out_date":"2013-09-03","room_name":"121","state":"2","customer_name":"Carson Energy","balance":"0","color":"false","guest_name":"Keith Schekk","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76457","room_id":"63","check_in_date":"2013-09-05","check_out_date":"2013-09-16","room_name":"121","state":"1","customer_name":"AB rail","balance":"258.33","color":"false","guest_name":"Orest Stadnyk","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"69520","room_id":"63","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"121","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1236.94","color":"false","guest_name":"Murray MacCuish","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"76458","room_id":"64","check_in_date":"2013-09-05","check_out_date":"2013-09-16","room_name":"122","state":"1","customer_name":"AB rail","balance":"258.33","color":"false","guest_name":"Daniel Stagg","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"69518","room_id":"65","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"123","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1203.36","color":"false","guest_name":null,"guest_count":"0","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"76460","room_id":"65","check_in_date":"2013-09-05","check_out_date":"2013-09-16","room_name":"123","state":"1","customer_name":"AB rail","balance":"258.33","color":"false","guest_name":"Stephen Ginn","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"77241","room_id":"66","check_in_date":"2013-09-03","check_out_date":"2013-09-10","room_name":"124","state":"1","customer_name":"Target Safety","balance":"258.33","color":"false","guest_name":"Todd Clyburn","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"74655","room_id":"66","check_in_date":"2013-08-20","check_out_date":"2013-09-03","room_name":"124","state":"2","customer_name":"Vertex","balance":"1128.15","color":"false","guest_name":"Jamie Grey","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"69519","room_id":"67","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"125","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1203.36","color":"false","guest_name":"Glen Griesser","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"76461","room_id":"67","check_in_date":"2013-09-05","check_out_date":"2013-09-16","room_name":"125","state":"1","customer_name":"AB rail","balance":"258.33","color":"false","guest_name":"Jerome Belhumeur","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76462","room_id":"68","check_in_date":"2013-09-05","check_out_date":"2013-09-16","room_name":"126","state":"1","customer_name":"AB rail","balance":"258.33","color":"false","guest_name":"Evan  Trelly","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"73861","room_id":"68","check_in_date":"2013-08-18","check_out_date":"2013-09-03","room_name":"126","state":"2","customer_name":"Sommerville","balance":"0","color":"false","guest_name":"Les Trepanier","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76558","room_id":"69","check_in_date":"2013-08-29","check_out_date":"2013-10-04","room_name":"127","state":"1","customer_name":"Warren Young","balance":"-451.26","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"78699","room_id":"70","check_in_date":"2013-09-10","check_out_date":"2013-09-20","room_name":"128","state":"0","customer_name":"KellerDenali Construction","balance":"0","color":"false","guest_name":"Derek Lantz","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75035","room_id":"70","check_in_date":"2013-08-22","check_out_date":"2013-09-10","room_name":"128","state":"1","customer_name":"Ensign Drilling","balance":"1306.65","color":"false","guest_name":"John Bedu","guest_count":"2","border_color":"black","warning_message":""},{"booking_id":"78397","room_id":"71","check_in_date":"2013-09-05","check_out_date":"2013-09-18","room_name":"129","state":"0","customer_name":"AB rail","balance":"150.42","color":"false","guest_name":"Junior Martin & Kenneth Paul","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76680","room_id":"71","check_in_date":"2013-09-03","check_out_date":"2013-09-05","room_name":"129","state":"2","customer_name":"Tundra","balance":"0","color":"false","guest_name":"Curt Derous","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"69511","room_id":"71","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"129","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1377.76","color":"false","guest_name":null,"guest_count":"0","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"77170","room_id":"72","check_in_date":"2013-09-03","check_out_date":"2013-09-12","room_name":"130","state":"1","customer_name":"Amalgamated Heating","balance":"291.03","color":"false","guest_name":"Paul Mulligan","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"69522","room_id":"72","check_in_date":"2013-08-19","check_out_date":"2013-09-01","room_name":"130","state":"2","customer_name":"Unimin Blasting Cleaning","balance":"1377.76","color":"false","guest_name":null,"guest_count":"0","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"78062","room_id":"73","check_in_date":"2013-09-04","check_out_date":"2013-09-10","room_name":"131","state":"1","customer_name":"Target Safety","balance":"172.22","color":"false","guest_name":"Andrew Raisbeck","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77773","room_id":"73","check_in_date":"2013-09-02","check_out_date":"2013-09-04","room_name":"131","state":"2","customer_name":"Sperry Rail Services","balance":"0","color":"false","guest_name":"Robert Waugl","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"70693","room_id":"73","check_in_date":"2013-08-06","check_out_date":"2013-08-31","room_name":"131","state":"2","customer_name":"Miroslav Krpan","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"24178","room_id":"74","check_in_date":"2013-01-03","check_out_date":"2013-09-30","room_name":"132","state":"1","customer_name":"James Schiller","balance":"-334.73","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"61290","room_id":"75","check_in_date":"2013-07-21","check_out_date":"2013-11-02","room_name":"133","state":"1","customer_name":"Powell Cats LTD","balance":"3928.09","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77203","room_id":"76","check_in_date":"2013-09-04","check_out_date":"2013-09-17","room_name":"134","state":"1","customer_name":"precision drilling","balance":"194.02","color":"false","guest_name":"Paul Pomehichok & Kyle Da","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"52978","room_id":"76","check_in_date":"2013-07-04","check_out_date":"2013-08-30","room_name":"134","state":"2","customer_name":"Wrangler Locating","balance":"0","color":"false","guest_name":"Robert La Brie","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77304","room_id":"76","check_in_date":"2013-08-30","check_out_date":"2013-09-02","room_name":"134","state":"2","customer_name":"Steven Edward","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77800","room_id":"76","check_in_date":"2013-09-02","check_out_date":"2013-09-04","room_name":"134","state":"2","customer_name":"Asplundh","balance":"291.03","color":"false","guest_name":"Greg Standish","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"56285","room_id":"77","check_in_date":"2013-06-13","check_out_date":"2013-11-05","room_name":"135","state":"1","customer_name":"Gerry Guitard","balance":"998.75","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77204","room_id":"78","check_in_date":"2013-09-04","check_out_date":"2013-09-17","room_name":"136","state":"1","customer_name":"precision drilling","balance":"194.02","color":"false","guest_name":"Sheldon Gagley & Nigel Gader","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76477","room_id":"78","check_in_date":"2013-08-27","check_out_date":"2013-09-04","room_name":"136","state":"2","customer_name":"Precision Drilling","balance":"86.11","color":"false","guest_name":"Andrew MacKinnon","guest_count":"2","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"76595","room_id":"79","check_in_date":"2013-08-31","check_out_date":"2013-09-01","room_name":"137","state":"2","customer_name":"desmond nolan","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77994","room_id":"79","check_in_date":"2013-09-04","check_out_date":"2013-09-07","room_name":"137","state":"1","customer_name":"AB Rail","balance":"391.69","color":"false","guest_name":"Barry Nood","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"52979","room_id":"79","check_in_date":"2013-07-15","check_out_date":"2013-08-30","room_name":"137","state":"2","customer_name":"Wrangler Locating","balance":"0","color":"false","guest_name":"Cassandra Delorme","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"74078","room_id":"79","check_in_date":"2013-08-30","check_out_date":"2013-08-31","room_name":"137","state":"2","customer_name":"Richard Rothwell","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"78320","room_id":"79","check_in_date":"2013-09-07","check_out_date":"2013-10-06","room_name":"137","state":"0","customer_name":"CASA Energy (Denmax)","balance":"0","color":"false","guest_name":"Josh Hesse","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77784","room_id":"79","check_in_date":"2013-09-02","check_out_date":"2013-09-04","room_name":"137","state":"2","customer_name":"CASA Energy (Denmax)","balance":"451.03","color":"false","guest_name":"Josh Hesse","guest_count":"1","border_color":"red","warning_message":"This guest has an outstanding balance"},{"booking_id":"77045","room_id":"80","check_in_date":"2013-09-02","check_out_date":"2013-09-05","room_name":"138","state":"2","customer_name":"Standard west steel","balance":"0","color":"false","guest_name":"Angie Lachance","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77030","room_id":"80","check_in_date":"2013-09-06","check_out_date":"2013-09-12","room_name":"138","state":"0","customer_name":"CLC","balance":"84.48","color":"false","guest_name":"Clean Harbors Canada","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"77856","room_id":"81","check_in_date":"2013-09-11","check_out_date":"2013-09-25","room_name":"139","state":"0","customer_name":"precision drilling","balance":"0","color":"false","guest_name":"Neil Buyse","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"76973","room_id":"81","check_in_date":"2013-09-02","check_out_date":"2013-09-11","room_name":"139","state":"1","customer_name":"Techmation","balance":"344.44","color":"false","guest_name":"Todd Taylor & Mohamed","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75995","room_id":"81","check_in_date":"2013-08-30","check_out_date":"2013-09-01","room_name":"139","state":"2","customer_name":"chris mody & Phil","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"75994","room_id":"82","check_in_date":"2013-08-30","check_out_date":"2013-09-01","room_name":"140","state":"2","customer_name":"Pasquale Barile & Tony","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"77112","room_id":"82","check_in_date":"2013-09-03","check_out_date":"2013-09-10","room_name":"140","state":"1","customer_name":"Ryann Thornton","balance":"192.93","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""},{"booking_id":"78349","room_id":"82","check_in_date":"2013-09-10","check_out_date":"2013-09-24","room_name":"140","state":"0","customer_name":"precision drilling","balance":"0","color":"","guest_name":"Mikel Sabefky","guest_count":"1","border_color":"black","warning_message":""},{"booking_id":"75198","room_id":"82","check_in_date":"2013-08-22","check_out_date":"2013-08-30","room_name":"140","state":"2","customer_name":"Ryann Thornton","balance":"0","color":"false","guest_name":null,"guest_count":"0","border_color":"black","warning_message":""}];
	//console.log(bookingObjects);
 	var bookingsArray = new Array();
 	$(bookingObjects).each(function(index, value){
	  	bookingsArray[index] = new Object();
	  	bookingsArray[index].booking_id = value.booking_id;
	  	bookingsArray[index].room_id = value.room_id;
	  	bookingsArray[index].room_name = value.room_name;
		bookingsArray[index].warning_message = value.warning_message;
		bookingsArray[index].border_color = value.border_color;
		bookingsArray[index].color = value.color;
		
		numberOfStayingGuests = parseInt(value.guest_count);
		
		if (value.state == 3) {// if the booking is Out of Order
			bookingsArray[index].customer_name = 'OUT OF ORDER';
		}
		// if there is more than one "staying" customer
		else if (numberOfStayingGuests > 1 )
		{
			bookingsArray[index].customer_name = value.customer_name + ", "+value.guest_name + " and "+(numberOfStayingGuests-1) +" other(s)";
		}	
		else if (numberOfStayingGuests === 1)
		{
			bookingsArray[index].customer_name = value.customer_name + " with "+value.guest_name;
		} 
		else
		{
			bookingsArray[index].customer_name = value.customer_name;
		}
		
		bookingsArray[index].check_in_date = value.check_in_date;
	  	bookingsArray[index].check_out_date = value.check_out_date; 
	  	bookingsArray[index].state = value.state;
  	});
	var tmp = convertToEvents(bookingsArray);
	bookings = tmp.bookings;
	//rooms = tmp.rooms;
	//room_names = tmp.room_names;
	if(callback !== undefined)
		callback(bookings);
	//calendar.fullCalendar('refetchEvents');
					
		
}

//Converts booking entry (taken from XML) to event used by calendar
function convertToEvents(data){
	var bookings = new Array();
	var rooms = new Array();
	var room_names = new Array();
	
	for(var i in data){
		bookings[i] = new Object();
		bookings[i].booking_id = data[i].booking_id;
	 	bookings[i].title = ""+data[i].customer_name;
		bookings[i].color = ""+data[i].color;
		
		/*if(parseDate===undefined){
			bookings[i].start = new Date(data[i].check_in_date);
		  	bookings[i].end = new Date(data[i].check_out_date);
		}
		else{
			bookings[i].start = parseDate(data[i].check_in_date);
		  	bookings[i].end = addDays(cloneDate(parseDate(data[i].check_out_date)), -check_out_dateHack);
		}*/

		// change that was suggested by Sergei on Feb 26, 2012
		
		bookings[i].start = jQuery.fullCalendar.parseDate(data[i].check_in_date);
		bookings[i].end = addDays(jQuery.fullCalendar.parseDate(data[i].check_out_date), -check_out_dateHack);
	
	  	bookings[i].state = parseInt(data[i].state);
		bookings[i].className = "fc-event"+bookings[i].state+" border-"+data[i].border_color; // For CSS and border color
		bookings[i].warning_message = data[i].warning_message;
						
		
		var rn = data[i].room_id;
		if(roomIds[rn] !== undefined)
			bookings[i].room = roomIds[rn];
		else{
			roomIds[rn] = rooms.length;
			bookings[i].room = roomIds[rn];
			rooms[rooms.length] = rn;
		}
	}
	
	var result = new Object();
	result.bookings = bookings;
	result.rooms = rooms;
	result.room_names = room_names;
	return result;
}

//###################################################################################
roomsy.ajaxError = function(XMLHttpRequest, textStatus, errorThrown){
	if(XMLHttpRequest.status==200)
		$('#errorDiv').html('AJAX error occured: '+textStatus);
	else
		$('#errorDiv').html('AJAX error occured: '+XMLHttpRequest.status+' '+XMLHttpRequest.statusText);
}
//###################################################################################
