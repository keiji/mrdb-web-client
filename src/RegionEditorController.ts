import { Category } from './Category';
import { Rectangle } from "./Rectangle";
import { Region } from './Region';

const TICK = 0.01;
const NEIGHBOR_THRESHOLD = 0.005;

export class EditHistory {
  regionList: Array<Region>

  constructor(regionList: Array<Region>) {
    this.regionList = regionList;
  }
}

export class RegionEditorController {

  category: Category;
  label = 0;

  regionList = Array<Region>();
  historyList = Array<EditHistory>();

  private canvas: HTMLCanvasElement
  private image: HTMLImageElement

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
    onHistoryUpdated(historyList: Array<EditHistory>) {
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
    this.callback.onSelectedRegion(region);
  }
  get selectedRegion(): Region | null {
    return this._selectedRegion;
  }

  private clicking = false;

  nearestRegion(offsetX: number, offsetY: number) {
    const x = offsetX / this.image.width;
    const y = offsetY / this.image.height;

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

  onMouseDownListener = (event) => {
    this.clicking = true;
    const nearestRegionArray = this.nearestRegion(event.offsetX, event.offsetY);

    if (nearestRegionArray.length > 0) {
      this.selectedRegion = nearestRegionArray[0];
      this.callback.onSelectedRegion(this.selectedRegion);
    } else {
      this.selectedRegion = null;
      this.editingRegion = this.createRegion(event.offsetX, event.offsetY);
    }
    this.redraw();
  };

  onMouseMoveListener = (event) => {
    if (this.clicking && this.editingRegion !== null) {
      const x = event.offsetX / this.image.width;
      const y = event.offsetY / this.image.height;

      this.editingRegion.rectangle.right = x;
      this.editingRegion.rectangle.bottom = y;
      this.redraw()
      return;

    } else if (!this.clicking) {
      const nearestRegionArray = this.nearestRegion(event.offsetX, event.offsetY);
      if (nearestRegionArray.length > 0) {
        this.focusedRegion = nearestRegionArray[0];
      } else {
        this.focusedRegion = null;
      }
      this.redraw()
      return;
    }
  }

  onMouseUpListener = (event: Event) => {
    this.clicking = false;

    const region = this.editingRegion
    if (region) {
      region.rectangle.validate();
      this.editingRegion = null

      if (region.rectangle.width() < TICK && region.rectangle.height() < TICK) {
        return;
      }

      this.selectedRegion = region;

      this.addEditHistory();
      this.regionList.push(region);

      this.callback.onAddedRegion(this.selectedRegion, this.regionList)
      this.callback.onSelectedRegion(this.selectedRegion)
    }
  }

  onKeyDownListener = (event) => {
    event.preventDefault();

    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowUp' || event.key == 'ArrowDown') {
      const dist = TICK * (event.shiftKey ? 0.1 : 1.0);

      if (event.altKey) {
        this.shrink(event.key, dist);
      } else if (event.metaKey) {
        this.expand(event.key, dist);
      } else {
        this.move(event.key, dist);
      }
      this.redraw();

    } else if (event.key == 'Delete' || event.key == 'Clear' || event.key == 'Backspace' || event.key == 'd') {
      if (!this.selectedRegion) {
        return;
      }
      this.deleteRegion(this.selectedRegion);
      this.redraw();

    } else if (!isNaN(parseInt(event.key))) {
      if (!this.selectedRegion) {
        return;
      }
      this.selectedRegion.label = parseInt(event.key);
      this.callback.onChangedLabel(this.selectedRegion, this.regionList)
      this.redraw();
    } else if (event.key == 'Escape') {
      this.editingRegion = null;
      this.redraw();
    } else if (event.key == 'Enter') {
      if (event.shiftKey) {
        this.selectPrevRegion();
      } else {
        this.selectNextRegion();
      }
      this.redraw();
    } else if (event.ctrlKey && event.key == 'z') {
      this.restoreEditHistory();
      this.redraw();
    } else {
      console.log(event.key);
    }
  }

  private restoreEditHistory() {
    if (this.historyList.length == 0) {
      return;
    }

    const lastHistoryIndex = this.historyList.length - 1;
    const latestHistory = this.historyList[lastHistoryIndex];
    this.regionList = latestHistory.regionList;

    this.historyList = [...this.historyList.slice(0, lastHistoryIndex)];
    this.callback.onHistoryUpdated(this.historyList);

    if (this.selectedRegion === null) {
      return;
    }

    const isSelectedRegion = this.regionList.filter((region) => {
      return region === this.selectedRegion;
    }).length != 0;

    if (!isSelectedRegion) {
      this.selectedRegion = null;
    }
  }

