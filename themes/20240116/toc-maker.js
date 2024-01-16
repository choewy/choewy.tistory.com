class TocContent {
  id;
  href;
  depth;
  text;
  parent = null;
  children = [];

  constructor(element) {
    element.id = element.textContent.replaceAll('.', '_').replaceAll(' ', '_');

    this.id = element.id;
    this.href = `#${element.id}`;
    this.depth = Number(element.tagName.replace('H', ''));
    this.text = element.textContent;
  }

  setParent(parent) {
    this.parent = parent;
    this.parent.children.push(this);

    return this;
  }

  findParent(depth) {
    let parent = this;

    while (parent) {
      if (parent.depth < depth) {
        break;
      }

      parent = parent.parent;
    }

    return parent;
  }
}

class TocMaker {
  tocElement;
  targetElement;
  text;
  depthLimit = 3;
  style = {};

  constructor(
    tocElement,
    targetElement,
    text = 'Table of Contents',
    style = {},
    depthLimit = 3,
  ) {
    this.tocElement = tocElement;
    this.targetElement = targetElement;
    this.text = text;
    this.style = style;
    this.depthLimit = depthLimit;
  }

  static init(
    tocElement,
    targetElement,
    text = this.text,
    style = {},
    depthLimit = 3,
  ) {
    return new TocMaker(tocElement, targetElement, text, style, depthLimit);
  }

  #extractTitles(titles, node, depthLimit = 3) {
    const tagName = node.tagName ?? '';
    const depth = Number(tagName.replace('H', ''));

    if (Number.isNaN(depth) === false && depth <= depthLimit) {
      titles.push(node);
    }

    for (const child of node.children) {
      this.#extractTitles(titles, child);
    }

    return titles;
  }

  #createContents(titles) {
    const contents = [];

    let last = null;

    while (titles.length > 0) {
      const content = new TocContent(titles.shift());

      if (last === null) {
        last = content;
        contents.push(last);

        continue;
      }

      if (last.depth < content.depth) {
        last = content.setParent(last);

        continue;
      }

      if (last.depth === content.depth) {
        if (last.parent) {
          last = content.setParent(last.parent);

          continue;
        }
      }

      if (last.depth > content.depth) {
        const parent = last.findParent(content.depth);

        if (parent) {
          last = content.setParent(parent);

          continue;
        }
      }

      last = content;
      contents.push(content);
    }

    return contents;
  }

  #createTocText(text) {
    const h1 = document.createElement('h1');

    h1.innerText = text;

    return h1;
  }

  #createTocListItems(items, content) {
    const anchor = document.createElement('a');

    anchor.innerText = content.text;
    anchor.href = content.href;

    const li = document.createElement('li');

    li.appendChild(anchor);
    li.style.paddingLeft = `${10 * content.depth}px`;

    items.push(li);

    for (const child of content.children) {
      this.#createTocListItems(items, child);
    }

    return items;
  }

  #createTocList(contents, styles = {}) {
    styles.listStyle = 'none';

    const ul = document.createElement('ul');

    for (const [key, val] of Object.entries(styles)) {
      ul.style[key] = val;
    }

    while (contents.length > 0) {
      ul.append(...this.#createTocListItems([], contents.shift()));
    }

    return ul;
  }

  setStyle(style = {}) {
    this.style = style;
  }

  render() {
    const titles = this.#extractTitles([], this.targetElement, this.depthLimit);
    const contents = this.#createContents(titles);

    this.tocElement.prepend(
      this.#createTocText(this.text),
      this.#createTocList(contents, this.style),
      document.createElement('hr'),
    );
  }

  remove() {
    const children = Array.from(this.tocElement.childNodes);

    while (children.length > 0) {
      this.tocElement.removeChild(children.pop());
    }
  }
}
