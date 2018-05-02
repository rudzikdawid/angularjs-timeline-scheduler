import planttTemplate from './plantt-template.html';

export function schedulerDirective($window, $document, $timeout, $rootScope, $filter, atsUtils) {
    'ngInject';

    const dateFilter = $filter('date');

    return {
        restrict: 'E',					// DOM Element only : <scheduler></scheduler>
        templateUrl: planttTemplate,	// Load HTML template for the view
        link: function(scope){
            // Create the list of events variable, if not present in the app controller
            if (!scope.events) scope.events = [];
            // Today's date
            scope.currDate = atsUtils.addDaysToDate(new Date(), 0);

            /*
             * OPTIONS VALUES
             * Can be overwritten in app controller
             */
            if (!scope.viewStart)						// Firt day to display in view. Default: today minus 7 days
                scope.viewStart		= atsUtils.addDaysToDate(scope.currDate, -7);
            if (!scope.viewEnd)							// Last day to display in view. Default: today plus 14 days
                scope.viewEnd		= atsUtils.addDaysToDate(scope.currDate, 14);
            if (!scope.eventHeight)
                scope.eventHeight	= 50;				// Height of events elements in pixels
            if (!scope.eventMargin)
                scope.eventMargin	= 10;				// Margin above events elements for spacing
            if (!scope.nbLines)
                scope.nbLines		= 5;				// Maximum number of lines we can draw in timeline
            if (typeof scope.useLock === 'undefined')
                scope.useLock		= true;				// To enable or disable the use of locking events
            if (typeof scope.autoLock === 'undefined')
                scope.autoLock		= true;				// To enable or disable the automatic lock of current & past events
            if (typeof scope.lockMarginDays === 'undefined')
                scope.lockMarginDays = 0;				// Number of days between today and the start date of events for the automatic lock to be effective
            if (!scope.formatDayLong)
                scope.formatDayLong  = 'EEEE MMMM dd';	// The JS date format for the long display of dates (see https://docs.angularjs.org/api/ng/filter/date)
            if (!scope.formatDayShort)
                scope.formatDayShort = 'yyyy-MM-dd';	// The JS date format for the short display of dates
            if (!scope.formatMonth)
                scope.formatMonth    = 'MMMM yyyy';		// The JS date format for the month display in header
            if (typeof scope.useHours === 'undefined')
                scope.useHours		 = false;			// To specify the use of hours ('true' to display hourly grid and don't force events hours to 12:00)
            if (typeof scope.dayStartHour === 'undefined')
                scope.dayStartHour	 = 8;				// The hour number at which the day begins (default 08:00)
            if (typeof scope.dayEndHour === 'undefined')
                scope.dayEndHour	 = 20;				// The hour number at which the day ends (default 20:00)
            /* END OPTIONS VALUES */

            // Options security
            scope.nbLines += 1;										// Add one line on the grid to be sure
            if (scope.dayStartHour < 0) scope.dayStartHour = 0;		// Limit start hour of day to midnight
            if (scope.dayEndHour > 23)  scope.dayEndHour = 23;		// Limit end hour of day to 23:00
            if (scope.dayStartHour >= scope.dayEndHour) {			// Prevent errors for hours grid
                scope.dayStartHour = 6;
                scope.dayEndHour   = 20;
            }

            // View essentials
            scope.nbHours = scope.dayEndHour +1 - scope.dayStartHour;						// Number of hours displayed in one day
            scope.minCellWidthForHours = (scope.dayEndHour+1 - scope.dayStartHour) * 13;	// Minimum width in pixels for the hours grid to be displayed

            /**
             * Common function to relay errors elsewhere (@todo)
             *
             * @param {STRING} lvl The level of the error (0 = Fatal; 1 = Warning; 2 = Notice, 3 = Info)
             * @param {STRING} msg The message to show
             */
            scope.throwError = function(lvl, msg){
                var level = '';
                switch (lvl) {
                    case 0: level = 'FATAL ERROR';
                    case 1: level = 'WARNING';
                    case 2: level = 'Notice';
                    case 3: level = 'Info';
                }
                $rootScope.$broadcast('planttError', { level: lvl, levelName: level, message: msg });
            };

            /**
             * Function to get the list of all hours within a working day (between dayStartHour & dayEndHour)
             *
             * @returns {ARRAY} The list of all hours within a working day
             */
            function listHoursInDay() {
                var enumHours = [];
                for (var h = scope.dayStartHour; h < (scope.dayEndHour +1); h++)
                    enumHours.push({ num: h, title: ('00' + h).substr(-2) });
                return enumHours;
            }

            /*
             * (Re)Compute the view: grid and rendered events
             */
            scope.renderView = function() {
                var currTime	 = scope.currDate.getTime();
                if (scope.useHours)
                    currTime	 = (new Date()).getTime();
                scope.enumDays	 = [];													// List of objects describing all days within the view.
                scope.enumMonths = [];													// List of objects describing all months within the view.
                scope.gridWidth	 = $document.find('tbody').prop('offsetWidth');			// Width of the rendered grid
                scope.viewPeriod = atsUtils.daysInPeriod(scope.viewStart, scope.viewEnd, false);	// Number of days in period of the view
                scope.cellWidth	 = scope.gridWidth / (scope.viewPeriod + 1);			// Width of the days cells of the grid
                scope.HcellWidth = scope.cellWidth / scope.nbHours;						// Width of the hours cells of the grid
                scope.linesFill	 = {};			// Empty the lines filling map
                scope.renderedEvents  = [];		// Empty the rendered events list

                // First Loop: on all view's days, to define the grid
                var lastMonth = -1, monthNumDays = 1, nbMonths = 0;
                for (var d = 0; d <= scope.viewPeriod; d++) {
                    var dayDate = atsUtils.addDaysToDate(scope.viewStart, d);
                    var today = (scope.currDate.getTime() === dayDate.getTime());
                    var isLastOfMonth = (atsUtils.daysInMonth(dayDate) === dayDate.getDate());

                    // Populate the lines filling map
                    for (var l = 1; l <= scope.nbLines; l++) {
                        scope.linesFill[l] = [];
                        for (var ld = 0; ld <= scope.viewPeriod; ld++)
                            scope.linesFill[l].push(false);
                    }

                    // Populate the list of all days
                    scope.enumDays.push({
                        num: dateFilter(dayDate, 'dd'),
                        offset: d,
                        date: dayDate,
                        time: dayDate.getTime(),
                        title: dateFilter(dayDate, scope.formatDayLong),
                        nbEvents: 0,
                        today: today,
                        isLastOfMonth: isLastOfMonth,
                        enumHours: listHoursInDay()
                    });
                    // Populate the list of all months
                    monthNumDays += 1;
                    if (lastMonth != dayDate.getMonth()) {
                        scope.enumMonths.push({
                            num: dayDate.getMonth(),
                            name: dateFilter(dayDate, scope.formatMonth)
                        });
                        lastMonth = dayDate.getMonth();
                        monthNumDays = 1;
                        nbMonths += 1;
                    }
                    if (scope.enumMonths[nbMonths-1]) {
                        scope.enumMonths[nbMonths-1].numDays = monthNumDays;
                    }
                }

                // Second loop: Filter and calculate the placement of all events to be rendered
                angular.forEach(scope.events, function(event){
                    var evt		= angular.copy(event);
                    var eStart	= evt.startDate.getTime(),
                        eEnd	= evt.endDate.getTime(),
                        viewRealStart	= new Date(scope.viewStart.getTime()),
                        viewRealEnd		= new Date(scope.viewEnd.getTime());
                    viewRealStart.setHours(0); viewRealStart.setMinutes(0); viewRealStart.setSeconds(0);
                    viewRealEnd.setHours(23); viewRealEnd.setMinutes(59); viewRealEnd.setSeconds(59);
                    var vStart	= viewRealStart.getTime(),
                        vEnd	= viewRealEnd.getTime();
                    if (eStart < vStart && eEnd < vStart)			// Do not render event if it's totally BEFORE the view's period
                        return true;
                    if (eStart > vEnd)								// Do not render event if it's AFTER the view's period
                        return true;

                    // Calculate the left and width offsets for the event's element
                    var offsetDays	= -atsUtils.daysInPeriod(angular.copy(evt.startDate), scope.viewStart, true);
                    var eventLength = atsUtils.daysInPeriod(angular.copy(evt.endDate), angular.copy(evt.startDate), false) + 1;
                    var eventWidth	= eventLength * scope.cellWidth;
                    var offsetLeft	= Math.floor(offsetDays * scope.cellWidth);
                    if (scope.useHours) {
                        var eventStartHour	= evt.startDate.getHours();
                        var eventEndHour	= evt.endDate.getHours();
                        var offsetHours		= Math.floor(scope.HcellWidth * (eventStartHour - scope.dayStartHour));
                        offsetLeft += offsetHours;
                        if (evt.startDate.getDate() === evt.endDate.getDate())	// If event is during one single day
                            eventWidth = scope.HcellWidth * (eventEndHour - eventStartHour);
                        else {
                            if (eStart < vStart)								// If event start date or hour is BEFORE the view start
                                eventWidth += offsetHours;
                            if (eEnd > vEnd)									// If event end date or hour is AFTER the view end
                                eventWidth -= offsetHours;
                            else												// If event end hour is before the view end
                                eventWidth -= offsetHours + (scope.HcellWidth * (scope.dayEndHour+1 - eventEndHour));
                        }
                    }

                    var daysExceed	= 0, extraClass	= evt.type+' ';
                    // If the event's START date is BEFORE the current displayed view
                    if (offsetDays < 0) {
                        offsetLeft = 0;				// to stick the element to extreme left
                        daysExceed = -offsetDays;	// to trim the total element's width
                        extraClass += 'overLeft ';	// to decorate the element's left boundary
                    }
                    // If the event's END date is AFTER the current displayed view
                    if (eEnd > vEnd) {
                        daysExceed = atsUtils.daysInPeriod(scope.viewEnd, angular.copy(evt.endDate), false);
                        extraClass += 'overRight ';	// to decorate the element's right boundary
                    }
                    // If the event's END date is BEFORE TODAY (to illustrate the fact it's in the past)
                    if (eEnd < currTime)
                        extraClass += 'past ';

                    // To automatically lock the event on the view
                    if (!evt.lock) {
                        var testLockTime = (eStart < (currTime - ((scope.lockMarginDays - 1) * 24*60*60*1000)));
                        evt.lock = (testLockTime && scope.autoLock === true);
                    }
                    if (scope.useLock === false)
                        evt.lock = false;
                    // If the event has the lock value set to true
                    if (evt.lock === true)
                        extraClass += 'locked ';

                    // If the event is CURRENTLY active (over today)
                    if (eStart <= currTime && eEnd >= currTime) {
                        extraClass += 'current ';	// to illustrate the fact it's currently active
                    }
                    // Add some classes to the element
                    evt.extraClasses = extraClass;

                    // Store the number of events in enumDays array, and calculate the line (Y-axis) for the event
                    evt.line = 0;
                    for (var n = 0; n < eventLength; n++) {
                        var D = atsUtils.addDaysToDate(evt.startDate, n);
                        var thisDay = $filter('filter')(scope.enumDays, {time: D.getTime()}, true)[0];
                        if (!thisDay) continue;
                        thisDay.nbEvents += 1;

                        var dayFilled = false;
                        angular.forEach(scope.linesFill, function(thisLine, numLine){
                            if (thisLine[thisDay.offset] === false && !dayFilled) {
                                thisLine[thisDay.offset] = thisDay.num+': '+evt.title;
                                dayFilled = true;
                                evt.line = Math.max(evt.line, parseInt(numLine)-1);
                                scope.linesFill[evt.line+1][thisDay.offset] = thisDay.num+': '+evt.title;
                            }
                        });
                    }

                    // Place and scale the event's element in DOM
                    evt.locScale = {
                        'left': Math.floor(offsetLeft)+'px',
                        'width': (eventWidth - (daysExceed * scope.cellWidth))+'px',
                        'top': (evt.line * (scope.eventHeight + scope.eventMargin))+'px',
                        'height': scope.eventHeight+'px'
                    };

                    // Actually RENDER the event on the timeline
                    scope.renderedEvents.push(evt);
                });


                // Compute the view's height to fit all elements (with margins)
                var gridMarginBottom = 40;			// Margin to apply at the bottom of grid, below last line
                var filledLines = 0;
                for (var l = 1; l <= scope.nbLines; l++) {
                    for (var ld = 0; ld <= scope.viewPeriod; ld++) {
                        if (scope.linesFill[l][ld] !== false) {
                            filledLines += 1;
                            break;
                        }
                    }
                }
                scope.gridHeight = ((filledLines+1) * (scope.eventHeight + scope.eventMargin)) + gridMarginBottom;
            };

            // Call the renderer for the first time
            scope.renderView();


            // Call the renderer when window is resized
            angular.element($window).bind('resize', function(){
                $timeout(function(){
                    scope.renderView();
                }, 100);
            });

            /*
             * Offset view to previous day
             */
            scope.prevDay = function(){
                scope.viewStart = atsUtils.addDaysToDate(scope.viewStart, -1);
                scope.viewEnd	= atsUtils.addDaysToDate(scope.viewEnd, -1);
                scope.renderView();
            };
            /*
             * Offset view to previous X days
             */
            scope.prevCustom = function(days){
                if (typeof days === 'undefined') days = 15;
                scope.viewStart = atsUtils.addDaysToDate(scope.viewStart, -days);
                scope.viewEnd	= atsUtils.addDaysToDate(scope.viewEnd, -days);
                scope.renderView();
            };
            /*
             * Set the start date for view
             */
            scope.setStartView = function(year, month, day){
                var date = atsUtils.addDaysToDate(new Date(year, month-1, day), 0);
                if (date.getTime() >= scope.viewEnd.getTime()) {
                    scope.throwError(2, "Aborting view draw: start date would be after end date.");
                    return;
                }
                scope.viewStart = date;
                scope.renderView();
            };
            /*
             * Zoom IN view (-1 day on each side)
             */
            scope.zoomIn = function(step){
                if (atsUtils.daysInPeriod(scope.viewStart, scope.viewEnd) <= 2) {
                    scope.throwError(2, "Aborting view draw: reached minimum days to show.");
                    return;
                }
                scope.viewStart  = atsUtils.addDaysToDate(scope.viewStart, +step);
                scope.viewEnd	 = atsUtils.addDaysToDate(scope.viewEnd, -step);
                scope.renderView();
            };
            /*
             * Zoom OUT view (+1 day on each side)
             */
            scope.zoomOut = function(step){
                if (atsUtils.daysInPeriod(scope.viewStart, scope.viewEnd) >= 365) {
                    scope.throwError(2, "Aborting view draw: reached maximum days to show.");
                    return;
                }
                scope.viewStart  = atsUtils.addDaysToDate(scope.viewStart, -step);
                scope.viewEnd	 = atsUtils.addDaysToDate(scope.viewEnd, +step);
                scope.renderView();
            };
            /*
             * Center view to current day (defaults -7, +14 days)
             */
            scope.centerView = function(daysBefore, daysAfter){
                if (typeof daysBefore === 'undefined') daysBefore = 7;
                if (typeof daysAfter === 'undefined') daysAfter = 14;
                scope.viewStart  = atsUtils.addDaysToDate(new Date(), -daysBefore);
                scope.viewEnd	 = atsUtils.addDaysToDate(new Date(), daysAfter);
                scope.renderView();
            };
            /*
             * Offset view to next day
             */
            scope.nextDay = function(){
                scope.viewStart = atsUtils.addDaysToDate(scope.viewStart, 1);
                scope.viewEnd	= atsUtils.addDaysToDate(scope.viewEnd, 1);
                scope.renderView();
            };
            /*
             * Offset view to next X days
             */
            scope.nextCustom = function(days){
                if (typeof days === 'undefined') days = 15;
                scope.viewStart = atsUtils.addDaysToDate(scope.viewStart, days);
                scope.viewEnd	= atsUtils.addDaysToDate(scope.viewEnd, days);
                scope.renderView();
            };
            /*
             * Set the end date for view
             */
            scope.setEndView = function(year, month, day){
                var date = atsUtils.addDaysToDate(new Date(year, month-1, day), 0);
                if (date.getTime() <= scope.viewStart.getTime()) {
                    scope.throwError(2, "Aborting view draw: end date would be before start date.");
                    return;
                }
                scope.viewEnd = date;
                scope.renderView();
            };
            /*
             * Mode toggle (daily mode <-> hourly mode)
             */
            scope.toggleMode = function(){
                scope.useHours = !scope.useHours;
                scope.renderView();
            };
            /*
             * Lock enabled / Unlock All toggle
             */
            scope.toggleLock = function(){
                scope.useLock = !scope.useLock;
                scope.renderView();
            };
        }
    };

}
