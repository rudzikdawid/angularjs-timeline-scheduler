export function handleDirective($document, $rootScope, $filter, atsUtils) {
    'ngInject';

    return {
        restrict: 'E',
        link: function(scope, element, attrs) {

            /*
             * EVERYTHING following will only be accessible if the event is NOT LOCKED
             * (if "event.lock" is not = true)
             */
            var thisRenderedEvent = $filter('filter')(scope.renderedEvents, {id: +attrs.eventId}, true)[0];
            if (thisRenderedEvent.lock && thisRenderedEvent.lock === true)
                return;

            // Click-Drag an event's handles to change its start or end dates
            // (emits the DOM event "eventScale" to all other scopes)
            var dragInit	= false;
            var startDeltaX = 0, grabDeltaX = 0, offsetDay = 0, side = attrs.handleSide, offsetLeft = 0, offsetWidth = 0;
            var newDate		= new Date(), newHour = 12;
            var parentEvent = element.parent();
            element.on('mousedown', grabHandleStart);

            function grabHandleStart (e) {
                e.preventDefault(); e.stopPropagation();
                startDeltaX	= e.layerX;
                grabDeltaX	= 0;
                offsetLeft  = parentEvent.prop('offsetLeft');
                offsetWidth = parentEvent.prop('offsetWidth');
                parentEvent.css({'opacity': 0.5, 'z-index': 1000});
                $document.on('mousemove', grabHandleMove);
                $document.on('mouseup',   grabHandleEnd);
            }
            function grabHandleMove (e) {
                if(e.buttons !== 1)
                    return;
                e.preventDefault(); e.stopPropagation();
                dragInit = true;
                grabDeltaX  += e.movementX;
                if (side === 'left') {
                    offsetWidth -= e.movementX;
                    if (offsetWidth >= scope.HcellWidth)
                        offsetLeft  += e.movementX;
                    offsetDay	 = Math.round((grabDeltaX - startDeltaX) / scope.cellWidth);
                }
                else if (side === 'right') {
                    offsetWidth += e.movementX;
                    offsetDay	 = Math.round((startDeltaX + grabDeltaX) / scope.cellWidth);
                }
                else return;
                if (offsetWidth < scope.HcellWidth)
                    offsetWidth = scope.HcellWidth;
                parentEvent.css({left: offsetLeft+'px', width: offsetWidth+'px'});
            }
            function grabHandleEnd (e){
                if (!dragInit)
                    return;
                e.preventDefault(); e.stopPropagation();
                if (scope.useHours) {
                    if (side === 'left')
                        var newPos = Math.round(offsetLeft / scope.HcellWidth);
                    else if (side === 'right')
                        var newPos = Math.round((offsetLeft+offsetWidth) / scope.HcellWidth);
                    else return;
                    var dayInGrid = Math.floor(newPos / scope.nbHours);
                    newDate	= atsUtils.addDaysToDate(angular.copy(scope.viewStart), dayInGrid);
                    newHour	= scope.dayStartHour + newPos - (scope.nbHours * dayInGrid);
                    // When placing the right handle on the last hour of day, make sure that
                    // its date corresponds (and not set before the first hour of next day)
                    if (side === 'right' && newHour === scope.dayStartHour) {
                        newHour = scope.dayEndHour + 1;
                        newDate = atsUtils.addDaysToDate(newDate, -1);
                    }
                }
                else {
                    if (side === 'left')
                        var oldDate = thisRenderedEvent.startDate;
                    else if (side === 'right')
                        var oldDate =  thisRenderedEvent.endDate;
                    else return;
                    newDate = atsUtils.addDaysToDate(oldDate, offsetDay);
                }
                var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
                if (thisEvent) {
                    $rootScope.$broadcast('eventScale', thisEvent, side, newDate, newHour);
                    scope.throwError(3, "The DOM event 'eventScale' was emitted in rootScope.");
                }
                else
                    scope.throwError(0, "The event with id #"+attrs.eventId+" was not found!");
                dragInit = false;
                startDeltaX = 0; grabDeltaX  = 0;
                parentEvent.css({opacity: 1});
                $document.off('mousemove', grabHandleMove);
                $document.off('mouseup', grabHandleEnd);
            }
        }
    };

}

