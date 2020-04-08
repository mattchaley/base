import './css/style.css';

import { Margin, TimeSerie, Options, TickOrientation } from './types';
import { getRandomColor } from './utils';

import * as d3 from 'd3';

import * as _ from 'lodash';


const DEFAULT_MARGIN: Margin = { top: 20, right: 20, bottom: 20, left: 20 };
const DEFAULT_TICK_COUNT = 4;
const MAX_GRID_COUNT = 24;
const SECONDS_IN_DAY = 24 * 60 * 60;

abstract class ChartwerkBase {
  protected _d3Node?: d3.Selection<HTMLElement, unknown, null, undefined>;
  protected _chartContainer?: d3.Selection<d3.BaseType, unknown, null, undefined>;
  protected _crosshair?: d3.Selection<SVGGElement, unknown, null, undefined>;
  protected _brush?: d3.BrushBehavior<unknown>;

  constructor(el: HTMLElement, protected _series: TimeSerie[] = [], protected _options: Options = {}) {
    if(this._options.colors === undefined) {
      this._options.colors = this._series.map(getRandomColor);
    }
    if(this._options.confidence === undefined) {
      this._options.confidence = 0;
    }

    const colorsCount = this._options.colors.length;
    const seriesCount = this._series.length;
    if(colorsCount < seriesCount) {
      throw new Error(`
        Colors count should be greater or equal than series count.
        Current: colors count (${colorsCount}) < series count (${seriesCount})
      `);
    }
    this._d3Node = d3.select(el);

    this.render();
  }

  render(): void {
    this._renderSvg();
    this._renderXAxis();
    this._renderYAxis();
    this._renderGrid();

    this._renderMetrics();

    this._renderYLabel();
    this._renderXLabel();
  }

  abstract _renderMetrics(): void;

  _renderSvg(): void {
    this._d3Node.select('svg').remove();
    this._chartContainer = this._d3Node
      .append('svg')
        .style('width', '100%')
        .style('height', '100%')
        .append('g')
          .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // TODO: clipPath
  }

  _renderGrid(): void {
    this._chartContainer
      .append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('class', 'grid')
      .call(
        d3.axisBottom(this.xScale).ticks(this.ticksCount(2))
          .tickSize(-this.height)
          .tickFormat(() => '')
      );

    this._chartContainer
      .append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(this.yScale).ticks(DEFAULT_TICK_COUNT)
          .tickSize(-this.width)
          .tickFormat(() => '')
      );

