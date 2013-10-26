
fcViews.relative = RelativeView;

function RelativeView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	BasicView.call(t, element, calendar, 'relative');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDates = calendar.formatDates;
	
	
	
	function render(date, delta) {
		
		var before = opt('daysBeforeToday') || 0;
		var after = 2 + opt('daysAfterToday') || 0;
		if (delta) {
			addDays(date, delta * (before + after-1));
		}
		
		var start = addDays(cloneDate(date), - before);
		var end = addDays(cloneDate(start), after+1);
		
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var weekends = opt('weekends');
		if (!weekends) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		
		var cols = dayDiff(visEnd,visStart);
		var rowCnt = (t.calendar.rooms !== undefined)? t.calendar.rooms.length : 0;

		renderBasic(rowCnt, cols, false, before + after -1);
	}	
}
