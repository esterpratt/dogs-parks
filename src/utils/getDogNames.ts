import { Dog } from "../types/dog";

const getDogNames = (dogs: Dog[]) => {
  let dogNames = dogs[0].name;
  
  if (dogs.length > 1) {
    const names = dogs.map((dog) => dog.name.charAt(0).toUpperCase() + dog.name.slice(1));
    names.pop();
    const strNames = names.join(', ');
    dogNames = `${strNames} & ${dogs[dogs.length - 1].name.charAt(0).toUpperCase() + dogs[dogs.length - 1].name.slice(1)}`;
  }
  
  return dogNames;
}

export { getDogNames}