    this._chartContainer.selectAll('.grid').selectAll('.tick')
      .attr('opacity', '0.5');
  }

  _renderXAxis(): void {
    this._chartContainer
      .append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('id', 'x-axis-container')
      .call(
        d3.axisBottom(this.xScale).ticks(this.ticksCount(1))
          .tickSize(2)
          .tickFormat(this.timeFormat)
      );
    this._chartContainer.select('#x-axis-container').selectAll('.tick').selectAll('text')
      .style('transform', this.xTickTransform);
  }

  _renderYAxis(): void {
    this._chartContainer
      .append('g')
      // TODO: number of ticks shouldn't be hardcoded
      .call(
        d3.axisLeft(this.yScale).ticks(DEFAULT_TICK_COUNT)
          .tickSize(2)
      );
  }

  _renderYLabel(): void {
    if(this._options.labelFormat === undefined || this._options.labelFormat.yAxis === undefined) {
      return;
    }
    this._chartContainer.append('text')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - (this.height / 2))
      .attr('dy', '1em')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'currentColor')
      .text(this._options.labelFormat.yAxis);
  }

  _renderXLabel(): void {
    if (this._options.labelFormat === undefined || this._options.labelFormat.xAxis === undefined) {
      return;
    }
    this._chartContainer.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', this.width / 2)
      .attr('y', this.height + this.margin.top + this.margin.bottom - 25)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'currentColor')
      .text(this._options.labelFormat.xAxis);
  }

  get xScale(): d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> {
    if (
      this.minValue === undefined ||
      this.maxValue === undefined
    ) {
      return d3.scaleLinear()
        // TODO: use timerange from options
        .domain([0, 1])
        .range([0, this.width]);
    }
    // TODO: add timezone (utc / browser) to options and use it
    return d3.scaleTime()
      .domain([
        new Date(_.first(this._series[0].datapoints)[1]),
        new Date(_.last(this._series[0].datapoints)[1])
      ])
      .range([0, this.width]);
  }

  get xTimeScale(): d3.ScaleTime<number, number> {
    return d3.scaleTime()
      .domain([
        new Date(_.first(this._series[0].datapoints)[1]),
        new Date(_.last(this._series[0].datapoints)[1])
      ])
      .range([0, this.width])
  }

  get yScale(): d3.ScaleLinear<number, number> {
    if(
      this.minValue === undefined ||
      this.maxValue === undefined
    ) {
      return d3.scaleLinear()
        // TODO: why [100, 0]?
        .domain([100, 0])
        .range([0, this.height]);
    }

    return d3.scaleLinear()
      .domain([this.maxValue, this.minValue])
      .range([0, this.height]);
  }

  ticksCount(scaleFactor: number): d3.TimeInterval | number {
    if(this._options.timeInterval !== undefined) {
      if(this.daysCount > 1 * scaleFactor) {
        return MAX_GRID_COUNT * scaleFactor;
      } else {
        return d3.timeMinute.every(this._options.timeInterval);
      }
    }
    return 4;
  }

  get daysCount(): number {
    const timestampRange = this.serieTimestampRange;
    if(timestampRange === undefined) {
      return 0;
    }
    return timestampRange / SECONDS_IN_DAY;
  }

  get serieTimestampRange(): number | undefined {
    if(this._series.length === 0) {
      return undefined;
    }
    const startTimestamp = _.first(this._series[0].datapoints)[1];
    const endTimestamp = _.last(this._series[0].datapoints)[1];
    return (endTimestamp - startTimestamp) / 1000;
  }

  get timeFormat(): (date: Date) => string {
    if(this._options.tickFormat !== undefined && this._options.tickFormat.xAxis !== undefined) {
      return d3.timeFormat(this._options.tickFormat.xAxis);
    }
    return (() => '');
  }

  get xTickTransform(): string {
    if(this._options.tickFormat === undefined && this._options.tickFormat.xTickOrientation === undefined) {
      return '';
    }
    switch (this._options.tickFormat.xTickOrientation) {
      case TickOrientation.VERTICAL:
        return 'translate(-10px, 50px) rotate(-90deg)';
      case TickOrientation.HORIZONTAL:
        return '';
      case TickOrientation.DIAGONAL:
        return 'translate(-30px, 30px) rotate(-45deg)';
      default:
        return '';
    }
  }

  get extraMargin(): Margin {
    let optionalMargin = { top: 0, right: 0, bottom: 0, left: 0 };
    if(this._options.tickFormat.xTickOrientation !== undefined) {
      switch (this._options.tickFormat.xTickOrientation) {
        case TickOrientation.VERTICAL:
          optionalMargin.bottom += 80;
          break;
        case TickOrientation.HORIZONTAL:
          break;
        case TickOrientation.DIAGONAL:
          optionalMargin.left += 15;
          optionalMargin.bottom += 50;
          optionalMargin.right += 10;
          break;
      }
    }
    if(this._options.labelFormat !== undefined) {
      if(this._options.labelFormat.xAxis !== undefined) {
        optionalMargin.bottom += 20;
      }
      if (this._options.labelFormat.yAxis !== undefined) {
        optionalMargin.left += 20;
      }
    }
    return optionalMargin;
  }

  get width(): number {
    return this._d3Node.node().clientWidth - this.margin.left - this.margin.right;
  }

  get height(): number {
    return this._d3Node.node().clientHeight - this.margin.top - this.margin.bottom;
  }

  get margin(): Margin {
    if(this._options.margin !== undefined) {
      return this._options.margin;
    }
    return _.mergeWith({}, DEFAULT_MARGIN, this.extraMargin, _.add);
  }

  get minValue(): number | undefined {
    const minValue = _.min(
      this._series.map(
        serie => _.minBy<number[]>(serie.datapoints, dp => dp[0])[0]
      )
    );

    if(minValue === undefined) {
      return undefined;
    }
    return minValue - this._options.confidence;
  }

  get maxValue(): number | undefined {
    const maxValue = _.max(
      this._series.map(
        serie => _.maxBy<number[]>(serie.datapoints, dp => dp[0])[0]
      )
    );

    if(maxValue === undefined) {
      return undefined;
    }
    return maxValue + this._options.confidence;
  }
}

export {
  ChartwerkBase,
  Margin, TimeSerie, Options, TickOrientation
};