
module.exports = class Stack {

    constructor() {
        this._i = 0;
        this._d = Buffer.alloc(1000000);
    }

    push(val) {
        if (this._i === this._d.length) {
            const newSize = this._d.length * 2;
            const newBuff = Buffer.alloc(newSize);

            console.log(`Raise stack to ${Math.floor(newSize / 1000000)}MiB`);

            this._d.copy(newBuff);
            this._d = newBuff;
        }

        this._d.writeUInt16LE(val, this._i);
        this._i += 2;
    }

    pop() {
        if (this._i === 0) {
            throw new Error('Stack is empty');
        }

        this._i -= 2;
        return this._d.readInt16LE(this._i);
    }

    size() {
        return this._i / 2;
    }

};
