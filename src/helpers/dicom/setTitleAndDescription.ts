export function setTitleAndDescription(titleText: string, descriptionText: string) {
  const title = document.getElementById('demo-title');
  const description = document.getElementById('demo-description');
  
  if (!title || !description) {
    throw new Error('title or description element not found - setTitleAndDescription.ts');
  }
  
  title.innerText = titleText;
  description.innerText = descriptionText;
}
