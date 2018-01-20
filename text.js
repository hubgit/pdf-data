const createContainer = () => {
  const viewer = document.createElement('div')
  viewer.className = 'pdfViewer'

  const container = document.createElement('div')
  container.appendChild(viewer)
  document.body.appendChild(container)

  return container
}

const createViewer = () => {
  const viewer = new PDFJS.PDFViewer({
    container: createContainer(),
    // removePageBorders: true,
    enhanceTextSelection: true,
  })

  viewer.eventBus.on('pagesinit', () => {
    // viewer.currentScaleValue = 'page-width'
    viewer.currentScaleValue = 1
  })

  return viewer
}

const getFontSize = div => div.style.fontSize.replace(/px$/, '')


const mostFrequentValue = input => {
  const sorted = Object.keys(input).sort((a, b) => input[b] - input[a])

  return sorted[0]
}

const calculateBounds = divs => {
  const counts = {
    left: {},
    right: {},
    fontSize: {}
  }

  divs.forEach(div => {
    const fontSize = Math.ceil(getFontSize(div))
    if (!counts.fontSize[fontSize]) {
      counts.fontSize[fontSize] = 0
    }
    counts.fontSize[fontSize]++

    const rect = div.getBoundingClientRect()

    const left = Math.floor(rect.x)
    const right = Math.ceil(rect.x + rect.width)

    if (!counts.left[left]) {
      counts.left[left] = 0
    }
    counts.left[left]++

    if (!counts.right[right]) {
      counts.right[right] = 0
    }
    counts.right[right]++
  })

  return {
    left: mostFrequentValue(counts.left),
    right: mostFrequentValue(counts.right),
    fontSize: mostFrequentValue(counts.fontSize)
  }
}

const shouldAddSpace = (rect, previous) => {
  // add a space if further across than the end of the previous div
  if (Math.round(rect.x) > previous.x) {
    return true
  }

  // add a space if further down than the bottom of the previous div, except when after a hyphen
  if (Math.round(rect.y) > previous.y) {
    if (!previous.text.match(/-$/)) return true
  }

  return false
}

const extract = (divs, bounds) => {
  const blocks = []

  const previous = {
    x: 0,
    y: 0,
    fontSize: 0,
    text: '',
  }

  let block = {
    type: 'paragraph',
    parts: []
  }

  divs.forEach(div => {
    const rect = div.getBoundingClientRect()

    // ignore divs that start or end outside column boundaries
    if (rect.x < bounds.left || rect.x > bounds.right) {
      return
    }

    const fontSize = Math.ceil(getFontSize(div))

    if (rect.y > previous.y && fontSize !== previous.fontSize) {
      // this is a new line and the font size has changed

      if (fontSize > previous.fontSize) {
        // the font size has increased

        if (block.parts.length) {
          blocks.push(block)
        }

        block = {
          type: 'heading',
          fontSize,
          parts: []
        }
      } else {
        // the font size has decreaed

        if (block.parts.length) {
          blocks.push(block)
        }

        block = {
          type: 'paragraph',
          fontSize,
          parts: []
        }
      }

      block.parts.push(div.textContent)
    } else {
      // this is not a new line, or the font size is the same

      if (shouldAddSpace(rect, previous)) {
        block.parts.push(' ')
      }

      block.parts.push(div.textContent)
    }

    previous.x = Math.round(rect.x + rect.width)
    previous.y = Math.round(rect.y + rect.height)
    previous.fontSize = fontSize
    previous.text = div.textContent
  })

  blocks.push(block)

  return blocks
}

export const getText = doc => new Promise(async resolve => {
  let rendered = 0

  const viewer = await createViewer()

  viewer.eventBus.on('textlayerrendered', () => {
    rendered++

    if (rendered === doc.numPages) {
      const divs = viewer.container.querySelectorAll('.textLayer > div')

      // TODO: need to sort by y + x to ensure correct ordering?

      const bounds = calculateBounds(divs)

      // TODO: group textDivs into blocks, first?

      const blocks = extract(divs, bounds)

      console.log({ blocks })

      const text = blocks
        .map(block => block.parts.join(''))
        .join('\n\n')
        .split(/\s*\.\s+(?=[A-Z])/) // split on sentence boundaries
        .join('.\n\n')

      resolve(text)
    }
  })

  viewer.setDocument(doc)
})
