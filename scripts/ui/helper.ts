export function isType<T>(elem: any, cls: new (...a: any) => T): boolean {
    return elem instanceof cls
}

export function assertType<T>(
    elem: any,
    cls: new (...a: any) => T
): asserts elem is T {
    if (!(elem instanceof cls)) {
        throw new TypeError('Element is not an instance of ' + cls)
    }
}
