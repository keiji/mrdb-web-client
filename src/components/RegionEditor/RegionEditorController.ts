import { Category } from '../../entities/Category';
import { Rectangle } from '../../entities/Rectangle';
import { Region } from '../../entities/Region';


const TICK = 0.01;
const NEIGHBOR_THRESHOLD = 0.005;

const MARKER_LENGTH = 8;

type Mode = 'move' | 'expand' | 'shrink';

export class RegionEditorController {

  category: Category = new Category(0, 'Unknown', 0);
  label = 0;

  private mode: Mode = 'move';

  regionList = Array<Region>();
  image: HTMLImageElement | null = null;

  private canvas: HTMLCanvasElement

  private callback: Callback = new (class implements Callback {
    onSelectedRegion(selectedRegion: Region) {
      // Do nothing
    }
    onAddedRegion(addedRegion: Region, regionList: Array<Region>) {
      // Do nothing
    }
    onDeletedRegion(deletedRegion: Region, regionList: Array<Region>) {
      // Do nothing
    }
    onChangedLabel(deletedRegion: Region, regionList: Array<Region>) {
      // Do nothing
    }
    onDeformRegion(deformedRegion: Region, regionList: Array<Region>) {
      // Do nothing
    }
  });

  private _focusedRegion: Region | null = null;
  set focusedRegion(region: Region | null) {
    this._focusedRegion = region;
  }
  get focusedRegion(): Region | null {
    return this._focusedRegion;
  }

  private _editingRegion: Region | null = null;
  set editingRegion(region: Region | null) {
    this._editingRegion = region;
  }
  get editingRegion(): Region | null {
    return this._editingRegion;
  }

  private _selectedRegion: Region | null = null;
  set selectedRegion(region: Region | null) {
    this._selectedRegion = region;
  }
  get selectedRegion(): Region | null {
    return this._selectedRegion;
  }

  private imageWidth = 0;
  private imageHeight = 0;

  private marginTop = 0;
  private marginBottom = 0;
  private marginLeft = 0;
  private marginRight = 0;

  destroy() {
    this.image = null;
  }

  calcMargin(
    minMarginPixel: number
  ) {
    if (!this.image) {
      return;
    }

    const ratio = Math.min(
      this.canvas.width / this.image.width,
      this.canvas.height / this.image.height
    );

    let marginHorizontal = this.canvas.width - (this.image.width * ratio);
    let marginVertical = this.canvas.height - (this.image.height * ratio);

    if (marginHorizontal < minMarginPixel * 2) {
      marginHorizontal = minMarginPixel * 2;
    }
    if (marginVertical < minMarginPixel * 2) {
      marginVertical = minMarginPixel * 2;
    }

    this.marginTop = marginVertical / 2;
    this.marginBottom = marginVertical - this.marginTop;
    this.marginLeft = marginHorizontal / 2;
    this.marginRight = marginHorizontal - this.marginLeft;

    this.imageWidth = this.canvas.width - marginHorizontal;
    this.imageHeight = this.canvas.height - marginVertical;
  };

  calcXRatio(offsetX: number) {
    return (offsetX - this.marginLeft) / this.imageWidth;
  }

  calcYRatio(offsetY: number) {
    return (offsetY - this.marginTop) / this.imageHeight;
  }

  private clicking = false;

  onMouseDownListener = (event) => {
    this.clicking = true;

    const x = this.calcXRatio(event.offsetX);
    const y = this.calcYRatio(event.offsetY);

    const nearestRegionArray = this.nearestRegion(x, y);

    if (nearestRegionArray.length > 0) {
      this.selectedRegion = nearestRegionArray[0];
    } else {
      this.selectedRegion = null;
      this.editingRegion = this.createRegion(x, y);
    }
    this.callback.onSelectedRegion(this.selectedRegion);
    this.redraw();
  };

