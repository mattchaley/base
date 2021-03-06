// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../d3

import * as d3 from 'd3';

abstract class ChartwerkBase {
    protected _d3: typeof d3;
    protected _series: TimeSerie[];
    protected _options: Options;
    protected _d3Node?: d3.Selection<HTMLElement, unknown, null, undefined>;
    protected _chartContainer?: d3.Selection<SVGGElement, unknown, null, undefined>;
    protected _crosshair?: d3.Selection<SVGGElement, unknown, null, undefined>;
    protected _brush?: d3.BrushBehavior<unknown>;
    constructor(_d3: typeof d3, el: HTMLElement, _series?: TimeSerie[], _options?: Options);
    render(): void;
    abstract _renderMetrics(): void;
    abstract onMouseOver(): void;
    abstract onMouseOut(): void;
    abstract onMouseMove(): void;
    abstract renderSharedCrosshair(timestamp: number): void;
    abstract hideSharedCrosshair(): void;
    _renderSvg(): void;
    _renderGrid(): void;
    _renderXAxis(): void;
    _renderYAxis(): void;
    _renderCrosshair(): void;
    _useBrush(): void;
    _renderLegend(): void;
    _renderYLabel(): void;
    _renderXLabel(): void;
    _renderNoDataPointsMessage(): void;
    onBrushStart(): void;
    onBrushEnd(): void;
    zoomOut(): void;
    get xScale(): d3.ScaleTime<number, number>;
    get timestampScale(): d3.ScaleLinear<number, number>;
    get yScale(): d3.ScaleLinear<number, number>;
    get axisBottomWithTicks(): d3.Axis<number | Date | {
        valueOf(): number;
    }>;
    get ticksCount(): d3.TimeInterval | number;
    getd3TimeRangeEvery(count: number): d3.TimeInterval;
    get daysCount(): number;
    get serieTimestampRange(): number | undefined;
    get timeFormat(): (date: Date) => string;
    get timeInterval(): number;
    get xTickTransform(): string;
    get extraMargin(): Margin;
    get width(): number;
    get height(): number;
    get legendRowPositionY(): number;
    get margin(): Margin;
    get minValue(): number | undefined;
    get maxValue(): number | undefined;
    formatedBound(alias: string, target: string): string;
    get seriesTargetsWithBounds(): any[];
    get visibleSeries(): any[];
    isOutOfChart(): boolean;
}
export { ChartwerkBase, VueChartwerkBaseMixin };

const _default: {
    props: {
        id: {
            type: StringConstructor;
            required: boolean;
        };
        series: {
            type: ArrayConstructor;
            required: boolean;
            default: () => any[];
        };
        options: {
            type: ObjectConstructor;
            required: boolean;
            default: () => {};
        };
    };
    watch: {
        id(): void;
        series(): void;
        options(): void;
    };
    mounted(): void;
    methods: {
        render(): void;
        renderChart(): void;
        appendEvents(): void;
        zoomIn(range: any): void;
        zoomOut(center: any): void;
        mouseMove(evt: any): void;
        mouseOut(): void;
        onLegendClick(idx: any): void;
    };
};
export default _default;

export type Margin = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
export type TimeSerie = {
    target: string;
    alias: string;
    datapoints: [number, number][];
    visible: boolean;
};
export type Options = {
    margin?: Margin;
    colors?: string[];
    confidence?: number;
    eventsCallbacks?: {
        zoomIn: (range: [number, number]) => void;
        zoomOut: (center: number) => void;
        mouseMove: (evt: any) => void;
        mouseOut: () => void;
        onLegendClick: (idx: number) => void;
    };
    timeInterval?: {
        timeFormat?: TimeFormat;
        count?: number;
    };
    tickFormat?: {
        xAxis?: string;
        xTickOrientation?: TickOrientation;
    };
    labelFormat?: {
        xAxis?: string;
        yAxis?: string;
    };
    bounds?: {
        upper: string;
        lower: string;
    };
    timeRange?: {
        from: number;
        to: number;
    };
    renderBarLabels?: boolean;
    renderTicksfromTimestamps?: boolean;
    renderBrushing?: boolean;
    renderYaxis?: boolean;
    renderXaxis?: boolean;
    renderLegend?: boolean;
    renderCrosshair?: boolean;
};
export type VueOptions = Omit<Options, "eventsCallbacks">;
export enum TickOrientation {
    VERTICAL = "vertical",
    HORIZONTAL = "horizontal",
    DIAGONAL = "diagonal"
}
export enum TimeFormat {
    SECOND = "second",
    MINUTE = "minute",
    HOUR = "hour",
    DAY = "day",
    MONTH = "month",
    YEAR = "year"
}

