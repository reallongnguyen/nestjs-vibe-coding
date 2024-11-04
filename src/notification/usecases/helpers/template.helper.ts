// Extract class and type from attr string looks like 'class="font-semibold text-blue-200" type="user"'
const extractAttr = (attrString: string) => {
  const attrMap: Record<string, string> = {};

  const attrs = attrString.split(/"\s+/);

  attrs.forEach((attr) => {
    const [key, val] = attr.split('=');

    attrMap[key] = val.replace(/^"/g, '').replace(/([^\\])"$/g, '$1');
  });

  return attrMap;
};

export class TemplateHelper {
  static makeDecorator(text: string) {
    const regex = /<\/?d\s?(.*?)>/;
    const decorators: PrismaJson.NotificationDecoratorType[] = [];
    const stack: PrismaJson.NotificationDecoratorType[] = [];

    let textClone = text;
    let res = regex.exec(textClone);

    while (res) {
      if (res[0] !== '</d>') {
        const attrMap = extractAttr(res[1]);

        if (!attrMap.class) {
          throw new Error(
            `Template format is not correct, missing "class" property. Text: ${text}`,
          );
        }

        stack.push({
          offset: res.index,
          length: 0,
          class: attrMap.class,
          type: attrMap.type,
          link: attrMap.link,
        });
      } else {
        const decorator = stack.pop();
        decorator.length = res.index - decorator.offset;

        decorators.push(decorator);
      }

      textClone = textClone.replace(res[0], '');
      res = regex.exec(textClone);
    }

    return decorators;
  }

  static getRawText(text: string) {
    return text.replace(/<\/?d.*?>/g, '');
  }
}
