const extractTitles = (titles, node, depthLimit = 3) => {
  const tagName = node.tagName ?? '';
  const depth = Number(tagName.replace('H', ''));

  if (Number.isNaN(depth) === false && depth <= depthLimit) {
    titles.push(node);
  }

  for (const child of node.children) {
    extractTitles(titles, child);
  }

  return titles;
};

const createContent = (element) => {
  element.id = element.textContent.replaceAll('.', '_').replaceAll(' ', '_');

  return {
    id: element.id,
    href: `#${element.id}`,
    depth: Number(element.tagName.replace('H', '')),
    text: element.textContent,
    parent: null,
    children: [],
    setRelations(parent) {
      this.parent = parent;
      this.parent.children.push(this);

      return this;
    },
    findParent(depth) {
      let parent = this;

      while (parent) {
        if (parent.depth < depth) {
          break;
        }

        parent = parent.parent;
      }

      return parent;
    },
  };
};

const createContents = (titles) => {
  const contents = [];

  let last = null;

  while (titles.length > 0) {
    const content = createContent(titles.shift());

    if (last === null) {
      last = content;
      contents.push(last);

      continue;
    }

    if (last.depth < content.depth) {
      last = content.setRelations(last);

      continue;
    }

    if (last.depth === content.depth) {
      if (last.parent) {
        last = content.setRelations(last.parent);

        continue;
      }
    }

    if (last.depth > content.depth) {
      const parent = last.findParent(content.depth);

      if (parent) {
        last = content.setRelations(parent);

        continue;
      }
    }

    last = content;
    contents.push(content);
  }

  return contents;
};

const createTocText = (text) => {
  const h1 = document.createElement('h1');

  h1.innerText = text;

  return h1;
};

const createTocListItems = (items, content) => {
  const anchor = document.createElement('a');

  anchor.innerText = content.text;
  anchor.href = content.href;

  const li = document.createElement('li');

  li.appendChild(anchor);
  li.style.paddingLeft = `${10 * content.depth}px`;

  items.push(li);

  for (const child of content.children) {
    createTocListItems(items, child);
  }

  return items;
};

const createTocList = (contents, styles = {}) => {
  styles.listStyle = 'none';

  const ul = document.createElement('ul');

  for (const [key, val] of Object.entries(styles)) {
    ul.style[key] = val;
  }

  while (contents.length > 0) {
    ul.append(...createTocListItems([], contents.shift()));
  }

  return ul;
};

const renderTableOfContents = (
  toc,
  target,
  text,
  styles = {},
  depthLimit = 3,
) => {
  const titles = extractTitles([], target, depthLimit);
  const contents = createContents(titles);

  toc.prepend(
    createTocText(text),
    createTocList(contents, styles),
    document.createElement('hr'),
  );
};
