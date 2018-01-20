1. Collect the text divs from each page, in the correct order (done as they're rendering, but could also be selected afterwards if they're not originally in the right order).
1. Calculate the most frequent left and right edges, and exclude divs that start or end outside those boundaries.
1. Group divs together into blocks by vertical position and font size changes. (use gaps, if not start + end or page, and/or lines that finish before the end of the line, or leading indentation, to detect paragraphs?) TODO: handle tables, lists, etc.
1. (optional, for diffing) Split each block into sentences and combine into a single piece of text with newline separators between blocks.


