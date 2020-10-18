export class Category {

    private _id = 0;
    get id(): number {
        return this._id;
    }

    private _name = "";
    get name(): string {
        return this._name;
    }

    private _order = 0;
    get order(): number {
        return this._order;
    }

    constructor(id: number, name: string, order: number) {
        this._id = id;
        this._name = name;
        this._order = order;
    }
}