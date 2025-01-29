export const sanitizContent = (content?: string) => {
  if (!content) {
    return content;
  }

  return content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
