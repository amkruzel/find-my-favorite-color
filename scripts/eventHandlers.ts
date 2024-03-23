export async function signupOrLogin(e: SubmitEvent): Promise<void> {
    console.log('loginHandler', e)

    if (!(e.target instanceof HTMLFormElement)) {
        return
    }

    const form = new FormData(e.target)

    const pw = form.get('password') as string | null
    const email = form.get('identity') as string | null
    if (!pw || !email) {
        return
    }

    form.append('passwordConfirm', pw)
    form.set('email', email)

    const data = {
        method: 'post',
        body: form,
    }

    // try to get the user
    const res1 = await fetch(
        `http://34.42.14.226:8090/api/collections/users/auth-with-password`,
        data
    )

    const json1 = await res1.json()
    console.log(res1, json1)
    if (res1.status == 200) {
        document.querySelector('.login')!.classList.add('hidden')
        document.querySelector('#logout-btn')!.classList.remove('hidden')
        document.querySelector(
            '.welcome-user'
        )!.textContent = `Welcome ${json1?.record?.email}`
        return
    }

    const res = await fetch(
        `http://34.42.14.226:8090/api/collections/users/records`,
        data
    )
    const json = await res.json()
    console.log(json)

    document.querySelector('.login')!.classList.add('hidden')
    document.querySelector('#logout-btn')!.classList.remove('hidden')
    document.querySelector(
        '.welcome-user'
    )!.textContent = `Welcome ${json?.email}`
}

export function logout(e: PointerEvent): void {
    console.log('logoutHandler', e)

    document.querySelector('.login')!.classList.remove('hidden')
    document.querySelector('#logout-btn')!.classList.add('hidden')
    document.querySelector('.welcome-user')!.textContent = ''
}

export function shuffleColors(): void {
    console.log('shuffleColorsHandler')
}

export function reset(): void {
    console.log('resetHandler')
}

export function selectColor(num: 1 | 2): void {
    console.log('selectColorHandler', num)
}
