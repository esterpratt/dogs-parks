const capitalizeText = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const capitalizeWords = (text: string) => {
  return text
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((segment) => (segment ? capitalizeText(segment) : segment))
        .join('-')
    )
    .join(' ');
};

export { capitalizeText, capitalizeWords };
