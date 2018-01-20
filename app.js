/* global PDFJS */

import { getText } from './text.js'

PDFJS.workerSrc = 'https://unpkg.com/pdfjs-dist@2.0.250/build/pdf.worker.min.js'

PDFJS.getDocument('data/article.pdf').then(async doc => {
  document.querySelector('#metadata').textContent = JSON.stringify(await doc.getMetadata(), null, 2)
  document.querySelector('#text').textContent = await getText(doc)
})

