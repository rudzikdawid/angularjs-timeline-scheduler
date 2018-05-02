export function eventsCanvasDirective($document, $rootScope, $timeout, atsUtils) {
    'ngInject';

    return {
        restrict: 'A',
        link: function(scope, element) {

            // Calculate the margin-top offset to avoid overlapping the grid's headers
            $timeout(function(){
                var theadHeight	 = parseInt(angular.element(document.querySelector('ats-scheduler thead')).prop('offsetHeight'));
                var headerHeight = parseInt($document.find('header').prop('offsetHeight'));
                var headHeight	 = (theadHeight + headerHeight + scope.eventMargin)+'px';
                var gridHeight	 = parseInt($document.find('tbody').prop('offsetHeight'));
                element.css({'top': headHeight});
                element.css({'height': (gridHeight - scope.eventMargin)+'px'});
            }, 0);

            // Double-click on the canvas emits the event "dayselect" to all other scopes
            // Useful to add an event on a specific day of the timeline
            element.on('dblclick', function(e){
                e.preventDefault(); e.stopPropagation();
                var dayInView = Math.floor(e.layerX / scope.cellWidth);
                var selectedDate = atsUtils.addDaysToDate(scope.viewStart, dayInView);
                if (scope.useHours)
                    selectedDate.setHours(scope.dayStartHour);
                $rootScope.$broadcast('daySelect', selectedDate);
                scope.throwError(3, "The DOM event 'daySelect' was emitted in rootScope.");
            });

            // Click-drag on canvas emits the event "periodSelect" to all other scopes
            // Useful to add events on the timeline
            var eventHelper = $document.find('ats-eventhelper');
            var dragInit = false, startWidth = 0, selStart = null, selEnd   = null;
            element.on('mousedown', grabGridStart);

            function grabGridStart (e){
                e.preventDefault(); e.stopPropagation();
                var startDay = Math.floor(e.layerX / scope.cellWidth);
                selStart = atsUtils.addDaysToDate(scope.viewStart, startDay);
                if (scope.useHours) {
                    var startPos = Math.round(e.layerX / scope.HcellWidth);
                    var dayInGrid = Math.floor(startPos / scope.nbHours);
                    selStart = atsUtils.addDaysToDate(angular.copy(scope.viewStart), dayInGrid);
                    var newHour	= scope.dayStartHour + startPos - (scope.nbHours * dayInGrid);
                    selStart.setHours(newHour);
                }
                eventHelper.css({top: (e.layerY - 25)+'px', left: (e.layerX+1)+'px'});
                eventHelper.css({display: 'block'});
                $document.on('mousemove', grabGridMove);
                $document.on('mouseup',   grabGridEnd);
                return false;
            }
            function grabGridMove (e){
                if (e.buttons === 1) {
                    e.preventDefault(); e.stopPropagation();
                    dragInit = true;
                    startWidth += e.movementX;
                    if (startWidth <= 0)
                        return;
                    eventHelper.css({width: (startWidth - 2)+'px'});
                }
            }
            function grabGridEnd (e) {
                startWidth  = 0;
                eventHelper.css({width: '0px', display: 'none'});
                $document.off('mousemove', grabGridMove);
                $document.off('mouseup',   grabGridEnd);
                if (!dragInit) return;
                if (!selStart) return;
                e.preventDefault(); e.stopPropagation();
                var dayInView = Math.floor(e.layerX / scope.cellWidth);
                selEnd  = atsUtils.addDaysToDate(scope.viewStart, dayInView);
                if (scope.useHours) {
                    var endPos = Math.round(e.layerX / scope.HcellWidth);
                    var dayInGrid = Math.floor(endPos / scope.nbHours);
                    selEnd = atsUtils.addDaysToDate(angular.copy(scope.viewStart), dayInGrid);
                    var newHour	= scope.dayStartHour + endPos - (scope.nbHours * dayInGrid);
                    selEnd.setHours(newHour);
                }
                if (selStart.getTime() < selEnd.getTime()) {
                    $rootScope.$broadcast('periodSelect', {start: selStart, end: selEnd});
                    scope.throwError(3, "The DOM event 'periodSelect' was emitted in rootScope.");
                }
                dragInit = false;
            }
        }
    };

}
