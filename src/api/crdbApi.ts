import { convertRegionsToPathRegions, convertPointsToRegions, Region } from '../entities/Region';
import { Category } from '../entities/Category';
import { Label } from '../entities/Label';

const BASE_API_ENDPOINT = 'https://mrdb.keiji.dev/api/v1'

const handleErrors = (response: any) => {
  if (response.ok) {
    return response;
  }

  switch (response.status) {
    case 400: throw Error('INVALID_TOKEN');
    case 401: throw Error('UNAUTHORIZED');
    case 500: throw Error('INTERNAL_SERVER_ERROR');
    case 502: throw Error('BAD_GATEWAY');
    case 404: throw Error('No region data found.');
    default: throw Error('UNHANDLED_ERROR');
  }
}

export async function fetchHash(imageFile: File) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await fetch(BASE_API_ENDPOINT + "/hash", { method: 'POST', body: formData })
    .then(handleErrors);
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch(BASE_API_ENDPOINT + "/category")
    .then(handleErrors);
  const jsonObj = await response.json();
  const categories = jsonObj['categories'].map((categoryObj: any) => {
    const id = categoryObj['id'];
    const name = categoryObj['name'];
    const order = categoryObj['order'];
    return new Category(id, name, order);
  });

  return categories;
}

export async function fetchLabels(categoryId: number) {
  const response = await fetch(BASE_API_ENDPOINT + `/category/${categoryId}`)
    .then(handleErrors);
  const jsonObj = await response.json();
  const labels = jsonObj['labels'].map((labelObj: any) => {
    const categoryId = labelObj['category_id'];
    const label = labelObj['label'];
    const name = labelObj['name'];
    const order = labelObj['order'];
    return new Label(categoryId, label, name, order);
  });

  return labels;
}

export function fetchPageRegionsUrl(imageIds: {}, category: Category | null | undefined, published: boolean) {
  let url = BASE_API_ENDPOINT + "/page/" + imageIds['dhash8'];
  if (category && published) {
    url += `/?category_id=${category.id}&published=true`;
  } else if (category) {
    url += `/?category_id=${category.id}`;
  } else if (published) {
    url += `/?published=true`;
  }
  return url;
}

export async function fetchPageRegions(imageIds: {}, category: Category | undefined) {
  const response = await fetch(fetchPageRegionsUrl(imageIds, category, false))
    .then(handleErrors);
  const jsonObj = await response.json();

  const regions = convertPointsToRegions(jsonObj['regions']);
  console.log(regions);

  return {
    hashes: imageIds,
    regions: regions
  };
}

function submitPageRegionsUrl(category: Category | undefined) {
  let url = BASE_API_ENDPOINT + "/page";
  if (category) {
    url += "?category_id=" + category.id;
  }
  return url;
}

export async function submitPageRegions(
  idempotencyKey: string,
  hashes: {},
  regions: Array<Region>,
  category: Category | undefined
) {

  const regionsObj = convertRegionsToPathRegions(regions);
  const jsonObj = {
    "image_ids": {
      "dhash8": hashes["dhash8"],
      "dhash12": hashes["dhash12"],
      "dhash16": hashes["dhash16"],
    },
    "regions": regionsObj
  };

  const body: string = JSON.stringify(jsonObj);

  const response = await fetch(submitPageRegionsUrl(category), {
    method: 'POST',
    headers: {
      "Idempotency-Key": idempotencyKey
    },
    body: body
  });
  return response.json();

}