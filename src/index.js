import { utilsService } from './utils.service'
import { schedulerDirective } from './scheduler.directive'
import { eventsCanvasDirective } from './events-canvas.directive'
import { theadDirective } from './thead.directive'
import { eventDirective } from './event.directive'
import { handleDirective } from './handle.directive'


export default angular.module('plantt.module', [])
    .service('atsUtils', utilsService)
	.directive('atsScheduler', ['$window', '$document', '$timeout', '$rootScope', '$filter', 'atsUtils', schedulerDirective])
	.directive('atsEventsCanvas', ['$document', '$rootScope', '$timeout', 'atsUtils', eventsCanvasDirective])
	.directive('atsThead', ['$document', '$timeout', 'atsUtils', theadDirective])
	.directive('atsEvent', ['$document', '$rootScope', '$timeout', '$filter', 'atsUtils', eventDirective])
	.directive('atsHandle', ['$document', '$rootScope', '$filter', 'atsUtils', handleDirective]);
