
var tdHeightBug;

setDefaults({
	weekMode: 'fixed'
});


function BasicView(element, calendar, viewName) {
	var t = this;
	
	
	// exports
	t.renderBasic = renderBasic;
	t.setHeight = setHeight;
	t.setWidth = setWidth;
	t.renderDayOverlay = renderDayOverlay;
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	t.defaultEventEnd = defaultEventEnd;
	t.getHoverListener = function() { return hoverListener };
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.dayOfWeekCol = dayOfWeekCol;
	t.dateCell = dateCell;
	t.cellDate = cellDate;
	t.cellIsAllDay = function() { return true };
	t.allDayTR = allDayTR;
	t.allDayBounds = allDayBounds;
	t.getRowCnt = function() { return rowCnt };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getDaySegmentContainer = function() { return daySegmentContainer };
	
	
	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	BasicEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var daySelectionMousedown = t.daySelectionMousedown;
	var formatDate = calendar.formatDate;
	
	
	// locals
	var rtl, dis, dit;
	var firstDay;
	var nwe;
	var rowCnt, colCnt;
	var colWidth;
	var viewWidth, viewHeight;
	var thead, tbody;
	var thead0, tbody0;
	var daySegmentContainer;
	var coordinateGrid;
	var hoverListener;
	var colContentPositions;
	
	
	
	/* Rendering
	------------------------------------------------------------*/
	
	
	disableTextSelection(element.addClass('fc-grid'));
	
	
	function renderBasic(r, c, showNumbers) {
	
		rowCnt = r;
		colCnt = c;
		rtl = opt('isRTL');
		if (rtl) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		
		var tm = opt('theme') ? 'ui' : 'fc';
		var colFormat = opt('columnFormat');
		var month = t.start.getMonth();
		var today = clearTime(new Date());
		var s, i, j, d = cloneDate(t.visStart);
		
		var prevRowCnt, prevColCnt;
		
		if (!tbody) // first time, build all cells from scratch
		{ 
			//If the calendar is built for the first time, assume that it should have all the columns
			var prevColCnt = 31;
			
			var exttable = $("<table/>").appendTo(element);
			var tr = $("<tr/>").appendTo(exttable);
			var td1 = $("<td class='room-column'/>").appendTo(tr);
			var td2 = $("<td/>").appendTo(tr);
			
			var table0 = $("<table/>").appendTo(td1);
			td2 = $("<div style='position:relative;' />").appendTo(td2);
			var table = $("<table id='hello'/>").appendTo(td2);
			daySegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(td2);
			
			thead0 = $("<thead><tr><th class='"+tm +"-state-default'>Room</th></tr></thead>").appendTo(table0);
			
			s = "<thead><tr>";
			for (i=0; i</*colCnt*/31; i++) {
				s += "<th class='fc-" +
					/*dayIDs[*/d.getDay()/*]*/ + ' ' + // needs to be first
					tm + '-state-default' +
					(i==dit ? ' fc-leftmost' : '') +
					"'>" + formatDate(d, colFormat) + "</th>";
				addDays(d, 1);
				if (nwe) {
					skipWeekend(d);
				}
			}
			thead = $(s + "</tr></thead>").appendTo(table);
			
			s = "<tbody>";
			s0 = "<tbody>";
			
			for (i=0; i<rowCnt; i++) {
				d = cloneDate(t.visStart);
				s += "<tr class='fc-week" + i + "'>";
				for (j=0; j</*colCnt*/31; j++) {
					s += "<td class='fc-" +
						dayIDs[d.getDay()] + ' ' + // needs to be first
						tm + '-state-default fc-day' + (i*colCnt+j) +
						(j==dit ? ' fc-leftmost' : '') +
						(rowCnt>1 && d.getMonth() != month ? ' fc-other-month' : '') +
						(+d == +today ?
						' fc-today '+tm+'-state-highlight' :
						' fc-not-today') + "'>" +
						(showNumbers ? "<div class='fc-day-number'>" + d.getDate() + "</div>" : '') +
						"<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div></td>";
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				}
				s += "</tr>";
				var roomType = t.calendar.rooms[i].type;
				if (roomType.length > 9) // if roomType is too long, trim it
					roomType = roomType.substring(0,8)+"..";
				var roomName = t.calendar.rooms[i].name +' '+ roomType; // Display roomName plus RoomType (e.g. 101 NDD)
				s0 += "<tr><td class='fc-wed fc-state-default fc-not-today'><div class='fc-day-content'><div style='position:relative'>"+roomName+"</div></div></td></tr>";
				
			}
			tbody = $(s + "</tbody>").appendTo(table);
			tbody0 = $(s0 + "</tbody>").appendTo(table0);
			dayBind(tbody.find('td'));
			
		}else{ // NOT first time, reuse as many cells as possible
		
			clearEvents();
		
			var prevRowCnt = tbody.find('tr').length;
			var prevColCnt = tbody.find('tr:first').find('td').length;
			
			if (rowCnt < prevRowCnt) {
				tbody.find('tr:gt(' + (rowCnt-1) + ')').remove(); // remove extra rows
			}
			else if (rowCnt > prevRowCnt) { // needs to create new rows...
				s = '';
				for (i=prevRowCnt; i<rowCnt; i++) {
					s += "<tr class='fc-week" + i + "'>";
					for (j=0; j<colCnt; j++) {
						s += "<td class='fc-" +
							dayIDs[d.getDay()] + ' ' + // needs to be first
							tm + '-state-default fc-new fc-day' + (i*colCnt+j) +
							(j==dit ? ' fc-leftmost' : '') + "'>" +
							(showNumbers ? "<div class='fc-day-number'></div>" : '') +
							"<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div>" +
							"</td>";
						addDays(d, 1);
						if (nwe) {
							skipWeekend(d);
						}
					}
					s += "</tr>";
				}
				tbody.append(s);
			}
			
			else if (rowCnt > prevRowCnt) { // needs to create new rows...
				s = '';
				for (i=prevRowCnt; i<rowCnt; i++) {
					s += "<tr class='fc-week" + i + "'>";
					for (j=0; j<colCnt; j++) {
						s += "<td class='fc-" +
							dayIDs[d.getDay()] + ' ' + // needs to be first
							tm + '-state-default fc-new fc-day' + (i*colCnt+j) +
							(j==dit ? ' fc-leftmost' : '') + "'>" +
							(showNumbers ? "<div class='fc-day-number'></div>" : '') +
							"<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div>" +
							"</td>";
						addDays(d, 1);
						if (nwe) {
							skipWeekend(d);
						}
					}
					s += "</tr>";
				}
				tbody.append(s);
			}
			
			dayBind(tbody.find('td.fc-new').removeClass('fc-new'));
			
			// re-label and re-class existing cells
			d = cloneDate(t.visStart);
			
			tbody.find('tr').each(function() {
				var tr = $(this);
				d = cloneDate(t.visStart);
				tr.find('td').each(function() {
					var td = $(this);
					if (rowCnt > 1) {
						if (d.getMonth() == month) {
							td.removeClass('fc-other-month');
						}else{
							td.addClass('fc-other-month');
						}
					}
					if (+d == +today) {
						td.removeClass('fc-not-today')
							.addClass('fc-today')
							.addClass(tm + '-state-highlight');
					}else{
						td.addClass('fc-not-today')
							.removeClass('fc-today')
							.removeClass(tm + '-state-highlight');
					}
					td.find('div.fc-day-number').text(d.getDate()+'.'+d.getMonth());
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
			});
			
			
			
			//if (rowCnt == 1) 
			{ // more changes likely (week or day view)
			
				// redo column header text and class
				d = cloneDate(t.visStart);
				thead.find('th').each(function(i, th) {
					$(th).html(formatDate(d, colFormat));
					th.className = th.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
				
				// redo cell day-of-weeks
				d = cloneDate(t.visStart);
				tbody.find('td').each(function(i, td) {
					td.className = td.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
				
			}
		
		}
		
		showHideExtraColumns(prevColCnt);
		
	}
	
	function showHideExtraColumns(prevColCnt){
			thead.find('tr').find('th').removeClass('hidden-column'); 
			tbody.find('tr').find('td').removeClass('hidden-column');  
			
			if (colCnt < prevColCnt) {
				thead.find('tr').find('th:gt(' + (colCnt-1) + ')').addClass('hidden-column'); // remove extra cols
				tbody.find('tr').find('td:gt(' + (colCnt-1) + ')').addClass('hidden-column'); // remove extra cols
			}
	}
	
	function setHeight(height) {
		viewHeight = height;
		var leftTDs = tbody.find('tr td:first-child'),
			tbodyHeight = viewHeight - thead.height(),
			rowHeight1, rowHeight2;
		if (opt('weekMode') == 'variable') {
			rowHeight1 = rowHeight2 = Math.floor(tbodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight1 = Math.floor(tbodyHeight / rowCnt);
			rowHeight2 = tbodyHeight - rowHeight1*(rowCnt-1);
		}
		
		if(opt('rowsHeight') !== undefined)
			rowHeight1 = rowHeight2 = opt('rowsHeight');
		
		if (tdHeightBug === undefined) {
			// bug in firefox where cell height includes padding
			var tr = tbody.find('tr:first'),
				td = tr.find('td:first');
			td.height(rowHeight1);
			tdHeightBug = rowHeight1 != td.height();
		}
		if (tdHeightBug) {
			leftTDs.slice(0, -1).height(rowHeight1);
			leftTDs.slice(-1).height(rowHeight2);
			var table0TDs = tbody0.find('tr td:first-child');
			table0TDs.slice(0, -1).height(rowHeight1);
			table0TDs.slice(-1).height(rowHeight2);
		}else{
			setOuterHeight(leftTDs.slice(0, -1), rowHeight1);
			setOuterHeight(leftTDs.slice(-1), rowHeight2);
			var table0TDs = tbody0.find('tr td:first-child');
			setOuterHeight(table0TDs.slice(0, -1), rowHeight1);
			setOuterHeight(table0TDs.slice(-1), rowHeight2);
		}
		
		thead0.find('tr').height(thead.find('tr').height());
		tbody0.height(tbody.height()); 
	}
	
	
	function setWidth(width) {
		viewWidth = width;
		colContentPositions.clear();
		colWidth = Math.floor(viewWidth / colCnt);
		setOuterWidth(thead.find('th')/*.slice(0, -1)*/, colWidth);
		tbody.width = width;
		thead.find('th').width(colWidth);/*
		thead.find('th').css('max-width',colWidth);
		thead.find('th').css('min-width',colWidth);
		*/
		
		var newViewWidth = 0;
		var ths = thead.find('th:visible');
		ths = ths.filter(function(){return !$(this).hasClass('hidden-column')});
		
		$.each(ths, function(index, value) { 
			newViewWidth += $(value).outerWidth();
		});
		
		viewWidth = newViewWidth;
	}
	
	
	
	/* Day clicking and binding
	-----------------------------------------------------------*/
	
	
	function dayBind(days) {
		days.click(dayClick)
			.mousedown(daySelectionMousedown);
	}
	
	
	function dayClick(ev) {
		if (!opt('selectable')) { // SelectionManager will worry about dayClick
			var n = parseInt(this.className.match(/fc\-day(\d+)/)[1]),
				date = addDays(
					cloneDate(t.visStart),
					Math.floor(n/colCnt) * 7 + n % colCnt
				);
			// TODO: what about weekends in middle of week?
			trigger('dayClick', this, date, true, ev);
		}
	}
	
	
	
	/* Semi-transparent Overlay Helpers
	------------------------------------------------------*/
	
	
	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive
		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}
		var rowStart = cloneDate(t.visStart);
		var rowEnd = addDays(cloneDate(rowStart), colCnt);

		var stretchStart = new Date(Math.max(rowStart, overlayStart));
		var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));
		if (stretchStart < stretchEnd) {
			var colStart, colEnd;
			if (rtl) {
				colStart = dayDiff(stretchEnd, rowStart)*dis+dit+1;
				colEnd = dayDiff(stretchStart, rowStart)*dis+dit+1;
			}else{
				colStart = dayDiff(stretchStart, rowStart);
				colEnd = dayDiff(stretchEnd, rowStart);
			}
			dayBind(
				renderCellOverlay(0, colStart, rowCnt-1, colEnd-1)
			);
		}

	}
	
	
	function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
		var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
		return renderOverlay(rect, element);
	}
	
	
	
	/* Selection
	-----------------------------------------------------------------------*/
	
	
	function defaultSelectionEnd(startDate, allDay) {
		return cloneDate(startDate);
	}
	
	
	function renderSelection(startDate, endDate, allDay) {
		renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
	}
	
	
	function clearSelection() {
		clearOverlays();
	}
	
	
	
	/* External Dragging
	-----------------------------------------------------------------------*/
	
	
	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
			}
		}, ev);
	}
	
	
	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			var d = cellDate(cell);
			trigger('drop', _dragElement, d, true, ev, ui);
		}
	}
	
	
	
	/* Utilities
	--------------------------------------------------------*/
	
	
	function defaultEventEnd(event) {
		return cloneDate(event.start);
	}
	
	
	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		var tds = tbody.find('tr:first td');
		tds = tds.filter(function(){return !$(this).hasClass('hidden-column')});
		
		if (rtl) {
			tds = $(tds.get().reverse());
		}
		tds.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		tbody.find('tr').each(function(i, _e) {
			e = $(_e);
			n = e.offset().top;
			if (i) {
				p[1] = n;
			}
			p = [n];
			rows[i] = p;
		});
		p[1] = n + e.outerHeight();
	});
	
	
	hoverListener = new HoverListener(coordinateGrid);
	
	
	colContentPositions = new HorizontalPositionCache(function(col) {
		return tbody.find('td:eq(' + col + ') div div');
	});
	
	
	function colContentLeft(col) {
		return colContentPositions.left(col);
	}
	
	
	function colContentRight(col) {
		return colContentPositions.right(col);
	}
	
	
	function dayOfWeekCol(dayOfWeek) {
		return (dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt;
	}
	
	
	function dateCell(date) {
		return {
			row: Math.floor(dayDiff(date, t.visStart)/* / 7*/),
			col: 1//dayOfWeekCol(date.getDay())*dis + dit
		};
	}
	
	
	function cellDate(cell) {
		return addDays(cloneDate(t.visStart), /*cell.row*7*/ + cell.col*dis+dit);
		// TODO: what about weekends in middle of week?
	}
	
	
	function allDayTR(i) {
		return tbody.find('tr:eq('+i+')');
	}
	
	
	function allDayBounds(i) {
		return {
			left: 0,
			right: viewWidth
		};
	}
	
	
}