  private addEditHistory() {
    this.historyList.push(
      new EditHistory(this.regionList.map((region) => {
        return region.deepCopy();
      }))
    );

    this.callback.onHistoryUpdated(this.historyList);
  }

  deleteRegion(region: Region) {
    this.addEditHistory();

    const index = this.regionList.indexOf(region)
    if (index >= 0) {
      this.regionList.splice(index, 1)
    }
    this.callback.onDeletedRegion(region, this.regionList)
    this.selectedRegion = null;
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
    image: HTMLImageElement,
    category: Category,
    callback: Callback,
  ) {
    this.canvas = canvas;
    this.image = image;

    this.category = category;

    this.callback = callback;

    canvas.addEventListener("mousedown", this.onMouseDownListener);
    canvas.addEventListener("mousemove", this.onMouseMoveListener);
    canvas.addEventListener("mouseup", this.onMouseUpListener);

    // https://qiita.com/jay-es/items/cd30c73989659374698a
    canvas.addEventListener("keydown", this.onKeyDownListener);
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.onMouseDownListener);
    this.canvas.removeEventListener("mousemove", this.onMouseMoveListener);
    this.canvas.removeEventListener("mouseup", this.onMouseUpListener);
    this.canvas.removeEventListener("keydown", this.onKeyDownListener);
  }

  createRegion(offsetX: number, offsetY: number) {
    const x = offsetX / this.image.width;
    const y = offsetY / this.image.height;

    const editingRectangle = new Rectangle();
    editingRectangle.left = x;
    editingRectangle.right = x;
    editingRectangle.top = y;
    editingRectangle.bottom = y;
    return new Region(this.category.id, this.label, editingRectangle)
  }

  shrink(key: string, dist: number) {
    if (key.endsWith('Left')) {
      this.deform(0, 0, -dist, 0);
    } else if (key.endsWith('Up')) {
      this.deform(0, 0, 0, -dist);
    } else if (key.endsWith('Right')) {
      this.deform(dist, 0, 0, 0);
    } else if (key.endsWith('Down')) {
      this.deform(0, dist, 0, 0);
    }
  }

  expand(key: string, dist: number) {
    if (key.endsWith('Left')) {
      this.deform(-dist, 0, 0, 0);
    } else if (key.endsWith('Up')) {
      this.deform(0, -dist, 0, 0);
    } else if (key.endsWith('Right')) {
      this.deform(0, 0, dist, 0);
    } else if (key.endsWith('Down')) {
      this.deform(0, 0, 0, dist);
    }
  }

  move(key: string, dist: number) {
    if (key.endsWith('Left')) {
      this.deform(-dist, 0, -dist, 0);
    } else if (key.endsWith('Up')) {
      this.deform(0, -dist, 0, -dist);
    } else if (key.endsWith('Right')) {
      this.deform(dist, 0, dist, 0);
    } else if (key.endsWith('Down')) {
      this.deform(0, dist, 0, dist);
    }
  }

  deform(left: number, top: number, right: number, bottom: number) {
    const rect = this.selectedRegion?.rectangle
    if (!rect) {
      return;
    }

    this.addEditHistory();

    rect.left = rect.left + left;
    rect.top = rect.top + top;
    rect.right = rect.right + right;
    rect.bottom = rect.bottom + bottom;
  }

  redraw() {
    const ctx = this.canvas.getContext("2d");
    if (ctx === null) {
      return;
    }

    ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

    if (!this.regionList) {
      return;
    }

    console.log(`regionList: ${this.regionList.length}`);

    this.regionList.forEach((region, index) => {
      const rect = region.rectangle;
      if (region == this.selectedRegion) {
        ctx.strokeStyle = "#00FF00";
      } else if (region == this.focusedRegion) {
        console.log('try focusing2.');
        ctx.strokeStyle = "#0000FF";
      } else {
        ctx.strokeStyle = "#666666";
      }
      ctx.strokeRect(
        rect.left * this.image.width,
        rect.top * this.image.height,
        rect.width() * this.image.width,
        rect.height() * this.image.height
      );
    })

    if (this.editingRegion) {
      const rect = this.editingRegion.rectangle;

      ctx.strokeStyle = "#FF0000";
      ctx.strokeRect(
        rect.left * this.image.width,
        rect.top * this.image.height,
        rect.width() * this.image.width,
        rect.height() * this.image.height
      );
    }
  }

}

export interface Callback {
  onSelectedRegion(region: Region | null);
  onAddedRegion(region: Region, regionList: Array<Region>);
  onDeletedRegion(region: Region, regionList: Array<Region>);
  onChangedLabel(region: Region, regionList: Array<Region>);
  onHistoryUpdated(historyList: Array<EditHistory>);
}
