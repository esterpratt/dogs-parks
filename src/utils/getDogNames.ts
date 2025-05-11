import { Dog } from "../types/dog";
import { capitalizeText } from "./text";

const getDogNames = (dogs: Dog[]) => {
  let dogNames = dogs[0].name;
  
  if (dogs.length > 1) {
    const names = dogs.map((dog) => capitalizeText(dog.name));
    names.pop();
    const strNames = names.join(', ');
    dogNames = `${strNames} & ${capitalizeText(dogs[dogs.length - 1].name)}`;
  }
  
  return dogNames;
}

export { getDogNames}