const signupDialog: HTMLDialogElement | null = document.querySelector('dialog')

export function showSignupForm() {
    signupDialog?.showModal()

    document.querySelector('body')?.addEventListener('click', e => {
        const element = e.target as HTMLDialogElement
        if (element?.classList.contains('signup-dialog')) {
            signupDialog?.close()
        }
    })
}
