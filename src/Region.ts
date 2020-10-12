import { Rectangle } from './Rectangle'

export class Region {

    categoryId: number
    label: number
    rectangle: Rectangle

    constructor(categoryId: number, label: number, rectangle: Rectangle) {
        this.categoryId = categoryId;
        this.label = label;
        this.rectangle = rectangle;
    }

    containsPoint(x: number, y: number): boolean {
        if (x < this.rectangle.left) {
            return false;
        }
        if (y < this.rectangle.top) {
            return false;
        }
        if (x > this.rectangle.right) {
            return false;
        }
        if (y > this.rectangle.bottom) {
            return false;
        }
        return true;
    }

    neighborScore(x: number, y: number): number {
        const l = Math.abs(this.rectangle.left - x);
        const r = Math.abs(this.rectangle.right - x);
        const t = Math.abs(this.rectangle.top - y);
        const b = Math.abs(this.rectangle.bottom - y);

        return Math.min(l, t, r, b)
    }

    deepCopy() : Region {
        return new Region(this.categoryId, this.label, this.rectangle.deepCopy());
    }
}

export function convertRegionsToPathRegions(regions: Array<Region>) {
    return regions.map((region) => {
      return {
        "category_id": region.categoryId,
        "label": region.label,
        "order": 0,
        "points": region.rectangle.toPoints()
      }
    });
  }
  