  onMouseMoveListener = (event) => {

    const x = this.calcXRatio(event.offsetX);
    const y = this.calcYRatio(event.offsetY);

    if (this.clicking && this.editingRegion !== null) {
      this.editingRegion.rectangle.right = x;
      this.editingRegion.rectangle.bottom = y;
      this.redraw()
      return;

    } else if (!this.clicking) {
      const nearestRegionArray = this.nearestRegion(x, y);

      if (nearestRegionArray.length > 0) {
        this.focusedRegion = nearestRegionArray[0];
      } else {
        this.focusedRegion = null;
      }
      this.redraw()
      return;
    }
  }

  onMouseUpListener = (event) => {
    this.clicking = false;

    const region = this.editingRegion
    if (region) {
      region.rectangle.validate();
      this.editingRegion = null

      if (region.rectangle.width() < TICK && region.rectangle.height() < TICK) {
        return;
      }

      this.addRegion(region);
    }
  }

  nearestRegion(x: number, y: number) {
    const filteredRegion = this.regionList.filter((region) => {
      return region.containsPoint(x, y);
    }).filter((region) => {
      const score = region.neighborScore(x, y);
      return score < NEIGHBOR_THRESHOLD;
    });

    // sort by neighbor score.
    const sortedRegions = filteredRegion.sort((a, b) => {
      const scoreA = a.neighborScore(x, y);
      const scoreB = b.neighborScore(x, y);
      if (scoreA < scoreB) {
        return -1;
      } else if (scoreA > scoreB) {
        return 1;
      }
      return 0;
    });
    return sortedRegions;
  }

  onKeyDownListener = (event) => {

    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowUp' || event.key == 'ArrowDown') {
      event.preventDefault();

      const dist = TICK * (event.shiftKey ? 0.1 : 1.0);

      if (event.altKey) {
        this.shrink(event.key, dist);
      } else if (event.metaKey) {
        this.expand(event.key, dist);
      } else {
        this.move(event.key, dist);
      }

    } else if (event.key == 'Delete' || event.key == 'Clear' || event.key == 'Backspace' || event.key == 'd') {
      event.preventDefault();

      if (!this.selectedRegion) {
        return;
      }
      this.deleteRegion(this.selectedRegion);

    } else if (!isNaN(parseInt(event.key))) {
      event.preventDefault();

      if (!this.selectedRegion) {
        return;
      }
      this.changeRegionLabel(this.selectedRegion, parseInt(event.key));

    } else if (event.key == 'Escape') {
      event.preventDefault();

      this.editingRegion = null;
    } else if (event.key == 'Enter') {
      event.preventDefault();

      if (event.shiftKey) {
        this.selectPrevRegion();
      } else {
        this.selectNextRegion();
      }
    } else if (event.key == 'Meta') {
      event.preventDefault();
      this.mode = 'expand';
    } else if (event.key == 'Alt') {
      event.preventDefault();
      this.mode = 'shrink';
    } else {
      console.log(event.key);
    }

