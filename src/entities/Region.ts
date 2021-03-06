import { Rectangle } from './Rectangle'

export class Region {

    id: number;
    categoryId: number
    label: number
    rectangle: Rectangle

    constructor(id: number, categoryId: number, label: number, rectangle: Rectangle) {
        this.id = id;
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

    deepCopy(): Region {
        return new Region(this.id, this.categoryId, this.label, this.rectangle.deepCopy());
    }
}

const ORDER_UNIT = 5;

export function convertRegionsToPathRegions(regions: Array<Region>) {
    return regions.map((region: Region, index: number) => {
        return {
            "category_id": region.categoryId,
            "label": region.label,
            "order": index * ORDER_UNIT,
            "points": region.rectangle.toPoints()
        }
    });
}

function horizontalPoints(points: Array<{}>): Array<number> {
    return points.map((point: any) => {
        return point['x'] as number
    });
}

function verticalPoints(points: Array<{}>): Array<number> {
    return points.map((point: any) => {
        return point['y'] as number
    });
}

export function convertPointsToRegions(regions): Array<Region> {
    return regions.map((regionObj: any) => {
        const id = regionObj['id'] ? regionObj['id'] : -1;
        const categoryId = regionObj['category_id'];
        const label = regionObj['label'];

        const horizontalPointList = horizontalPoints(regionObj['points']);
        const verticalPointList = verticalPoints(regionObj['points']);

        const left = Math.min(...horizontalPointList);
        const top = Math.min(...verticalPointList);
        const right = Math.max(...horizontalPointList);
        const bottom = Math.max(...verticalPointList);

        const rectangle = new Rectangle()
        rectangle.left = left;
        rectangle.top = top;
        rectangle.right = right;
        rectangle.bottom = bottom;
        rectangle.validate()

        return new Region(id, categoryId, label, rectangle);
    });
}