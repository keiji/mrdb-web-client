import { Category } from './Category';
import { Rectangle } from "./Rectangle";
import { Region } from './Region';

const TICK = 0.01;
const NEIGHBOR_THRESHOLD = 0.005;

export class RegionEditorController {

  category: Category;
  label = 0;

  regionList = Array<Region>();

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
  });

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

  onMouseDownListener = (event) => {
    const x = event.offsetX / this.image.width;
    const y = event.offsetY / this.image.height;

    const filteredRegion = this.regionList.filter((region) => {
      return region.containsPoint(x, y);
    }).filter((region) => {
      const score = region.neighborScore(x, y);
      return score < NEIGHBOR_THRESHOLD;
    });

    // sort by neighbor score.
    const sortedRegion = filteredRegion.sort((a, b) => {
      const scoreA = a.neighborScore(x, y);
      const scoreB = b.neighborScore(x, y);
      if (scoreA < scoreB) {
        return -1;
      } else if (scoreA > scoreB) {
        return 1;
      }
      return 0;
    });

    if (sortedRegion.length > 0) {
      this.selectedRegion = sortedRegion[0];
      this.callback.onSelectedRegion(this.selectedRegion);
    } else {
      this.selectedRegion = null;
      this.editingRegion = this.createRegion(x, y);
    }
    this.redraw();
  };

  onMouseMoveListener = (event) => {
    if (this.editingRegion === null) {
      return;
    }

    const x = event.offsetX / this.image.width;
    const y = event.offsetY / this.image.height;

    this.editingRegion.rectangle.right = x;
    this.editingRegion.rectangle.bottom = y;
    this.redraw()
  }

  onMouseUpListener = (event: Event) => {
    const region = this.editingRegion
    if (region) {
      region.rectangle.validate();
      this.editingRegion = null

      if (region.rectangle.width() < TICK && region.rectangle.height() < TICK) {
        return;
      }

      this.selectedRegion = region;
      this.regionList.push(region);
      this.callback.onAddedRegion(this.selectedRegion, this.regionList)
      this.callback.onSelectedRegion(this.selectedRegion)
    }
  }

  onKeyDownListener = (event) => {
    console.log(`keydown ${event.key}`)

    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowUp' || event.key == 'ArrowDown') {
      if (event.altKey) {
        this.shrink(event.key);
      } else if (event.shiftKey) {
        this.expand(event.key);
      } else {
        this.move(event.key);
      }
      this.redraw();

    } else if (event.key == 'Delete' || event.key == 'Clear' || event.key == 'Backspace' || event.key == 'd') {
      if (!this.selectedRegion) {
        return;
      }
      const index = this.regionList.indexOf(this.selectedRegion)
      if (index >= 0) {
        this.regionList.splice(index, 1)
      }
      this.callback.onDeletedRegion(this.selectedRegion, this.regionList)
      this.selectedRegion = null;
      this.redraw();
    } else if (!isNaN(parseInt(event.key))) {
      if (!this.selectedRegion) {
        return;
      }
      this.selectedRegion.label = parseInt(event.key);
      this.callback.onChangedLabel(this.selectedRegion, this.regionList)
      this.redraw();
    } else if(event.key == 'Escape') {
      this.editingRegion = null;
      this.redraw();
    }
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

  createRegion(x: number, y: number) {
    const editingRectangle = new Rectangle();
    editingRectangle.left = x;
    editingRectangle.right = x;
    editingRectangle.top = y;
    editingRectangle.bottom = y;
    return new Region(this.category.id, this.label, editingRectangle)
  }

  shrink(key: string) {
    if (key.endsWith('Left')) {
      this.deform(0, 0, -TICK, 0);
    } else if (key.endsWith('Up')) {
      this.deform(0, 0, 0, -TICK);
    } else if (key.endsWith('Right')) {
      this.deform(TICK, 0, 0, 0);
    } else if (key.endsWith('Down')) {
      this.deform(0, TICK, 0, 0);
    }
  }

  expand(key: string) {
    if (key.endsWith('Left')) {
      this.deform(-TICK, 0, 0, 0);
    } else if (key.endsWith('Up')) {
      this.deform(0, -TICK, 0, 0);
    } else if (key.endsWith('Right')) {
      this.deform(0, 0, TICK, 0);
    } else if (key.endsWith('Down')) {
      this.deform(0, 0, 0, TICK);
    }
  }

  move(key: string) {
    if (key.endsWith('Left')) {
      this.deform(-TICK, 0, -TICK, 0);
    } else if (key.endsWith('Up')) {
      this.deform(0, -TICK, 0, -TICK);
    } else if (key.endsWith('Right')) {
      this.deform(TICK, 0, TICK, 0);
    } else if (key.endsWith('Down')) {
      this.deform(0, TICK, 0, TICK);
    }
  }

  deform(left: number, top: number, right: number, bottom: number) {
    const rect = this.selectedRegion?.rectangle
    if (!rect) {
      return;
    }
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
}
