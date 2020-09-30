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

        console.log(`neighborScore l:${l}, t:${t}, r:${r}, b:${b}`)
        return Math.min(l, t, r, b)
    }
}