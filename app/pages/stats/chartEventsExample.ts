
import {Component} from 'angular2/core';
import { CHART_DIRECTIVES,Highcharts } from 'angular2-highcharts';




@Component({
    selector: 'chart-events-example',
    directives: [CHART_DIRECTIVES],
    template: `
        <chart [options]="options" (selection)="onChartSelection($event)">
            <series (mouseOver)="onSeriesMouseOver($event)">
                <point (select)="onPointSelect($event)"></point>
            </series>
        </chart>
    `
})
export class ChartEventsExample {
    constructor() {
        this.options = {
            title : { text : 'chart events example' },
            chart: { zoomType: 'x'},
            series: [{
                data: [29.9, 71.5, 106.4, 148.5, 216.4, 194.1, 95.6, 54.4],
                allowPointSelect: true
            }]
        };
    }
    options: Object;
    onChartSelection (e) {
        console.log('onChartSelection', e);
    }
    onSeriesMouseOver (e) {
        console.log('onSeriesMouseOver', e);
    }
    onPointSelect (e) {
        console.log('onPointSelect', e);
    }
}