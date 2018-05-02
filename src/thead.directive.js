export function theadDirective($document, $timeout, atsUtils) {
    'ngInject';

    return {
        restrict: 'A',
        link: function(scope, element) {
            // Click-drag on grid header to move the view left or right
            element.on('mousedown', grabHeadStart);

            var dragInit = false;
            var grabDeltaX = 0;

            function grabHeadStart(e) {
                e.preventDefault(); e.stopPropagation();
                grabDeltaX = 0;
                $document.on('mousemove', grabHeadMove);
                $document.on('mouseup',   grabHeadEnd);
            }
            function grabHeadMove(e) {
                if(e.buttons !== 1)
                    return;
                e.preventDefault(); e.stopPropagation();
                dragInit = true;
                grabDeltaX += e.movementX;
                if (Math.abs(grabDeltaX) >= scope.cellWidth) {
                    var deltaDay = Math.round(grabDeltaX / scope.cellWidth);
                    scope.viewStart = atsUtils.addDaysToDate(scope.viewStart, -deltaDay);
                    scope.viewEnd	= atsUtils.addDaysToDate(scope.viewEnd, -deltaDay);
                    grabDeltaX = 0;
                    $timeout(function(){
                        scope.renderView();
                    }, 0);
                    return;
                }
            }
            function grabHeadEnd(e) {
                e.preventDefault(); e.stopPropagation();
                if (!dragInit)
                    return;
                dragInit = false;
                grabDeltaX = 0;
                $document.off('mousemove', grabHeadMove);
                $document.off('mouseup',   grabHeadEnd);
            }
        }
    };

}
