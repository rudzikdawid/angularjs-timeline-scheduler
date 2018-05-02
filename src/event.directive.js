export function eventDirective($document, $rootScope, $timeout, $filter, atsUtils) {
    'ngInject';

    return {
        restrict: 'E',
        link: function(scope, element, attrs) {

            // Double-click an event element to emit the custom event "eventOpen" to all other scopes
            // Useful to open a modal window containing detailed informations of the vent, for example
            element.on('dblclick', function(e){
                e.preventDefault(); e.stopPropagation();
                var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
                if (!thisEvent) {
                    scope.throwError(1, "Event with ID "+attrs.eventId+" not found!");
                    return;
                }
                $rootScope.$broadcast('eventOpen', thisEvent);
                scope.throwError(3, "The DOM event 'eventOpen' was emitted in rootScope.");
            });

            // Right-click an event to emit the custom event "eventCtxMenu" to all ohter scopes
            // Usefull to open a contextual menu with several event-based actions
            element.on('contextmenu', function(e){
                e.preventDefault(); e.stopPropagation();
                var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
                if (!thisEvent) {
                    scope.throwError(1, "Event with ID "+attrs.eventId+" not found!");
                    return;
                }
                $rootScope.$broadcast('eventCtxMenu', thisEvent);
                scope.throwError(3, "The DOM event 'eventCtxMenu' was emitted in rootScope.");
            });

            /*
             * EVERYTHING following will only be accessible if the event is NOT LOCKED
             * (if "event.lock" is not = true)
             */
            var thisRenderedEvent = $filter('filter')(scope.renderedEvents, {id: +attrs.eventId}, true)[0];
            if (thisRenderedEvent.lock && thisRenderedEvent.lock === true)
                return;

            // Click-Drag an event to change its dates
            // (emits the DOM event "eventMove" to all other scopes)
            var dragInit	= false;
            var grabDeltaX	= 0, offsetDay = 0, offsetLeft = 0, offsetTop = 0, elemWidth = 0;
            var newStartDate = thisRenderedEvent.startDate;
            var newEndDate   = thisRenderedEvent.endDate;
            var newStartHour = thisRenderedEvent.startDate.getHours();
            var newEndHour	 = thisRenderedEvent.endDate.getHours();
            element.on('mousedown', grabEventStart);

            function grabEventStart (e) {
                e.preventDefault(); e.stopPropagation();
                grabDeltaX	= 0;
                offsetLeft	= parseInt(element.css('left'));
                offsetTop	= parseInt(element.css('top'));
                elemWidth	= parseInt(element.css('width'));
                element.css({'opacity': 0.5, 'z-index': 1000});
                $document.on('mousemove', grabEventMove);
                $document.on('mouseup',   grabEventEnd);
            }
            function grabEventMove (e) {
                if(e.buttons !== 1)
                    return;
                e.preventDefault(); e.stopPropagation();
                dragInit = true;
                grabDeltaX += e.movementX;
                offsetDay	= Math.round(grabDeltaX / scope.cellWidth);
                offsetLeft += e.movementX;
                offsetTop  += e.movementY;
                element.css({left: offsetLeft+'px', top: offsetTop+'px'});
            }
            function grabEventEnd (e){
                element.css({opacity: 1});
                if (!dragInit)
                    return;
                e.preventDefault(); e.stopPropagation();
                if (scope.useHours) {
                    var newStartPos		= Math.round(offsetLeft / scope.HcellWidth);
                    var newEndPos		= Math.round((offsetLeft + elemWidth) / scope.HcellWidth);
                    var dayStartInGrid	= Math.floor(newStartPos / scope.nbHours);
                    var dayEndInGrid	= Math.floor(newEndPos / scope.nbHours);
                    newStartDate		= atsUtils.addDaysToDate(angular.copy(scope.viewStart), dayStartInGrid) ;
                    newEndDate			= atsUtils.addDaysToDate(angular.copy(scope.viewStart), dayEndInGrid);
                    newStartHour		= scope.dayStartHour + newStartPos - (scope.nbHours * dayStartInGrid);
                    newEndHour			= scope.dayStartHour + newEndPos - (scope.nbHours * dayEndInGrid);
                    // When placing the event's end on the last hour of day, make sure that
                    // its date corresponds (and not set before the first hour of next day)
                    if (newEndHour === scope.dayStartHour) {
                        newEndHour = scope.dayEndHour + 1;
                        newEndDate = atsUtils.addDaysToDate(newEndDate, -1);
                    }
                }
                else {
                    newStartDate = atsUtils.addDaysToDate(newStartDate, offsetDay);
                    newEndDate	 = atsUtils.addDaysToDate(newEndDate, offsetDay);
                }
                var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
                if (thisEvent) {
                    $rootScope.$broadcast('eventMove', thisEvent, newStartDate, newEndDate, newStartHour, newEndHour);
                    scope.throwError(3, "The DOM event 'eventMove' was emitted in rootScope.");
                }
                else
                    scope.throwError(0, "The event with id #"+attrs.eventId+" was not found!");
                dragInit = false;
                grabDeltaX  = 0;
                $document.off('mousemove', grabEventMove);
                $document.off('mouseup', grabEventEnd);
            }
        }
    };

}

