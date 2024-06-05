import { Game } from './game'

export class FormConverter {
    static signup(fe: HTMLFormElement): FormData {
        const form = new FormData(fe)

        FormConverter.tryAddProp(form, 'password', 'passwordConfirm')

        return form
    }

    static login(fe: HTMLFormElement): FormData {
        const form = new FormData(fe)

        FormConverter.tryAddProp(form, 'identity', 'email')

        return form
    }

    static from(obj: Map<string, string>): FormData {
        const form = new FormData()

        for (const [key, val] of obj) {
            form.append(key, val)
        }

        return form
    }

    static game(game: Game, userId: string): FormData {
        const elimColorBlob = game.eliminatedColors.blob
        const selectColorBlob = game.selectedColors.blob
        const colorsBlob = new Blob([game.next1000Colors])

        const form = new FormData()

        form.set('eliminatedColors', elimColorBlob)
        form.set('selectedColors', selectColorBlob)
        form.set('colors', colorsBlob)
        form.set('properties', JSON.stringify(game.properties))
        form.set('user', userId)

        return form
    }

    private static tryAddProp(
        form: FormData,
        nameToGet: string,
        nameToAdd: string
    ): void {
        const prop = form.get(nameToGet)

        if (!prop || !(typeof prop === 'string')) {
            return
        }

        form.set(nameToAdd, prop)
    }
}
