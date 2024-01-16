class Content {
  id;
  href;
  depth;
  title;
  parent;
  children;

  constructor(id, depth, title) {
    this.id = id;
    this.href = `#${id}`;
    this.depth = depth;
    this.title = title;
    this.parent = null;
    this.children = [];
  }

  appendChild(child) {
    this.children.push(child);
  }

  setParent(parent) {
    this.parent = parent;

    return this;
  }

  findParentOrderThanCurrentDepth(depth) {
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
  ref;
  element;
  title;
  depth;

  constructor(
    ref = document.createElement('div'),
    element = document.querySelector('body'),
    title = 'Table of Contents',
    depth = 6,
  ) {
    this.ref = ref;
    this.ref.id = 'toc';
    this.element = element;
    this.title = title;
    this.depth = depth;
  }

  #extractElements(elements, node, content) {
    const tagName = node.tagName ?? '';
    const depth = Number(tagName.replace('H', ''));

    if (Number.isNaN(depth) === false && depth <= this.depth) {
      elements.push(node);
    }

    for (const child of node.children) {
      this.#extractElements(elements, child, content);
    }
  }

  createContents(elements, contents) {
    let last = null;

    while (elements.length > 0) {
      const element = elements.shift();

      element.id = element.textContent
        .replaceAll('.', '_')
        .replaceAll(' ', '_');

      const depth = Number(element.tagName.replace('H', ''));
      const content = new Content(element.id, depth, element.textContent);

      if (last === null) {
        last = content;
        contents.push(last);
        continue;
      }

      if (last.depth === content.depth) {
        if (last.parent) {
          last.parent.appendChild(content);
          last = content.setParent(last.parent);

          continue;
        }
      }

      if (last.depth < content.depth) {
        last.appendChild(content);
        last = content.setParent(last);

        continue;
      }

      if (last.depth > content.depth) {
        const parent = last.findParentOrderThanCurrentDepth(content.depth);

        if (parent) {
          parent.appendChild(content);
          last = content.setParent(parent);

          continue;
        }
      }

      last = content;
      contents.push(last);
    }

    return contents;
  }

  #contentToElement(elements, content) {
    const anchor = document.createElement('a');

    anchor.innerText = content.title;
    anchor.href = content.href;

    const li = document.createElement('li');

    li.appendChild(anchor);
    li.style.paddingLeft = `${10 * content.depth}px`;

    elements.push(li);

    for (const child of content.children) {
      this.#contentToElement(elements, child);
    }
  }

  #renderContents(contents) {
    const h1 = document.createElement('h1');
    const ul = document.createElement('ul');
    const hr = document.createElement('hr');
    const li = [];

    while (true) {
      const content = contents.shift();

      if (content == null) {
        break;
      }

      this.#contentToElement(li, content);
    }

    h1.innerText = this.title;
    ul.style.padding = '20px';
    ul.style.listStyle = 'none';
    ul.style.backgroundColor = '#f6f8fa';
    ul.style.borderRadius = '0.5rem';

    ul.append(...li);
    this.ref.append(h1, ul, hr);
  }

  render() {
    const elements = [];
    const contents = [];

    this.#extractElements(elements, this.element, null);
    this.createContents(elements, contents);
    this.#renderContents(contents);
  }

  remove() {
    const children = Array.from(this.ref.childNodes);

    while (children.length > 0) {
      this.ref.removeChild(children.pop());
    }
  }
}
