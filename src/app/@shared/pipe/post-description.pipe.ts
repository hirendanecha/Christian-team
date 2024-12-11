import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number): string {
    if (limit === -1 || value?.length <= limit) {
      return value;
    }
    return value?.substring(0, limit) + '...';
  }
}
@Pipe({
  name: 'stripHtml'
})
export class StripHtmlPipe implements PipeTransform {
  transform(value: string): string {
    const div = document.createElement('div');
    div.innerHTML = value;
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'br') {
          return '<br>';
        }
        if (tagName === 'a' && element.hasAttribute('data-id')) {
          return element.outerHTML;
        }
        if (tagName === 'img' && element.hasAttribute('src')) {
          const src = element.getAttribute('src');
          const width = element.getAttribute('width');
          const height = element.getAttribute('height');
          return `<img src="${src}"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}>`;
        }
        const childContent = Array.from(element.childNodes).map(processNode).join('');
        if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.ELEMENT_NODE) {
          const firstChildElement = element.firstChild as HTMLElement;
          if (firstChildElement.tagName.toLowerCase() === tagName) {
            return childContent;
          }
        }
        return `<${tagName}>${childContent}</${tagName}>`;
      } else if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      return '';
    };
    const result = processNode(div);
    return result;
  }
  // transform(value: string): string {
  //   return `${value}`
  //     .replace(/<div[^>]*>\s*/gi, '<div>')
  //     .replace(/<br[^>]*>\s*/gi, '<br>')
  //     .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
  //     .replace(/(?:<div><br><\/div>\s*)+/gi, '<div><br></div>')
  //     .replace(/<a\s+([^>]*?)>/gi, (match, p1) => {
  //       const hrefMatch = p1.match(/\bhref=["'][^"']*["']/);
  //       const classMatch = p1.match(/\bclass=["'][^"']*["']/);
  //       const dataIdMatch = p1.match(/\bdata-id=["'][^"']*["']/);
  //       let allowedAttrs = '';
  //       if (hrefMatch) allowedAttrs += ` ${hrefMatch[0]}`;
  //       if (classMatch) allowedAttrs += ` ${classMatch[0]}`;
  //       if (dataIdMatch) allowedAttrs += ` ${dataIdMatch[0]}`;
  //       return `<a${allowedAttrs}>`;
  //     })
  //     .replace(/<\/?[^>]+(>|$)/gi, (match) => {
  //       return /<\/?(a|br|div)(\s+[^>]*)?>/i.test(match) ? match : '';
  //     })
  //     .replace(/^(?:&nbsp;|\s)+/g, '')
  //     .trim();
  // }
}