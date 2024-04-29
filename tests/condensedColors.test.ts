import { CondensedColors } from 'scripts/condensedColors'

export class TestCondensedColors extends CondensedColors {
    get raw(): Uint32Array {
        return this.ary
    }
}
