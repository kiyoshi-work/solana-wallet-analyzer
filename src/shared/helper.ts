export function parseString(str: string) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return [];
  }
}

export function chunk<T>(array: T[], chunkSize: number): T[][] {
  const chunked = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunked.push(array.slice(i, i + chunkSize));
  }

  return chunked;
}

export function generateSlug(input: string) {
  const words = input?.trim()?.split(' ');
  // Create a new string starting with "output"
  let newString = '';
  // Iterate through each word in the original string
  for (let i = 0; i < words.length; i++) {
    if (i === 0) {
      newString = words[i];
      continue;
    }
    newString += '-' + words[i];
  }
  return (
    newString
      .toLowerCase()
      .replace(/[^\w\s]/gi, '-')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/ /g, '-') +
    '-' +
    new Date().getTime().toString()
  );
}

export function roundDate(
  date: Date,
  type: 'minute' | 'hour' | 'day' | 'month' | 'year',
) {
  switch (type) {
    case 'minute':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        0,
      );
    case 'hour':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        0,
        0,
      );
    case 'day':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
      );
    case 'month':
      return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    case 'year':
      return new Date(date.getFullYear(), 0, 1, 0, 0, 0);
    default:
      return date;
  }
}

export function formatNumber(
  value: number | string,
  options: Intl.NumberFormatOptions = {},
  compact: boolean = false,
): string {
  if (typeof value === 'string') value = Number(value);
  if (typeof value !== 'number' || isNaN(value)) return '';
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    compactDisplay: 'short',
    notation: compact ? 'compact' : 'standard',
    ...options,
  }).format(value);
}
