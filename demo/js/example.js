/*
 * Usage example of the Plantt AngularJS module
 * MIT licence, @ Polosson 2016
 *
 */
'use strict';

var planttEx = angular.module("planttDemo", ["plantt.module"]);

planttEx.controller("planttExample", function($scope, $timeout, atsUtils){
	// Basic settings (optional)
	$scope.eventHeight		= 50;				// Height of events elements in pixels
	$scope.eventMargin		= 10;				// Margin above events elements for spacing
	$scope.nbLines			= 6;				// Maximum number of lines we can draw in timeline
	$scope.autoLock			= true;				// To enable the automatic lock of past events
	$scope.lockMarginDays	= 4;				// Number of days between today and the start date of events for the automatic lock to take effect
	$scope.formatDayLong	= 'EEEE dd MMMM';	// The JS date format for the long display of dates
	$scope.formatDayShort	= 'dd/MM/yyyy';		// The JS date format for the short display of dates
	$scope.formatMonth		= 'MMMM yyyy';		// The JS date format for the month display in header

	// FOR DEMO : using today as a reference to create events, for them to be allways visible
	var now = new Date();

	// Create the events list (don't use it like this, it's relative for DEMO)
	$scope.events = [
		{ id: 1, title: 'Hello World',				type: 'normal', startDate: atsUtils.addDaysToDate(now, -30), endDate: atsUtils.addDaysToDate(now, -22) },
		{ id: 2, title: 'OK Junior, bend over',		type: 'normal', startDate: atsUtils.addDaysToDate(now, -24), endDate: atsUtils.addDaysToDate(now, -21) },
		{ id: 3, title: 'Running in the mountain',	type: 'urgent', startDate: atsUtils.addDaysToDate(now, -17), endDate: atsUtils.addDaysToDate(now, -15) },
		{ id: 4, title: 'July Ruby',				type: 'urgent', startDate: atsUtils.addDaysToDate(now, -12), endDate: atsUtils.addDaysToDate(now, -10) },
		{ id: 5, title: 'Old one',					type: 'urgent', startDate: atsUtils.addDaysToDate(now, -18), endDate: atsUtils.addDaysToDate(now, -6) },
		{ id: 6, title: 'Outdated event',			type: 'urgent', startDate: atsUtils.addDaysToDate(now,  -4), endDate: atsUtils.addDaysToDate(now, -2) },
		{ id: 7, title: 'In progress, low priority',type: 'normal', startDate: atsUtils.addDaysToDate(now,  -2), endDate: atsUtils.addDaysToDate(now,  2) },
		{ id: 8, title: 'Full Week Holidays',		type: 'normal', startDate: atsUtils.addDaysToDate(now,   4), endDate: atsUtils.addDaysToDate(now, 10) },
		{ id: 9, title: 'Something to do soon',		type: 'normal', startDate: atsUtils.addDaysToDate(now,   2), endDate: atsUtils.addDaysToDate(now,  6) },
		{ id: 10, title: 'In progress, hi-priority',type: 'urgent', startDate: atsUtils.addDaysToDate(now,   0), endDate: atsUtils.addDaysToDate(now,  4) },
		{ id: 11, title: 'Fiesta on the beach',		type: 'urgent', startDate: atsUtils.addDaysToDate(now,  12), endDate: atsUtils.addDaysToDate(now, 20) },
		{ id: 12, title: '1 day',					type: 'normal', startDate: atsUtils.addDaysToDate(now,  13), endDate: atsUtils.addDaysToDate(now, 13) },
		{ id: 13, title: 'Testing', lock: true,		type: 'urgent', startDate: atsUtils.addDaysToDate(now,   8), endDate: atsUtils.addDaysToDate(now,  9) },
		{ id: 14, title: 'Near future event',		type: 'normal', startDate: atsUtils.addDaysToDate(now,  30), endDate: atsUtils.addDaysToDate(now, 35) },
		{ id: 15, title: 'Far future event',		type: 'normal', startDate: atsUtils.addDaysToDate(now,  92), endDate: atsUtils.addDaysToDate(now, 98) }
	];

	// Listen to the "planttError" DOM event, to do something when an error occurs
	$scope.$on('planttError', function(e, err){
		console.log('Plantt '+err.levelName+' ('+err.level+'):', err.message);
	});

	// Listen to the "daySelect" DOM event, to add a new event
	$scope.$on('daySelect', function(e, date){
		var name = prompt('New event title:');
		if (!name) return;
		if (name === "") return;
		var end  = new Date(date.getTime() + 1000*60*60);
		var id   = $scope.events.length + 1;
		var newEvent = {
			id: id,
			title: name,
			type: 'normal',
			startDate: date,
			endDate: end
		};
		$scope.events.push(newEvent);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "periodSelect" DOM event, to add a new event
	$scope.$on('periodSelect', function(e, dates){
		var name = prompt('New event title:');
		if (!name) return;
		if (name === "") return;
		var id   = $scope.events.length + 1;
		var newEvent = {
			id: id,
			title: name,
			type: 'normal',
			startDate: dates.start,
			endDate: dates.end
		};
		$scope.events.push(newEvent);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventMove" DOM event, to store the new position of the event in time
	$scope.$on('eventMove', function(e, event, newStartDate, newEndDate){
		event.startDate = newStartDate;
		event.endDate	= newEndDate;
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventScale" DOM event, to store the new positions of the event limits in time
	$scope.$on('eventScale', function(e, event, side, newDate, newHour){
		newDate.setHours(newHour);
		if (side === 'left')
			event.startDate = newDate;
		else if (side === 'right')
			event.endDate	= newDate;
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventOpen" DOM event
	$scope.$on('eventOpen', function(e, event){
		console.log(event);
		alert('Opening event "' + event.title +'"');
	});

});


planttEx.controller("planttHourlyExample", function($scope, $timeout){
	// Basic settings (optional)
	$scope.nbLines			= 6;				// Maximum number of lines we can draw in timeline
	$scope.lockMarginDays	= 2;				// Number of days between today and the start date of events for the automatic lock to take effect
	$scope.viewStart		= atsUtils.addDaysToDate(new Date(), -1);	// First day to display in view.
	$scope.viewEnd			= atsUtils.addDaysToDate(new Date(), 2);		// Last day to display in view.
	// Crucial settings for the use of hours in timeline
	$scope.useHours			= true;				// To specify the use of hours (to display hourly grid and don't force events hours to 12:00)
	$scope.dayStartHour		= 8;				// The hour number at which the day begins (default 08:00)
	$scope.dayEndHour		= 20;				// The hour number at which the day ends   (default 20:00)

	// FOR DEMO : using today as a reference to create events, for them to be allways visible
	var now = new Date();
	var today = now.getDate();

	// Create the events list (don't use it like this, it's relative for DEMO)
	$scope.events = [
		{ id: 0, title: 'Yesterday afternoon',			type: 'urgent', startDate: new Date(2016, 9-1, today-1,	13, 0), endDate: new Date(2016, 9-1, today-1, 20, 0) },
		{ id: 1, title: 'Some time ago',				type: 'normal', startDate: new Date(2016, 9-1, today-3, 14, 0), endDate: new Date(2016, 9-1, today-1, 12, 0) },
		{ id: 2, title: 'Today morning',				type: 'normal', startDate: new Date(2016, 9-1, today,	 8, 0), endDate: new Date(2016, 9-1, today,	  12, 0) },
		{ id: 3, title: 'Today Afternoon',				type: 'normal', startDate: new Date(2016, 9-1, today,	14, 0), endDate: new Date(2016, 9-1, today,	  19, 0) },
		{ id: 4, title: 'Yesterday - Tomorrow',			type: 'urgent', startDate: new Date(2016, 9-1, today-1, 14, 0), endDate: new Date(2016, 9-1, today+1, 15, 0) },
		{ id: 5, title: 'One night long',				type: 'normal', startDate: new Date(2016, 9-1, today,	19, 0), endDate: new Date(2016, 9-1, today+1,  9, 0) },
		{ id: 6, title: 'One complete day',				type: 'normal', startDate: new Date(2016, 9-1, today+2,	 8, 0), endDate: new Date(2016, 9-1, today+2, 21, 0) },
		{ id: 7, title: 'Not so far in future',			type: 'normal', startDate: new Date(2016, 9-1, today+2, 14, 0), endDate: new Date(2016, 9-1, today+3, 19, 0) },
		{ id: 8, title: 'Manually locked', lock: true,	type: 'urgent', startDate: new Date(2016, 9-1, today+1, 14, 0), endDate: new Date(2016, 9-1, today+1, 20, 0) }
	];

	// Listen to the "planttError" DOM event, to do something when an error occurs
	$scope.$on('planttError', function(e, err){
		console.log('Plantt '+err.levelName+' ('+err.level+'):', err.message);
	});

	// Listen to the "daySelect" DOM event, to add a new event
	$scope.$on('daySelect', function(e, date){
		var name = prompt('New event title:');
		if (!name) return;
		if (name === "") return;
		var end  = new Date(date.getTime());
		end.setHours($scope.dayEndHour+1);
		var id   = $scope.events.length + 1;
		var newEvent = {
			id: id,
			title: name,
			type: 'normal',
			startDate: date,
			endDate: end
		};
		$scope.events.push(newEvent);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "periodSelect" DOM event, to add a new event
	$scope.$on('periodSelect', function(e, dates){
		var name = prompt('New event title:');
		if (!name) return;
		if (name === "") return;
		var id   = $scope.events.length + 1;
		var newEvent = {
			id: id,
			title: name,
			type: 'normal',
			startDate: dates.start,
			endDate: dates.end
		};
		$scope.events.push(newEvent);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventMove" DOM event, to store the new position of the event in time
	$scope.$on('eventMove', function(e, event, newStartDate, newEndDate, newStartHour, newEndHour){
		newStartDate.setHours(newStartHour);
		newEndDate.setHours(newEndHour);
		event.startDate = newStartDate;
		event.endDate	= newEndDate;
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventScale" DOM event, to store the new positions of the event limits in time
	$scope.$on('eventScale', function(e, event, side, newDate, newHour){
		newDate.setHours(newHour);
		if (side === 'left')
			event.startDate = newDate;
		else if (side === 'right')
			event.endDate	= newDate;
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventOpen" DOM event
	$scope.$on('eventOpen', function(e, event){
		console.log(event);
		alert('Opening event "' + event.title +'"');
	});

	// Listen to the "eventCtxMenu" DOM event
	$scope.$on('eventCtxMenu', function(e, event){
		console.log(event);
		alert('Todo: context menu for event "' + event.title +'"');
	});

});
