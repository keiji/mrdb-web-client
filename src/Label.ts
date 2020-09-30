export class Label {

    private _categoryId = 0;
    get categoryId(): number {
        return this._categoryId;
    }

    private _label = 0;
    get label(): number {
        return this._label;
    }

    private _name = "";
    get name(): string {
        return this._name;
    }

    private _order = 0;
    get order(): number {
        return this._order;
    }

    constructor(categoryId: number, label: number, name: string, order: number) {
        this._categoryId = categoryId;
        this._label = label;
        this._name = name;
        this._order = order;
    }
}