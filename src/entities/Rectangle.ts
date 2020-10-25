export class Rectangle {

    private _left = 0;
    set left(value: number) {
        this._left = Math.min(Math.max(0, value), 1.0);
    }
    get left(): number {
        return Math.min(this._left, this._right);
    }

    private _top = 0;
    set top(value: number) {
        this._top = Math.min(Math.max(0, value), 1.0);
    }
    get top(): number {
        return Math.min(this._top, this._bottom);
    }

    private _right = 0;
    set right(value: number) {
        this._right = Math.min(Math.max(0, value), 1.0);
    }
    get right(): number {
        return Math.max(this._left, this._right);
    }

    private _bottom = 0;
    set bottom(value: number) {
        this._bottom = Math.min(Math.max(0, value), 1.0);
    }
    get bottom(): number {
        return Math.max(this._top, this._bottom);
    }

    get centerX(): number {
        return this.left + this.width() / 2;
    }
    get centerY(): number {
        return this.top + this.height() / 2;
    }

    width = () => { return this.right - this.left; }
    height = () => { return this.bottom - this.top; }

    validate() {
        const l = Math.min(this.left, this.right);
        const t = Math.min(this.top, this.bottom);
        const r = Math.max(this.left, this.right);
        const b = Math.max(this.top, this.bottom);

        this.left = l;
        this.top = t;
        this.right = r;
        this.bottom = b;
    }

    toString() {
        return `left: ${this.left}, top: ${this.top}, right: ${this.right}, bottom: ${this.bottom}`
    }

    toPoints(): Array<{}> {
        return [
            {
                "x": this.left,
                "y": this.top,
            },
            {
                "x": this.right,
                "y": this.top,
            },
            {
                "x": this.right,
                "y": this.bottom,
            },
            {
                "x": this.left,
                "y": this.bottom,
            }
        ];
    }

    deepCopy(): Rectangle {
        const rectangle = new Rectangle();
        rectangle.left = this.left;
        rectangle.top = this.top;
        rectangle.right = this.right;
        rectangle.bottom = this.bottom;

        return rectangle;
    }
}