    this.redraw();
  }

  onKeyUpListener = (event) => {
    event.preventDefault();

    if (event.key == 'Meta' && !event.altKey) {
      this.mode = 'move';
    } else if (event.key == 'Alt' && !event.metaKey) {
      this.mode = 'move';
    }

    this.redraw();
  }

  addRegion(region: Region) {
    this.regionList = [...this.regionList, region];
    this.callback.onAddedRegion(region, this.regionList)

    this.selectedRegion = region;
    this.callback.onSelectedRegion(region);
  }

  deleteRegion(region: Region) {
    const deleteIndex = this.regionList.indexOf(region)
    if (deleteIndex >= 0) {
      this.regionList = [
        ...this.regionList.slice(0, deleteIndex),
        ...this.regionList.slice(deleteIndex + 1, this.regionList.length)
      ];
    }
    this.callback.onDeletedRegion(region, this.regionList)

    this.selectedRegion = null;
    this.callback.onSelectedRegion(null);
  }

  moveRegion(count: number) {
    if (this.regionList.length == 0) {
      return;
    }

    if (this.selectedRegion === null) {
      this.selectedRegion = this.regionList[0];
      return;
    }

    const index = this.regionList.indexOf(this.selectedRegion);
    if (index > -1) {
      const toIndex = index + count;
      if (toIndex >= 0 && toIndex < this.regionList.length) {
        this.selectedRegion = this.regionList[toIndex];
        this.callback.onSelectedRegion(this.selectedRegion);
      }
    }
  }

  selectPrevRegion() {
    this.moveRegion(-1);
  }

  selectNextRegion() {
    this.moveRegion(+1);
  }

  constructor(
    canvas: HTMLCanvasElement,
    callback: Callback,
  ) {
    this.canvas = canvas;
    this.callback = callback;
  }

  createRegion(x: number, y: number) {
    const editingRectangle = new Rectangle();
    editingRectangle.left = x;
    editingRectangle.right = x;
    editingRectangle.top = y;
    editingRectangle.bottom = y;
    return new Region(this.category.id, this.label, editingRectangle)
  }

  shrink(key: string, dist: number): boolean {
    this.mode = 'shrink';

    if (key.endsWith('Left')) {
      return this.deform(0, 0, -dist, 0);
    } else if (key.endsWith('Up')) {
      return this.deform(0, 0, 0, -dist);
    } else if (key.endsWith('Right')) {
      return this.deform(dist, 0, 0, 0);
    } else if (key.endsWith('Down')) {
      return this.deform(0, dist, 0, 0);
    }
    return false;
  }

  expand(key: string, dist: number): boolean {
    this.mode = 'expand';

    if (key.endsWith('Left')) {
      return this.deform(-dist, 0, 0, 0);
    } else if (key.endsWith('Up')) {
      return this.deform(0, -dist, 0, 0);
    } else if (key.endsWith('Right')) {
      return this.deform(0, 0, dist, 0);
    } else if (key.endsWith('Down')) {
      return this.deform(0, 0, 0, dist);
    }

    return false;
  }

  move(key: string, dist: number): boolean {
    this.mode = 'move';

    if (key.endsWith('Left')) {
      return this.deform(-dist, 0, -dist, 0);
    } else if (key.endsWith('Up')) {
      return this.deform(0, -dist, 0, -dist);
    } else if (key.endsWith('Right')) {
      return this.deform(dist, 0, dist, 0);
    } else if (key.endsWith('Down')) {
      return this.deform(0, dist, 0, dist);
    }

    return false;
  }

  deform(left: number, top: number, right: number, bottom: number): boolean {
    if (!this.selectedRegion) {
      return false;
    }

    const deformRegionIndex = this.regionList.indexOf(this.selectedRegion);
    if (deformRegionIndex < 0) {
      return false;
    }

    const deformRegion = this.selectedRegion.deepCopy();
    const rect = deformRegion.rectangle;

    let newLeft = rect.left + left;
    let newTop = rect.top + top;
    let newRight = rect.right + right;
    let newBottom = rect.bottom + bottom;

    newLeft = Math.max(0, newLeft);
    newTop = Math.max(0, newTop);
    newRight = Math.min(1.0, newRight);
    newBottom = Math.min(1.0, newBottom);

    if (rect.left === newLeft
      && rect.top === newTop
      && rect.right === newRight
      && rect.bottom === newBottom) {
      return false;
    }

    rect.left = newLeft;
    rect.top = newTop;
    rect.right = newRight;
    rect.bottom = newBottom;

    const newRegionList = [
      ...this.regionList.slice(0, deformRegionIndex),
      deformRegion,
      ...this.regionList.slice(deformRegionIndex + 1, this.regionList.length)
    ];
    this.regionList = newRegionList;
    this.selectedRegion = deformRegion;

    this.callback.onDeformRegion(deformRegion, this.regionList);
    this.callback.onSelectedRegion(this.selectedRegion);

    return true;
  }

  changeRegionLabel(region: Region, label: number) {
    const labelRegionIndex = this.regionList.indexOf(region);
    if (labelRegionIndex < 0) {
      return false;
    }

    const labelRegion = region.deepCopy();
    labelRegion.label = label;

    const newRegionList = [
      ...this.regionList.slice(0, labelRegionIndex),
      labelRegion,
      ...this.regionList.slice(labelRegionIndex + 1, this.regionList.length)
    ];
    this.regionList = newRegionList;
    this.selectedRegion = labelRegion;

    this.callback.onChangedLabel(labelRegion, this.regionList);

    return true;
  }

  redraw() {
    if (!this.image) {
      return;
    }

    const ctx = this.canvas.getContext("2d");
    if (ctx === null) {
      return;
    }

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.drawImage(
      this.image,
      this.marginLeft, this.marginTop,
      this.imageWidth, this.imageHeight
    );

    if (!this.regionList) {
      return;
    }

    this.regionList.forEach((region, index) => {
      if (region == this.selectedRegion) {
        ctx.strokeStyle = "#00FF00";
        this.drawMarkers(region, ctx);
      } else if (region == this.focusedRegion) {
        ctx.strokeStyle = "#0000FF";
      } else {
        ctx.strokeStyle = "#666666";
      }

      this.drawRegion(region, ctx);
    })

    if (this.editingRegion) {
      ctx.strokeStyle = "#FF0000";
      this.drawRegion(this.editingRegion, ctx);
    }
  }

  drawExpandMarkers(region: Region, ctx: CanvasRenderingContext2D) {
    // top
    const topX = region.rectangle.centerX * this.imageWidth + this.marginLeft;
    const topY = region.rectangle.top * this.imageHeight + this.marginTop;
    ctx.fillRect(topX, topY, 1, -MARKER_LENGTH);

    // left
    const leftX = region.rectangle.left * this.imageWidth + this.marginLeft;
    const leftY = region.rectangle.centerY * this.imageHeight + this.marginTop;
    ctx.fillRect(leftX, leftY, -MARKER_LENGTH, 1);

    // right
    const rightX = region.rectangle.right * this.imageWidth + this.marginLeft;
    const rightY = region.rectangle.centerY * this.imageHeight + this.marginTop;
    ctx.fillRect(rightX, rightY, MARKER_LENGTH, 1);

    // bottom
    const bottomX = region.rectangle.centerX * this.imageWidth + this.marginLeft;
    const bottomY = region.rectangle.bottom * this.imageHeight + this.marginTop;
    ctx.fillRect(bottomX, bottomY, 1, MARKER_LENGTH);
  }

  drawShrinkMarkers(region: Region, ctx: CanvasRenderingContext2D) {
    // top
    const topX = region.rectangle.centerX * this.imageWidth + this.marginLeft;
    const topY = region.rectangle.top * this.imageHeight + this.marginTop;
    ctx.fillRect(topX, topY, 1, MARKER_LENGTH);

    // left
    const leftX = region.rectangle.left * this.imageWidth + this.marginLeft;
    const leftY = region.rectangle.centerY * this.imageHeight + this.marginTop;
    ctx.fillRect(leftX, leftY, MARKER_LENGTH, 1);

    // right
    const rightX = region.rectangle.right * this.imageWidth + this.marginLeft;
    const rightY = region.rectangle.centerY * this.imageHeight + this.marginTop;
    ctx.fillRect(rightX, rightY, -MARKER_LENGTH, 1);

    // bottom
    const bottomX = region.rectangle.centerX * this.imageWidth + this.marginLeft;
    const bottomY = region.rectangle.bottom * this.imageHeight + this.marginTop;
    ctx.fillRect(bottomX, bottomY, 1, -MARKER_LENGTH);
  }

  drawMarkers(region: Region, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#00FF00";

    switch (this.mode) {
      case "move": {
        return;
      }
      case "expand": {
        this.drawExpandMarkers(region, ctx);
        return;
      }
      case "shrink": {
        this.drawShrinkMarkers(region, ctx);
        return;
      }
    }
  }

  drawRegion(region: Region, ctx: CanvasRenderingContext2D) {
    const rect = region.rectangle;

    ctx.strokeRect(
      rect.left * this.imageWidth + this.marginLeft,
      rect.top * this.imageHeight + this.marginTop,
      rect.width() * this.imageWidth,
      rect.height() * this.imageHeight
    );
  }
}

export interface Callback {
  onSelectedRegion(region: Region | null);
  onChangedLabel(region: Region, regionList: Array<Region>);

  onAddedRegion(addedRegion: Region, regionList: Array<Region>);
  onDeletedRegion(deletedRegion: Region, regionList: Array<Region>);
  onDeformRegion(deformedRegion: Region, regionList: Array<Region>);
}
