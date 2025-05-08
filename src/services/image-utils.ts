const removeBasePath = (url: string, marker: string) => {
  const index = url.lastIndexOf(marker);
  return index !== -1 ? url.slice(index + marker.length) : url;
}

const cleanName = (str: string) => {
  return str.replace(/[\u0590-\u05FF]+|\s+/g, '-');
}

export { removeBasePath, cleanName }
