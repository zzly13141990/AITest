const CN_NUM = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const CN_PLACE = ['', '拾', '佰', '仟'];
const CN_UNITS = ['', '万', '亿', '万亿'];

export function numberToChinese(amount: number): string {
  if (amount === 0) return '零元整';

  const negative = amount < 0;
  const absAmount = Math.abs(amount);

  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  let result = '';

  // Convert integer part
  if (integerPart > 0) {
    result += convertInteger(integerPart) + '元';
  }

  // Convert decimal part
  if (decimalPart === 0) {
    result += '整';
  } else {
    const jiao = Math.floor(decimalPart / 10);
    const fen = decimalPart % 10;

    if (jiao > 0) {
      result += CN_NUM[jiao] + '角';
    } else {
      result += '零';
    }

    if (fen > 0) {
      result += CN_NUM[fen] + '分';
    }
  }

  return negative ? '负' + result : result;
}

function convertInteger(num: number): string {
  if (num === 0) return '';

  const numStr = num.toString();
  const groups: string[] = [];
  let i = numStr.length;

  // group into 4-digit chunks from right
  while (i > 0) {
    const start = Math.max(0, i - 4);
    groups.push(numStr.substring(start, i));
    i = start;
  }

  let result = '';
  let zeroFlag = false;

  for (let g = groups.length - 1; g >= 0; g--) {
    const group = groups[g];
    const groupNum = parseInt(group, 10);

    if (groupNum === 0) {
      zeroFlag = true;
      continue;
    }

    if (zeroFlag) {
      result += '零';
      zeroFlag = false;
    }

    result += convertGroup(group) + CN_UNITS[g];

    // if the next lower group starts with leading zeros, we need a zero
    if (g > 0) {
      const lowerGroup = groups[g - 1];
      if (lowerGroup && parseInt(lowerGroup, 10) > 0 && lowerGroup.length < 4) {
        const leadingZeros = 4 - lowerGroup.length;
        const hasLeadingZero = lowerGroup[0] === '0' || leadingZeros > 0;
        if (hasLeadingZero) {
          zeroFlag = true;
        }
      }
    }
  }

  return result;
}

function convertGroup(groupStr: string): string {
  const len = groupStr.length;
  let result = '';
  let zeroFlag = false;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(groupStr[i], 10);
    const place = len - 1 - i;

    if (digit === 0) {
      zeroFlag = true;
      continue;
    }

    if (zeroFlag) {
      result += '零';
      zeroFlag = false;
    }

    result += CN_NUM[digit] + CN_PLACE[place];
  }

  return result;
}
