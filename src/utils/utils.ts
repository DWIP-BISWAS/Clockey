import anime from "animejs";

//Get the URL params
const queryString = window.location.search;
export const urlParams = new URLSearchParams(queryString);

export function numToString(n: number) : string {
    return (typeof n === 'number') ? n.toString() : n;
}

export function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function caretToEnd(textNode: HTMLElement) {
    if (textNode.childNodes[0]?.textContent) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(textNode.childNodes[0], textNode.childNodes[0].textContent.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        textNode.focus();
    }
}

export function shakeElement(el: HTMLElement) {
    return anime({
        targets: el,
        duration: 70,
        translateX: [10, -10, 0],
        easing: 'linear',
        loop: 4,
        direction: 'alternate'
    });
}


export function groupBy(array: Array<any>, key: string) {
  // Return the end result
  return array.reduce((result, currentValue) => {
    // If an array already present for key, push it to the array. Else create an array and push the object
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    );
    // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
    return result;
  }, {}); // empty object is the initial value for result object
}


export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createCommaArray(array: Array<string>) {
  let string = '';
  array.forEach((s, i) => (i < array.length - 1) ? string += `${s}, ` : string += s)
  return string;
}