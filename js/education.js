const chapterHeaders = document.querySelectorAll('body > main > .chapter > header')

for (const h of chapterHeaders) {
    h.addEventListener('click', function (e) {
        const chapters = document.querySelectorAll('body > main > .chapter')

        for (const c of chapters) {
            c.classList.add('closed-chapter')
        }

        const chapter = e.target.closest('.chapter')
        chapter.classList.remove('closed-chapter')
    })
}